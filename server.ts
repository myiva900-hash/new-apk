import express from 'express';
import crypto from 'node:crypto';
import dns from 'node:dns';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'myv_vpn.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vip_accounts (
    device_id TEXT PRIMARY KEY,
    vip_expires_at INTEGER NOT NULL DEFAULT 0,
    total_credited_hours INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS redeem_codes (
    code_hash TEXT PRIMARY KEY,
    code_hint TEXT NOT NULL,
    hours INTEGER NOT NULL,
    assigned_to TEXT NOT NULL,
    redeemed INTEGER NOT NULL DEFAULT 0,
    redeemed_by TEXT,
    redeemed_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_title TEXT NOT NULL,
    amount_frw INTEGER NOT NULL,
    hours_to_credit INTEGER NOT NULL,
    payer_phone TEXT NOT NULL,
    momo_tx_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    admin_note TEXT,
    created_at TEXT NOT NULL,
    verified_at TEXT
  );

  CREATE TABLE IF NOT EXISTS wg_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    country_code TEXT NOT NULL,
    flag TEXT NOT NULL,
    endpoint_host TEXT NOT NULL,
    endpoint_port INTEGER NOT NULL,
    server_public_key TEXT NOT NULL,
    dns_servers TEXT NOT NULL,
    allowed_ips TEXT NOT NULL,
    mtu INTEGER NOT NULL DEFAULT 1420,
    requires_vip INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`);

function getOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = 'session_secret'`).get() as
    | { value: string }
    | undefined;
  if (row?.value) return row.value;
  const generated = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO app_meta (key, value) VALUES ('session_secret', ?)`).run(generated);
  return generated;
}

const SESSION_SECRET = getOrCreateSessionSecret();

const VIP_PLANS = {
  '1week': { title: '1 Week VIP', amountFrw: 2000, hours: 168 },
  '2months': { title: '2 Months VIP', amountFrw: 12000, hours: 1440 },
  '3years': { title: '3 Years Ultra VIP', amountFrw: 35000, hours: 26280 },
} as const;

type PlanId = keyof typeof VIP_PLANS;

function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function hashAdminSecret(secret: string, salt: string): string {
  return crypto.scryptSync(secret, salt, 32).toString('hex');
}

function isAdminConfigured(): boolean {
  if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.trim().length >= 4) {
    return true;
  }
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = 'admin_secret_hash'`).get() as
    | { value: string }
    | undefined;
  return Boolean(row?.value);
}

function verifyAdminSecret(candidate: string): boolean {
  if (!candidate) return false;
  if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.trim().length >= 4) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(process.env.ADMIN_SECRET.trim());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = 'admin_secret_hash'`).get() as
    | { value: string }
    | undefined;
  if (!row?.value) return false;
  const [salt, storedHex] = row.value.split(':');
  if (!salt || !storedHex) return false;
  const derivedHex = hashAdminSecret(candidate, salt);
  const a = Buffer.from(derivedHex, 'hex');
  const b = Buffer.from(storedHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + 12 * 3600 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(authHeader?: string): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function isBlockedDocumentationIp(host: string): boolean {
  const clean = host.trim();
  return (
    clean.startsWith('192.0.2.') ||
    clean.startsWith('198.51.100.') ||
    clean.startsWith('203.0.113.')
  );
}

function getDeviceVipStatus(deviceId: string) {
  const now = Date.now();
  const row = db
    .prepare(`SELECT device_id, vip_expires_at, total_credited_hours, updated_at FROM vip_accounts WHERE device_id = ?`)
    .get(deviceId) as
    | {
        device_id: string;
        vip_expires_at: number;
        total_credited_hours: number;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return {
      deviceId,
      isVipActive: false,
      vipExpiresAt: 0,
      remainingSeconds: 0,
      totalCreditedHours: 0,
    };
  }

  const remainingSeconds = Math.max(0, Math.floor((row.vip_expires_at - now) / 1000));
  return {
    deviceId: row.device_id,
    isVipActive: remainingSeconds > 0,
    vipExpiresAt: row.vip_expires_at,
    remainingSeconds,
    totalCreditedHours: row.total_credited_hours,
  };
}

function creditVipHours(deviceId: string, hours: number): { vipExpiresAt: number; remainingSeconds: number } {
  const now = Date.now();
  const current = db
    .prepare(`SELECT vip_expires_at, total_credited_hours FROM vip_accounts WHERE device_id = ?`)
    .get(deviceId) as { vip_expires_at: number; total_credited_hours: number } | undefined;

  const baseMs = current && current.vip_expires_at > now ? current.vip_expires_at : now;
  const newExpiresAt = baseMs + hours * 3600 * 1000;
  const newTotalHours = (current?.total_credited_hours || 0) + hours;

  db.prepare(`
    INSERT INTO vip_accounts (device_id, vip_expires_at, total_credited_hours, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET
      vip_expires_at = excluded.vip_expires_at,
      total_credited_hours = excluded.total_credited_hours,
      updated_at = excluded.updated_at
  `).run(deviceId, newExpiresAt, newTotalHours, new Date().toISOString());

  return {
    vipExpiresAt: newExpiresAt,
    remainingSeconds: Math.max(0, Math.floor((newExpiresAt - now) / 1000)),
  };
}

function validateDeviceId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim();
  if (!/^[a-zA-Z0-9_-]{8,96}$/.test(cleaned)) return null;
  return cleaned;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      version: '6.0.0',
      tunnelEngine: 'WireGuard (Android GoBackend)',
      adminConfigured: isAdminConfigured(),
      serverTime: new Date().toISOString(),
    });
  });

  // VIP status from authoritative backend DB
  app.get('/api/vip/status', (req, res) => {
    const deviceId = validateDeviceId(req.header('x-device-id') || req.query.deviceId);
    if (!deviceId) {
      res.status(400).json({ error: 'Invalid or missing x-device-id.' });
      return;
    }
    res.json({
      ...getDeviceVipStatus(deviceId),
      serverTimeMs: Date.now(),
    });
  });

  // Verified WireGuard servers registered on backend (no invented/RFC5737 IPs)
  app.get('/api/servers', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT id, name, location, country_code, flag, endpoint_host, endpoint_port, server_public_key, dns_servers, allowed_ips, mtu, requires_vip, created_at
         FROM wg_servers ORDER BY created_at DESC`
      )
      .all() as Array<{
      id: string;
      name: string;
      location: string;
      country_code: string;
      flag: string;
      endpoint_host: string;
      endpoint_port: number;
      server_public_key: string;
      dns_servers: string;
      allowed_ips: string;
      mtu: number;
      requires_vip: number;
      created_at: string;
    }>;

    res.json({
      servers: rows.map(r => ({
        id: r.id,
        name: r.name,
        location: r.location,
        countryCode: r.country_code,
        flag: r.flag,
        endpointHost: r.endpoint_host,
        endpointPort: r.endpoint_port,
        serverPublicKey: r.server_public_key,
        dnsServers: r.dns_servers,
        allowedIps: r.allowed_ips,
        mtu: r.mtu,
        requiresVip: r.requires_vip === 1,
        createdAt: r.created_at,
      })),
    });
  });

  // Real DNS + TCP/network probe for a user/server endpoint
  app.post('/api/servers/probe', async (req, res) => {
    const { host, port } = req.body || {};
    if (typeof host !== 'string' || !host.trim()) {
      res.status(400).json({ error: 'Host irakenewe.' });
      return;
    }
    const cleanHost = host.trim();
    if (isBlockedDocumentationIp(cleanHost)) {
      res.status(400).json({ error: 'RFC 5737 documentation IP (192.0.2.x / 198.51.100.x / 203.0.113.x) ntiyemewe.' });
      return;
    }

    const numericPort = Number(port) || 51820;
    const started = Date.now();
    try {
      const lookup = await dns.promises.lookup(cleanHost);
      const dnsMs = Date.now() - started;

      const tcpStart = Date.now();
      const tcpResult = await new Promise<{ tcpReachable: boolean; tcpMs: number; note: string }>(resolve => {
        const socket = new net.Socket();
        let settled = false;
        const done = (tcpReachable: boolean, note: string) => {
          if (settled) return;
          settled = true;
          socket.destroy();
          resolve({ tcpReachable, tcpMs: Date.now() - tcpStart, note });
        };
        socket.setTimeout(2200);
        socket.on('connect', () => done(true, 'TCP port responded'));
        socket.on('timeout', () => done(false, 'UDP-only WireGuard port or firewall filtered (normal for WireGuard)'));
        socket.on('error', err => done(false, err.message));
        socket.connect(numericPort, lookup.address);
      });

      res.json({
        ok: true,
        host: cleanHost,
        resolvedIp: lookup.address,
        dnsMs,
        port: numericPort,
        ...tcpResult,
      });
    } catch (err) {
      res.status(400).json({
        ok: false,
        host: cleanHost,
        error: err instanceof Error ? err.message : 'DNS resolution failed',
      });
    }
  });

  // Atomic Single-Use Backend Redeem Code Endpoint
  app.post('/api/redeem', (req, res) => {
    const deviceId = validateDeviceId(req.body?.deviceId);
    const rawCode = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';

    if (!deviceId) {
      res.status(400).json({ error: 'Device ID ntabwo isobanutse.' });
      return;
    }
    if (!rawCode || rawCode.length < 8 || rawCode.length > 64) {
      res.status(400).json({ error: 'Andika Redeem Code yuzuye mbere yo kohereza.' });
      return;
    }

    const codeHash = hashString(rawCode);

    try {
      db.exec('BEGIN IMMEDIATE');
      const found = db
        .prepare(`SELECT code_hash, hours, redeemed, assigned_to FROM redeem_codes WHERE code_hash = ?`)
        .get(codeHash) as
        | { code_hash: string; hours: number; redeemed: number; assigned_to: string }
        | undefined;

      if (!found) {
        db.exec('ROLLBACK');
        res.status(404).json({ error: 'Redeem Code ntabwo ibaho kuri backend.' });
        return;
      }

      if (found.redeemed === 1) {
        db.exec('ROLLBACK');
        res.status(409).json({ error: 'Iyi Redeem Code yarakoreshejwe mbere. Ntishobora kongera gukoreshwa.' });
        return;
      }

      const nowIso = new Date().toISOString();
      const updated = db
        .prepare(
          `UPDATE redeem_codes SET redeemed = 1, redeemed_by = ?, redeemed_at = ? WHERE code_hash = ? AND redeemed = 0`
        )
        .run(deviceId, nowIso, codeHash);

      if (updated.changes !== 1) {
        db.exec('ROLLBACK');
        res.status(409).json({ error: 'Redeem Code imaze gukoreshwa.' });
        return;
      }

      const credited = creditVipHours(deviceId, found.hours);
      db.exec('COMMIT');

      res.json({
        ok: true,
        addedHours: found.hours,
        assignedTo: found.assigned_to,
        ...credited,
        message: `+${found.hours} Hours VIP zemejwe na backend!`,
      });
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // Ignore rollback errors
      }
      res.status(500).json({ error: 'Backend verification error.' });
    }
  });

  // Submit MTN MoMo payment reference for backend verification
  app.post('/api/payments/submit', (req, res) => {
    const deviceId = validateDeviceId(req.body?.deviceId);
    const planId = req.body?.planId as PlanId;
    const payerPhone = typeof req.body?.payerPhone === 'string' ? req.body.payerPhone.trim() : '';
    const momoTxId =
      typeof req.body?.momoTxId === 'string' ? req.body.momoTxId.trim().toUpperCase() : '';

    if (!deviceId) {
      res.status(400).json({ error: 'Device ID irakenewe.' });
      return;
    }
    if (!planId || !(planId in VIP_PLANS)) {
      res.status(400).json({ error: 'Plan wahisemo ntibaho.' });
      return;
    }
    if (!/^(?:\+?250)?0?7[2389]\d{7}$/.test(payerPhone.replace(/\s+/g, ''))) {
      res.status(400).json({ error: 'Andika nimero ya telefoni yawe nyayo (urugero: 078xxxxxxx).' });
      return;
    }
    if (!/^[A-Z0-9_-]{6,40}$/.test(momoTxId)) {
      res.status(400).json({
        error: 'Andika Transaction ID nyayo ya MTN MoMo (nibura inyuguti/imibare 6).',
      });
      return;
    }

    const plan = VIP_PLANS[planId];
    const id = `PAY-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const createdAt = new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO payments (
          id, device_id, plan_id, plan_title, amount_frw, hours_to_credit,
          payer_phone, momo_tx_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(
        id,
        deviceId,
        planId,
        plan.title,
        plan.amountFrw,
        plan.hours,
        payerPhone,
        momoTxId,
        createdAt
      );

      res.status(201).json({
        ok: true,
        payment: {
          id,
          planId,
          planTitle: plan.title,
          amountFrw: plan.amountFrw,
          hoursToCredit: plan.hours,
          payerPhone,
          momoTxId,
          status: 'PENDING',
          createdAt,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('UNIQUE')) {
        res.status(409).json({ error: 'Iyi Transaction ID ya MoMo yamaze koherezwa mbere.' });
        return;
      }
      res.status(500).json({ error: 'Ntibishobotse kubika ubusabe bwo kwishyura.' });
    }
  });

  app.get('/api/payments/my', (req, res) => {
    const deviceId = validateDeviceId(req.header('x-device-id') || req.query.deviceId);
    if (!deviceId) {
      res.status(400).json({ error: 'Invalid x-device-id.' });
      return;
    }

    const rows = db
      .prepare(
        `SELECT id, plan_id, plan_title, amount_frw, hours_to_credit, payer_phone, momo_tx_id, status, admin_note, created_at, verified_at
         FROM payments WHERE device_id = ? ORDER BY created_at DESC LIMIT 20`
      )
      .all(deviceId) as Array<Record<string, unknown>>;

    res.json({
      payments: rows.map(r => ({
        id: r.id,
        planId: r.plan_id,
        planTitle: r.plan_title,
        amountFrw: r.amount_frw,
        hoursToCredit: r.hours_to_credit,
        payerPhone: r.payer_phone,
        momoTxId: r.momo_tx_id,
        status: r.status,
        adminNote: r.admin_note,
        createdAt: r.created_at,
        verifiedAt: r.verified_at,
      })),
    });
  });

  // Payment provider HMAC webhook verification
  app.post('/api/payments/webhook', (req, res) => {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.status(503).json({ error: 'Payment webhook secret is not configured.' });
      return;
    }

    const signature = req.header('x-payment-signature') || '';
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const txId = typeof req.body?.momoTxId === 'string' ? req.body.momoTxId.trim().toUpperCase() : '';
    if (!txId) {
      res.status(400).json({ error: 'Missing momoTxId.' });
      return;
    }

    try {
      db.exec('BEGIN IMMEDIATE');
      const payment = db
        .prepare(`SELECT id, device_id, hours_to_credit, status FROM payments WHERE momo_tx_id = ?`)
        .get(txId) as { id: string; device_id: string; hours_to_credit: number; status: string } | undefined;

      if (!payment) {
        db.exec('ROLLBACK');
        res.status(404).json({ error: 'Payment not found.' });
        return;
      }

      if (payment.status === 'VERIFIED') {
        db.exec('COMMIT');
        res.json({ ok: true, alreadyVerified: true });
        return;
      }

      db.prepare(`UPDATE payments SET status = 'VERIFIED', verified_at = ?, admin_note = 'Webhook Verified' WHERE id = ?`).run(
        new Date().toISOString(),
        payment.id
      );
      const credited = creditVipHours(payment.device_id, payment.hours_to_credit);
      db.exec('COMMIT');
      res.json({ ok: true, ...credited });
    } catch {
      try {
        db.exec('ROLLBACK');
      } catch {
        // Ignore
      }
      res.status(500).json({ error: 'Webhook processing failed.' });
    }
  });

  // One-time Owner Admin Secret initialization when ADMIN_SECRET env var isn't set
  app.get('/api/admin/bootstrap-status', (_req, res) => {
    res.json({ configured: isAdminConfigured() });
  });

  app.post('/api/admin/bootstrap', (req, res) => {
    if (isAdminConfigured()) {
      res.status(403).json({ error: 'Admin secret yamaze gushyirwaho.' });
      return;
    }
    const secret = typeof req.body?.secret === 'string' ? req.body.secret.trim() : '';
    if (secret.length < 6) {
      res.status(400).json({ error: 'Admin PIN/Password igomba kugira nibura inyuguti cyangwa imibare 6.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hashed = hashAdminSecret(secret, salt);
    db.prepare(`INSERT INTO app_meta (key, value) VALUES ('admin_secret_hash', ?)`).run(`${salt}:${hashed}`);
    res.json({ ok: true, token: signAdminToken() });
  });

  app.post('/api/admin/login', (req, res) => {
    if (!isAdminConfigured()) {
      res.status(412).json({ error: 'Admin secret ntabwo irashyirwaho bwa mbere.' });
      return;
    }
    const secret = typeof req.body?.secret === 'string' ? req.body.secret.trim() : '';
    if (!verifyAdminSecret(secret)) {
      res.status(401).json({ error: 'Admin Secret siyo.' });
      return;
    }
    res.json({ ok: true, token: signAdminToken() });
  });

  // Protected Admin Endpoints
  app.get('/api/admin/overview', (req, res) => {
    if (!verifyAdminToken(req.header('authorization'))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payments = db
      .prepare(`SELECT * FROM payments ORDER BY created_at DESC LIMIT 50`)
      .all() as Array<Record<string, unknown>>;

    const codes = db
      .prepare(`SELECT code_hint, hours, assigned_to, redeemed, redeemed_by, redeemed_at, created_at FROM redeem_codes ORDER BY created_at DESC LIMIT 50`)
      .all() as Array<Record<string, unknown>>;

    const servers = db
      .prepare(`SELECT * FROM wg_servers ORDER BY created_at DESC`)
      .all() as Array<Record<string, unknown>>;

    res.json({
      payments: payments.map(p => ({
        id: p.id,
        deviceId: p.device_id,
        planId: p.plan_id,
        planTitle: p.plan_title,
        amountFrw: p.amount_frw,
        hoursToCredit: p.hours_to_credit,
        payerPhone: p.payer_phone,
        momoTxId: p.momo_tx_id,
        status: p.status,
        adminNote: p.admin_note,
        createdAt: p.created_at,
        verifiedAt: p.verified_at,
      })),
      codes: codes.map(c => ({
        codeHint: c.code_hint,
        hours: c.hours,
        assignedTo: c.assigned_to,
        redeemed: c.redeemed === 1,
        redeemedBy: c.redeemed_by,
        redeemedAt: c.redeemed_at,
        createdAt: c.created_at,
      })),
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        location: s.location,
        countryCode: s.country_code,
        flag: s.flag,
        endpointHost: s.endpoint_host,
        endpointPort: s.endpoint_port,
        serverPublicKey: s.server_public_key,
        dnsServers: s.dns_servers,
        allowedIps: s.allowed_ips,
        mtu: s.mtu,
        requiresVip: s.requires_vip === 1,
      })),
    });
  });

  app.post('/api/admin/payments/:id/approve', (req, res) => {
    if (!verifyAdminToken(req.header('authorization'))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const paymentId = req.params.id;
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : 'Approved by Owner';

    try {
      db.exec('BEGIN IMMEDIATE');
      const row = db
        .prepare(`SELECT id, device_id, hours_to_credit, status FROM payments WHERE id = ?`)
        .get(paymentId) as
        | { id: string; device_id: string; hours_to_credit: number; status: string }
        | undefined;

      if (!row) {
        db.exec('ROLLBACK');
        res.status(404).json({ error: 'Payment not found.' });
        return;
      }
      if (row.status === 'VERIFIED') {
        db.exec('ROLLBACK');
        res.status(409).json({ error: 'Payment already verified.' });
        return;
      }

      db.prepare(`UPDATE payments SET status = 'VERIFIED', admin_note = ?, verified_at = ? WHERE id = ?`).run(
        note,
        new Date().toISOString(),
        paymentId
      );
      const credited = creditVipHours(row.device_id, row.hours_to_credit);
      db.exec('COMMIT');

      res.json({ ok: true, ...credited });
    } catch {
      try {
        db.exec('ROLLBACK');
      } catch {
        // Ignore
      }
      res.status(500).json({ error: 'Failed to approve payment.' });
    }
  });

  app.post('/api/admin/payments/:id/reject', (req, res) => {
    if (!verifyAdminToken(req.header('authorization'))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const paymentId = req.params.id;
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : 'Rejected';
    const result = db
      .prepare(`UPDATE payments SET status = 'REJECTED', admin_note = ? WHERE id = ? AND status = 'PENDING'`)
      .run(note, paymentId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Pending payment not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/codes/generate', (req, res) => {
    if (!verifyAdminToken(req.header('authorization'))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const hours = Math.min(8760, Math.max(1, Number(req.body?.hours) || 50));
    const assignedTo =
      typeof req.body?.assignedTo === 'string' && req.body.assignedTo.trim()
        ? req.body.assignedTo.trim().slice(0, 60)
        : 'VIP Member';

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randBlock = (len: number) =>
      Array.from(crypto.randomBytes(len), b => alphabet[b % alphabet.length]).join('');

    const plaintextCode = `MYV-${hours}H-${randBlock(4)}-${randBlock(4)}`;
    const codeHash = hashString(plaintextCode);
    const codeHint = `MYV-${hours}H-****-${plaintextCode.slice(-4)}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO redeem_codes (code_hash, code_hint, hours, assigned_to, redeemed, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(codeHash, codeHint, hours, assignedTo, createdAt);

    res.status(201).json({
      ok: true,
      code: plaintextCode,
      codeHint,
      hours,
      assignedTo,
      createdAt,
    });
  });

  app.post('/api/admin/servers', (req, res) => {
    if (!verifyAdminToken(req.header('authorization'))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      name,
      location,
      countryCode,
      flag,
      endpointHost,
      endpointPort,
      serverPublicKey,
      dnsServers,
      allowedIps,
      mtu,
      requiresVip,
    } = req.body || {};

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof endpointHost !== 'string' ||
      !endpointHost.trim() ||
      typeof serverPublicKey !== 'string' ||
      !serverPublicKey.trim()
    ) {
      res.status(400).json({ error: 'Name, Endpoint Host, na WireGuard Server Public Key birakenewe.' });
      return;
    }

    if (isBlockedDocumentationIp(endpointHost)) {
      res.status(400).json({ error: 'RFC 5737 documentation IP ntiyemewe.' });
      return;
    }

    // Standard WireGuard Base64 Curve25519 key is 44 characters ending in '='
    if (!/^[A-Za-z0-9+/]{42,43}=$/.test(serverPublicKey.trim())) {
      res.status(400).json({ error: 'WireGuard Server Public Key igomba kuba ari Base64 valid (inyuguti 44).' });
      return;
    }

    const portNum = Number(endpointPort) || 51820;
    if (portNum < 1 || portNum > 65535) {
      res.status(400).json({ error: 'Port ntabwo yemewe (1-65535).' });
      return;
    }

    const id = `wg-${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO wg_servers (
        id, name, location, country_code, flag, endpoint_host, endpoint_port,
        server_public_key, dns_servers, allowed_ips, mtu, requires_vip, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      typeof location === 'string' && location.trim() ? location.trim() : 'WireGuard VPS',
      typeof countryCode === 'string' && countryCode.trim() ? countryCode.trim().toUpperCase() : 'RW',
      typeof flag === 'string' && flag.trim() ? flag.trim() : '🛡️',
      endpointHost.trim(),
      portNum,
      serverPublicKey.trim(),
      typeof dnsServers === 'string' && dnsServers.trim() ? dnsServers.trim() : '1.1.1.1, 8.8.8.8',
      typeof allowedIps === 'string' && allowedIps.trim() ? allowedIps.trim() : '0.0.0.0/0, ::/0',
      Number(mtu) || 1420,
      requiresVip === false ? 0 : 1,
      createdAt
    );

    res.status(201).json({ ok: true, id });
  });

  app.delete('/api/admin/servers/:id', (req, res) => {
    if (!verifyAdminToken(req.header('authorization'))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    db.prepare(`DELETE FROM wg_servers WHERE id = ?`).run(req.params.id);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mutiganda Yvan VPN server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
