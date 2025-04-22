import React, { useState, useMemo } from "react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard";
import { FocusedIdeaView } from "./FocusedIdeaView";
import { CreateIdeaView } from "./CreateIdeaView";

interface IdeasViewProps {
  ideas: any[]; // Accept ideas as prop (consider more specific type)
  isCreatingIdea: boolean; // Pass down from App
  onCloseCreateIdeaView: () => void;
  deleteIdea: (ideaId: Id<"ideas">) => Promise<void>; // Update prop type for delete function
  // Add other props needed from App/Content
}

export function IdeasView({ ideas, isCreatingIdea, onCloseCreateIdeaView, deleteIdea }: IdeasViewProps) {
  const [focusedIdeaId, setFocusedIdeaId] = useState<Id<"ideas"> | null>(null);

  const addIdea = useMutation(api.ideas.addIdea);

  // Removed: const ideas = useQuery(api.ideas.listIdeas) || [];

  const handleIdeaDelete = async (ideaId: Id<"ideas">) => {
    // Call the deleteIdea function passed from the parent
    // The parent component (App.tsx) now handles the optimistic UI update and error handling
    await deleteIdea(ideaId);
    if (focusedIdeaId === ideaId) {
      setFocusedIdeaId(null); // Close focus view if deleted
    }
  };

  const focusedIdea = useMemo(() => {
    if (!Array.isArray(ideas)) {
      return undefined; // Or null, depending on desired initial state
    }
    return ideas.find(idea => idea._id === focusedIdeaId);
  }, [ideas, focusedIdeaId]);

  // Removed: Conditional return based on loggedInUser === undefined

  // Modified handleNavigate for IdeasView
  const handleIdeaNavigate = (direction: 'prev' | 'next') => {
    if (!focusedIdea || !ideas.length) return;
    const currentIndex = ideas.findIndex(idea => idea._id === focusedIdea._id);
    let nextIndex = direction === 'prev'
        ? (currentIndex > 0 ? currentIndex - 1 : ideas.length - 1)
        : (currentIndex < ideas.length - 1 ? currentIndex + 1 : 0);
    if (ideas[nextIndex]) setFocusedIdeaId(ideas[nextIndex]._id);
  };


  return (
    <>
      <Authenticated>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              onDelete={handleIdeaDelete}
              onFocus={() => setFocusedIdeaId(idea._id)} // Simplified focus
              isHidden={idea._id?.toString() === focusedIdeaId?.toString()}
            />
          ))}
        </div>
        {ideas.length === 0 && <p className="text-center text-gray-500 mt-8">No ideas yet. Create one!</p>}
      </Authenticated>

      {focusedIdea && (
        <FocusedIdeaView
          focusedIdea={focusedIdea}
          allIdeas={ideas} // Pass all ideas for context if needed
          onClose={() => setFocusedIdeaId(null)}
          onNavigate={handleIdeaNavigate} // Use the local navigate handler
        />
      )}

      {isCreatingIdea && (
        <CreateIdeaView
          onAddIdea={addIdea}
          onClose={onCloseCreateIdeaView}
        />
      )}
    </>
  );
}