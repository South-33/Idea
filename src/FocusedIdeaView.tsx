import React, { useState, useEffect } from 'react';
import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useAction, useMutation } from 'convex/react';

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
}

type FocusedIdeaViewProps = {
  focusedIdea: Idea;
  allIdeas: Idea[]; // Needed to find index for navigation disabling
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const ZOOM_LEVELS = [0.5, 1.0, 1.5, 2.0, 2.5];
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

  // Convex actions/mutations
  const reanalyzeIdea = useAction(api.ideaAnalysis.analyzeIdea);
  const updateIdea = useMutation(api.ideas.updateIdea); // Assuming this mutation exists

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handler for zoom slider
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Map the slider value (0-100) to the scale range (MIN_SCALE-MAX_SCALE)
    const sliderValue = parseInt(e.target.value, 10);
    const newScale = MIN_SCALE + (sliderValue / 100) * (MAX_SCALE - MIN_SCALE);
    setScale(newScale);
  };


  const score = focusedIdea.analysis?.score;

  return (
    <>
    <div
      id="focused-idea-backdrop" // Added ID for mouseleave listener
      className="fixed inset-0 bg-black bg-opacity-[0.2] backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose} // Close when clicking the backdrop
    >
      {/* Outer Scrollable Container */}
      <div
        className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar border-2 border-border-grey"
        style={{
           boxShadow: '0 0 120px 27px rgba(255, 255, 255, 0.5)', // Keep the glow
           transform: `scale(${scale})`, // Apply scale transform
           transformOrigin: 'center', // Scale from center
           transition: 'transform 0.1s ease-out', // Smooth transition
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent closing when clicking inside the card
      >
        {/* Inner Content Div - Apply scale transform here */}
        {/* This div contains the actual card content and is scaled */}
        <div
          // This div contains the actual card content and is scaled
          className={`p-6 ${fontSize}`} // Added font size class
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
              <span className="text-xl text-dark-grey-text font-semibold">{focusedIdea.analysis.title}</span>
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

            {/* Detailed Content */}
            <div className="space-y-3">
               {isEditing ? (
                 <textarea
                   value={editedContent}
                   onChange={(e) => setEditedContent(e.target.value)}
                   className="w-full p-2 border rounded text-dark-grey-text"
                   rows={6} // Adjust rows as needed
                 />
               ) : (
                 <p className="text-dark-grey-text italic">{focusedIdea.content}</p>
               )}
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-dark-grey-text text-md font-semibold">Reasoning:</span>
                 <p className="text-dark-grey-text text-sm mt-1">{focusedIdea.analysis.reasoning}</p>
               </div>
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-dark-grey-text text-md font-semibold">Feasibility:</span>
                 <p className="text-dark-grey-text text-sm mt-1">{focusedIdea.analysis.feasibility}</p>
               </div>
               <div className="border-t border-gray-200 pt-3 mt-3">
                 <span className="text-dark-grey-text text-md font-semibold">Similar Ideas:</span>
                 <p className="text-dark-grey-text text-sm mt-1">{focusedIdea.analysis.similarIdeas}</p>
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
            className="flex items-center text-dark-grey-text cursor-pointer select-none"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = ZOOM_LEVELS.indexOf(scale);
              const nextIndex = (currentIndex + 1) % ZOOM_LEVELS.length;
              const newScale = ZOOM_LEVELS[nextIndex];
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
            onWheel={(e) => {
              e.preventDefault(); // Prevent default scroll behavior
              e.stopPropagation(); // Prevent backdrop click
              const delta = e.deltaY < 0 ? SCROLL_SENSITIVITY : -SCROLL_SENSITIVITY; // Determine zoom direction and step (increased sensitivity)
              const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
              setScale(newScale);
              setZoomPercentage(Math.round(newScale * 100));
            }}
            title="Adjust Zoom (Click to snap, Scroll to fine-tune)"
          >
            <span className="font-semibold">{zoomPercentage}%</span>
          </div>
          {/* Font Size Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setFontSize(prevSize => {
              if (prevSize === 'text-base') return 'text-lg';
              if (prevSize === 'text-lg') return 'text-xl';
              return 'text-base'; // Cycle back to base
            }); }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Adjust Font Size"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="m12.75 15-3-3m0 0-3 3m3-3 3-3m-3 3v9m3 9H3.375a2.25 2.25 0 0 1-2.244-2.077Mb75-2.25V4.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25H12.75Z" />
             </svg>
          </button>
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
                await updateIdea({ ideaId: focusedIdea._id, content: editedContent });
                setIsEditing(false); // Exit editing mode after saving
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
            onClick={(e) => { e.stopPropagation(); reanalyzeIdea({ ideaId: focusedIdea._id }); }}
            className="p-2 rounded-full hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-dark-grey-text"
            title="Re-analyze Idea"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.015 10.002A8.25 8.25 0 0 1 16.5 6.375h2.25a9.75 9.75 0 0 0-19.5 0v.338A9.75 9.75 0 0 0 5.015 10.002Z" />
             </svg>
          </button>
        </div>
      </div> {/* End of toolbars container */}

    </div> {/* End of backdrop div */}
</>
);
}
