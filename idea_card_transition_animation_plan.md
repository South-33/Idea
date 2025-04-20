# Focused Idea Card Transition Animation Plan

This document outlines the plan to add a simple and quick animation when switching between cards inside the focused state in the `FocusedIdeaView.tsx` component.

## Objective

Implement a subtle fade animation to enhance the user experience when navigating between different ideas in the focused view.

## Plan

1.  **Add a state variable:** Introduce a new state variable `isTransitioning` within the `FocusedIdeaView` component. This state will be a boolean, initialized to `false`, and will control the animation state during navigation.

2.  **Implement a useEffect:** Create a `useEffect` hook that will trigger its logic whenever the `focusedIdea._id` prop changes. This change signifies that a new idea is being loaded into the focused view.

3.  **Trigger the transition:**
    *   Inside the `useEffect`, immediately set the `isTransitioning` state to `true`. This will initiate the visual fade-out effect on the current card content.
    *   Use a `setTimeout` function to introduce a short delay. A duration of approximately 150ms is suggested to match or slightly less than the existing transform transition duration, ensuring a quick animation.
    *   In the callback function of the `setTimeout`, set `isTransitioning` back to `false`. This will allow the newly loaded card content (which is now the `focusedIdea`) to fade in smoothly.

4.  **Apply CSS classes:** Modify the `className` property of the main card container `div` (the one with the `cardRef`). Conditionally add the Tailwind CSS class `opacity-0` to this element when the `isTransitioning` state is `true`. When `isTransitioning` is `false`, the element will revert to its default opacity (which is 100), creating the fade effect.

5.  **Update transition property:** Locate the `style` property of the main card container `div`. Ensure that the `transition` CSS property within this style object includes `opacity`. This will ensure that the change in opacity (from 100 to 0 and back to 100) is animated smoothly over the specified duration. The existing `transform` and `box-shadow` transitions should be maintained.

## Animation Flow (Mermaid Diagram)

```mermaid
graph TD
    A[User navigates to next/previous idea] --> B{focusedIdea._id changes?};
    B -- Yes --> C[Set isTransitioning to true];
    C --> D[Card opacity transitions to 0];
    D --> E[Wait 150ms (setTimeout)];
    E --> F[Set isTransitioning to false];
    F --> G[New card content displayed];
    G --> H[Card opacity transitions to 100];
    B -- No --> I[No animation];
```

This plan focuses on a simple and quick fade animation by leveraging existing component structure and Tailwind CSS classes.