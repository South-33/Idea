import { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useQuery } from 'convex/react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

// Derive the Idea type from the listIdeas query to ensure it's always in sync with the backend
type Idea = NonNullable<ReturnType<typeof useQuery<typeof api.ideas.listIdeas>>>[number];

type IdeaCardProps = {
  idea: Idea;
  onDelete: (id: Id<"ideas">) => void;
  onFocus: () => void;        // Added onFocus prop
  isHidden: boolean; // Added prop for conditional hiding
};

export function IdeaCard({ idea, onDelete, onFocus, isHidden }: IdeaCardProps) { // Updated props to accept isHidden
  // Determine card background based on score (subtler than before)
  const score = idea.analysis?.score;

  return (
    <div
      key={idea._id}
      className={`relative bg-white rounded-xl p-6 shadow-md overflow-hidden border border-border-grey flex flex-col ${idea.status === 'analyzing' ? 'self-start' : ''} ${isHidden ? 'invisible' : 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1'}`}
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
        {'< Idea'}
      </div>

      {/* Content - Make clickable for expansion */}
      <div className="cursor-pointer flex-grow" onClick={onFocus}> {/* Changed onClick handler */}
        {idea.status === "analyzing" ? (
          <div className="flex items-center gap-2 text-dark-grey-text">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-grey-text"></div>
            Analyzing...
          </div>
        ) : idea.analysis ? (
          <div className="space-y-3">
            {/* Always visible Title and Score */}
            {/* Always show title/score with border */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg text-dark-grey-text font-semibold">{idea.analysis.title}</span>
                {idea.audioUrl && (
                  <SpeakerWaveIcon className="w-5 h-5 text-gray-400 mr-2" title="This idea has an audio recording" />
                )}
              </div>
              <span className={`text-sm bg-gray-75 rounded-full px-2.5 py-0.5 border shadow-sm ${
                idea.status === "analyzed" && score !== undefined
                  ? score >= 8 ? 'border-green-300'
                  : score >= 5 ? 'border-soft-gold'
                  : 'border-red-300'
                  : 'border-border-grey' // Default border color if not analyzed or score is undefined
              }`}>
                {idea.analysis.score?.toFixed(1)}
              </span>
            </div>
            {/* Image and Summary/Transcription */}
            <div className="flex items-start gap-4 mt-2">
              {idea.imageUrl && (
                <img src={idea.imageUrl} alt="Idea thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
              )}
              <div className="text-sm text-dark-grey-text flex-1">
                {idea.analysis?.summary && (
                  <p>{idea.analysis.summary}</p>
                )}
                {idea.transcription && (
                  <p className="mt-2 italic text-gray-500"><strong>Transcription:</strong> {idea.transcription}</p>
                )}
              </div>
            </div>
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