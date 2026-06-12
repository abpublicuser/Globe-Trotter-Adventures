import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Trip, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import TripCard from './TripCard';
import TripDetail from './TripDetail';
import CreateTripModal from './CreateTripModal';
import CreateTripFromItineraryModal from './CreateTripFromItineraryModal';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function MyTrips() {
  const [user] = useAuthState(auth);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDropdownTripId, setSelectedDropdownTripId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateItineraryModalOpen, setIsCreateItineraryModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'trips'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripData: Trip[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Trip)).sort((a, b) => {
        return b.name.localeCompare(a.name);
      });
      setTrips(tripData);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trips');
      setIsLoading(false);
      setError(`Sync issue: ${err.message || 'Unknown error'}`);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  if (selectedTripId) {
    return <TripDetail tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-natural-muted/20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-natural-muted px-8 text-center">
        <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-xs font-bold uppercase tracking-widest text-natural-sage underline"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
        <div className="w-full max-w-sm">
          <label htmlFor="my-trip-select" className="block text-sm font-bold uppercase tracking-widest text-natural-muted mb-2">
            Select a Journey
          </label>
          <select
            id="my-trip-select"
            value={selectedDropdownTripId}
            onChange={(e) => {
              if (e.target.value === 'new_journey') {
                setIsCreateModalOpen(true);
                return;
              }
              if (e.target.value === 'new_journey_from_itinerary') {
                setIsCreateItineraryModalOpen(true);
                return;
              }
              setSelectedDropdownTripId(e.target.value);
            }}
            className="w-full rounded-xl border border-natural-border bg-white px-4 py-3 text-natural-text focus:border-natural-sage focus:outline-none focus:ring-2 focus:ring-natural-sage/20"
          >
            <option value="" disabled>-- Choose a journey --</option>
            <option value="new_journey" className="font-bold text-natural-sage">
              + New Journey
            </option>
            <option value="new_journey_from_itinerary" className="font-bold text-natural-sage">
              + New Journey from Itinerary
            </option>
            {trips.map(trip => {
              return (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              );
            })}
          </select>
        </div>
      </header>

      {trips.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-natural-muted/20">
          <Compass className="h-16 w-16" />
          <p className="text-xl font-medium">No journeys yet. Where to next?</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-sm font-bold uppercase tracking-widest text-natural-sage hover:underline"
          >
            Start your first trip
          </button>
        </div>
      ) : !selectedDropdownTripId ? (
        <div className="flex flex-col items-center justify-center gap-6 text-center mt-12 mb-16 py-12 px-4 rounded-3xl bg-white border border-natural-border shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight text-natural-text sm:text-5xl">
            Your <span className="text-natural-sage">Journeys</span>
          </h1>
          <p className="max-w-xl text-lg text-natural-muted leading-relaxed">
            Manage your travel stories, edit your past moments, and expand your adventures. Select a journey from the dropdown above to view or update it, or create a new one.
          </p>
          <Compass className="h-20 w-20 opacity-20 text-natural-sage mt-2" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {trips.filter(t => t.id === selectedDropdownTripId).map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onClick={(id) => setSelectedTripId(id)}
                isOwnerView={true}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateTripModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(tripId) => {
          setIsCreateModalOpen(false);
          setSelectedTripId(tripId);
        }}
      />
      <CreateTripFromItineraryModal
        isOpen={isCreateItineraryModalOpen}
        onClose={() => setIsCreateItineraryModalOpen(false)}
        onSuccess={(tripId) => {
          setIsCreateItineraryModalOpen(false);
          setSelectedTripId(tripId);
        }}
      />
    </motion.div>
  );
}
