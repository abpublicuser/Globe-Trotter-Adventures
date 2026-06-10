import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, compressImage } from '../utils';
import { OperationType } from '../types';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10485760) { // 10MB Limit for selection
        setErrorStatus('Photo is too large (max 10MB).');
        return;
      }
      
      setIsOptimizing(true);
      setErrorStatus(null);
      setFile(selectedFile);
      
      try {
        const optimized = await compressImage(selectedFile);
        setPreview(optimized);
      } catch (err) {
        console.error('Optimization failed:', err);
        setErrorStatus('Failed to optimize photo. Please try another.');
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !note || !auth.currentUser || !preview) return;

    setIsUploading(true);
    setErrorStatus(null);
    try {
      await addDoc(collection(db, 'photos'), {
        imageUrl: preview,
        note,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userEmail: auth.currentUser.email || 'no-email@provided.com',
        createdAt: serverTimestamp(),
      });

      setFile(null);
      setPreview(null);
      setNote('');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorStatus(`Upload failed: ${errorMessage}`);
      try {
        handleFirestoreError(error, OperationType.CREATE, 'photos');
      } catch {
        // already logged
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg rounded-3xl border border-natural-border bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium text-natural-text">Share a Moment</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-natural-muted transition-colors hover:bg-natural-bg hover:text-natural-text"
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              {errorStatus && (
                <div className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-600 border border-red-100">
                  {errorStatus}
                </div>
              )}
              
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`group relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-natural-border bg-natural-bg transition-all ${isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-natural-sage hover:bg-white'}`}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-natural-sage/10 p-3 group-hover:bg-natural-sage/20">
                      <Upload className="h-6 w-6 text-natural-sage" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold uppercase tracking-widest text-natural-text">Upload Photo</p>
                      <p className="text-xs italic text-natural-muted">Max size: 10MB (optimized for sharing)</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-natural-muted">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Capture the feeling..."
                  className="w-full rounded-2xl border border-natural-border bg-natural-bg p-4 text-sm italic text-natural-text placeholder:text-natural-muted/40 focus:outline-none focus:ring-1 focus:ring-natural-sage disabled:opacity-50"
                  rows={4}
                  required
                  disabled={isUploading}
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || isOptimizing || !file || !note}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-natural-sage py-4 font-bold uppercase tracking-widest text-white transition-all hover:bg-natural-sage-hover hover:shadow-lg disabled:opacity-50 disabled:grayscale"
              >
                {isUploading || isOptimizing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isOptimizing ? 'Optimizing...' : 'Sharing...'}
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5" />
                    Share Moment
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
