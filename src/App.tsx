import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard"; // Import the new component

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100"> {/* Updated background */}
      <header className="sticky top-0 z-10 bg-white shadow-sm p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-indigo-600">Idea Analyzer</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const [newIdea, setNewIdea] = useState("");
  const [expandedId, setExpandedId] = useState<Id<"ideas"> | null>(null);
  const addIdea = useMutation(api.ideas.addIdea);
  const deleteIdea = useMutation(api.ideas.deleteIdea);
  const moveIdea = useMutation(api.ideas.moveIdea);
  const ideas = useQuery(api.ideas.listIdeas) || [];
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;
    await addIdea({ content: newIdea });
    setNewIdea("");
  };

  const handleDelete = async (ideaId: Id<"ideas">) => {
    await deleteIdea({ ideaId });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-600 mb-4">Idea Analyzer</h1>
        <Authenticated>
          <p className="text-xl text-slate-600">Welcome back, {loggedInUser?.email ?? "friend"}!</p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to start analyzing your ideas</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Type your idea here..."
            className="w-full p-4 border rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            disabled={!newIdea.trim()}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-indigo-600 transition-colors"
          >
            Add Idea
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start"> {/* Updated gap */}
          {ideas.map((idea) => (
            // Use the new IdeaCard component
            <IdeaCard
              key={idea._id}
              idea={idea}
              onDelete={handleDelete}
              isExpanded={expandedId === idea._id} // Pass expansion state
              onToggleExpand={() => setExpandedId(expandedId === idea._id ? null : idea._id)} // Pass toggle handler
            />
          ))}
        </div>
      </Authenticated>
    </div>
  );
}
