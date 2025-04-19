import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { IdeaCard } from "./IdeaCard"; // Import the new component

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const loggedInUser = useQuery(api.auth.loggedInUser);

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
          {/* Sign Out Button */}
          <SignOutButton />
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Content />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function Content() {
  const [newIdea, setNewIdea] = useState("");
  const [expandedIds, setExpandedIds] = useState<Id<"ideas">[]>([]);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  const addIdea = useMutation(api.ideas.addIdea);
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
        <Unauthenticated>
          <p className="text-xl text-dark-grey-text">Sign in to start analyzing your ideas</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={newIdea}
            onChange={(e) => {
              setNewIdea(e.target.value);
            }}
            onInput={(e) => { // Use onInput for immediate resizing
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto'; // Temporarily reset to get accurate scrollHeight
              setTextareaHeight(`${target.scrollHeight}px`);
            }}
            placeholder="Type your idea here..."
            className="w-full p-4 border border-border-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-border-grey focus:ring-opacity-50 bg-white resize-none hide-scrollbar overflow-hidden"
            style={{ height: textareaHeight }}
          />
          <button
            type="submit"
            disabled={!newIdea.trim()}
            className="button px-6 py-2 disabled:opacity-50 hover:bg-gray-100"
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
              isExpanded={expandedIds.includes(idea._id)} // Pass expansion state
              onToggleExpand={() => {
                setExpandedIds(prevExpandedIds =>
                  prevExpandedIds.includes(idea._id)
                    ? prevExpandedIds.filter(id => id !== idea._id)
                    : [...prevExpandedIds, idea._id]
                );
              }} // Pass toggle handler
            />
          ))}
        </div>
      </Authenticated>
    </div>
  );
}


