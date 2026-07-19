import React, { useState, useEffect } from 'react';
import HeroSection from './components/HeroSection.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import GuestView from './components/GuestView.tsx';
import AdminView from './components/AdminView.tsx';
import GoogleMapsSection from './components/GoogleMapsSection.tsx';
import ThemeLanguageSelector from './components/ThemeLanguageSelector.tsx';
import { useLanguageTheme } from './components/LanguageThemeContext.tsx';
import { Room } from './types.ts';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase.ts';
import { RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function App() {
  const { language, theme, isDarkMode, t, themeColors } = useLanguageTheme();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [showExplore, setShowExplore] = useState(false);

  // Synchronize Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userToken = await firebaseUser.getIdToken();
          
          // Sync with the database backend
          const syncResponse = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`,
            },
          });
          
          if (syncResponse.ok) {
            const dbUser = await syncResponse.json();
            setToken(userToken);
            setUser(dbUser);
          } else {
            console.error('Failed to sync authenticated user with database');
          }
        } catch (error) {
          console.error('Error during auth token sync:', error);
        }
      } else {
        // Only clear if not in a demo mock session (detect demo sessions by looking at token string prefix)
        setToken((prevToken) => {
          if (prevToken && prevToken.startsWith('demo-')) {
            return prevToken; // Keep demo session active
          }
          setUser(null);
          return null;
        });
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch rooms list
  useEffect(() => {
    fetchRooms();
  }, [token]);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const roomsData = await response.json();
        setRooms(roomsData);
      }
    } catch (err) {
      console.error('Failed to query rooms list:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Toggle Role Helper (critical for seamless workspace testing of guest and admin PMS dashboards)
  const handleToggleRole = async () => {
    if (!user || !token) return;
    
    const newRole = user.role === 'admin' ? 'guest' : 'admin';
    
    // For demo tokens, update local client state directly
    if (token.startsWith('demo-')) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      return;
    }

    try {
      const response = await fetch('/api/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } catch (err) {
      console.error('Failed to change demo user roles:', err);
    }
  };

  const handleAuthSuccess = (sessionToken: string, dbUserDetails: any) => {
    setToken(sessionToken);
    setUser(dbUserDetails);
    setIsLoadingAuth(false);
  };

  const handleLogout = async () => {
    setIsLoadingAuth(true);
    if (token && token.startsWith('demo-')) {
      // Direct local reset for demo bypass sessions
      setToken(null);
      setUser(null);
      setIsLoadingAuth(false);
      return;
    }
    
    try {
      await signOut(auth);
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#faf8f5] text-stone-900'}`}>
        <RefreshCw className={`w-8 h-8 animate-spin ${themeColors.primaryText} mb-4`} />
        <span className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Verifying secure hospitality portal session...</span>
      </div>
    );
  }

  // Not logged in -> Show login
  if (!token || !user) {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess}
        isLoading={isLoadingRooms}
        setIsLoading={setIsLoadingRooms}
        rooms={rooms}
      />
    );
  }

  // Render Admin View PMS
  if (user.role === 'admin') {
    return (
      <AdminView 
        token={token}
        user={user}
        onLogout={handleLogout}
        onToggleRole={handleToggleRole}
      />
    );
  }

  // Render Guest Portal
  return (
    <div className={`${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#faf8f5] text-stone-900'} min-h-screen relative transition-colors duration-205`}>
      {/* Floating Theme and Language Switcher */}
      <ThemeLanguageSelector 
        user={user}
        onLogout={handleLogout}
        onToggleRole={handleToggleRole}
      />

      {/* Role and developer utility banner */}
      <div 
        className={`border-b text-center py-2.5 px-4 flex items-center justify-center gap-3 transition-colors ${isDarkMode ? 'border-zinc-800' : 'border-stone-200'}`}
        style={{ 
          backgroundImage: `linear-gradient(to right, ${themeColors.radialGlow}, transparent)`,
        }}
      >
        <span className={`text-xs ${themeColors.primaryText} font-semibold flex items-center gap-1.5`}>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          {t('reviewer_mode')}
        </span>
        <button
          onClick={handleToggleRole}
          className={`px-3 py-1 rounded ${themeColors.primaryBg} ${themeColors.primaryHover} text-zinc-950 font-extrabold text-[10px] transition cursor-pointer flex items-center gap-1 shadow`}
        >
          <SlidersHorizontal className="w-3 h-3" /> {t('toggle_admin')}
        </button>
      </div>

      <GuestView 
        token={token}
        user={user}
        rooms={rooms}
        onLogout={handleLogout}
        onToggleRole={handleToggleRole}
      />
    </div>
  );
}
