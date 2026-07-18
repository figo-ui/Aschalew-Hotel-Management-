import React from 'react';
import { motion } from 'motion/react';
import { Compass, Coffee, MapPin, Sparkles } from 'lucide-react';
import { useLanguageTheme } from './LanguageThemeContext.tsx';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export default function HeroSection({ onExploreClick }: HeroSectionProps) {
  const { language, theme, t, themeColors } = useLanguageTheme();

  // Localized descriptions
  const heroDescriptions = {
    en: "Nestled at the gates of Chiro (Asbe Teferi), beneath the mist-shrouded peaks of the beautiful Chercher Mountains. Experience modern luxury combined with legendary warm Ethiopian hospitality and fresh organic coffee.",
    am: "በሚያማምሩ የቸርቸር ተራሮች ጭጋጋማ ኮረብታዎች ስር በጭሮ (አስበ ተፈሪ) መግቢያ ላይ ይገኛል። ዘመናዊ የቅንጦት ሁኔታን ከታዋቂው ሞቅ ያለ የኢትዮጵያ እንግዳ ተቀባይነት እና ትኩስ ኦርጋኒክ ቡና ጋር ተጣምሮ ያግኙ።",
    om: "Millo Chercher jala handhuura magaalaa Ciroo (Asbe Teferii) irratti argama. Qulqullina ammayyaa, kabaja keessummeessuu Itoophiyaa beekamaa fi buna dhandhama gaarii qabu waliin muuxadhu."
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-zinc-950 text-white">
      {/* Background Image with elegant overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920')`,
          filter: 'brightness(0.35) contrast(1.05)'
        }} 
      />

      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40" />

      {/* Hero Content */}
      <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-6"
        >
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${themeColors.badgeBg} border ${themeColors.primaryBorder} ${themeColors.primaryText} text-xs font-semibold uppercase tracking-wider backdrop-blur-md`}>
            <Sparkles className="w-3.5 h-3.5" />
            The Jewel of Eastern Ethiopia
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          {t('hotel_branding_title')} <br />
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeColors.gradientText}`}>
            Hotel &amp; Resort
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-zinc-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-sans"
        >
          {heroDescriptions[language]}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={onExploreClick}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl ${themeColors.primaryBg} ${themeColors.primaryHover} text-zinc-950 font-bold transition duration-300 shadow-lg ${themeColors.primaryGlow} flex items-center justify-center gap-2 cursor-pointer group`}
          >
            <Compass className="w-5 h-5 group-hover:rotate-45 transition duration-300" />
            {t('explore_rooms')}
          </button>
          
          <a 
            href="#experience"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold transition duration-300 flex items-center justify-center gap-2"
          >
            <Coffee className={`w-5 h-5 ${themeColors.primaryText}`} />
            Chiro Experience
          </a>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 pt-8 border-t border-zinc-900 max-w-4xl mx-auto"
        >
          <div className="flex flex-col items-center p-3 text-center">
            <span className={`${themeColors.primaryText} text-xl font-bold font-display`}>24/7</span>
            <span className="text-zinc-400 text-xs mt-1">Concierge &amp; Butler Service</span>
          </div>
          <div className="flex flex-col items-center p-3 text-center">
            <span className={`${themeColors.primaryText} text-xl font-bold font-display`}>Fresh</span>
            <span className="text-zinc-400 text-xs mt-1">Chercher Highland Coffee</span>
          </div>
          <div className="flex flex-col items-center p-3 text-center">
            <span className={`${themeColors.primaryText} text-xl font-bold font-display`}>Luxury</span>
            <span className="text-zinc-400 text-xs mt-1">Suites with Mountain View</span>
          </div>
          <div className="flex flex-col items-center p-3 text-center">
            <span className={`${themeColors.primaryText} text-xl font-bold font-display`}>100%</span>
            <span className="text-zinc-400 text-xs mt-1">Secure &amp; Guarded Parking</span>
          </div>
        </motion.div>
      </div>

      {/* Ambient glowing effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: theme === 'amber' ? 'rgba(245,158,11,0.08)' : theme === 'green' ? 'rgba(16,185,129,0.08)' : theme === 'blue' ? 'rgba(59,130,246,0.08)' : 'rgba(139,92,246,0.08)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: theme === 'amber' ? 'rgba(217,119,6,0.08)' : theme === 'green' ? 'rgba(5,150,105,0.08)' : theme === 'blue' ? 'rgba(37,99,235,0.08)' : 'rgba(124,58,237,0.08)' }} />
    </div>
  );
}
