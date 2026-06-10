import { Photo, OperationType } from '../types';
import { auth, db } from '../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../utils';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface PhotoCardProps {
  photo: Photo;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const isOwner = auth.currentUser?.uid === photo.userId;
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState(photo.note);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await deleteDoc(doc(db, 'photos', photo.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `photos/${photo.id}`);
    }
  };

  const handleUpdate = async () => {
    if (newNote === photo.note) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'photos', photo.id), {
        note: newNote
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `photos/${photo.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const date = photo.createdAt?.toDate ? photo.createdAt.toDate().toLocaleDateString() : 'Just now';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-natural-border bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-natural-border">
        <img
          src={photo.imageUrl}
          alt={photo.note}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-natural-muted">
              {photo.userName}
            </span>
            <span className="text-[10px] text-natural-muted/60">{date}</span>
          </div>
          {isOwner && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-bold uppercase tracking-tighter text-natural-sage transition-colors hover:text-natural-text"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-[10px] font-bold uppercase tracking-tighter text-natural-terracotta transition-colors hover:text-red-800"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex-1">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full rounded-xl border border-natural-border bg-natural-bg p-3 text-xs italic text-natural-text focus:outline-none focus:ring-1 focus:ring-natural-sage"
                rows={3}
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setIsEditing(false); setNewNote(photo.note); }}
                  className="p-1 text-natural-muted hover:text-natural-text"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleUpdate}
                  className="p-1 text-natural-sage hover:text-natural-sage-hover"
                  title="Save"
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs italic leading-relaxed text-natural-muted line-clamp-3">
              {photo.note}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
