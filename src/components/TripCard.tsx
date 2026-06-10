import { Trip, Moment } from '../types';
import { db } from '../firebase';
import { doc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Calendar, Trash2, ChevronDown, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, useEffect } from 'react';
import AddMomentModal from './AddMomentModal';

interface TripCardProps {
  trip: Trip;
  onClick?: (id: string) => void;
  isOwnerView?: boolean;
}

export default function TripCard({ trip, onClick, isOwnerView }: TripCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isAddMomentOpen, setIsAddMomentOpen] = useState(false);

  const tripDate = useMemo(() => {
    const d = trip.createdAt?.toDate?.() || new Date();
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [trip.createdAt]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journey and all its moments?')) return;
    
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

  useEffect(() => {
    if (isExpanded) {
      setIsLoadingImages(true);
      const q = query(
        collection(db, 'moments'),
        where('tripId', '==', trip.id)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const momentData: Moment[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Moment));
        setMoments(momentData);
        setIsLoadingImages(false);
      });
      return () => unsubscribe();
    }
  }, [isExpanded, trip.id]);

  const allImages = moments.flatMap(m => m.images);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(trip.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="overflow-hidden rounded-3xl bg-white ring-1 ring-natural-border shadow-sm transition-shadow hover:shadow-md"
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer select-none items-stretch justify-between gap-4 p-4 transition-colors hover:bg-natural-bg/50 sm:p-5"
      >
        <div className="flex flex-1 flex-col justify-center py-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-natural-muted">
            <Calendar className="h-3 w-3" />
            {tripDate}
          </div>
          <h3 className="mt-1 text-xl font-bold leading-tight tracking-tight text-natural-text sm:text-2xl lg:text-3xl">
            {trip.name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium text-natural-muted">by {trip.userName}</span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-3 sm:gap-6">
          <div className="h-20 w-24 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 sm:h-24 sm:w-32 md:h-28 md:w-40">
            <img
              src={trip.coverImageUrl}
              alt={trip.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-natural-sage/10 text-natural-sage"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-natural-border"
          >
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-natural-text">Trip Memories</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {isOwnerView && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsAddMomentOpen(true); }}
                      className="flex items-center gap-1 rounded-xl bg-natural-sage/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-natural-sage transition-colors hover:bg-natural-sage hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                      Add Photos
                    </button>
                  )}
                  {onClick && (
                    <button
                      onClick={handleActionClick}
                      className="text-xs font-bold uppercase tracking-widest text-natural-sage hover:text-natural-sage-hover hover:underline pl-2"
                    >
                      View Details
                    </button>
                  )}
                  {isOwnerView && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-natural-muted/50 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {isLoadingImages ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-natural-muted/50 animate-pulse">Loading Memories...</div>
                </div>
              ) : allImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {allImages.map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] overflow-hidden rounded-xl bg-natural-bg ring-1 ring-black/5">
                      <img src={img.url} alt={`Memory ${idx}`} className="h-full w-full object-cover transition-transform hover:scale-105" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-24 flex-col items-center justify-center gap-2 text-natural-muted/30">
                  <ImageIcon className="h-6 w-6" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No photos yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOwnerView && (
        <AddMomentModal 
          isOpen={isAddMomentOpen} 
          onClose={() => setIsAddMomentOpen(false)} 
          tripId={trip.id} 
        />
      )}
    </motion.div>
  );
}
