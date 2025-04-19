"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  // Always render a button element to occupy space
  return (
    <button
      className={`button px-4 py-2 ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`} // Add styling for disabled state
      onClick={() => { // Only call signOut if authenticated
        if (isAuthenticated) {
          void signOut();
        }
      }}
      disabled={!isAuthenticated} // Disable the button when not authenticated
    >
      Sign out
    </button>
  );
}
