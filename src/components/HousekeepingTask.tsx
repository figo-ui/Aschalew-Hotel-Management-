import React, { useState } from 'react';
import { Check, Clock, User, ClipboardList } from 'lucide-react';
import { Room } from '../types.ts';

interface HousekeepingTaskProps {
  room: Room;
  schedule: any;
  isDarkMode: boolean;
  onComplete: (roomId: number) => void;
}

export default function HousekeepingTask({ room, schedule, isDarkMode, onComplete }: HousekeepingTaskProps) {
  const [tasks, setTasks] = useState([
    { id: 'linen', label: 'Changed bed linens and towels', completed: false },
    { id: 'bathroom', label: 'Cleaned & sanitized bathroom', completed: false },
    { id: 'trash', label: 'Emptied trash and replaced bins', completed: false },
    { id: 'floors', label: 'Vacuumed and mopped floors', completed: false },
    { id: 'amenities', label: 'Restocked minibar and amenities', completed: false },
  ]);

  const allCompleted = tasks.every(t => t.completed);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleFinish = () => {
    if (allCompleted) {
      onComplete(room.id);
    }
  };

  return (
    <div className={`p-5 rounded-xl border flex flex-col gap-4 transition-colors ${
      isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-stone-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-display font-bold ${isDarkMode ? 'text-zinc-200' : 'text-stone-800'}`}>
              Room {room.roomNumber} <span className="opacity-70 text-sm font-normal">({room.type})</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              room.status === 'dirty' 
                ? 'bg-amber-500/15 text-amber-500' 
                : 'bg-emerald-500/15 text-emerald-500'
            }`}>
              {room.status}
            </span>
          </div>
          <div className={`flex flex-wrap items-center gap-3 mt-2 text-xs ${isDarkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> <span className="font-semibold text-amber-500">{schedule.assignedStaff}</span></span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {schedule.scheduleTime}</span>
          </div>
        </div>
        
        {room.status === 'dirty' && (
          <div className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-2 h-fit ${
            allCompleted 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
              : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}>
            <ClipboardList className="w-4 h-4" />
            {tasks.filter(t => t.completed).length} / {tasks.length} Tasks
          </div>
        )}
      </div>

      {/* Checklist */}
      {room.status === 'dirty' ? (
        <div className="space-y-2 mt-2">
          {tasks.map(task => (
            <label 
              key={task.id} 
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                task.completed 
                  ? isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' 
                  : isDarkMode ? 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${
                task.completed 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : isDarkMode ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-stone-300'
              }`}>
                {task.completed && <Check className="w-3.5 h-3.5" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={task.completed} 
                onChange={() => toggleTask(task.id)} 
              />
              <span className={`text-sm ${
                task.completed 
                  ? isDarkMode ? 'text-zinc-300 line-through opacity-70' : 'text-stone-500 line-through'
                  : isDarkMode ? 'text-zinc-200' : 'text-stone-700'
              }`}>
                {task.label}
              </span>
            </label>
          ))}
          
          <div className="pt-3">
            <button 
              onClick={handleFinish}
              disabled={!allCompleted}
              className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                allCompleted 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20' 
                  : isDarkMode ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Mark Room as Clean & Ready
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
          isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          <Check className="w-5 h-5" />
          Room is clean and ready for guests.
        </div>
      )}
    </div>
  );
}
