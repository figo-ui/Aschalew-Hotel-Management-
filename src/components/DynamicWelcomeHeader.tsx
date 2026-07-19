import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';
import { BookingWithDetails } from '../types.ts';
import { useLanguageTheme } from './LanguageThemeContext.tsx';

interface DynamicWelcomeHeaderProps {
  user: any;
  myBookings: BookingWithDetails[];
}

export default function DynamicWelcomeHeader({ user, myBookings }: DynamicWelcomeHeaderProps) {
  const [weather, setWeather] = useState<{ temp: number, code: number } | null>(null);
  const { themeColors } = useLanguageTheme();

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=9.0750&longitude=40.8700&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (data && data.current_weather) {
          setWeather({
            temp: data.current_weather.temperature,
            code: data.current_weather.weathercode
          });
        }
      })
      .catch(console.error);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className={`w-6 h-6 ${themeColors.primaryText}`} />;
    if (code <= 48) return <Cloud className="w-6 h-6 text-zinc-400" />;
    if (code <= 67) return <CloudRain className="w-6 h-6 text-blue-400" />;
    return <Wind className="w-6 h-6 text-zinc-400" />;
  };

  const getGreeting = () => {
    const name = user.displayName || user.email || 'Guest';
    
    // Check booking statuses
    const checkedIn = myBookings.find(b => b.booking.status === 'checked_in');
    if (checkedIn) {
      return `Welcome back to your room, ${name}`;
    }
    
    const upcoming = myBookings.find(b => b.booking.status === 'confirmed');
    if (upcoming) {
      return `Looking forward to your stay, ${name}`;
    }
    
    return `Welcome to Aschalew Hotel, ${name}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mt-6">
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-100">{getGreeting()}</h2>
          <p className="text-sm text-zinc-400 mt-1">We hope you enjoy the tranquility of West Hararghe.</p>
        </div>
        
        {weather && (
          <div className="flex items-center gap-4 bg-zinc-950/80 px-5 py-3 rounded-xl border border-zinc-800/50 shadow-inner">
            {getWeatherIcon(weather.code)}
            <div>
              <p className="text-base font-bold text-zinc-200 leading-tight">{weather.temp}°C</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Chiro, Ethiopia</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
