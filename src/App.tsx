import React, { useState, useEffect, useCallback } from 'react';
import {
  ConnectionMode,
  ConnectionStatus,
  CustomSetupConfig,
  AppSettings,
  VpnLogEntry,
  VpnServer,
  ExportableConfig,
  SimCarrierMode,
  VipAccountStatus,
  WireGuardProfile,
} from './types/vpn';
import { DEFAULT_LOCAL_MANUAL_PROFILE, SIM_CARRIERS } from './data/servers';
import { vpnBridge, LiveTunnelStats } from './services/vpnBridge';
import { backendApi } from './services/api';
import { soundService } from './services/sound';

// UI Components
import { MatrixHackingBackground } from './components/MatrixHackingBackground';
import { TopAppBar } from './components/TopAppBar';
import { TabsHeader } from './components/TabsHeader';
import { TickerNotice } from './components/TickerNotice';
import { HomeScreen } from './components/HomeScreen';
import { VipRoomScreen } from './components/VipRoomScreen';
import { LogScreen } from './components/LogScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SideMenuDrawer } from './components/SideMenuDrawer';

// Modals
import { PayloadGeneratorModal } from './components/PayloadGeneratorModal';
import { IdentificationModal } from './components/IdentificationModal';
import { ExportConfigModal } from './components/ExportConfigModal';
import { ImportConfigModal } from './components/ImportConfigModal';
import { ServerAppsModal } from './components/ServerAppsModal';
import { AboutModal } from './components/AboutModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { OnlineUpdateModal } from './components/OnlineUpdateModal';
import { VipPaymentModal } from './components/VipPaymentModal';
import { AddServerDrawer } from './components/AddServerDrawer';
import { AiAssistantModal } from './components/AiAssistantModal';
import { CodeGeneratorRoomModal } from './components/CodeGeneratorRoomModal';
import { Server, Bot } from 'lucide-react';

const WG_PROFILE_STORAGE_KEY = 'myv_wg_profile_v6';
const LOCAL_SERVERS_STORAGE_KEY = 'myv_local_servers_v6';

function loadSavedLocalServers(): VpnServer[] {
  try {
    const raw = localStorage.getItem(LOCAL_SERVERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSavedWireGuardProfile(): WireGuardProfile {
  try {
    const raw = localStorage.getItem(WG_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        privateKey: parsed.privateKey || '',
        publicKey: parsed.publicKey || '',
        address: parsed.address || '10.0.0.2/32',
        dns: parsed.dns || '1.1.1.1, 8.8.8.8',
        mtu: Number(parsed.mtu) || 1420,
        peerPublicKey: parsed.peerPublicKey || '',
        presharedKey: parsed.presharedKey || '',
        endpointHost: parsed.endpointHost || '',
        endpointPort: Number(parsed.endpointPort) || 51820,
        allowedIps: parsed.allowedIps || '0.0.0.0/0, ::/0',
        persistentKeepalive: Number(parsed.persistentKeepalive) || 25,
        importedConfigName: parsed.importedConfigName || undefined,
      };
    }
  } catch {
    // Fallback below
  }
  return {
    privateKey: '',
    publicKey: '',
    address: '10.0.0.2/32',
    dns: '1.1.1.1, 8.8.8.8',
    mtu: 1420,
    peerPublicKey: '',
    presharedKey: '',
    endpointHost: '',
    endpointPort: 51820,
    allowedIps: '0.0.0.0/0, ::/0',
    persistentKeepalive: 25,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [activeTab, setActiveTab] = useState<'HOME' | 'VIP_ROOM' | 'LOG'>('HOME');

  const [status, setStatus] = useState<ConnectionStatus>(() => vpnBridge.getStatus());
  const [stats, setStats] = useState<LiveTunnelStats>(() => vpnBridge.getStats());
  const [logs, setLogs] = useState<VpnLogEntry[]>([]);

  const [backendServers, setBackendServers] = useState<VpnServer[]>([]);
  const [localServers, setLocalServers] = useState<VpnServer[]>(() => loadSavedLocalServers());
  const servers = React.useMemo(() => {
    const map = new Map<string, VpnServer>();
    [...localServers, ...backendServers].forEach(s => map.set(s.id, s));
    return Array.from(map.values());
  }, [localServers, backendServers]);

  const [selectedServer, setSelectedServer] = useState<VpnServer>(
    () => loadSavedLocalServers()[0] || DEFAULT_LOCAL_MANUAL_PROFILE
  );
  const [selectedPort, setSelectedPort] = useState<number>(
    () => loadSavedLocalServers()[0]?.endpointPort || 51820
  );
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(() =>
    loadSavedLocalServers().length > 0 ? 'wireguard_server' : 'wireguard_manual'
  );
  const [simCarrier, setSimCarrier] = useState<SimCarrierMode>('all_sim');
  const [customSetupEnabled, setCustomSetupEnabled] = useState<boolean>(true);
  const [vipStatus, setVipStatus] = useState<VipAccountStatus | null>(null);

  const [customSetup, setCustomSetup] = useState<CustomSetupConfig>(() => ({
    wireguard: loadSavedWireGuardProfile(),
    importedConfigName: undefined,
  }));

  // Luxury dark mode (#050B1A) as default with Light/Dark/System + 5 accent themes
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('myv_settings_v6');
    if (saved) {
      try {
        return {
          accentColor: 'blue',
          ...JSON.parse(saved),
        };
      } catch {
        // Fallback below
      }
    }
    return {
      sound: true,
      vibrate: true,
      theme: 'dark',
      accentColor: 'blue',
      connectionRetry: true,
      forwardDns: false,
      customDns: false,
      primaryDns: '1.1.1.1',
      secondaryDns: '8.8.8.8',
      autoReconnect: false,
      connectionTimeout: 30,
    };
  });

  // Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [payloadGenOpen, setPayloadGenOpen] = useState(false);
  const [identificationOpen, setIdentificationOpen] = useState(false);
  const [exportConfigOpen, setExportConfigOpen] = useState(false);
  const [importConfigOpen, setImportConfigOpen] = useState(false);
  const [serverAppsOpen, setServerAppsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [apkDownloadOpen, setApkDownloadOpen] = useState(false);
  const [onlineUpdateOpen, setOnlineUpdateOpen] = useState(false);
  const [vipPaymentOpen, setVipPaymentOpen] = useState(false);
  const [addServerOpen, setAddServerOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [codeGeneratorOpen, setCodeGeneratorOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('myv_settings_v6', JSON.stringify(settings));
  }, [settings]);

  // Persist WireGuard local keys/profile safely
  useEffect(() => {
    try {
      localStorage.setItem(WG_PROFILE_STORAGE_KEY, JSON.stringify(customSetup.wireguard));
    } catch {
      // Ignore storage quota errors
    }
  }, [customSetup.wireguard]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SERVERS_STORAGE_KEY, JSON.stringify(localServers));
    } catch {
      // Ignore storage quota errors
    }
  }, [localServers]);

  const refreshBackend = useCallback(async () => {
    try {
      const [vip, serverList] = await Promise.all([
        backendApi.getVipStatus(),
        backendApi.getServers(),
      ]);
      setVipStatus(vip);
      setBackendServers(serverList);

      if (serverList.length > 0) {
        setSelectedServer(prev => {
          if (prev.id.startsWith('custom-') && prev.endpointHost) return prev;
          const match = serverList.find(s => s.id === prev.id);
          return match || serverList[0];
        });
        setConnectionMode(prev => (prev === 'imported_config' ? prev : 'wireguard_server'));
      }
    } catch (err) {
      vpnBridge.emitLog(
        'warn',
        `[Backend Sync] ${err instanceof Error ? err.message : 'Unable to reach backend server.'}`
      );
    }
  }, []);

  // Subscribe to real WireGuard Bridge & sync backend on boot
  useEffect(() => {
    const unsubStatus = vpnBridge.subscribeStatus((newStatus, newStats) => {
      setStatus(newStatus);
      setStats(newStats);
    });

    const unsubLogs = vpnBridge.subscribeLogs(entry => {
      setLogs(prev => [...prev, entry]);
    });

    vpnBridge.emitLog(
      'info',
      `Mutiganda Yvan VPN v6 initialized (${vpnBridge.isNativeAndroid() ? 'Android WireGuard GoBackend Active' : 'Browser Config & Backend Mode'}).`
    );

    refreshBackend();

    const syncInterval = setInterval(() => {
      backendApi.getVipStatus().then(setVipStatus).catch(() => {});
    }, 60000);

    return () => {
      unsubStatus();
      unsubLogs();
      clearInterval(syncInterval);
    };
  }, [refreshBackend]);

  // Live 1s countdown UI tick based on backend-verified remainingSeconds
  useEffect(() => {
    const timer = setInterval(() => {
      setVipStatus(prev => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        const nextRemaining = Math.max(0, prev.remainingSeconds - 1);
        return {
          ...prev,
          remainingSeconds: nextRemaining,
          isVipActive: nextRemaining > 0,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateWireGuard = (updates: Partial<WireGuardProfile>) => {
    vpnBridge.clearNotice();
    setCustomSetup(prev => ({
      ...prev,
      wireguard: {
        ...prev.wireguard,
        ...updates,
      },
    }));
  };

  const handleGenerateKeyPair = async () => {
    const pair = await vpnBridge.generateKeyPairAsync();
    if (!pair) {
      vpnBridge.emitLog(
        'warn',
        '[WireGuard KeyGen] Browser yawe ntiyemera WebCrypto X25519 cyangwa ntiwafunguye muri Android APK. Injiza PrivateKey mu ntoki cyangwa ukore import ya .conf.'
      );
      return;
    }

    handleUpdateWireGuard({
      privateKey: pair.privateKey,
      publicKey: pair.publicKey,
    });
    vpnBridge.clearNotice();
    vpnBridge.emitLog(
      'success',
      `[WireGuard KeyPair Generated] Client PublicKey: ${pair.publicKey} (shyira iyi PublicKey kuri WireGuard server peer yawe)`
    );
  };

  const handleStartVpn = () => {
    const wg = customSetup.wireguard;

    if (connectionMode === 'wireguard_server' && selectedServer.requiresVip && !vipStatus?.isVipActive) {
      const msg =
        'Server wahisemo isaba VIP yemejwe na Backend. Ishyura MoMo cyangwa ukoreshe Redeem Code muri VIP ROOM.';
      vpnBridge.emitLog('warn', `[VIP Required] ${msg}`);
      vpnBridge.setNotice({
        level: 'warn',
        title: 'VIP irakenewe kuri iyi server',
        message: msg,
        action: 'vip_payment',
      });
      setVipPaymentOpen(true);
      soundService.playVipWelcomeGuide();
      return;
    }

    const activeProfile: WireGuardProfile =
      connectionMode === 'wireguard_server' && selectedServer.endpointHost
        ? {
            ...wg,
            endpointHost: selectedServer.endpointHost,
            endpointPort: selectedPort || selectedServer.endpointPort || 51820,
            peerPublicKey: selectedServer.serverPublicKey,
            dns: settings.customDns
              ? `${settings.primaryDns}${settings.secondaryDns ? `, ${settings.secondaryDns}` : ''}`
              : selectedServer.dnsServers || wg.dns,
            allowedIps: selectedServer.allowedIps || wg.allowedIps,
            mtu: selectedServer.mtu || wg.mtu || 1420,
          }
        : {
            ...wg,
            endpointPort: wg.endpointPort || selectedPort || 51820,
            dns: settings.customDns
              ? `${settings.primaryDns}${settings.secondaryDns ? `, ${settings.secondaryDns}` : ''}`
              : wg.dns,
          };

    if (!activeProfile.endpointHost.trim() || !activeProfile.peerPublicKey.trim() || !activeProfile.privateKey.trim()) {
      setCustomSetupEnabled(true);
    }

    const simLabel = SIM_CARRIERS.find(c => c.id === simCarrier)?.short || 'ALL SIM';
    const label =
      connectionMode === 'wireguard_server' && selectedServer.endpointHost
        ? selectedServer.name
        : customSetup.importedConfigName || activeProfile.endpointHost || 'Custom WireGuard Peer';

    vpnBridge.startWireGuard(activeProfile, label, {
      sound: settings.sound,
      vibrate: settings.vibrate,
      simCarrierLabel: simLabel,
    });
  };

  const handleStopVpn = () => {
    vpnBridge.stopWireGuard({
      sound: settings.sound,
      vibrate: settings.vibrate,
    });
  };

  const handleConfigImported = (config: ExportableConfig) => {
    setConnectionMode('imported_config');
    setCustomSetup({
      wireguard: {
        ...config.customSetup.wireguard,
        importedConfigName: config.configName,
      },
      importedConfigName: config.configName,
      importedConfigRaw: config.customSetup.importedConfigRaw,
    });
    setCustomSetupEnabled(true);

    if (config.serverPort) {
      setSelectedPort(config.serverPort);
    }

    const matchingServer = servers.find(s => s.endpointHost === config.serverHost);
    if (matchingServer) {
      setSelectedServer(matchingServer);
    }

    vpnBridge.clearNotice();
    vpnBridge.emitLog(
      'success',
      `[WireGuard Import] Profile [${config.configName}] (${config.serverHost}:${config.serverPort}) yinjijwe neza.`
    );
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleOpenVipPayment = () => {
    setVipPaymentOpen(true);
    soundService.playVipWelcomeGuide();
  };

  const handleOpenVipRoom = () => {
    setCurrentView('main');
    setActiveTab('VIP_ROOM');
  };

  const handleDrawerOption = (
    option:
      | 'payload_gen'
      | 'identification'
      | 'export_config'
      | 'import_config'
      | 'settings'
      | 'server_apps'
      | 'online_update'
      | 'about'
      | 'apk_download'
      | 'vip_payment'
      | 'vip_room'
      | 'add_server'
      | 'ai_assistant'
      | 'code_generator'
  ) => {
    switch (option) {
      case 'payload_gen':
        setPayloadGenOpen(true);
        break;
      case 'identification':
        setIdentificationOpen(true);
        break;
      case 'export_config':
        setExportConfigOpen(true);
        break;
      case 'import_config':
        setImportConfigOpen(true);
        break;
      case 'settings':
        setCurrentView('settings');
        break;
      case 'server_apps':
        setServerAppsOpen(true);
        break;
      case 'online_update':
        setOnlineUpdateOpen(true);
        break;
      case 'about':
        setAboutOpen(true);
        break;
      case 'apk_download':
        setApkDownloadOpen(true);
        break;
      case 'vip_payment':
        handleOpenVipPayment();
        break;
      case 'vip_room':
        handleOpenVipRoom();
        break;
      case 'add_server':
        setAddServerOpen(true);
        break;
      case 'ai_assistant':
        setAiAssistantOpen(true);
        break;
      case 'code_generator':
        setCodeGeneratorOpen(true);
        break;
    }
  };

  const handleSaveLocalServer = (
    server: VpnServer,
    clientPrivateKey?: string,
    address?: string
  ) => {
    setLocalServers(prev => [server, ...prev.filter(s => s.id !== server.id)]);
    setSelectedServer(server);
    setSelectedPort(server.endpointPort);
    setConnectionMode('wireguard_server');
    if (clientPrivateKey || address) {
      handleUpdateWireGuard({
        ...(clientPrivateKey ? { privateKey: clientPrivateKey } : {}),
        ...(address ? { address } : {}),
        endpointHost: server.endpointHost,
        endpointPort: server.endpointPort,
        peerPublicKey: server.serverPublicKey,
      });
    }
    vpnBridge.clearNotice();
    vpnBridge.emitLog(
      'success',
      `[Server Added] ${server.name} (${server.endpointHost}:${server.endpointPort}) yashyizweho kandi irahiswemo.`
    );
  };

  const handleDeleteLocalServer = (id: string) => {
    setLocalServers(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (selectedServer.id === id) {
        setSelectedServer(remaining[0] || backendServers[0] || DEFAULT_LOCAL_MANUAL_PROFILE);
      }
      return remaining;
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100 flex justify-center font-sans transition-colors relative overflow-hidden">

      {/* LIVE ANIMATED MATRIX HACKING + CONSTELLATION BACKGROUND */}
      <MatrixHackingBackground accentColor={settings.accentColor} />

      {/* APP SHELL */}
      <div className="w-full max-w-lg min-h-screen bg-transparent shadow-2xl border-x border-slate-300/40 dark:border-blue-500/25 flex flex-col relative z-10">
        {currentView === 'settings' ? (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={updates => setSettings(prev => ({ ...prev, ...updates }))}
            onBack={() => setCurrentView('main')}
          />
        ) : (
          <>
            <TopAppBar
              onOpenDrawer={() => setDrawerOpen(true)}
              onOpenSettings={() => setCurrentView('settings')}
              onOpenPayloadGen={() => setPayloadGenOpen(true)}
              onOpenExport={() => setExportConfigOpen(true)}
              onOpenImport={() => setImportConfigOpen(true)}
              onOpenServerApps={() => setServerAppsOpen(true)}
              onOpenAbout={() => setAboutOpen(true)}
              onClearLogs={handleClearLogs}
              onOpenUpdate={() => setOnlineUpdateOpen(true)}
              onOpenVipPayment={handleOpenVipPayment}
              onOpenVipRoom={handleOpenVipRoom}
              onOpenAiAssistant={() => setAiAssistantOpen(true)}
              onOpenCodeGenerator={() => setCodeGeneratorOpen(true)}
              accentColor={settings.accentColor}
            />

            <TabsHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              unreadLogsCount={logs.length}
            />

            <TickerNotice
              onServerClick={() => setServerAppsOpen(true)}
              onVipClick={handleOpenVipPayment}
            />

            <div className="flex-1 flex flex-col bg-transparent overflow-y-auto">
              {activeTab === 'HOME' ? (
                <HomeScreen
                  status={status}
                  stats={stats}
                  vipStatus={vipStatus}
                  servers={servers}
                  selectedServer={selectedServer}
                  onSelectServer={setSelectedServer}
                  selectedPort={selectedPort}
                  onSelectPort={setSelectedPort}
                  connectionMode={connectionMode}
                  onSelectConnectionMode={setConnectionMode}
                  simCarrier={simCarrier}
                  onSelectSimCarrier={setSimCarrier}
                  customSetupEnabled={customSetupEnabled}
                  onToggleCustomSetup={setCustomSetupEnabled}
                  customSetup={customSetup}
                  onUpdateWireGuard={handleUpdateWireGuard}
                  onGenerateKeyPair={handleGenerateKeyPair}
                  onStartVpn={handleStartVpn}
                  onStopVpn={handleStopVpn}
                  onOpenImportConfig={() => setImportConfigOpen(true)}
                  onOpenExportConfig={() => setExportConfigOpen(true)}
                  onOpenServerApps={() => setServerAppsOpen(true)}
                  onOpenUpdate={() => setOnlineUpdateOpen(true)}
                  onOpenVipPayment={handleOpenVipPayment}
                  onOpenVipRoom={handleOpenVipRoom}
                  onOpenAddServer={() => setAddServerOpen(true)}
                  onOpenApkDownload={() => setApkDownloadOpen(true)}
                  onRefreshBackend={refreshBackend}
                  accentColor={settings.accentColor}
                />
              ) : activeTab === 'VIP_ROOM' ? (
                <VipRoomScreen
                  vipStatus={vipStatus}
                  servers={servers}
                  selectedServer={selectedServer}
                  onSelectServer={setSelectedServer}
                  onOpenVipPayment={handleOpenVipPayment}
                  onSwitchToHome={() => setActiveTab('HOME')}
                  onRefreshBackend={refreshBackend}
                  onOpenCodeGenerator={() => setCodeGeneratorOpen(true)}
                />
              ) : (
                <LogScreen logs={logs} onClearLogs={handleClearLogs} />
              )}
            </div>
          </>
        )}

        {/* Quick Side Server Edge Tab (kuruhande) */}
        {currentView === 'main' && (
          <button
            type="button"
            onClick={() => setAddServerOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#050B1A]/90 hover:bg-[#1D4ED8] text-[#06B6D4] hover:text-white border border-r-0 border-cyan-500/45 rounded-l-xl px-1.5 py-3 shadow-lg flex flex-col items-center gap-1 text-[10px] font-black tracking-wider cursor-pointer transition-colors"
            title="Ongeramo Server ku ruhande"
            aria-label="Ongeramo Server ku ruhande"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="[writing-mode:vertical-rl] rotate-180 uppercase">+ SERVER</span>
          </button>
        )}

        {/* Floating AI Assistant Help Button */}
        {currentView === 'main' && (
          <button
            type="button"
            onClick={() => setAiAssistantOpen(true)}
            className="fixed bottom-4 right-4 z-30 bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] hover:from-blue-600 hover:to-cyan-400 text-white border border-cyan-300/40 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-blue-900/40 flex items-center gap-2 text-xs font-black tracking-wide cursor-pointer transition-transform active:scale-95"
            title="AI Assistant: Kwishyura, Free Internet & VPN Help"
            aria-label="AI Assistant"
          >
            <Bot className="w-4 h-4" />
            <span>AI Help</span>
          </button>
        )}
      </div>

      {/* SIDE DRAWER */}
      <SideMenuDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectOption={handleDrawerOption}
      />

      {/* MODALS */}
      <PayloadGeneratorModal
        isOpen={payloadGenOpen}
        onClose={() => setPayloadGenOpen(false)}
        onApplyPayload={p => {
          vpnBridge.emitLog('info', `[Payload Reference Copied] ${p.replace(/\r\n/g, ' ')}`);
        }}
      />

      <IdentificationModal
        isOpen={identificationOpen}
        onClose={() => setIdentificationOpen(false)}
      />

      <ExportConfigModal
        isOpen={exportConfigOpen}
        onClose={() => setExportConfigOpen(false)}
        server={selectedServer}
        port={selectedPort}
        connectionMode={connectionMode}
        customSetup={customSetup}
      />

      <ImportConfigModal
        isOpen={importConfigOpen}
        onClose={() => setImportConfigOpen(false)}
        onConfigImported={handleConfigImported}
      />

      <ServerAppsModal
        isOpen={serverAppsOpen}
        onClose={() => setServerAppsOpen(false)}
        servers={servers}
      />

      <OnlineUpdateModal
        isOpen={onlineUpdateOpen}
        onClose={() => setOnlineUpdateOpen(false)}
        onApplyUpdate={ver => {
          vpnBridge.emitLog('vip_shield', `[BACKEND SYNC] Verified Mutiganda Yvan VPN ${ver}`);
          refreshBackend();
        }}
      />

      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      <ApkDownloadModal
        isOpen={apkDownloadOpen}
        onClose={() => setApkDownloadOpen(false)}
      />

      <VipPaymentModal
        isOpen={vipPaymentOpen}
        onClose={() => {
          setVipPaymentOpen(false);
          refreshBackend();
        }}
        onPaymentUpdated={refreshBackend}
      />

      <AddServerDrawer
        isOpen={addServerOpen}
        onClose={() => setAddServerOpen(false)}
        localServers={localServers}
        selectedServerId={selectedServer.id}
        onSaveLocalServer={handleSaveLocalServer}
        onSelectServer={srv => {
          setSelectedServer(srv);
          setSelectedPort(srv.endpointPort);
          setConnectionMode('wireguard_server');
        }}
        onDeleteLocalServer={handleDeleteLocalServer}
        onBackendServerAdded={refreshBackend}
      />

      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        clientState={{
          isNativeAndroid: stats.nativeAndroidActive,
          status,
          connectionMode,
          simCarrier,
          hasEndpoint: Boolean(
            (connectionMode === 'wireguard_server' && selectedServer.endpointHost) ||
              customSetup.wireguard.endpointHost
          ),
          hasKeys: Boolean(
            customSetup.wireguard.privateKey &&
              ((connectionMode === 'wireguard_server' && selectedServer.serverPublicKey) ||
                customSetup.wireguard.peerPublicKey)
          ),
        }}
        onOpenVipPayment={handleOpenVipPayment}
        onOpenVipRoom={handleOpenVipRoom}
        onOpenAddServer={() => setAddServerOpen(true)}
        onOpenApkDownload={() => setApkDownloadOpen(true)}
      />

      <CodeGeneratorRoomModal
        isOpen={codeGeneratorOpen}
        onClose={() => setCodeGeneratorOpen(false)}
      />
    </div>
  );
}
