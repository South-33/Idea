import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api"; // Assuming types might be needed, like Idea type
import { useMutation } from "convex/react"; // If delete is handled inside, but let's pass handler

// Define the expected shape of the 'idea' prop based on original App.tsx usage
type Idea = {
  _id: Id<"ideas">;
  content: string;
  analysis?: {
    title?: string;
    score: number;
    reasoning?: string;
    feasibility?: string;
    similarIdeas?: string;
    summary?: string;
  };
  status?: "pending" | "analyzed"; // Restore status
};

type IdeaCardProps = {
  idea: Idea;
  onDelete: (id: Id<"ideas">) => void;
  // isExpanded: boolean;      // Removed
  // onToggleExpand: () => void; // Removed
  onFocus: () => void;        // Added onFocus prop
};

export function IdeaCard({ idea, onDelete, onFocus }: IdeaCardProps) { // Updated props
  // Determine card background based on score (subtler than before)
  const score = idea.analysis?.score;
  return (
    <div
      key={idea._id}
      className={`relative bg-white rounded-xl p-6 shadow-md overflow-hidden transition-all duration-300 border border-border-grey`} // Adjusted rounding, added overflow/transition
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={() => onDelete(idea._id)}
        className="absolute top-3 right-3 p-1 rounded text-dark-grey-text hover:text-red-600 hover:bg-red-100 transition-colors"
        title="Delete"
      >
        {/* Using a simple SVG for 'X' might look cleaner */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center mb-4 text-dark-grey-text text-sm border-b border-gray-200 pb-3 mb-3">
        {'< Notes'}
      </div>

      {/* Content - Make clickable for expansion */}
      <div className="cursor-pointer" onClick={onFocus}> {/* Changed onClick handler */}
        {idea.status === "pending" ? (
          <div className="flex items-center gap-2 text-dark-grey-text">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-grey-text"></div>
            Analyzing...
          </div>
        ) : idea.analysis ? (
          <div className="space-y-3">
            {/* Always visible Title and Score */}
            {/* Always show title/score with border */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <span className="text-lg text-dark-grey-text font-semibold">{idea.analysis.title}</span>
              <span className={`text-sm bg-gray-75 rounded-full px-2.5 py-0.5 border shadow-sm ${
                idea.status === "analyzed" && score !== undefined
                  ? score >= 8 ? 'border-green-300'
                  : score >= 5 ? 'border-soft-gold'
                  : 'border-red-300'
                  : 'border-border-grey' // Default border color if not analyzed or score is undefined
              }`}>
                {idea.analysis.score}/10
              </span>
            </div>
            {/* AI Summary (non-expanded) */}
            {/* Always show summary if available */}
            {idea.analysis?.summary && (
             <p className="text-sm text-dark-grey-text mt-2">
               {idea.analysis.summary}
             </p>
           )}
            {/* Removed collapsible content div */}
          </div>
        ) : (
          // Fallback if analyzed but no analysis data somehow
          <p className="text-dark-grey-text">Analysis data unavailable.</p>
        )}
      </div>

      {/* Divider and Toolbar Placeholder (Optional, can be removed if not needed) */}
      {/* <hr className="my-4 border-gray-100" /> */}
      {/* Removed Toolbar Placeholder */}
    </div>
  );
}