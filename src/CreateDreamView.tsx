import React, { useState, useEffect, useRef } from 'react';
import { Id } from '../convex/_generated/dataModel';
import { api } from '../convex/_generated/api';
import { toast } from 'sonner';

// Zoom Constants (copied from FocusedIdeaView and CreateIdeaView)
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const ZOOM_LEVELS = [0.5, 1.0, 1.5, 2.0, 2.5];
const SCROLL_SENSITIVITY = 0.15;

// Define the expected type for the onAddDream prop:
// A function that takes { content: string } and returns a Promise resolving to the dream ID (string)
type AddDreamMutationType = (args: { content: string }) => Promise<Id<"dreams">>;

type CreateDreamViewProps = {
  onAddDream: AddDreamMutationType;
  onClose: () => void;
};

export function CreateDreamView({ onAddDream, onClose }: CreateDreamViewProps) {
  const [dreamContent, setDreamContent] = useState(""); // State for dream content
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks
  // Zoom State (copied from FocusedIdeaView)
  const [scale, setScale] = useState(1);
  const [zoomPercentage, setZoomPercentage] = useState(100);
  const zoomControlRef = useRef<HTMLDivElement>(null); // Ref for zoom control

  // Animation states and ref
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isBackdropVisible, setIsBackdropVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card element

  // Effect to prevent background scroll when the modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed'; // Prevent scroll jump
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Effect to handle backdrop transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBackdropVisible(true);
    }, 50);
    return () => {
      setIsBackdropVisible(false);
      clearTimeout(timer);
    };
  }, []);

  // Effect to handle the mounting/unmounting animation for the card
   useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimatingIn(true);
    }, 50);
    return () => {
      setIsAnimatingIn(false);
      clearTimeout(timer);
    };
  }, []);


  const handleAddClick = async () => {
    if (!dreamContent.trim()) {
      toast.error("Dream content cannot be empty."); // Basic validation feedback
      return;
    }
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true);
    try {
      await onAddDream({ content: dreamContent });
      // toast.success("Dream added and story generation started!"); // Optional success toast
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Failed to add dream:", error);
      toast.error("Failed to add dream. Please try again.");
      setIsSubmitting(false); // Allow retry on error
    }
    // No need to set isSubmitting back to false on success because the component unmounts
  };

  // Effect to handle wheel zoom on the zoom control element (copied from FocusedIdeaView)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!zoomControlRef.current?.contains(e.target as Node)) return;

      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
      setZoomPercentage(Math.round(newScale * 100));
    };

    const currentRef = zoomControlRef.current;
    if (currentRef) {
      window.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
       window.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);

  return (
    // Backdrop - Style copied from FocusedIdeaView
    <div
      id="create-dream-backdrop" // Updated ID
      className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-all duration-500 ease-in-out ${isBackdropVisible ? 'bg-opacity-[0.2] backdrop-blur-sm' : 'bg-opacity-0 backdrop-blur-none'}`}
      onClick={onClose} // Close when clicking the backdrop
      style={{ perspective: '1000px' }}
    >
      {/* Main Card Container - Made larger and applying scale transform */}
      <div
        ref={cardRef}
        className="relative bg-white rounded-xl w-full max-w-2xl border-2 border-border-grey overflow-hidden flex flex-col shadow-lg"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
        style={{
             maxHeight: '85vh',
             transform: `scale(${scale}) ${isAnimatingIn ? 'translateZ(0px)' : 'translateZ(-90px)'}`,
             transformOrigin: 'center',
             transformStyle: 'preserve-3d',
             backfaceVisibility: 'hidden',
             transition: 'transform 0.18s ease-out, box-shadow 0.25s ease-out',
             maxWidth: 'calc(48rem * 1.3)',
         }}
      >
        {/* Inner Content Area */}
        <div className="p-6 flex-grow overflow-y-auto" style={{ transform: 'translateZ(0)', textRendering: 'optimizeLegibility' }}>
            <h2 className="text-xl font-semibold text-dark-grey-text mb-4">Record a New Dream</h2> {/* Updated title */}

            <textarea
              value={dreamContent}
              onChange={(e) => setDreamContent(e.target.value)}
              placeholder="Describe your dream here..."
              className="w-full p-3 border border-border-grey rounded-md text-dark-grey-text focus:outline-none focus:ring-2 focus:ring-border-grey focus:border-transparent min-h-[200px] resize-y"
              rows={8}
              autoFocus
            />
        </div>

         {/* Optional Close Button (Top Right) */}
         <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
      </div>

      {/* Floating Toolbar - Style copied from FocusedIdeaView */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          {/* Cancel Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Cancel"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
             </svg>
           </button>

           {/* Functional Zoom Control (copied & adapted from FocusedIdeaView) */}
           <div
            ref={zoomControlRef}
            className="flex items-center text-dark-grey-text cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = ZOOM_LEVELS.indexOf(scale);
              const nextIndex = (currentIndex + 1) % ZOOM_LEVELS.length;
              const newScale = ZOOM_LEVELS[nextIndex];
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
            title="Adjust Zoom (Click to snap, Scroll to fine-tune)"
          >
            <span className="font-semibold">{zoomPercentage}%</span>
          </div>

          {/* Add Dream Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAddClick(); }}
            disabled={isSubmitting || !dreamContent.trim()} // Disable if submitting or empty
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Add Dream"
          >
            {isSubmitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dark-grey-text"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> {/* Plus Icon */}
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}