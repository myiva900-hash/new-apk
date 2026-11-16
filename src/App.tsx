import React, { useState, useEffect } from 'react';
import {
  ConnectionMode,
  ConnectionStatus,
  CustomSetupConfig,
  AppSettings,
  VpnLogEntry,
  VpnServer,
  ExportableConfig,
  SimCarrierMode
} from './types/vpn';
import { SERVERS } from './data/servers';
import { vpnSimulator, VpnStats } from './services/vpnSimulator';
import { soundService } from './services/sound';
import { DEFAULT_PAYLOAD } from './services/payloadEngine';

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

export default function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [activeTab, setActiveTab] = useState<'HOME' | 'VIP_ROOM' | 'LOG'>('HOME');

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [stats, setStats] = useState<VpnStats>(() => vpnSimulator.getStats());
  const [logs, setLogs] = useState<VpnLogEntry[]>([]);
  const [selectedServer, setSelectedServer] = useState<VpnServer>(SERVERS[0]);
  const [selectedPort, setSelectedPort] = useState<number>(80);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('direct');
  const [simCarrier, setSimCarrier] = useState<SimCarrierMode>('all_sim');
  const [customSetupEnabled, setCustomSetupEnabled] = useState<boolean>(false);

  const [customSetup, setCustomSetup] = useState<CustomSetupConfig>({
    payload: DEFAULT_PAYLOAD,
    hostHeader: 'cloudflare.com',
    sni: 'edge.cloudflare.com',
    proxyHost: '104.21.58.120',
    proxyPort: '8080',
    dnsttDomain: 't.myv-dns.org',
    dnsttPublicKey: '3b6c28f090b4d4554be7df75bf1efbe00e572886f4a7c062abff4820a4be3568',
    dnsResolver: '1.1.1.1',
    importedConfigName: undefined,
  });

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

  // Subscribe to VPN service
  useEffect(() => {
    const unsubStatus = vpnSimulator.subscribeStatus((newStatus, newStats) => {
      setStatus(newStatus);
      setStats(newStats);
    });

    const unsubLogs = vpnSimulator.subscribeLogs(entry => {
      setLogs(prev => [...prev, entry]);
    });

    vpnSimulator.emitLog(
      'info',
      'Mutiganda Yvan VPN v6 ready (124h timer · All SIM Cards · No-VPS Edge).'
    );

    return () => {
      unsubStatus();
      unsubLogs();
    };
  }, []);

  const handleStartVpn = () => {
    vpnSimulator.startConnection(selectedServer, selectedPort, connectionMode, customSetup, {
      sound: settings.sound,
      vibrate: settings.vibrate,
      primaryDns: settings.primaryDns,
      forwardDns: settings.forwardDns,
      simCarrier,
    });
  };

  const handleStopVpn = () => {
    vpnSimulator.stopConnection({
      sound: settings.sound,
      vibrate: settings.vibrate,
    });
  };

  const handleConfigImported = (config: ExportableConfig) => {
    setConnectionMode(config.connectionMode);
    setCustomSetup(config.customSetup);
    setCustomSetupEnabled(true);

    const matchingServer = SERVERS.find(s => s.host === config.serverHost);
    if (matchingServer) {
      setSelectedServer(matchingServer);
    }
    if (config.serverPort) {
      setSelectedPort(config.serverPort);
    }

    setCustomSetup(prev => ({
      ...prev,
      importedConfigName: config.configName,
    }));

    vpnSimulator.emitLog(
      'success',
      `Imported configuration profile [${config.configName}] successfully applied.`
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
    }
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
                  onUpdateCustomSetup={updates => setCustomSetup(prev => ({ ...prev, ...updates }))}
                  onStartVpn={handleStartVpn}
                  onStopVpn={handleStopVpn}
                  onOpenPayloadGen={() => setPayloadGenOpen(true)}
                  onOpenImportConfig={() => setImportConfigOpen(true)}
                  onOpenExportConfig={() => setExportConfigOpen(true)}
                  onOpenServerApps={() => setServerAppsOpen(true)}
                  onOpenUpdate={() => setOnlineUpdateOpen(true)}
                  onOpenVipPayment={handleOpenVipPayment}
                  onOpenVipRoom={handleOpenVipRoom}
                  accentColor={settings.accentColor}
                  onSelectAccentColor={color => setSettings(prev => ({ ...prev, accentColor: color }))}
                />
              ) : activeTab === 'VIP_ROOM' ? (
                <VipRoomScreen
                  remainingSeconds={stats.remainingSeconds}
                  selectedServer={selectedServer}
                  onSelectServer={setSelectedServer}
                  onOpenVipPayment={handleOpenVipPayment}
                  onSwitchToHome={() => setActiveTab('HOME')}
                />
              ) : (
                <LogScreen logs={logs} onClearLogs={handleClearLogs} />
              )}
            </div>
          </>
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
          setCustomSetup(prev => ({ ...prev, payload: p }));
          setCustomSetupEnabled(true);
          setConnectionMode('custom_payload');
          vpnSimulator.emitLog('info', 'Custom payload updated and applied to setup.');
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
      />

      <OnlineUpdateModal
        isOpen={onlineUpdateOpen}
        onClose={() => setOnlineUpdateOpen(false)}
        onApplyUpdate={ver => {
          vpnSimulator.emitLog('vip_shield', `[UPDATE] Mutiganda Yvan VPN updated to ${ver}`);
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
        onClose={() => setVipPaymentOpen(false)}
      />
    </div>
  );
}
