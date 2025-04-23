import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard";
import { FocusedIdeaView } from "./FocusedIdeaView";
import { CreateIdeaView } from "./CreateIdeaView";
import { IdeasView } from "./IdeasView"; // Import IdeasView
import { DreamsView } from "./DreamsView"; // Import DreamsView

export type ViewType = 'ideas' | 'dreams'; // Define view type

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('ideas'); // State for current view
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [isCreatingDream, setIsCreatingDream] = useState(false); // State for create dream modal
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const queryIdeas = useQuery(api.ideas.listIdeas) || []; // Fetch ideas in App
  const queryDreams = useQuery(api.dreams.listDreams) || []; // Fetch dreams in App

  // Use local state for optimistic updates
  const [localIdeas, setLocalIdeas] = useState(queryIdeas);
  const [localDreams, setLocalDreams] = useState(queryDreams);

  // Update local state when query results change from useQuery
  useEffect(() => {
    if (queryIdeas.length > 0) {
      setLocalIdeas(queryIdeas);
    }
  }, [queryIdeas]);

  useEffect(() => {
    if (queryDreams.length > 0) {
      setLocalDreams(queryDreams);
    }
  }, [queryDreams]);

  const deleteIdeaMutation = useMutation(api.ideas.deleteIdea);

  const deleteDreamMutation = useMutation(api.dreams.deleteDream);

  const deleteIdea = async (ideaId: Id<"ideas">) => {
    // Find the idea to be deleted
    const ideaToDelete = localIdeas.find(idea => idea._id === ideaId);
    if (!ideaToDelete) return;

    // Optimistically update the UI
    setLocalIdeas(prevIdeas => prevIdeas.filter(idea => idea._id !== ideaId));

    try {
      // Call the delete mutation
      await deleteIdeaMutation({ ideaId });
    } catch (error) {
      // If mutation fails, revert the UI and show error
      console.error("Failed to delete idea on server:", error);
      setLocalIdeas(prevIdeas => [...prevIdeas, ideaToDelete]);
      // Optionally show a user-friendly error message
      // alert("Failed to delete idea. Please try again.");
    }
  };

  const deleteDream = async (dreamId: Id<"dreams">) => {
    // Find the dream to be deleted
    const dreamToDelete = localDreams.find(dream => dream._id === dreamId);
    if (!dreamToDelete) return;

    // Optimistically update the UI
    setLocalDreams(prevDreams => prevDreams.filter(dream => dream._id !== dreamId));

    try {
      // Call the delete mutation
      await deleteDreamMutation({ dreamId });
    } catch (error) {
      // If mutation fails, revert the UI and show error
      console.error("Failed to delete dream on server:", error);
      setLocalDreams(prevDreams => [...prevDreams, dreamToDelete]);
      // Optionally show a user-friendly error message
      // alert("Failed to delete dream. Please try again.");
    }
  };

  const handleCloseCreateIdeaView = () => setIsCreatingIdea(false);
  const handleCloseCreateDreamView = () => setIsCreatingDream(false);

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
          <h2 className="text-xl text-dark-grey-text mb-6">Menu</h2>
          {/* Sidebar Navigation */}
          <nav>
            <ul>
              <li>
                <button
                  onClick={() => { setCurrentView('ideas'); setIsSidebarOpen(false); }}
                  className={`block w-full text-left py-2 px-3 rounded mb-2 ${currentView === 'ideas' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-dark-grey-text hover:bg-gray-100'}`}
                >
                  💡 Ideas
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('dreams'); setIsSidebarOpen(false); }}
                  className={`block w-full text-left py-2 px-3 rounded ${currentView === 'dreams' ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-dark-grey-text hover:bg-gray-100'}`}
                >
                  🌙 Dreams
                </button>
              </li>
            </ul>
          </nav>
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
            {/* Dynamic Title */}
            <p className="text-xl text-dark-grey-text">
              {currentView === 'ideas' ? 'Do you have an idea?' : 'Record a dream?'}
            </p>
          </div>
          {/* Create New Button */}
          <button
            onClick={() => {
              if (currentView === 'ideas') {
                setIsCreatingIdea(true);
              } else {
                setIsCreatingDream(true);
              }
            }}
            className="p-2 rounded-lg hover:bg-gray-100 text-dark-grey-text border border-border-grey"
            title={currentView === 'ideas' ? 'Create New Idea' : 'Create New Dream'} // Dynamic title
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
            <Content
              currentView={currentView}
              isCreatingIdea={isCreatingIdea}
              isCreatingDream={isCreatingDream}
              onCloseCreateIdeaView={handleCloseCreateIdeaView}
              onCloseCreateDreamView={handleCloseCreateDreamView}
              loggedInUser={loggedInUser} // Pass loggedInUser
              ideas={localIdeas} // Pass local ideas state
              dreams={localDreams} // Pass local dreams state
              deleteIdea={deleteIdea} // Pass delete function
              deleteDream={deleteDream} // Pass delete function
            />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

// Update Content component props
interface ContentProps {
  currentView: ViewType;
  isCreatingIdea: boolean;
  isCreatingDream: boolean;
  onCloseCreateIdeaView: () => void;
  onCloseCreateDreamView: () => void;
  loggedInUser: any; // Add loggedInUser to props
  ideas: any[]; // Accept local ideas state as prop
  dreams: any[]; // Accept local dreams state as prop
  deleteIdea: (ideaId: Id<"ideas">) => Promise<void>; // Update prop type for delete function
  deleteDream: (dreamId: Id<"dreams">) => Promise<void>; // Update prop type for delete function
}
// The Focused and Create views are now rendered within IdeasView and DreamsView,
// so their props are not needed here anymore.

function Content({
  currentView,
  isCreatingIdea,
  isCreatingDream,
  onCloseCreateIdeaView,
  onCloseCreateDreamView,
  loggedInUser,
  ideas, // Accept ideas prop
  dreams, // Accept dreams prop
  deleteIdea, // Accept delete mutation prop
  deleteDream, // Accept delete mutation prop
}: ContentProps) {

  // Reinstate loading check for loggedInUser
  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-grey-text"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative"> {/* Added relative positioning for modal context */}
      <div className="text-center">
        <Unauthenticated>
          <p className="text-xl text-dark-grey-text">
            {currentView === 'ideas'
              ? "Sign in to start analyzing your ideas"
              : "Sign in to record your dreams"}
          </p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {/* Conditionally render IdeasView or DreamsView */}
        {currentView === 'ideas' && (
          <IdeasView
            isCreatingIdea={isCreatingIdea}
            onCloseCreateIdeaView={onCloseCreateIdeaView}
            ideas={ideas} // Pass ideas prop
            deleteIdea={deleteIdea} // Pass delete mutation
          />
        )}
        {currentView === 'dreams' && (
          <DreamsView
            isCreatingDream={isCreatingDream} // Pass isCreatingDream
            onCloseCreateDreamView={onCloseCreateDreamView}
            dreams={dreams} // Pass dreams prop
            deleteDream={deleteDream} // Pass delete mutation
          />
        )}
      </Authenticated>
       {/* The focused and create views are now rendered within IdeasView and DreamsView */}
    </div>
  );
}
