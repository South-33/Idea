import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useAction, useMutation } from 'convex/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // <-- Import the icon

// TODO: Move this interface to a shared types file if used elsewhere
interface Idea {
  _id: Id<"ideas">;
  content: string;
  analysis?: {
    title?: string;
    score: number;
    reasoning?: string;
    feasibility?: string;
    similarIdeas?: string;
  };
  status?: "pending" | "analyzed";
  imageUrl?: string | null;
}

type FocusedIdeaViewProps = {
  focusedIdea: Idea;
  allIdeas: Idea[]; // Needed to find index for navigation disabling
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const ZOOM_LEVELS = [0.5,0.75, 1.0, 1.25, 1.5];
const SCROLL_SENSITIVITY = 0.15;

export function FocusedIdeaView({ focusedIdea, allIdeas, onClose, onNavigate }: FocusedIdeaViewProps) {
  // Find current index to disable navigation buttons if needed
  const currentIndex = allIdeas.findIndex(idea => idea._id === focusedIdea._id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allIdeas.length - 1;

  // State for scaling/zooming and editing
  const [scale, setScale] = useState(1);
  const [zoomPercentage, setZoomPercentage] = useState(100); // State for displayed zoom percentage
  const [fontSize, setFontSize] = useState('text-base'); // State for font size
  const [isEditing, setIsEditing] = useState(false); // State for editing mode
  const [editedContent, setEditedContent] = useState(focusedIdea.content); // State for edited content
  const [zoomBarHeightClass, setZoomBarHeightClass] = useState('h-4'); // State for zoom bar height
  const cardRef = useRef<HTMLDivElement>(null); // Ref for the card element
  const zoomControlRef = useRef<HTMLDivElement>(null); // Ref for the zoom control element
  const [cardMaxHeight, setCardMaxHeight] = useState<number | null>(null); // State for dynamic max height
  const [isAnimatingIn, setIsAnimatingIn] = useState(false); // State for animation
  const [isBackdropVisible, setIsBackdropVisible] = useState(false); // State for backdrop transition
  // Convex actions/mutations
  const reanalyzeIdea = useAction(api.ideaAnalysis.analyzeIdea);
  const updateIdea = useMutation(api.ideas.updateIdea); // Assuming this mutation exists
  const updateIdeaStatus = useMutation(api.ideas.updateIdeaStatus); // Get the new mutation

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = ''; // Reset to default
      document.body.style.width = ''; // Reset to default
    };
  }, []);

  // Effect to handle the mounting animation smoothly.
  useEffect(() => {
    // We use requestAnimationFrame to ensure the component has been painted
    // in its initial state (e.g., invisible) before we apply the classes that
    // trigger the transition to the visible state. This prevents the
    // "laggy" or "janky" feel on the first render.
    const animationFrameId = requestAnimationFrame(() => {
      setIsBackdropVisible(true);
      setIsAnimatingIn(true);
    });

    // Cleanup function to cancel the frame if the component unmounts before it runs
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Handler for zoom slider
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Map the slider value (0-100) to the scale range (MIN_SCALE-MAX_SCALE)
    const sliderValue = parseInt(e.target.value, 10);
    const newScale = MIN_SCALE + (sliderValue / 100) * (MAX_SCALE - MIN_SCALE);
    setScale(newScale);
  };


  const score = focusedIdea.analysis?.score;

  // Update edited content if the focused idea changes
  useEffect(() => {
      setEditedContent(focusedIdea.content);
      setIsEditing(false); // Reset editing state when idea changes
  }, [focusedIdea.content, focusedIdea._id]);


  // Effect to calculate and set max height based on width and viewport height
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (cardRef.current) {
        const viewportHeight = window.innerHeight;
        // Max height is 85% of the viewport height
        setCardMaxHeight(viewportHeight * 0.85);
      }
    };

    calculateMaxHeight(); // Calculate on mount
    window.addEventListener('resize', calculateMaxHeight); // Recalculate on resize

    return () => {
      window.removeEventListener('resize', calculateMaxHeight); // Clean up event listener
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Effect to handle wheel zoom on the zoom control element
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent default scroll behavior
      e.stopPropagation(); // Prevent backdrop click
      const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY; // Determine zoom direction and step (increased sensitivity)
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
      setZoomPercentage(Math.round(newScale * 100));
    };

    if (zoomControlRef.current) {
      zoomControlRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (zoomControlRef.current) {
        zoomControlRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scale]); // Add scale to dependency array so handleWheel always has the latest scale value



  return (
    <>
    <div
      id="focused-idea-backdrop"
      className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-all duration-500 ease-in-out ${isBackdropVisible ? 'bg-opacity-[0.2] backdrop-blur-sm' : 'bg-opacity-0 backdrop-blur-none'}`} // Conditionally apply opacity and blur, faster duration
      onClick={onClose}
    >
      {/* Outer Scrollable Container */}
      <div
        ref={cardRef}
        className={`relative bg-white rounded-xl max-w-2xl w-full overflow-y-auto hide-scrollbar border-2 border-border-grey min-h-0 transition-all duration-300 ease-in-out ${isAnimatingIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{
           ...focusedIdea.analysis?.score !== undefined && !isAnimatingIn ? { boxShadow: '0 0 120px 27px rgba(255, 255, 255, 0.5)' } : {}, // Keep the glow conditionally, but not when animating in
           boxShadow: isAnimatingIn ? '0 50px 75px -20px rgba(0, 0, 0, 0.3)' : (focusedIdea.analysis?.score !== undefined ? '0 0 120px 27px rgba(255, 255, 255, 0.5)' : 'none'), // Conditional box shadow based on animation state (more pronounced)
           transform: `scale(${scale}) ${isAnimatingIn ? 'translateZ(0px)' : 'translateZ(-180px)'}`, // Apply scale and translateZ transform based on animation state (increased lift)
           transformOrigin: 'center', // Scale from center
           transformStyle: 'preserve-3d', // Preserve 3D transformations for children
           backfaceVisibility: 'hidden', // Hide backface during transform
           transition: 'transform 0.15s ease-out, box-shadow 0.18s ease-out', // Smooth transition for transform and box-shadow
           maxHeight: cardMaxHeight !== null ? `${cardMaxHeight}px` : undefined, // Apply dynamic max height
           maxWidth: 'calc(48rem * 1.3)',
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Inner Content Div - Apply scale transform here */}
        {/* This div contains the actual card content and is scaled */}
        <div
          // This div contains the actual card content and is scaled
          className={`pt-4 pb-7 pl-7 pr-7 ${fontSize}`} // Adjusted padding: increased on top
          style={{ fontSize: '1.3rem', transform: 'translateZ(0)', textRendering: 'optimizeLegibility' }} // Add translateZ(0) for potential blurriness fix and optimizeLegibility
        >
        {/* Card Content */}
        {focusedIdea.status === "pending" && (
          <div className="flex items-center justify-center gap-2 text-dark-grey-text py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dark-grey-text"></div>
            Analyzing...
          </div>
        )}

        {focusedIdea.status !== "pending" && focusedIdea.analysis && (
          <div className="space-y-4">
            {/* Header: Title and Score */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <span className="text-2xl text-dark-grey-text font-semibold">{focusedIdea.analysis.title}</span>
              <span className={`text-md bg-gray-75 rounded-full px-3 py-1 border shadow-sm ${
                score !== undefined
                  ? score >= 8 ? 'border-green-300'
                  : score >= 5 ? 'border-soft-gold'
                  : 'border-red-300'
                  : 'border-border-grey'
               }`}>
                {focusedIdea.analysis.score}/10
              </span>
            </div>

            {/* Display Image if available */}
            {focusedIdea.imageUrl && (
              <div className="my-4 rounded-lg overflow-hidden bg-gray-50 flex justify-center">
                <img 
                  src={focusedIdea.imageUrl} 
                  alt="Idea visualization" 
                  className="max-w-full h-auto object-contain max-h-[60vh]"
                />
              </div>
            )}

            {/* Detailed Content */}
            <div className="space-y-3">
               {isEditing ? (
                 <textarea
                   value={editedContent}
                   onChange={(e) => setEditedContent(e.target.value)}
                   className="w-full p-2 border rounded text-dark-grey-text"
                   rows={6} // Adjust rows as needed
                   autoFocus // Focus the textarea when editing starts
                 />
               ) : (
                 <p className="text-dark-grey-text italic">{focusedIdea.content}</p>
               )}
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-xl text-dark-grey-text text-lg font-semibold">Reasoning:</span>
                 <div className="prose prose-sm max-w-none text-dark-grey-text mt-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{focusedIdea.analysis.reasoning}</ReactMarkdown>
                 </div>
               </div>
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-xl text-dark-grey-text text-lg font-semibold">Feasibility:</span>
                 <div className="prose prose-sm max-w-none text-dark-grey-text mt-1">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{focusedIdea.analysis.feasibility}</ReactMarkdown>
                 </div>
               </div>
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-xl text-dark-grey-text text-lg font-semibold">Similar Ideas:</span>
                 <div className="prose prose-sm max-w-none text-dark-grey-text mt-1">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{focusedIdea.analysis.similarIdeas}</ReactMarkdown>
                 </div>
               </div>
            </div>
          </div>
        )}

        {focusedIdea.status !== "pending" && !focusedIdea.analysis && (
          <p className="text-dark-grey-text text-center py-10">Analysis data unavailable.</p>
        )}

      </div> {/* End of inner scaled content div */}
      </div> {/* End of outer scrollable container div */}

      {/* Toolbars Container (Centered Group) */}
      {/* Add e.stopPropagation() to button clicks to prevent backdrop click from closing modal */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50">
        {/* Main Toolbar Container */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          {/* Left Arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            disabled={isFirst}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Previous Idea"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
             </svg>
          </button>
          {/* Right Arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            disabled={isLast}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Next Idea"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
             </svg>
          </button>
          {/* Zoom Control */}
          <div
            ref={zoomControlRef} // Attach the ref
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
          {/* Edit Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title={isEditing ? "Cancel Edit" : "Edit Idea"}
          >
            {isEditing ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
               </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            )}
          </button>
          {/* Save Button (only visible when editing) */}
          {isEditing && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await updateIdea({ ideaId: focusedIdea._id, content: editedContent });
                  // No need to manually update focusedIdea.content, Convex will handle state update
                  setIsEditing(false); // Exit editing mode after saving
                } catch (error) {
                   console.error("Failed to save idea:", error);
                   // Optionally: show an error message to the user
                }
              }}
              className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
              title="Save Changes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
          )}
          {/* Re-analyze Button */}
          <button
            onClick={async (e) => { // Make the handler async
              e.stopPropagation();
              if (isEditing) setIsEditing(false); // Exit edit mode if re-analyzing
              try {
                  await updateIdeaStatus({ ideaId: focusedIdea._id, status: "pending" }); // Set status to pending
                  // Don't await the reanalyze action if you want the UI to update immediately
                  reanalyzeIdea({ ideaId: focusedIdea._id }); // Trigger re-analysis action
              } catch(error) {
                  console.error("Failed to trigger re-analysis:", error);
                  // Optionally reset status if updateIdeaStatus failed but you want to try reanalyzeIdea anyway,
                  // or show an error message
              }
            }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Re-analyze Idea"
          >
             {/* --- Replaced SVG with Heroicon component --- */}
             <ArrowPathIcon className="w-6 h-6" />
             {/* ------------------------------------------- */}
          </button>
        </div>
      </div> {/* End of toolbars container */}

    </div> {/* End of backdrop div */}
</>
);
}