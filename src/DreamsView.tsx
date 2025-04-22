import React, { useState, useMemo } from "react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { DreamCard } from "./DreamCard.tsx";
import { FocusedDreamView } from "./FocusedDreamView.tsx";
import { CreateDreamView } from "./CreateDreamView.tsx";

interface DreamsViewProps {
  dreams: any[]; // Accept dreams as prop (consider more specific type)
  isCreatingDream: boolean; // Pass down from App
  onCloseCreateDreamView: () => void;
  // Add other props needed from App/Content
}

export function DreamsView({ dreams, isCreatingDream, onCloseCreateDreamView }: DreamsViewProps) {
  const [focusedDreamId, setFocusedDreamId] = useState<Id<"dreams"> | null>(null);

  const addDream = useMutation(api.dreams.addDream);
  const deleteDream = useMutation(api.dreams.deleteDream);

  // Removed: const dreams = useQuery(api.dreams.listDreams) || [];

  const handleDreamDelete = async (dreamId: Id<"dreams">) => {
    await deleteDream({ dreamId });
    if (focusedDreamId === dreamId) {
      setFocusedDreamId(null); // Close focus view if deleted
    }
  };

  const focusedDream = useMemo(() => dreams.find(dream => dream._id === focusedDreamId), [dreams, focusedDreamId]);

  // Removed: Conditional return based on loggedInUser === undefined

  // Modified handleNavigate for DreamsView
  const handleDreamNavigate = (direction: 'prev' | 'next') => {
    if (!focusedDream || !dreams.length) return;
    const currentIndex = dreams.findIndex(dream => dream._id === focusedDream._id);
    let nextIndex = direction === 'prev'
        ? (currentIndex > 0 ? currentIndex - 1 : dreams.length - 1)
        : (currentIndex < dreams.length - 1 ? currentIndex + 1 : 0);
    if (dreams[nextIndex]) setFocusedDreamId(dreams[nextIndex]._id);
  };


  return (
    <>
      <Authenticated>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {dreams.map((dream) => (
            <DreamCard
               key={dream._id}
               dream={dream}
               onDelete={handleDreamDelete}
               onFocus={() => setFocusedDreamId(dream._id)} // Simplified focus
               isHidden={dream._id?.toString() === focusedDreamId?.toString()}
             />
          ))}
        </div>
        {dreams.length === 0 && <p className="text-center text-gray-500 mt-8">No dreams recorded yet. Add one!</p>}
      </Authenticated>

      {focusedDream && (
         <FocusedDreamView
           focusedDream={focusedDream}
           allDreams={dreams} // Pass all dreams for context if needed
           onClose={() => setFocusedDreamId(null)}
           onNavigate={handleDreamNavigate} // Use the local navigate handler
         />
       )}

      {isCreatingDream && (
         <CreateDreamView
           onAddDream={addDream}
           onClose={onCloseCreateDreamView}
         />
       )}
    </>
  );
}