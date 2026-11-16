import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Check, Volume2, Smartphone, Palette, Shield, Network } from 'lucide-react';
import { AppSettings } from '../types/vpn';
import { MyvLogo } from './MyvLogo';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [dnsModalOpen, setDnsModalOpen] = useState(false);

  const getHeaderClass = () => {
    switch (settings.accentColor) {
      case 'red':
        return 'from-rose-900 via-red-700 to-rose-900';
      case 'green':
        return 'from-emerald-900 via-emerald-700 to-teal-900';
      case 'yellow':
        return 'from-amber-800 via-amber-600 to-yellow-800';
      case 'black':
        return 'from-slate-950 via-slate-900 to-black border-b border-slate-800';
      case 'blue':
      default:
        return 'from-[#050B1A] via-[#1D4ED8] to-[#050B1A]';
    }
  };

  return (
    <div className="flex-1 w-full max-w-xl mx-auto bg-white/78 dark:bg-[#050B1A]/70 backdrop-blur-[2px] min-h-screen select-none pb-24">
      {/* Top Bar for Settings */}
      <div className={`sticky top-0 z-30 bg-gradient-to-r ${getHeaderClass()} text-white flex items-center justify-between h-14 px-3 sm:px-4 shadow-md`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none cursor-pointer"
            aria-label="Back to main screen"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">Settings</h1>
        </div>
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
          aria-label="Settings options"
        >
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-blue-500/15">
        {/* SECTION: APK & Updates */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-blue-950/40 dark:to-[#050B1A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-[#1D4ED8] shadow-xs flex items-center justify-center">
                <MyvLogo size={20} monochrome />
              </div>
              <h2 className="text-xs font-bold text-blue-800 dark:text-cyan-200 tracking-wide uppercase">
                Gukura APK Nshya muri Phone
              </h2>
            </div>
            <span className="text-[10px] bg-[#10B981] text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs">
              v6.0.0 VIP
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            APK Nshya <strong>Mutiganda Yvan VPN v6</strong> ikoresha WireGuard GoBackend kuri Android VpnService, Backend VIP &amp; Redeem Verification, na Hacking Matrix Background.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <a
              href="https://github.com/myiva900-hash/Mutiganda-Yvan-vpn-/releases/latest/download/app-debug.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <span>Download app-debug.apk</span>
            </a>
            <a
              href="https://github.com/myiva900-hash/Mutiganda-Yvan-vpn-/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 dark:border-blue-500/30 transition-colors cursor-pointer"
            >
              <span>Reba Releases</span>
            </a>
          </div>
        </div>

        {/* SECTION: Notification */}
        <div className="p-4 space-y-4">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
            Notification
          </h2>

          {/* Sound Toggle */}
          <div 
            onClick={() => onUpdateSettings({ sound: !settings.sound })}
            className="flex items-start justify-between cursor-pointer py-1"
          >
            <div className="pr-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Sound
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Notify with a sound while connecting or disconnecting.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.sound}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ sound: !settings.sound });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.sound ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.sound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibrate Toggle */}
          <div 
            onClick={() => onUpdateSettings({ vibrate: !settings.vibrate })}
            className="flex items-start justify-between cursor-pointer py-1"
          >
            <div className="pr-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Vibrate
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Notify with a vibration while connecting or disconnecting.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.vibrate}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ vibrate: !settings.vibrate });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.vibrate ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.vibrate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SECTION: Appearance */}
        <div className="p-4 space-y-4">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
            Appearance
          </h2>

          {/* Choose Theme */}
          <div
            onClick={() => setThemeModalOpen(true)}
            className="cursor-pointer py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded -mx-2 px-2 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Choose Theme (Light / Dark)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
              {settings.theme}
            </div>
          </div>

          {/* Choose Accent Color */}
          <div className="py-1">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Theme Color (Amabara)
            </div>
            <div className="flex items-center gap-3">
              {[
                { id: 'blue', label: 'Ubururu', bg: 'bg-blue-600' },
                { id: 'red', label: 'Umutuku', bg: 'bg-rose-600' },
                { id: 'green', label: 'Icyatsi', bg: 'bg-emerald-600' },
                { id: 'yellow', label: 'Umuhondo', bg: 'bg-amber-500' },
                { id: 'black', label: 'Umukara', bg: 'bg-slate-900' },
              ].map(color => (
                <button
                  key={color.id}
                  onClick={() => onUpdateSettings({ accentColor: color.id as any })}
                  className={`flex flex-col items-center gap-1 cursor-pointer`}
                >
                  <div
                    className={`w-7 h-7 rounded-full ${color.bg} transition-all flex items-center justify-center ${
                      settings.accentColor === color.id
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {settings.accentColor === color.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION: Connection */}
        <div className="p-4 space-y-4">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
            Connection
          </h2>

          {/* Connection Retry */}
          <div 
            onClick={() => onUpdateSettings({ connectionRetry: !settings.connectionRetry })}
            className="flex items-start justify-between cursor-pointer py-1"
          >
            <div className="pr-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Connection Retry
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Try to reconnect after connection is lost. By default, service is stopped after 10 consecutive unsuccessful attempts.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.connectionRetry}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ connectionRetry: !settings.connectionRetry });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.connectionRetry ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.connectionRetry ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Forward DNS */}
          <div 
            onClick={() => onUpdateSettings({ forwardDns: !settings.forwardDns })}
            className="flex items-start justify-between cursor-pointer py-1"
          >
            <div className="pr-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Forward DNS
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Forward DNS queries to remote server if enabled.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.forwardDns}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ forwardDns: !settings.forwardDns });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.forwardDns ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.forwardDns ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Custom DNS */}
          <div 
            onClick={() => onUpdateSettings({ customDns: !settings.customDns })}
            className="flex items-start justify-between cursor-pointer py-1"
          >
            <div className="pr-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Custom DNS
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Use custom DNS servers to resolve DNS queries.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.customDns}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ customDns: !settings.customDns });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.customDns ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.customDns ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Primary DNS input */}
          <div className={`space-y-3 pt-2 ${!settings.customDns ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary DNS
              </label>
              <input
                type="text"
                value={settings.primaryDns}
                onChange={e => onUpdateSettings({ primaryDns: e.target.value })}
                placeholder="1.1.1.1 (Cloudflare)"
                className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Secondary DNS
              </label>
              <input
                type="text"
                value={settings.secondaryDns}
                onChange={e => onUpdateSettings({ secondaryDns: e.target.value })}
                placeholder="8.8.8.8 (Google)"
                className="w-full p-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Auto Reconnect */}
          <div 
            onClick={() => onUpdateSettings({ autoReconnect: !settings.autoReconnect })}
            className="flex items-start justify-between cursor-pointer py-1 pt-2"
          >
            <div className="pr-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Auto Reconnect
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically attempt re-establishing tunnel when connectivity changes.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoReconnect}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateSettings({ autoReconnect: !settings.autoReconnect });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.autoReconnect ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  settings.autoReconnect ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Connection Timeout */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Connection Timeout (Seconds)
            </label>
            <select
              value={settings.connectionTimeout}
              onChange={e => onUpdateSettings({ connectionTimeout: Number(e.target.value) })}
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value={10}>10 Seconds (Fast Fail)</option>
              <option value={15}>15 Seconds (Standard)</option>
              <option value={30}>30 Seconds (Recommended)</option>
              <option value={60}>60 Seconds (High Latency)</option>
            </select>
          </div>
        </div>

        {/* SECTION: About & App Version */}
        <div className="p-4 space-y-2">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
            About App
          </h2>
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">App Name</span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Mutiganda Yvan VPN</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">App Version</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Mutiganda Yvan VPN v6</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Architecture</span>
            <span className="text-xs font-mono text-slate-500">Android VpnService / TUN</span>
          </div>
        </div>
      </div>

      {/* Theme Picker Modal */}
      {themeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
              Choose Theme
            </h3>
            <div className="space-y-2">
              {(['light', 'dark', 'system'] as const).map(themeOption => (
                <button
                  key={themeOption}
                  onClick={() => {
                    onUpdateSettings({ theme: themeOption });
                    setThemeModalOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-semibold capitalize transition-colors ${
                    settings.theme === themeOption
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{themeOption}</span>
                  {settings.theme === themeOption && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setThemeModalOpen(false)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
