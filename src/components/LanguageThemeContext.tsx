import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'am' | 'om';
export type Theme = 'amber' | 'green' | 'blue' | 'purple';

export interface ThemeColors {
  primaryText: string;
  primaryBg: string;
  primaryHover: string;
  primaryBorder: string;
  primaryGlow: string;
  radialGlow: string;
  gradientText: string;
  badgeBg: string;
  ring: string;
  accentText: string;
}

interface LanguageThemeContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  t: (key: string) => string;
  themeColors: ThemeColors;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & Actions
  "portal_title": {
    en: "Aschalew International Portal",
    am: "አሻለው ኢንተርናሽናል ፖርታል",
    om: "Aschalew International Portal"
  },
  "toggle_admin": {
    en: "Toggle Admin Mode",
    am: "ወደ አስተዳዳሪ ሁነታ ቀይር",
    om: "Admin Mode Jijjiiri"
  },
  "logout": {
    en: "Logout",
    am: "ውጣ",
    om: "Ba'i"
  },
  "explore_rooms": {
    en: "Explore Luxury Rooms",
    am: "የቅንጦት ክፍሎችን ያስሱ",
    om: "Kutaalee Qoradhu"
  },
  "rooms_suites": {
    en: "Rooms & Suites",
    am: "ክፍሎች እና ስብስቦች",
    om: "Kutaalee & Suuyitoota"
  },
  "my_bookings": {
    en: "My Bookings & Folio",
    am: "የእኔ መያዣዎች እና ፎሊዮ",
    om: "Kutaalee Ani Qabadhe"
  },
  "write_review": {
    en: "Write Google Review",
    am: "የጉግል ግምገማ ፃፍ",
    om: "Google Review Barreessi"
  },
  "post_review": {
    en: "Post Review to Landing Page",
    am: "ግምገማውን በድረ-ገጹ ላይ አስፍር",
    om: "Gabaasa Ol Gasi"
  },
  "gps_coords": {
    en: "GPS Coordinates",
    am: "ጂፒኤስ መጋጠሚያዎች",
    om: "GPS Coordinates"
  },
  "gmaps_integration": {
    en: "Google Maps Integration",
    am: "የጉግል ካርታዎች ውህደት",
    om: "Macaafa Google Maps"
  },
  "discover_chiro": {
    en: "Discover Chiro Through Google Maps",
    am: "ጭሮን በጉግል ካርታዎች ያግኙ",
    om: "Magaalaa Ciroo Google Maps irratti argadhu"
  },
  "real_feedback": {
    en: "Real guest feedback, photo collections, and interactive location guides straight from Google Places.",
    am: "ትክክለኛ የእንግዳ አስተያየት፣ የፎቶ ስብስቦች እና በይነተገናኝ አካባቢ መመሪያዎች ከጉግል ቦታዎች።",
    om: "Yaada dhugaa keessummootaa, kuusaalee suuraa, fi qajeelfamoota bakkaa dabalataa kallattiin Google Places irraa."
  },
  "rating_breakdown": {
    en: "Google Rating Breakdown",
    am: "የጉግል ደረጃዎች ዝርዝር",
    om: "Gabaasa Rating Google"
  },
  "all_reviews": {
    en: "All Reviews",
    am: "ሁሉም ግምገማዎች",
    om: "Gabaasoota Hundumaa"
  },
  "five_star": {
    en: "5-Star Rating",
    am: "የ 5-ኮከብ ደረጃ",
    om: "Rating Urjii 5"
  },
  "with_photos": {
    en: "With Photos",
    am: "ከፎቶዎች ጋር",
    om: "Suuraawwan Waliin"
  },
  "sim_review": {
    en: "Simulate a Google Review",
    am: "የጉግል ግምገማ አስመስለው",
    om: "Yaada Google Fakkeessi"
  },
  "your_name": {
    en: "Your Name",
    am: "የእርስዎ ስም",
    om: "Maqaa Keessan"
  },
  "star_rating": {
    en: "Star Rating",
    am: "የኮከብ ደረጃ",
    om: "Rating Urjii"
  },
  "review_details": {
    en: "Review Details",
    am: "የግምገማ ዝርዝሮች",
    om: "Yaada Dabalataa"
  },
  "optional_image": {
    en: "Optional Image URL",
    am: "አማራጭ የምስል URL",
    om: "Optional Image URL"
  },
  "reviewer_mode": {
    en: "Reviewer mode: You are signed in as a Guest. Want to check the Admin PMS Dashboard?",
    am: "የገምጋሚ ሁነታ፡ እንደ እንግዳ ገብተዋል። የአስተዳዳሪ PMS ዳሽቦርድ መፈተሽ ይፈልጋሉ?",
    om: "Akaakuu keessummaa: Keessummaa taatanii seentaniittu. PMS Admin ilaaluu barbaadduu?"
  },
  
  // Auth Screen Translation
  "hotel_branding_title": {
    en: "Aschalew International",
    am: "አሻለው ኢንተርናሽናል",
    om: "Aschalew International"
  },
  "hotel_branding_subtitle": {
    en: "Hotel & Resort • Chiro",
    am: "ሆቴል እና ሪዞርት • ጭሮ",
    om: "Hotel & Resort • Ciroo"
  },
  "secure_pms_portal": {
    en: "Secure Hospitality PMS & Guest Portal",
    am: "ደህንነቱ የተጠበቀ የእንግዳ መቀበያ PMS እና የእንግዳ ፖርታል",
    om: "PMS fi Karra Keessummootaa"
  },
  "portal_desc": {
    en: "Manage luxury room reservations, housekeeping logs, real-time guest folios, and Explore Chiro local guides in West Hararghe.",
    am: "የቅንጦት ክፍሎች ምዝገባን፣ የጽዳት ምዝግብ ማስታወሻዎችን፣ የእንግዳ ፎሊዮዎችን እና የጭሮ መመሪያዎችን በምዕራብ ሐረርጌ ያስተዳድሩ።",
    om: "Kutaalee qabachuu, qulqullina kutaalee, folios keessummootaa, fi qajeelfama Magaalaa Ciroo dabalataa xiinxali."
  },
  "username_email": {
    en: "Username or Email",
    am: "የተጠቃሚ ስም ወይም ኢሜይል",
    om: "Maqaa ykn Email"
  },
  "password": {
    en: "Password",
    am: "የይለፍ ቃል",
    om: "Jecha Icciitii"
  },
  "sign_in": {
    en: "Sign In Securely",
    am: "ደህንነቱ በተጠበቀ ሁኔታ ይግቡ",
    om: "Gara Keessaa Seeni"
  },
  "dont_have_account": {
    en: "Don't have an account?",
    am: "መለያ የለዎትም?",
    om: "Account hin qabduu?"
  },
  "register_here": {
    en: "Register here",
    am: "እዚህ ይመዝገቡ",
    om: "Asitti Galmaa'aa"
  },
  "aschalew_motto": {
    en: "The Gateway of West Hararghe Hospitality",
    am: "የምዕራብ ሐረርጌ እንግዳ ተቀባይነት መግቢያ በር",
    om: "Miltoommii fi Kabaja Harargee Lixaa"
  },
  "admin_demo_credentials": {
    en: "ADMIN DEMO CREDENTIALS",
    am: "የአስተዳዳሪ ማሳያ ምስክር ወረቀቶች",
    om: "KODII GM / ADMIN DEMO"
  },
  "guest_demo_credentials": {
    en: "GUEST DEMO CREDENTIALS",
    am: "የእንግዳ ማሳያ ምስክር ወረቀቶች",
    om: "KODII GUEST DEMO"
  },
  "demo_username": {
    en: "Username",
    am: "የተጠቃሚ ስም",
    om: "Username"
  }
};

const LanguageThemeContext = createContext<LanguageThemeContextType | undefined>(undefined);

export const LanguageThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('aschalew_lang') as Language) || 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('aschalew_theme') as Theme) || 'amber';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('aschalew_dark_mode');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('aschalew_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('aschalew_theme', theme);
    
    const root = document.documentElement;
    root.classList.remove('theme-amber', 'theme-green', 'theme-blue', 'theme-purple');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('aschalew_dark_mode', String(isDarkMode));
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      return key;
    }
    return translations[key][language] || translations[key]['en'];
  };

  const themeColorsMap: Record<Theme, ThemeColors> = {
    amber: {
      primaryText: "text-[#D4AF37]",
      primaryBg: "bg-[#D4AF37]",
      primaryHover: "hover:bg-[#bfa032] hover:from-[#bfa032] hover:to-[#D4AF37]",
      primaryBorder: "border-[#D4AF37]/20",
      primaryGlow: "shadow-[#D4AF37]/30",
      radialGlow: "rgba(212,175,55,0.08)",
      gradientText: "from-[#D4AF37] to-amber-200",
      badgeBg: "bg-[#D4AF37]/10",
      ring: "focus:border-[#D4AF37] focus:ring-[#D4AF37]/20",
      accentText: "text-[#D4AF37]"
    },
    green: {
      primaryText: "text-emerald-400 dark:text-emerald-400 light:text-[#006400]",
      primaryBg: "bg-[#006400]",
      primaryHover: "hover:bg-[#004d00] hover:from-[#004d00] hover:to-[#006400]",
      primaryBorder: "border-[#006400]/20",
      primaryGlow: "shadow-[#006400]/30",
      radialGlow: "rgba(0,100,0,0.08)",
      gradientText: "from-emerald-400 to-[#006400]",
      badgeBg: "bg-[#006400]/10",
      ring: "focus:border-[#006400] focus:ring-[#006400]/20",
      accentText: "text-[#006400]"
    },
    blue: {
      primaryText: "text-blue-400",
      primaryBg: "bg-blue-500",
      primaryHover: "hover:bg-blue-400 hover:from-blue-400 hover:to-blue-500",
      primaryBorder: "border-blue-500/20",
      primaryGlow: "shadow-blue-500/30",
      radialGlow: "rgba(59,130,246,0.08)",
      gradientText: "from-blue-400 to-blue-200",
      badgeBg: "bg-blue-500/10",
      ring: "focus:border-blue-500 focus:ring-blue-500/20",
      accentText: "text-blue-500"
    },
    purple: {
      primaryText: "text-purple-400",
      primaryBg: "bg-purple-500",
      primaryHover: "hover:bg-purple-400 hover:from-purple-400 hover:to-purple-500",
      primaryBorder: "border-purple-500/20",
      primaryGlow: "shadow-purple-500/30",
      radialGlow: "rgba(139,92,246,0.08)",
      gradientText: "from-purple-400 to-purple-200",
      badgeBg: "bg-purple-500/10",
      ring: "focus:border-purple-500 focus:ring-purple-500/20",
      accentText: "text-purple-500"
    }
  };

  const themeColors = themeColorsMap[theme];

  return (
    <LanguageThemeContext.Provider value={{ language, setLanguage, theme, setTheme, isDarkMode, toggleDarkMode, t, themeColors }}>
      {children}
    </LanguageThemeContext.Provider>
  );
};

export const useLanguageTheme = () => {
  const context = useContext(LanguageThemeContext);
  if (!context) {
    throw new Error('useLanguageTheme must be used within a LanguageThemeProvider');
  }
  return context;
};
