import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, Search, Coffee, BedDouble, UtensilsCrossed, MapPin, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useLanguageTheme } from './LanguageThemeContext.tsx';

interface FAQItem {
  id: string;
  category: 'amenities' | 'services' | 'dining' | 'local';
  question: { en: string; am: string; om: string };
  answer: { en: string; am: string; om: string };
}

export default function FAQSection() {
  const { language, theme, t, themeColors } = useLanguageTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'amenities' | 'services' | 'dining' | 'local'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 'faq-wifi',
      category: 'amenities',
      question: {
        en: "Is high-speed Wi-Fi available at the resort?",
        am: "በሪዞርቱ ውስጥ ባለከፍተኛ ፍጥነት ዋይ ፋይ (Wi-Fi) አለ?",
        om: "Wi-Fi'n saffisa jabaa qabu ni argamaa?"
      },
      answer: {
        en: "Yes, complimentary premium fiber-optic Wi-Fi is available throughout the entire property, including all guest rooms, dining halls, and our outdoor mountain-view terrace. There is no password required; simply accept the terms of service on our landing portal.",
        am: "አዎ፣ ሁሉም የእንግዳ ማረፊያ ክፍሎችን፣ የመመገቢያ አዳራሾችን እና የተራራ እይታ በረንዳውን ጨምሮ በመላው ግቢ ውስጥ ነጻ ከፍተኛ ፍጥነት ያለው የፋይበር ኦፕቲክ ዋይ ፋይ አገልግሎት አለ። ምንም የይለፍ ቃል አያስፈልግም፤ የእኛን መግቢያ ገጽ ላይ የአገልግሎት ውሉን መቀበል ብቻ በቂ ነው።",
        om: "Eeyyee, Wi-Fi'n fayiiber-ooptiiks tolaa ta'e kutaalee hundatti, akkasumas terraces fi iddoowwan nyaataa hundatti ni argama. Jecha icciitii hin barbaachisu, tajaajiloota fudhachuuf waliigaltee irratti cuqaasuu qofa."
      }
    },
    {
      id: 'faq-breakfast',
      category: 'dining',
      question: {
        en: "Is breakfast included, and what are the dining hours?",
        am: "ቁርስ ይካተታል? የምግብ ሰዓትስ መቼ ነው?",
        om: "Cireen ni dabalataa, yeroon nyaataa hoo yoomi?"
      },
      answer: {
        en: "Yes! Every reservation includes a complimentary hot breakfast buffet featuring traditional Ethiopian favorites (like Ful and Chechebsa) and international selections, paired with organic single-origin Chiro highland espresso. Dining hours are 6:30 AM to 10:00 AM daily at our signature Gara Restaurant.",
        am: "አዎ! እያንዳንዱ ክፍል ማስያዣ በነጻ የሙቅ ቁርስ ቡፌን ያካትታል፤ ይህም ባህላዊ የኢትዮጵያ ምግቦችን (እንደ ፉል እና ጨጨብሳ) እንዲሁም ዓለም አቀፍ አማራጮችን ከኦርጋኒክ ጭሮ ቡና ጋር ያቀርባል። የምግብ ሰዓት በየቀኑ ከጠዋቱ 12:30 እስከ 4:00 ሰዓት በጋራ ሬስቶራንታችን ውስጥ ነው።",
        om: "Eeyyee! Kutaa qabachuu keessan waliin cireen tolaa dabalata. Nyaata akka Caccabsaa fi Foolii, akkasumas buna addaa Ciroo of keessaa qaba. Sa'aatiin nyaataa ganama sa'aatii 12:30 hanga 4:00 ti Gara Restaurant keessatti."
      }
    },
    {
      id: 'faq-service',
      category: 'services',
      question: {
        en: "How do I request room service or housekeeping?",
        am: "የክፍል አገልግሎት (Room Service) ወይም የጽዳት አገልግሎት እንዴት ማዘዝ እችላለሁ?",
        om: "Tajaajila kutaa (Room Service) fi qulqullina akkamittan gaafadha?"
      },
      answer: {
        en: "You can request amenities right from your phone! Navigate to 'My Bookings', click on your active booking, and access the 'In-Room Service Hub' to order fresh towels, schedule housekeeping, or order delicious meals with a single tap. Our hospitality team is standby 24/7.",
        am: "የክፍል አገልግሎቶችን በቀጥታ ከስልክዎ ማዘዝ ይችላሉ። ወደ 'የእኔ መያዣዎች' ይሂዱ፣ ንቁ መያዣዎ ላይ ጠቅ ያድርጉ እና አዲስ ፎጣዎችን ለመጠየቅ፣ የክፍል ጽዳት ለማስያዝ ወይም ጣፋጭ ምግቦችን ለማዘዝ 'የክፍል አገልግሎት ማዕከልን' ይጠቀሙ። የእኛ ቡድን 24/7 ዝግጁ ነው።",
        om: "Tajaajiloota kana kallattiin bilbila keessaniin gaafachuu dandeessu. Gara 'My Bookings' deemuun, tajaajiloota akka qulqullinaa, uffata dabalataa ykn nyaata ajajuu dandeessu. Gareen keenya sa'aatii 24 qophiidha."
      }
    },
    {
      id: 'faq-checkout',
      category: 'amenities',
      question: {
        en: "What are the standard check-in and check-out times?",
        am: "መደበኛው የቼክ-ኢን (መግቢያ) እና ቼክ-አውት (መውጫ) ሰዓት ስንት ነው?",
        om: "Sa'aatiin seenuu (check-in) fi ba'uu (check-out) yoomi?"
      },
      answer: {
        en: "Standard check-in begins at 2:00 PM (8:00 local time) and check-out is at 11:00 AM (5:00 local time). If you need an early arrival or late departure, please mention it in the special notes of your booking or message our front desk staff. We always try our best to accommodate requests based on availability.",
        am: "መደበኛ መግቢያ ከቀኑ 8:00 ሰዓት ይጀምራል፣ መውጫ ደግሞ ረፋድ 5:00 ሰዓት ነው። ቀድመው መግባት ወይም ዘግይተው መውጣት ከፈለጉ፣ እባክዎ ክፍል ሲያስይዙ በልዩ ማስታወሻዎች ላይ ይጥቀሱ ወይም የፊት ጠረጴዛ ሰራተኞቻችንን ያነጋግሩ። ክፍሎች ሲኖሩ በደስታ እናስተናግዳለን።",
        om: "Sa'aatiin seenuu sa'aatii 8:00 (waaree booda) yoo ta'u sa'aatiin ba'uu sa'aatii 5:00 (ganama) dha. Yoo duras ta'ee dabalata barbaaddan gaaffii keessan nuuf ergaa. Akkaataa kutaaleen jiraniin isiniif mijeessina."
      }
    },
    {
      id: 'faq-parking',
      category: 'local',
      question: {
        en: "Is secure parking available, and can you arrange local transport?",
        am: "ደህንነቱ የተጠበቀ የመኪና ማቆሚያ አለ? የሀገር ውስጥ ትራንስፖርትስ ማመቻቸት ይቻላል?",
        om: "Iddoon dhaaba konkolaataa eegumsa qabu ni jiraa?"
      },
      answer: {
        en: "Yes, we provide 100% free, gated, and 24/7 guarded private parking for all guests. Our front desk concierge can also arrange direct airport transfers, guided tour vans to the Chercher Mountains peaks, or reliable bajaj/taxi transport around Chiro town center.",
        am: "አዎ፣ 100% ነፃ፣ በበሩ የተከለለ እና የ24 ሰዓት ጥበቃ የሚደረግለት የግል የመኪና ማቆሚያ እናቀርባለን። የፊት ጠረጴዛችን የአውሮፕላን ማረፊያ ማመላለሻዎችን፣ ወደ ቸርቸር ተራሮች የሚወስዱ አስጎብኚዎችን ወይም ወደ ጭሮ መሃል ከተማ የሚወስድ የታክሲ ትራንስፖርት ሊያመቻች ይችላል።",
        om: "Eeyyee, iddoon dhaaba konkolaataa eegumsa guutuu qabu tola jira. Akkasumas gara tulluuwwan Chercher fi handhuura magaalaa Cirootti geejjibaa fi tajaajila gabaa ni mijeessina."
      }
    },
    {
      id: 'faq-water',
      category: 'amenities',
      question: {
        en: "Do rooms feature hot water and air conditioning?",
        am: "ክፍሎች ሙቅ ውሃ እና የአየር ማቀዝቀዣ (AC) አሏቸው?",
        om: "Kutaaleen bishaan ho'aa fi qilleensa qabbaneessaa qabuu?"
      },
      answer: {
        en: "Absolutely. All our premium rooms and executive suites are equipped with private water heaters for high-pressure hot showers, modern climate control systems (AC), and complimentary bottled pure highland water replenished daily by our housekeeping team.",
        am: "በፍጹም። ሁሉም የእኛ ፕሪሚየም ክፍሎች እና ስብስቦች ለሙቅ ሻወር የግል የውሃ ማሞቂያዎች፣ ዘመናዊ የአየር ማቀዝቀዣዎች (AC) እና በየቀኑ በጽዳት ሰራተኞቻችን የሚቀርብ ነፃ የታሸገ ንጹህ ውሃ የታጠቁ ናቸው።",
        om: "Guutuudha. Kutaaleen keenya hundinuu bishaan ho'aa, qilleensa qabbaneessaa ammayyaa (AC) fi bishaan dhugaatii tolaa eegumsa qulqullinaa waliin guyyaa guyyaatti kan dhiyaatu qabu."
      }
    }
  ];

  // Localized texts
  const titles = {
    en: {
      sectionTitle: "Guest Help Desk & FAQ",
      sectionSub: "Quick answers about our luxury amenities, in-room dining, and premium resort services.",
      searchPlaceholder: "Search amenities, room services, breakfast...",
      all: "All FAQs",
      amenities: "Amenities",
      services: "Room Services",
      dining: "Dining & Coffee",
      local: "Parking & Local",
      noResults: "No answers found for your search query. Try another keyword!",
      found: "Matching results"
    },
    am: {
      sectionTitle: "የእንግዳ መረጃ ጠረጴዛ እና ተደጋጋሚ ጥያቄዎች",
      sectionSub: "ስለ ቅንጦት አገልግሎቶቻችን፣ የክፍል መመገቢያ እና ፕሪሚየም የሪዞርት አገልግሎቶች ፈጣን መልሶች ያግኙ።",
      searchPlaceholder: "አገልግሎቶችን፣ የክፍል እገዛን፣ ቁርስን ፈልግ...",
      all: "ሁሉም ጥያቄዎች",
      amenities: "ምቾቶች",
      services: "የክፍል አገልግሎቶች",
      dining: "ምግብ እና ቡና",
      local: "ፓርኪንግ እና መጓጓዣ",
      noResults: "ለፍለጋዎ ምንም መልስ አልተገኘም። እባክዎ ሌላ ቃል ይሞክሩ!",
      found: "የተገኙ ውጤቶች"
    },
    om: {
      sectionTitle: "Gargaarsa Keessummootaa & FAQ",
      sectionSub: "Waa'ee tajaajiloota keenya qulqulluu, nyaata kutaalee fi tajaajila resort dabalataa deebii ariifataa.",
      searchPlaceholder: "Tajaajila, ciree, qulqullina barbaadi...",
      all: "Hundumaa",
      amenities: "Haalawwan Kutaa",
      services: "Tajaajila Kutaa",
      dining: "Nyaata & Buna",
      local: "Geejjiba & Parking",
      noResults: "Gaaffii keessaniif deebiin hin argamne. Jecha biraa yaalaa!",
      found: "Deebii argame"
    }
  };

  const currentTexts = titles[language] || titles['en'];

  // Filter and search FAQs
  const filteredFAQs = useMemo(() => {
    return faqItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      
      const qText = (item.question[language] || item.question['en']).toLowerCase();
      const aText = (item.answer[language] || item.answer['en']).toLowerCase();
      const matchesSearch = qText.includes(q) || aText.includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, language]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'amenities':
        return <BedDouble className="w-4 h-4" />;
      case 'services':
        return <HelpCircle className="w-4 h-4" />;
      case 'dining':
        return <UtensilsCrossed className="w-4 h-4" />;
      case 'local':
        return <MapPin className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <div id="faq-section-container" className="mt-16 border-t border-zinc-900 pt-12 pb-8 max-w-4xl mx-auto px-1">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono mb-3">
          <HelpCircle className={`w-3.5 h-3.5 ${themeColors.primaryText}`} />
          <span>HELP &amp; INFORMATION CENTER</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
          {currentTexts.sectionTitle}
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto mt-2 leading-relaxed">
          {currentTexts.sectionSub}
        </p>
      </div>

      {/* Real-time search input */}
      <div className="relative max-w-xl mx-auto mb-6">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500">
          <Search className="w-4 h-4" />
        </div>
        <input 
          id="faq-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={currentTexts.searchPlaceholder}
          className={`w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-10.5 pr-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition ${themeColors.ring} focus:ring-1`}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono font-bold text-zinc-500 hover:text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category filters */}
      <div id="faq-categories-tab" className="flex flex-wrap justify-center gap-2 mb-8">
        {(['all', 'amenities', 'services', 'dining', 'local'] as const).map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`faq-cat-btn-${cat}`}
              onClick={() => {
                setSelectedCategory(cat);
                setExpandedId(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isActive 
                  ? `${themeColors.badgeBg} ${themeColors.primaryText} border ${themeColors.primaryBorder}` 
                  : 'bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {cat === 'all' ? <SlidersHorizontal className="w-3.5 h-3.5" /> : getCategoryIcon(cat)}
              <span>{currentTexts[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion container */}
      <div id="faq-accordion-container" className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredFAQs.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const qText = item.question[language] || item.question['en'];
            const aText = item.answer[language] || item.answer['en'];

            return (
              <motion.div
                key={item.id}
                id={`faq-card-${item.id}`}
                layout="position"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'border-zinc-800 bg-zinc-900/30 shadow-xl' 
                    : 'border-zinc-900 hover:border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/20'
                }`}
              >
                {/* Header button */}
                <button
                  id={`faq-header-btn-${item.id}`}
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`p-1.5 rounded-lg bg-zinc-950 text-zinc-500 border border-zinc-800 shrink-0 ${isExpanded ? themeColors.primaryText : ''}`}>
                      {getCategoryIcon(item.category)}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold text-zinc-100 leading-snug transition-colors ${isExpanded ? themeColors.primaryText : 'hover:text-zinc-100'}`}>
                      {qText}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-zinc-300' : ''}`} />
                </button>

                {/* Expanding body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={`faq-body-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 pl-14 pt-1 border-t border-zinc-900/60">
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                          {aText}
                        </p>
                        
                        {/* Optional subtle help guide action depending on the category */}
                        {item.category === 'services' && (
                          <div className="mt-3.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-zinc-500 font-medium">Ready to serve 24 hours. No additional fees apply for basic setups.</span>
                          </div>
                        )}
                        {item.category === 'dining' && (
                          <div className="mt-3.5 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500 font-medium">Brewed directly by award-winning traditional Oromia baristas.</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredFAQs.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl"
          >
            <HelpCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-xs font-medium px-4">
              {currentTexts.noResults}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
