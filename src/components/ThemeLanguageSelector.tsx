import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Palette, Check, ChevronDown, Sun, Moon } from 'lucide-react';
import { useLanguageTheme, Language, Theme } from './LanguageThemeContext.tsx';

export default function ThemeLanguageSelector() {
  const { language, setLanguage, theme, setTheme, isDarkMode, toggleDarkMode, themeColors } = useLanguageTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'none' | 'lang' | 'theme'>('none');

  const languages: { code: Language; name: string; flag: string; native: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' },
    { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹', native: 'Oromoo' }
  ];

  const themes: { code: Theme; name: string; colorClass: string; desc: string }[] = [
    { code: 'amber', name: 'Ethiopian Gold', colorClass: 'bg-amber-500', desc: 'Luxury traditional warm glow' },
    { code: 'green', name: 'Chercher Forest', colorClass: 'bg-emerald-500', desc: 'Lush Hararghe mountain vibe' },
    { code: 'blue', name: 'Sky Luxury', colorClass: 'bg-blue-500', desc: 'Cool premium business style' },
    { code: 'purple', name: 'Royal Velvet', colorClass: 'bg-purple-500', desc: 'Imperial Ethiopian elegance' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const currentTheme = themes.find(t => t.code === theme) || themes[0];

  const handleToggleMenu = (menu: 'lang' | 'theme') => {
    if (activeMenu === menu) {
      setActiveMenu('none');
    } else {
      setActiveMenu(menu);
      setIsOpen(true);
    }
  };

  return (
    <div id="theme-lang-selector-root" className="fixed top-4 right-4 z-[9999] font-sans">
      <div className="flex items-center gap-2">
        
        {/* Sleek Floating Compact Panel */}
        <motion.div 
          layout
          className="flex items-center gap-1 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-md shadow-2xl"
        >
          {/* Language trigger */}
          <button
            onClick={() => handleToggleMenu('lang')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              activeMenu === 'lang' 
                ? `${themeColors.badgeBg} ${themeColors.primaryText}` 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase font-mono tracking-wider">{language}</span>
            <span className="text-[10px] opacity-60">{currentLang.flag}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeMenu === 'lang' ? 'rotate-180' : ''}`} />
          </button>

          <div className="w-px h-4 bg-zinc-800" />

          {/* Theme trigger */}
          <button
            onClick={() => handleToggleMenu('theme')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              activeMenu === 'theme' 
                ? `${themeColors.badgeBg} ${themeColors.primaryText}` 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title="Switch Theme Accent"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className={`w-2.5 h-2.5 rounded-full ${currentTheme.colorClass} border border-zinc-950`} />
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeMenu === 'theme' ? 'rotate-180' : ''}`} />
          </button>

          <div className="w-px h-4 bg-zinc-800" />

          {/* Light/Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition cursor-pointer flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
          </button>
        </motion.div>
      </div>

      {/* Dynamic Dropdown list */}
      <AnimatePresence>
        {activeMenu !== 'none' && (
          <>
            {/* Click outside backdrop spacer */}
            <div 
              className="fixed inset-0 z-[-1]" 
              onClick={() => setActiveMenu('none')} 
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-64 bg-zinc-950/95 border border-zinc-850 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl z-10"
            >
              {activeMenu === 'lang' && (
                <div className="space-y-1">
                  <div className="px-2 pb-1.5 border-b border-zinc-900 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Select Language</span>
                    <Globe className="w-3 h-3 text-zinc-500" />
                  </div>
                  {languages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setActiveMenu('none');
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer group ${
                          isSelected 
                            ? `${themeColors.badgeBg} text-zinc-100` 
                            : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">{lang.flag}</span>
                          <div>
                            <p className="text-xs font-bold leading-none">{lang.name}</p>
                            <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">{lang.native}</span>
                          </div>
                        </div>
                        {isSelected && <Check className={`w-3.5 h-3.5 ${themeColors.primaryText}`} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeMenu === 'theme' && (
                <div className="space-y-1">
                  <div className="px-2 pb-1.5 border-b border-zinc-900 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Accent Theme</span>
                    <Palette className="w-3 h-3 text-zinc-500" />
                  </div>
                  {themes.map((t) => {
                    const isSelected = theme === t.code;
                    return (
                      <button
                        key={t.code}
                        onClick={() => {
                          setTheme(t.code);
                          setActiveMenu('none');
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer group ${
                          isSelected 
                            ? `${themeColors.badgeBg} text-zinc-100` 
                            : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${t.colorClass} border border-zinc-900 flex-shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold leading-none">{t.name}</p>
                            <p className="text-[8px] text-zinc-500 truncate mt-0.5">{t.desc}</p>
                          </div>
                        </div>
                        {isSelected && <Check className={`w-3.5 h-3.5 ${themeColors.primaryText}`} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
