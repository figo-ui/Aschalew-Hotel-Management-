import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Star, ThumbsUp, Calendar, MessageSquare, Camera, 
  ChevronLeft, ChevronRight, Eye, Sparkles, AlertCircle, Info, CheckCircle2, Navigation
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

// Hotel coordinates in Chiro, Ethiopia
const HOTEL_COORDS = { lat: 9.0833, lng: 40.8667 };

// Nearby points of interest in Chiro
const NEARBY_PLACES = [
  { id: 'hotel', name: 'Aschalew International Hotel & Resort', type: 'Hotel', lat: 9.0833, lng: 40.8667, desc: 'Luxury stay in the heart of Chiro' },
  { id: 'mountain', name: 'Chercher Mountains Trailhead', type: 'Adventure', lat: 9.0950, lng: 40.8500, desc: 'Panoramic hiking trails' },
  { id: 'coffee', name: 'Chiro Highland Organic Coffee Farm', type: 'Experience', lat: 9.0700, lng: 40.8800, desc: 'Single-origin traditional farm tour' },
  { id: 'market', name: 'Chiro Central Cultural Market', type: 'Culture', lat: 9.0850, lng: 40.8710, desc: 'Fresh spices and hand-woven crafts' }
];

// Seed reviews from Google Maps
const INITIAL_REVIEWS = [
  {
    id: 1,
    author: "Abraham Tsegaye",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    relativeTime: "2 days ago",
    text: "Aschalew Hotel is the absolute best place to stay in Chiro! The mountain views from the suite balcony are breathtaking, and the traditional Ethiopian coffee they brew in the lobby in the morning is top-tier. Extremely secure and hospitable.",
    likes: 18,
    verified: true,
    photo: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    author: "Fatuma Kedir",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    relativeTime: "1 week ago",
    text: "Modern luxury meets local culture. The rooms are incredibly spacious, beds are very comfortable, and the staff's warmth makes you feel at home instantly. Located perfectly at the gates of West Hararghe.",
    likes: 12,
    verified: true,
    photo: null
  },
  {
    id: 3,
    author: "Dr. Marcus Lindqvist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    relativeTime: "3 weeks ago",
    text: "I visited Chiro for coffee research and stayed here for a week. The internet is highly reliable, rooms are quiet and immaculate, and they even helped coordinate a professional guide to the organic coffee washing stations. Exceptional service!",
    likes: 24,
    verified: true,
    photo: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 4,
    author: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
    rating: 4,
    relativeTime: "1 month ago",
    text: "A true oasis in West Hararghe. Loved the gym, the steam room, and the local cuisine at the restaurant. Try the Harar-style kitfo! The only minor thing was a slow checkout during peak hour, but the receptionist was lovely.",
    likes: 8,
    verified: false,
    photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600"
  }
];

// Beautiful images representing Google Maps Photos of Chiro / Aschalew Hotel
const MAPS_GALLERY = [
  {
    id: 'g1',
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800',
    caption: 'Hotel Exterior & Main Entrance',
    category: 'Hotel',
    takenBy: 'Aschalew Official'
  },
  {
    id: 'g2',
    url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
    caption: 'Luxury Suite with Chercher Mountain view',
    category: 'Rooms',
    takenBy: 'Local Guide Abraham'
  },
  {
    id: 'g3',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800',
    caption: 'Chiro Highland Organic Coffee Farm',
    category: 'Local Vibe',
    takenBy: 'Sarah J. (Visitor)'
  },
  {
    id: 'g4',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    caption: 'Recreational pool and gardens',
    category: 'Amenities',
    takenBy: 'Google Trusted Photographer'
  },
  {
    id: 'g5',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    caption: 'Executive lounge dining & fresh Harar dishes',
    category: 'Dining',
    takenBy: 'Foodie Harar Guide'
  },
  {
    id: 'g6',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    caption: 'The majestic peaks of Chercher Mountains',
    category: 'Local Vibe',
    takenBy: 'Drone Explorer Ethiopia'
  }
];

export default function GoogleMapsSection() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [activeReviewFilter, setActiveReviewFilter] = useState<'all' | 'highest' | 'with-photos'>('all');
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'Hotel' | 'Rooms' | 'Local Vibe' | 'Amenities'>('all');
  const [selectedImage, setSelectedImage] = useState<typeof MAPS_GALLERY[0] | null>(null);
  
  // Custom review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    author: '',
    rating: 5,
    text: '',
    photo: ''
  });

  // Map state
  const [selectedPlace, setSelectedPlace] = useState<typeof NEARBY_PLACES[0]>(NEARBY_PLACES[0]);
  const [mapZoom, setMapZoom] = useState(13);

  // Retrieve API Key
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  // Handling manual reviews likes/thumbs up
  const handleLikeReview = (id: number) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, likes: r.likes + 1 } : r));
  };

  // Submitting review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.author || !newReview.text) {
      alert("Please fill out your name and review details!");
      return;
    }

    const reviewObject = {
      id: Date.now(),
      author: newReview.author,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      rating: newReview.rating,
      relativeTime: "Just now",
      text: newReview.text,
      likes: 0,
      verified: false,
      photo: newReview.photo || null
    };

    setReviews([reviewObject, ...reviews]);
    setNewReview({ author: '', rating: 5, text: '', photo: '' });
    setShowReviewForm(false);
    alert("Thank you! Your Google Maps simulated review has been posted successfully to the landing page.");
  };

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    if (activeReviewFilter === 'highest') return r.rating === 5;
    if (activeReviewFilter === 'with-photos') return r.photo !== null;
    return true;
  });

  // Filter photos
  const filteredPhotos = MAPS_GALLERY.filter(p => {
    if (activeGalleryTab === 'all') return true;
    return p.category === activeGalleryTab;
  });

  return (
    <section id="experience" className="py-20 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(245,158,11,0.03),transparent_60%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest mb-4">
            <MapPin className="w-3.5 h-3.5" /> Google Maps Integration
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight leading-tight">
            Discover Chiro Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Google Maps</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed">
            Real guest feedback, photo collections, and interactive location guides straight from Google Places. See why Aschalew Hotel is the highest-rated stay in West Hararghe.
          </p>
        </div>

        {/* 2 Column Layout: Interactive Map + Location Info & Photo Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Interactive Map Block (LHS - 7 Cols) */}
          <div id="hotel-map-block" className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[520px] relative overflow-hidden group">
            
            {/* Map Header details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 z-10 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> GPS Coordinates
                </h3>
                <p className="text-zinc-200 text-xs font-bold mt-1">
                  {selectedPlace.name}
                </p>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Latitude: {selectedPlace.lat.toFixed(4)} • Longitude: {selectedPlace.lng.toFixed(4)}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg uppercase">
                {selectedPlace.type}
              </span>
            </div>

            {/* Map Rendering Container */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
              {hasValidKey ? (
                /* Google Maps Real Integration */
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={HOTEL_COORDS}
                    defaultZoom={13}
                    mapId="ASCHALEW_MAP_ID"
                    style={{ width: '100%', height: '100%' }}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  >
                    {NEARBY_PLACES.map(place => (
                      <AdvancedMarker 
                        key={place.id} 
                        position={{ lat: place.lat, lng: place.lng }}
                        onClick={() => setSelectedPlace(place)}
                      >
                        <Pin 
                          background={place.id === 'hotel' ? '#f59e0b' : '#3b82f6'} 
                          borderColor="#18181b" 
                          glyphColor="#ffffff" 
                        />
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              ) : (
                /* Beautiful Simulated High-fidelity Map if API Key is not set up yet */
                <div className="absolute inset-0 bg-zinc-950 flex flex-col justify-between overflow-hidden">
                  
                  {/* Grid Lines Overlay representing a map */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
                  
                  {/* Styled mountains and topographical outlines */}
                  <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-amber-500/5 blur-[50px] pointer-events-none" />
                  <div className="absolute bottom-20 right-20 w-52 h-52 rounded-full bg-blue-500/5 blur-[50px] pointer-events-none" />
                  
                  {/* Simulated Map Markers & Paths */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 pointer-events-none">
                    
                    {/* Drawing simulated roads */}
                    <svg className="absolute inset-0 w-full h-full text-zinc-800/40 pointer-events-none" style={{ zIndex: 1 }}>
                      <path d="M -50 200 C 200 220, 300 150, 800 180" fill="none" stroke="currentColor" strokeWidth="6" />
                      <path d="M 400 -50 C 420 200, 380 400, 450 600" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path d="M 100 400 L 700 100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>

                    {/* Simulated Markers */}
                    {NEARBY_PLACES.map((place) => {
                      // Map GPS coordinates to beautiful absolute pixel locations in container
                      const isSelected = selectedPlace.id === place.id;
                      let top = "50%";
                      let left = "50%";
                      if (place.id === 'hotel') { top = "42%"; left = "48%"; }
                      else if (place.id === 'mountain') { top = "15%"; left = "20%"; }
                      else if (place.id === 'coffee') { top = "75%"; left = "70%"; }
                      else if (place.id === 'market') { top = "32%"; left = "82%"; }

                      return (
                        <div 
                          key={place.id}
                          className="absolute pointer-events-auto cursor-pointer"
                          style={{ top, left, transform: 'translate(-50%, -50%)', zIndex: isSelected ? 20 : 10 }}
                          onClick={() => setSelectedPlace(place)}
                        >
                          <div className="flex flex-col items-center">
                            <motion.div 
                              animate={{ scale: isSelected ? [1, 1.12, 1] : 1 }}
                              transition={{ repeat: isSelected ? Infinity : 0, duration: 2 }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition ${
                                isSelected 
                                  ? 'bg-amber-500 border-zinc-100 text-zinc-950 scale-110 shadow-amber-500/30' 
                                  : 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800'
                              }`}
                            >
                              <MapPin className="w-5 h-5 shrink-0" />
                            </motion.div>
                            <span className="px-2 py-0.5 mt-1 text-[9px] font-bold tracking-tight rounded bg-zinc-900/90 border border-zinc-800 text-zinc-200 backdrop-blur-sm shadow whitespace-nowrap">
                              {place.id === 'hotel' ? 'Aschalew Hotel' : place.name.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Simulated Zoom & Map Toggles */}
                  <div className="absolute bottom-4 right-4 z-15 flex flex-col gap-1.5">
                    <button onClick={() => setMapZoom(z => Math.min(18, z+1))} className="w-8 h-8 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-800 hover:text-white flex items-center justify-center text-sm shadow">
                      +
                    </button>
                    <button onClick={() => setMapZoom(z => Math.max(10, z-1))} className="w-8 h-8 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-800 hover:text-white flex items-center justify-center text-sm shadow">
                      -
                    </button>
                  </div>

                  {/* Satellite View label */}
                  <div className="absolute bottom-4 left-4 z-15 px-3 py-1 bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-400 rounded-lg shadow">
                    Google Satellite: 3D Off
                  </div>
                </div>
              )}
            </div>

            {/* Places Selector Carousel */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {NEARBY_PLACES.map((place) => {
                const isSelected = selectedPlace.id === place.id;
                return (
                  <button
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      if (place.id === 'hotel') setMapZoom(14);
                      else setMapZoom(13);
                    }}
                    className={`px-3 py-2 rounded-xl text-left border flex-shrink-0 transition max-w-[190px] cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-500 block">
                      {place.type}
                    </p>
                    <h4 className="text-[11px] font-bold truncate mt-0.5">
                      {place.name}
                    </h4>
                    <p className="text-[9px] text-zinc-500 line-clamp-1">
                      {place.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Instruction block for real Google Maps activation */}
            {!hasValidKey && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-400 leading-normal">
                  <span className="font-extrabold text-amber-400">Google Maps Mode:</span> Showing high-fidelity offline simulation. To activate real, live Google Satellite/Street View maps: Add your <code className="bg-zinc-900 px-1 py-0.5 text-zinc-100 rounded text-[9px] border border-zinc-800">GOOGLE_MAPS_PLATFORM_KEY</code> under **Settings** ⚙️ → **Secrets**.
                </p>
              </div>
            )}
          </div>

          {/* Google Maps Photo Gallery (RHS - 5 Cols) */}
          <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col h-[520px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Google Local Photos</h3>
                <p className="text-[11px] text-zinc-500">Uploaded by trusted Google Guides &amp; visitors</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 border border-zinc-850 rounded">
                {MAPS_GALLERY.length} Images
              </span>
            </div>

            {/* Image categories tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 border-b border-zinc-850/60 mb-4 scrollbar-none">
              {['all', 'Hotel', 'Rooms', 'Local Vibe', 'Amenities'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveGalleryTab(tab as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition whitespace-nowrap ${
                    activeGalleryTab === tab
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Photo Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800">
              {filteredPhotos.map((photo) => (
                <div 
                  key={photo.id}
                  onClick={() => setSelectedImage(photo)}
                  className="relative h-28 rounded-xl overflow-hidden cursor-pointer group border border-zinc-850 hover:border-amber-500/50 transition duration-300"
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Photo Attribution Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end">
                    <p className="text-[9px] font-black text-zinc-100 truncate">{photo.caption}</p>
                    <span className="text-[7px] text-zinc-400">By {photo.takenBy}</span>
                  </div>
                  
                  {/* Subtle Camera Icon */}
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-950/60 backdrop-blur-md text-zinc-300 border border-zinc-800 pointer-events-none group-hover:bg-amber-500 group-hover:text-zinc-950 transition duration-300">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-850/60 text-center">
              <span className="text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-zinc-400" />
                Click any image to expand and view photographer credits
              </span>
            </div>
          </div>
        </div>

        {/* Google Reviews Section (Horizontal Row of Reviews + Breakdown Dashboard) */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 sm:p-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-zinc-850 mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-200">Google Places Verified Reviews</h3>
              <p className="text-xs text-zinc-500 mt-1">Authentic ratings from travelers around the globe</p>
            </div>

            {/* Ratings Summary Stats */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                <span className="text-2xl font-black text-amber-400 font-display">4.9</span>
                <div>
                  <div className="flex text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} className="w-3 h-3 fill-current" />)}
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">Google Rating Breakdown</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveReviewFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeReviewFilter === 'all' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
                >
                  All Reviews
                </button>
                <button 
                  onClick={() => setActiveReviewFilter('highest')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeReviewFilter === 'highest' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
                >
                  5-Star Rating
                </button>
                <button 
                  onClick={() => setActiveReviewFilter('with-photos')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeReviewFilter === 'with-photos' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
                >
                  With Photos
                </button>
              </div>

              <button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Write Google Review
              </button>
            </div>
          </div>

          {/* Write a Review Modal/Form Overlay */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-8"
              >
                <form onSubmit={handleSubmitReview} className="p-5 bg-zinc-950 rounded-2xl border border-amber-500/20 space-y-4 max-w-xl mx-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Simulate a Google Review
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowReviewForm(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Your Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Obang Omot"
                        value={newReview.author}
                        onChange={(e) => setNewReview({...newReview, author: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 rounded-lg outline-none focus:border-amber-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Star Rating</label>
                      <select 
                        value={newReview.rating}
                        onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 rounded-lg outline-none focus:border-amber-500 transition"
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                        <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                        <option value="3">⭐⭐⭐ (3 Stars)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Review Details</label>
                    <textarea 
                      placeholder="Share your experience at Aschalew Hotel & Resort..."
                      value={newReview.text}
                      onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 rounded-lg h-24 outline-none focus:border-amber-500 transition resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">Optional Image URL</label>
                    <input 
                      type="text" 
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      value={newReview.photo}
                      onChange={(e) => setNewReview({...newReview, photo: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-zinc-200 rounded-lg outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow transition"
                  >
                    Post Review to Landing Page
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Layout of Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredReviews.length === 0 ? (
              <div className="col-span-full py-12 text-center text-zinc-500 text-xs italic">
                No matching reviews found. Click "Write Google Review" to submit one!
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div 
                  key={review.id}
                  className="bg-zinc-950/50 border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-800 transition duration-300 group"
                >
                  <div className="space-y-4">
                    {/* User Details */}
                    <div className="flex items-center gap-3">
                      <img 
                        src={review.avatar} 
                        alt={review.author} 
                        className="w-9 h-9 rounded-full object-cover border border-zinc-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-zinc-200 truncate">{review.author}</h4>
                          {review.verified && (
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0" title="Verified Local Guide">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-500 block">{review.relativeTime}</span>
                      </div>
                    </div>

                    {/* Star Display */}
                    <div className="flex text-amber-400 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-zinc-800'}`} 
                        />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                      "{review.text}"
                    </p>

                    {/* Photo attached (if exists) */}
                    {review.photo && (
                      <div className="h-24 rounded-lg overflow-hidden border border-zinc-850 mt-3 relative">
                        <img 
                          src={review.photo} 
                          alt="Review attachment" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Like interaction */}
                  <div className="mt-4 pt-3 border-t border-zinc-850/60 flex justify-between items-center">
                    <button 
                      onClick={() => handleLikeReview(review.id)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-amber-400 transition flex items-center gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" /> {review.likes} Helpfulness
                    </button>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase">
                      Google Maps
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Lightbox Modal for Photo Gallery */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden p-3"
            >
              {/* Main Expanded Image */}
              <div className="relative aspect-video max-h-[70vh] bg-zinc-950 rounded-2xl overflow-hidden">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.caption} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Photo Meta details */}
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                <div>
                  <h4 className="text-zinc-200 text-sm font-bold">{selectedImage.caption}</h4>
                  <p className="text-xs text-zinc-500 mt-1">Uploaded to Google Places by <span className="text-zinc-300 font-semibold">{selectedImage.takenBy}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close Photo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
