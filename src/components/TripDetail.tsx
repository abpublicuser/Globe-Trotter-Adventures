import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Trip, Moment, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import AddMomentModal from './AddMomentModal';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Trash2, MessageSquare, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function TripDetail({ tripId, onBack }: { tripId: string, onBack: () => void }) {
  const [user] = useAuthState(auth);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMomentOpen, setIsAddMomentOpen] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      const docRef = doc(db, 'trips', tripId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
      }
    };
    fetchTrip();

    const q = query(
      collection(db, 'moments'),
      where('tripId', '==', tripId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const momentData: Moment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Moment)).sort((a, b) => b.date.localeCompare(a.date));
      setMoments(momentData);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'moments');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleDeleteMoment = async (momentId: string) => {
    if (!window.confirm('Delete this moment?')) return;
    try {
      await deleteDoc(doc(db, 'moments', momentId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const isOwner = user && trip && user.uid === trip.userId;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-natural-muted/20" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <header className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-natural-muted transition-colors hover:text-natural-sage"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journeys
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 overflow-hidden rounded-3xl shadow-xl ring-4 ring-white">
              <img src={trip.coverImageUrl} alt={trip.name} className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-4xl font-medium tracking-tight text-natural-text sm:text-6xl">{trip.name}</h1>
              <p className="mt-2 text-lg italic text-natural-muted">by {trip.userName}</p>
            </div>
          </div>

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddMomentOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-natural-sage px-8 py-4 font-bold uppercase tracking-widest text-white shadow-lg shadow-natural-sage/10 transition-all hover:bg-natural-sage-hover"
            >
              <Plus className="h-5 w-5" />
              Add Moment
            </motion.button>
          )}
        </div>
      </header>

      <div className="space-y-16">
        {moments.length === 0 ? (
          <div className="flex h-[30vh] flex-col items-center justify-center gap-4 text-natural-muted/20">
            <ImageIcon className="h-12 w-12" />
            <p className="text-xl font-medium">No moments captured yet.</p>
          </div>
        ) : (
          moments.map((moment) => (
            <motion.section
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative border-l-2 border-natural-border pl-8 sm:pl-12"
            >
              <div className="absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4 border-natural-bg bg-natural-sage shadow-sm shadow-natural-sage/40" />
              
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-natural-sage/10 text-natural-sage">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-natural-text">
                      {new Date(moment.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs italic text-natural-muted">Shared by {moment.userName}</p>
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={() => handleDeleteMoment(moment.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {moment.images.map((img, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-natural-border transition-all hover:shadow-xl">
                    <div className="aspect-square overflow-hidden">
                      <img src={img.url} alt={`Moment ${idx}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    {img.comment && (
                      <div className="p-6">
                        <div className="flex gap-3">
                          <MessageSquare className="h-4 w-4 shrink-0 text-natural-tan" />
                          <p className="text-sm italic text-natural-muted leading-relaxed">{img.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {moment.note && (
                <div className="mt-8 max-w-2xl rounded-3xl bg-natural-tan/5 p-8 italic text-natural-text ring-1 ring-natural-tan/10">
                  <p className="leading-relaxed">"{moment.note}"</p>
                </div>
              )}
            </motion.section>
          ))
        )}
      </div>

      <AddMomentModal 
        isOpen={isAddMomentOpen}
        onClose={() => setIsAddMomentOpen(false)}
        tripId={tripId}
      />
    </motion.div>
  );
}
