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
  };
  status?: "pending" | "analyzed"; // Restore status
};

type IdeaCardProps = {
  idea: Idea;
  onDelete: (id: Id<"ideas">) => void;
  isExpanded: boolean;         // Add isExpanded prop
  onToggleExpand: () => void;  // Add onToggleExpand prop
};

export function IdeaCard({ idea, onDelete, isExpanded, onToggleExpand }: IdeaCardProps) {
  // Determine card background based on score (subtler than before)
  const score = idea.analysis?.score;
  const scoreBgClass = idea.status === "analyzed" && score !== undefined
    ? score >= 8 ? 'border-l-4 border-green-300'
    : score >= 5 ? 'border-l-4 border-yellow-300'
    : 'border-l-4 border-red-300'
    : '';

  return (
    <div
      key={idea._id}
      className={`relative bg-white rounded-xl p-6 shadow-md overflow-hidden transition-all duration-300 ${scoreBgClass}`} // Adjusted rounding, added overflow/transition
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={() => onDelete(idea._id)}
        className="absolute top-3 right-3 p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
        title="Delete"
      >
        {/* Using a simple SVG for 'X' might look cleaner */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center mb-4 text-gray-400 text-sm font-medium">
        {'< Notes'}
      </div>

      {/* Content - Make clickable for expansion */}
      <div className="cursor-pointer" onClick={onToggleExpand}>
        {idea.status === "pending" ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
            Analyzing...
          </div>
        ) : idea.analysis ? (
          <div className="space-y-3">
            {/* Always visible Title and Score */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-800">{idea.analysis.title}</span>
              <span className="text-sm font-semibold bg-gray-100 rounded-full px-2.5 py-0.5 border border-gray-200 shadow-sm">
                {idea.analysis.score}/10
              </span>
            </div>

            {/* Collapsible Content - Added overflow-y-auto and hide-scrollbar */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[500px] opacity-100 pt-2 overflow-y-auto hide-scrollbar' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-3">
                 <p className="text-gray-600 italic border-t pt-3 mt-1">{idea.content}</p>
                 <div>
                   <span className="font-semibold text-gray-700 text-sm">Reasoning:</span>
                   <p className="text-gray-600 text-sm">{idea.analysis.reasoning}</p>
                 </div>
                 <div>
                   <span className="font-semibold text-gray-700 text-sm">Feasibility:</span>
                   <p className="text-gray-600 text-sm">{idea.analysis.feasibility}</p>
                 </div>
                 <div>
                   <span className="font-semibold text-gray-700 text-sm">Similar Ideas:</span>
                   <p className="text-gray-600 text-sm">{idea.analysis.similarIdeas}</p>
                 </div>
              </div>
            </div>
            {/* Show hint to expand if collapsed */}
            {!isExpanded && (
               <div className="text-xs text-gray-400 text-center pt-1">Click to expand</div>
            )}
          </div>
        ) : (
          // Fallback if analyzed but no analysis data somehow
          <p className="text-gray-500">Analysis data unavailable.</p>
        )}
      </div>

      {/* Divider and Toolbar Placeholder (Optional, can be removed if not needed) */}
      {/* <hr className="my-4 border-gray-100" /> */}
      {/* Removed Toolbar Placeholder */}
    </div>
  );
}