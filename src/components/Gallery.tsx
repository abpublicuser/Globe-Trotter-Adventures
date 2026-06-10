import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Photo, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import PhotoCard from './PhotoCard';
import { AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photoData: Photo[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Photo));
      setPhotos(photoData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photos');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-white/20">
        <ImageIcon className="h-16 w-16" />
        <p className="text-xl font-medium">No photos yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </AnimatePresence>
    </div>
  );
}
