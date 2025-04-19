# Frontend Redesign Plan: Idea Analyzer

This plan outlines the steps to update the frontend UI of the Idea Analyzer application to match the cleaner, minimalist look of the provided image (notes app).

**Phase 1: Information Gathering & Setup (Completed)**

*   Reviewed `App.tsx` to understand component structure, data flow (Convex), and current rendering logic.
*   Reviewed `src/index.css` for global styles and Tailwind setup.
*   Reviewed `tailwind.config.js` for theme customizations (none found).

**Phase 2: Implementation Steps**

1.  **Refactor Card Rendering:**
    *   Create a new component file: `src/IdeaCard.tsx`.
    *   Extract the idea rendering logic (currently lines 105-184 in `src/App.tsx`) into `IdeaCard.tsx`.
    *   Pass necessary props (like `idea`, `onDelete`, potentially `onMove`) from `App.tsx` to `IdeaCard.tsx`.
    *   Replace the original rendering logic in `App.tsx` with `<IdeaCard ... />`.
2.  **Update Global Background:**
    *   Modify the main container `div` in `App.tsx` (line 11) to use a light gray background class (e.g., `bg-gray-100` or `bg-slate-100`).
3.  **Restyle Idea Cards (`IdeaCard.tsx`):**
    *   Apply Tailwind classes to the main card container:
        *   `bg-white`
        *   `rounded-2xl` (or similar large radius)
        *   `p-6` (adjust as needed)
        *   `shadow-md` (or similar subtle shadow)
    *   Remove existing conditional background color logic (`getScoreColor`).
    *   Remove hover effects (`hover:bg-gray-50`, `hover:bg-green-100`, etc.).
4.  **Adjust Card Content Layout (`IdeaCard.tsx`):**
    *   **Header:** Add a static header element at the top:
        ```tsx
        <div className="flex items-center mb-4 text-gray-500">
          < Notes
        </div>
        ```
    *   **Content:** Display only the main idea content: `<p className="text-gray-700">{idea.content}</p>`. Remove the `idea.analysis` details (title, score, reasoning, feasibility, similar ideas) and the expand/collapse logic.
    *   **Toolbar Placeholder:** Add a visual divider and placeholder area at the bottom:
        ```tsx
        <hr className="my-4" />
        <div className="h-8"> {/* Placeholder for toolbar */} </div>
        ```
5.  **Action Buttons (`IdeaCard.tsx`):**
    *   Remove the Move Up/Down buttons entirely.
    *   Keep the Delete button (`×`), but adjust its styling and placement. It could potentially go inside the toolbar placeholder area or remain top-right but styled more subtly.
6.  **Update Grid Layout (`App.tsx`):**
    *   Adjust the `gap-4` class on the grid container (line 104) if needed to match the desired spacing (e.g., `gap-6` or `gap-8`).
7.  **Typography and Spacing:**
    *   Review font sizes, weights, and margins/paddings within `IdeaCard.tsx` using Tailwind utilities to ensure consistency with the target minimalist style.

**Visual Plan (Mermaid Diagram):**

```mermaid
graph TD
    A[App.tsx] --> B(Main Layout - Background Color: bg-gray-100);
    A --> C{Idea Data};
    C --> D[Grid Container (gap-6?)];
    D -- Map over ideas --> E(IdeaCard.tsx);

    subgraph IdeaCard.tsx
        direction TB
        E1[Card: bg-white, rounded-2xl, p-6, shadow-md] --> E2(Header: '< Notes');
        E2 --> E3(Content: idea.content);
        E3 --> E4(Divider + Toolbar Placeholder);
        E1 --> E5(Delete Button - Restyled/Repositioned);
    end

    style E fill:#f9f,stroke:#333,stroke-width:2px
```

**Summary of Changes:**

*   Create `src/IdeaCard.tsx`.
*   Modify `src/App.tsx` (background, grid, use `IdeaCard`).
*   Modify styles within `IdeaCard.tsx` (layout, content, buttons).
*   Remove unused logic (analysis display, move buttons, score colors).