import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Palette, Check, ChevronDown, Sun, Moon, 
  MoreVertical, LogOut, ShieldCheck, Mail, Bell, Settings, User 
} from 'lucide-react';
import { useLanguageTheme, Language, Theme } from './LanguageThemeContext.tsx';

interface ThemeLanguageSelectorProps {
  user?: any;
  onLogout?: () => void;
  onToggleRole?: () => void;
}

export default function ThemeLanguageSelector({ user, onLogout, onToggleRole }: ThemeLanguageSelectorProps) {
  const { language, setLanguage, theme, setTheme, isDarkMode, toggleDarkMode, t, themeColors } = useLanguageTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Sync preferences states with localStorage/events
  const [prefEmailConfirmations, setPrefEmailConfirmations] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_email_confirmations');
    return saved !== null ? saved === 'true' : true;
  });
  const [prefEmailReminders, setPrefEmailReminders] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_email_reminders');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const handlePrefsChange = () => {
      const savedConfirmations = localStorage.getItem('pref_email_confirmations');
      if (savedConfirmations !== null) {
        setPrefEmailConfirmations(savedConfirmations === 'true');
      }
      const savedReminders = localStorage.getItem('pref_email_reminders');
      if (savedReminders !== null) {
        setPrefEmailReminders(savedReminders === 'true');
      }
    };
    window.addEventListener('aschalew_prefs_updated', handlePrefsChange);
    return () => window.removeEventListener('aschalew_prefs_updated', handlePrefsChange);
  }, []);

  const handleToggleConfirmations = (checked: boolean) => {
    setPrefEmailConfirmations(checked);
    localStorage.setItem('pref_email_confirmations', String(checked));
    window.dispatchEvent(new Event('aschalew_prefs_updated'));
  };

  const handleToggleReminders = (checked: boolean) => {
    setPrefEmailReminders(checked);
    localStorage.setItem('pref_email_reminders', String(checked));
    window.dispatchEvent(new Event('aschalew_prefs_updated'));
  };

  const languages: { code: Language; name: string; flag: string; native: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' },
    { code: 'om', name: 'Oromoo', flag: '🇪🇹', native: 'Oromoo' }
  ];

  const themes: { code: Theme; name: string; colorClass: string; desc: string }[] = [
    { code: 'amber', name: 'Gold', colorClass: 'bg-[#D4AF37]', desc: 'Traditional warm glow' },
    { code: 'green', name: 'Green', colorClass: 'bg-emerald-500', desc: 'Hararghe mountain vibe' },
    { code: 'blue', name: 'Blue', colorClass: 'bg-blue-500', desc: 'Cool luxury corporate' },
    { code: 'purple', name: 'Purple', colorClass: 'bg-purple-500', desc: 'Imperial elegance' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div id="three-dots-settings-root" className="fixed top-4 right-4 z-[9999] font-sans">
      <div className="relative">
        {/* Three Dots Circular Kebab Button */}
        <button
          id="three-dots-trigger-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-zinc-900/95 border border-zinc-800/90 backdrop-blur-md shadow-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition cursor-pointer"
          title="More Options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* Dropdown Card */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop element to catch clicks outside */}
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setIsOpen(false)} 
              />

              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-72 bg-zinc-950/95 border border-zinc-850 rounded-2xl shadow-2xl backdrop-blur-xl z-10 overflow-hidden"
              >
                {/* User Info Header Section */}
                {user && (
                  <div className="flex items-center gap-3 p-3.5 border-b border-zinc-900 bg-zinc-900/30">
                    <img
                      src={user.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                      alt="User Avatar"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full border border-zinc-800"
                    />
                    <div className="min-w-0 flex-grow">
                      <p className="text-xs font-bold text-zinc-100 truncate">{user.displayName || user.email}</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-bold">
                        {user.role === 'admin' ? 'Administrator' : 'Guest Member'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 1: Language Switcher */}
                <div className="p-3 border-b border-zinc-900 space-y-2">
                  <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-500" /> Language
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {languages.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`py-1.5 px-1 rounded-lg text-center transition flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? `${themeColors.badgeBg} text-zinc-100 border border-zinc-800/80`
                              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <span className="text-sm">{lang.flag}</span>
                          <span className="text-[9px] font-bold font-mono mt-0.5">{lang.code.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Accent Theme & Appearance Mode */}
                <div className="p-3 border-b border-zinc-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-zinc-500" /> Accent Theme
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 capitalize">{theme}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex gap-2">
                      {themes.map((t) => {
                        const isSelected = theme === t.code;
                        return (
                          <button
                            key={t.code}
                            onClick={() => setTheme(t.code)}
                            className={`w-6 h-6 rounded-full ${t.colorClass} border-2 transition ${
                              isSelected ? 'border-zinc-100 scale-110' : 'border-zinc-950 hover:scale-105'
                            }`}
                            title={t.name}
                          />
                        );
                      })}
                    </div>
                    {/* Light/Dark Mode Switch */}
                    <button
                      onClick={toggleDarkMode}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                      {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  </div>
                </div>

                {/* Section 3: Notification Preferences */}
                <div className="p-3 border-b border-zinc-900 space-y-2">
                  <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-zinc-500" /> Notification Preferences
                  </span>
                  <div className="space-y-2 pt-1">
                    {/* Confirmations Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[10px] flex items-center gap-1.5 font-medium">
                        <Mail className="w-3 h-3 text-zinc-500" /> Email Invoices
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleConfirmations(!prefEmailConfirmations)}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          prefEmailConfirmations ? 'bg-amber-500' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                            prefEmailConfirmations ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Reminders Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[10px] flex items-center gap-1.5 font-medium">
                        <Bell className="w-3 h-3 text-zinc-500" /> Stay Guides &amp; Tips
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleReminders(!prefEmailReminders)}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          prefEmailReminders ? 'bg-amber-500' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                            prefEmailReminders ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 4: Role-switching & Logout actions */}
                <div className="p-2 bg-zinc-900/10 space-y-1">
                  {onToggleRole && (
                    <button
                      onClick={() => {
                        onToggleRole();
                        setIsOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left transition flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/60 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('toggle_admin')}</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left transition flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('logout')}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
