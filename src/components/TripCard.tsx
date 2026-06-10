import { Trip } from '../types';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Calendar, Trash2, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useMemo } from 'react';

interface TripCardProps {
  trip: Trip;
  onClick?: (id: string) => void;
  isOwnerView?: boolean;
}

export default function TripCard({ trip, onClick, isOwnerView }: TripCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const tripDate = useMemo(() => {
    const d = trip.createdAt?.toDate?.() || new Date();
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [trip.createdAt]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this entire journey and all its moments?')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'trips', trip.id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete trip.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      onClick={() => onClick?.(trip.id)}
      className={`group relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-natural-border transition-all hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={trip.coverImageUrl}
          alt={trip.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
          <Calendar className="h-3 w-3" />
          {tripDate}
        </div>
        <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {trip.name}
        </h3>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 overflow-hidden rounded-full border border-white/20">
              <div className="flex h-full w-full items-center justify-center bg-natural-sage text-[10px] font-bold uppercase italic">
                {trip.userName[0]}
              </div>
            </div>
            <span className="text-xs font-medium tracking-wide opacity-80">by {trip.userName}</span>
          </div>

          {isOwnerView && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full bg-white/10 p-2 text-white/60 backdrop-blur-md transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-6 top-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform group-hover:scale-110">
          <MapPin className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
