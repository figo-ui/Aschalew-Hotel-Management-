import React, { useState, useMemo } from 'react';
import { Room } from '../types.ts';
import { BedDouble, AlertTriangle, CheckCircle2, Paintbrush, Plus, MapPin, Grid, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveFloorPlanProps {
  rooms: Room[];
  isDarkMode: boolean;
  onUpdateRoomStatus: (roomId: number, status: string) => void;
  hasAccess: (resource: string) => boolean;
}

export default function InteractiveFloorPlan({ rooms, isDarkMode, onUpdateRoomStatus, hasAccess }: InteractiveFloorPlanProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Group rooms by floor based on their first digit
  const floors = useMemo(() => {
    const grouped = rooms.reduce((acc, room) => {
      const floorMatch = room.roomNumber.match(/^(\d)/);
      const floorStr = floorMatch ? floorMatch[1] : '1';
      const floorNum = parseInt(floorStr);
      if (!acc[floorNum]) acc[floorNum] = [];
      acc[floorNum].push(room);
      return acc;
    }, {} as Record<number, Room[]>);
    
    // Sort floors and rooms
    Object.values(grouped).forEach(floorRooms => {
      floorRooms.sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
    });
    
    return grouped;
  }, [rooms]);

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return isDarkMode ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700';
      case 'occupied': return isDarkMode ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-100 border-red-300 text-red-700';
      case 'dirty': return isDarkMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-700';
      case 'maintenance': return isDarkMode ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-orange-100 border-orange-300 text-orange-700';
      default: return isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-600';
    }
  };

  const getStatusIcon = (status: Room['status']) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="w-4 h-4" />;
      case 'occupied': return <BedDouble className="w-4 h-4" />;
      case 'dirty': return <Paintbrush className="w-4 h-4" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className={`text-xl font-display font-bold flex items-center gap-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            <Grid className="w-5 h-5" /> Interactive Floor Plan
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Real-time overview of room occupancy and maintenance status.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-4 px-4 py-2 rounded-lg text-xs font-medium border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>Available</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Occupied</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>Dirty</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>Maintenance</div>
          </div>
          {hasAccess('room_management') && (
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`p-2 rounded-lg border transition-colors ${
                editMode 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Customize Layout / Status"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(floors).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([floorNum, floorRooms]) => (
          <div key={floorNum} className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-8 flex items-center justify-center">
              <div className={`text-sm font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }} ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Floor {floorNum}
              </div>
            </div>
            
            <div className={`ml-8 p-6 rounded-xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800/50' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {(floorRooms as Room[]).map((room: Room) => (
                  <motion.div
                    key={room.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedRoom(room)}
                    className={`cursor-pointer aspect-square p-3 rounded-xl border flex flex-col justify-between transition-shadow hover:shadow-lg ${getStatusColor(room.status)}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-lg leading-none">{room.roomNumber}</span>
                      {getStatusIcon(room.status)}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 truncate">{room.type}</div>
                      <div className="text-xs font-medium opacity-90 capitalize mt-0.5">{room.status}</div>
                    </div>
                  </motion.div>
                ))}
                
                {editMode && (
                  <div className={`aspect-square p-3 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                    isDarkMode ? 'border-zinc-700 hover:border-zinc-500 text-zinc-600' : 'border-zinc-300 hover:border-zinc-400 text-zinc-400'
                  }`}>
                    <Plus className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room Details Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedRoom(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Room {selectedRoom.roomNumber}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} capitalize`}>{selectedRoom.type} Suite</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedRoom.status)} border-none`}>
                  {selectedRoom.status}
                </div>
              </div>

              <div className="space-y-4">
                {hasAccess('room_management') || hasAccess('maintenance_requests') ? (
                  <>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Update Status</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(['available', 'occupied', 'dirty', 'maintenance'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => {
                            onUpdateRoomStatus(selectedRoom.id, status);
                            setSelectedRoom({ ...selectedRoom, status });
                          }}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                            selectedRoom.status === status 
                              ? getStatusColor(status)
                              : isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {getStatusIcon(status)}
                          <span className="text-xs font-bold capitalize">{status}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    You do not have permission to change room status.
                  </p>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
