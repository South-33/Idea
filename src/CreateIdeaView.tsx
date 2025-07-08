import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { Id } from '../convex/_generated/dataModel'; // Import Id type
import { api } from '../convex/_generated/api';
import { toast } from 'sonner'; // For potential feedback
import { useMutation } from 'convex/react';

// Zoom Constants (copied from FocusedIdeaView)
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const ZOOM_LEVELS = [0.5,0.75, 1.0, 1.25, 1.5];
const SCROLL_SENSITIVITY = 0.15;

// Define the expected type for the onAddIdea prop:
// A function that takes { content: string } and returns a Promise resolving to the idea ID (string)
type AddIdeaMutationType = (args: { content: string; imageId?: Id<"_storage"> }) => Promise<Id<"ideas">>;

// Define the expected type for the CreateIdeaView component props
type CreateIdeaViewProps = {
  onAddIdea: AddIdeaMutationType;
  onClose: () => void;
};

export function CreateIdeaView({ onAddIdea, onClose }: CreateIdeaViewProps) {
  const [ideaContent, setIdeaContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
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
    // Set isBackdropVisible to true after a short delay on mount
    const timer = setTimeout(() => {
      setIsBackdropVisible(true);
    }, 50); // Small delay to ensure component is in DOM

    // Cleanup function to set isBackdropVisible to false on unmount
    return () => {
      setIsBackdropVisible(false);
      clearTimeout(timer); // Clear the timer if component unmounts before delay
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  // Effect to handle the mounting/unmounting animation for the card
   useEffect(() => {
    // Set isAnimatingIn to true after a short delay on mount
    const timer = setTimeout(() => {
      setIsAnimatingIn(true);
    }, 50); // Small delay to ensure component is in DOM

    // Cleanup function to set isAnimatingIn to false on unmount
    return () => {
      setIsAnimatingIn(false);
      clearTimeout(timer); // Clear the timer if component unmounts before delay
    };
  }, []); // Empty dependency array means this runs only on mount and unmount


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddClick = async () => {
    if (!ideaContent.trim()) {
      toast.error("Idea content cannot be empty.");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      // If an image is selected, upload it
      if (selectedImage) {
        // 1. Get a short-lived upload URL
        const uploadUrl = await generateUploadUrl();

        // 2. POST the file to the URL
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });

        // Check if the upload was successful
        if (!result.ok) {
          // You can enhance error handling here, e.g., by reading the response
          throw new Error(`Upload failed: ${await result.text()}`);
        }

        // 3. Get the storage ID from the response
        const { storageId } = await result.json();
        imageId = storageId;
      }

      // 4. Save the new idea with the imageId
      await onAddIdea({ content: ideaContent, imageId });
      
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Failed to add idea:", error);
      toast.error("Failed to add idea. Please try again.");
      setIsSubmitting(false); // Allow retry on error
    }
  };

  // Effect to handle wheel zoom on the zoom control element (copied from FocusedIdeaView)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!zoomControlRef.current?.contains(e.target as Node)) return; // Only zoom if wheel is over the control

      e.preventDefault(); // Prevent default scroll behavior
      e.stopPropagation(); // Prevent backdrop click/scroll
      const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY; // Determine zoom direction and step
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
      setZoomPercentage(Math.round(newScale * 100));
    };

    const currentRef = zoomControlRef.current; // Capture ref value
    if (currentRef) {
      // Attach listener to the window to capture wheel events even if cursor moves slightly off
      window.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      // Remove listener from the window
       window.removeEventListener('wheel', handleWheel);
    };
  }, [scale]); // Re-run effect if scale changes

  return (
    // Backdrop - Style copied from FocusedIdeaView
    <div
      id="create-idea-backdrop" // Added ID
      className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-all duration-500 ease-in-out ${isBackdropVisible ? 'bg-opacity-[0.2] backdrop-blur-sm' : 'bg-opacity-0 backdrop-blur-none'}`} // Conditionally apply opacity and blur, faster duration
      onClick={onClose} // Close when clicking the backdrop
      style={{ perspective: '1000px' }} // Add perspective for 3D transform
    >
      {/* Main Card Container - Made larger and applying scale transform */}
      <div
        ref={cardRef} // Attach the ref
        className="relative bg-white rounded-xl w-full max-w-2xl border-2 border-border-grey overflow-hidden flex flex-col shadow-lg" // Adjusted max-w to match FocusedIdeaView
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
        style={{
             maxHeight: '85vh',
             transform: `scale(${scale}) ${isAnimatingIn ? 'translateZ(0px)' : 'translateZ(-90px)'}`, // Apply scale and translateZ transform based on animation state
             transformOrigin: 'center', // Scale from center
             transformStyle: 'preserve-3d', // Preserve 3D transformations for children
             backfaceVisibility: 'hidden', // Hide backface during transform
             transition: 'transform 0.18s ease-out, box-shadow 0.25s ease-out', // Add transition for transform and box-shadow
             maxWidth: 'calc(48rem * 1.3)', // Added to match FocusedIdeaView proportion
         }}
      >
        {/* Inner Content Area */}
        <div className="p-6 flex-grow overflow-y-auto" style={{ transform: 'translateZ(0)', textRendering: 'optimizeLegibility' }}> {/* Padding moved here, allow content to scroll, Added transform and textRendering */}
            <h2 className="text-xl font-semibold text-dark-grey-text mb-4">Create a New Idea</h2>

            <textarea
              value={ideaContent}
              onChange={(e) => setIdeaContent(e.target.value)}
              placeholder="Enter your brilliant idea here..."
              className="w-full p-3 border border-border-grey rounded-md text-dark-grey-text focus:outline-none focus:ring-2 focus:ring-border-grey focus:border-transparent min-h-[200px] resize-y"
              rows={8}
              autoFocus
            />
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-border-grey rounded-md text-dark-grey-text hover:bg-gray-50 transition-colors"
              >
                Click to upload an image
              </button>
              {previewUrl && (
                <div className="mt-4">
                  <img src={previewUrl} alt="Preview" className="w-full rounded-md" />
                </div>
              )}
            </div>
        </div>

         {/* Optional Close Button (Top Right - kept for convenience) */}
         <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10" // Ensure it's above content
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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
            ref={zoomControlRef} // Attach ref
            className="flex items-center text-dark-grey-text cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = ZOOM_LEVELS.indexOf(scale);
              const nextIndex = (currentIndex + 1) % ZOOM_LEVELS.length;
              const newScale = ZOOM_LEVELS[nextIndex];
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
             // onWheel handling is now done via the useEffect hook attached to the window
            title="Adjust Zoom (Click to snap, Scroll to fine-tune)"
          >
            <span className="font-semibold">{zoomPercentage}%</span> {/* Display dynamic zoom percentage */}
          </div>

          {/* Add Idea Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAddClick(); }}
            disabled={isSubmitting || !ideaContent.trim()} // Disable if submitting or empty
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Add Idea"
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