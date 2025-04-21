import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard";
import { FocusedIdeaView } from "./FocusedIdeaView"; // Import the focused view component
import { CreateIdeaView } from "./CreateIdeaView"; // Import the create view component

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingIdea, setIsCreatingIdea] = useState(false); // State for create view modal
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleCloseCreateView = () => setIsCreatingIdea(false); // Handler to close create view

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative min-h-screen flex bg-background-light-grey"> {/* Use flex for layout */}
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out z-20`}>
        {/* Sidebar Content */}
        <div className="p-4">
          <h2 className="text-xl text-dark-grey-text mb-4">Menu</h2>
          {/* Add sidebar navigation items here */}
          {/* <nav>
            <ul>
              <li><a href="#" className="block py-2 text-dark-grey-text hover:bg-gray-100 rounded">Link 1</a></li>
              <li><a href="#" className="block py-2 text-dark-grey-text hover:bg-gray-100 rounded">Link 2</a></li>
            </ul>
          </nav> */}
        {/* Sign Out Button */}
         <div className="mt-auto p-4 border-t border-gray-200"> {/* Added margin-top and border */}
           <SignOutButton />
         </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Top Bar/Header Area */}
        <div className="p-4 flex justify-between items-center bg-white shadow-sm border-b-2 border-border-grey">
          {/* Sidebar Toggle Button */}
          <button onClick={toggleSidebar} className="text-dark-grey-text focus:outline-none border border-border-grey rounded-lg p-2"> {/* Added border and padding */}
            {/* Hamburger Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          {/* Application Title (Optional, can be moved) */}
          <div className="flex-grow text-center">
            <p className="text-xl text-dark-grey-text">Do you have an idea?</p>
          </div>
          {/* Create New Note Button */}
          <button
            onClick={() => setIsCreatingIdea(true)} // Open create view modal
            className="p-2 rounded-lg hover:bg-gray-100 text-dark-grey-text border border-border-grey" // Added border class
            title="Create New Note" // Add title for accessibility
          >
            {/* Plus Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Content isCreating={isCreatingIdea} onCloseCreateView={handleCloseCreateView} />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function Content({ isCreating, onCloseCreateView }: { isCreating: boolean; onCloseCreateView: () => void }) {
  // Removed unused newIdea state and handler
  const [focusedIdeaId, setFocusedIdeaId] = useState<Id<"ideas"> | null>(null); // Changed state for focused view
  // Removed unused textareaHeight state
  const addIdea = useMutation(api.ideas.addIdea); // Keep addIdea mutation here
  const deleteIdea = useMutation(api.ideas.deleteIdea);
  const moveIdea = useMutation(api.ideas.moveIdea);
  const ideas = useQuery(api.ideas.listIdeas) || [];
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-grey-text"></div>
      </div>
    );
  }

  // Removed unused handleSubmit function

  const handleDelete = async (ideaId: Id<"ideas">) => {
    await deleteIdea({ ideaId });
    // If the deleted idea was focused, close the focus view
    if (focusedIdeaId === ideaId) {
      setFocusedIdeaId(null);
    }
  };

  // Find the currently focused idea object
  const focusedIdea = ideas.find(idea => idea._id === focusedIdeaId);

  // Handle navigation between focused ideas
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!focusedIdea || !ideas.length) return;

    const currentIndex = ideas.findIndex(idea => idea._id === focusedIdea._id);
    let nextIndex;

    if (direction === 'prev') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : ideas.length - 1; // Wrap around
    } else {
      nextIndex = currentIndex < ideas.length - 1 ? currentIndex + 1 : 0; // Wrap around
    }

    // Ensure nextIndex is valid before setting
    if (ideas[nextIndex]) {
      setFocusedIdeaId(ideas[nextIndex]._id);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative"> {/* Added relative positioning for modal context */}
      <div className="text-center">
        <Unauthenticated>
          <p className="text-xl text-dark-grey-text">Sign in to start analyzing your ideas</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start"> {/* Updated gap */}
          {ideas.map((idea) => (
              <IdeaCard
                key={idea._id}
                idea={idea}
                onDelete={handleDelete}
                onFocus={() => setFocusedIdeaId(idea._id)} // Pass focus handler
                isHidden={idea._id?.toString() === focusedIdeaId?.toString()} // Pass prop for conditional hiding
              />
            ))}
        </div>
      </Authenticated>

      {/* Conditionally render the Focused Idea View */}
      {focusedIdea && (
        <FocusedIdeaView
          focusedIdea={focusedIdea}
          allIdeas={ideas}
          onClose={() => setFocusedIdeaId(null)}
          onNavigate={handleNavigate}
        />
      )}

      {/* Conditionally render the Create Idea View */}
      {isCreating && (
        <CreateIdeaView
          onAddIdea={addIdea}
          onClose={onCloseCreateView}
        />
      )}
    </div>
  );
}


