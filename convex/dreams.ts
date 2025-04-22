import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Add a new dream and schedule story generation
export const addDream = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dreamId = await ctx.db.insert("dreams", {
      userId,
      content: args.content,
      status: "pending",
      position: Date.now(), // Use timestamp for default ordering
    });

    // Schedule the AI story generation action
    await ctx.scheduler.runAfter(0, api.dreamStorytelling.generateStory, { dreamId });
    return dreamId;
  },
});

// Delete a dream
export const deleteDream = mutation({
  args: { dreamId: v.id("dreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dream = await ctx.db.get(args.dreamId);
    if (!dream || dream.userId !== userId) throw new Error("Unauthorized or dream not found");

    await ctx.db.delete(args.dreamId);
  },
});

// List dreams for the logged-in user
export const listDreams = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return []; // Return empty array if not logged in

    return await ctx.db
      .query("dreams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc") // Order by position (timestamp descending)
      .collect();
  },
});

// Get a single dream by ID (used internally by the action)
export const getDream = query({
  args: { dreamId: v.id("dreams") },
  handler: async (ctx, args) => {
    // Note: Actions run with system privileges, so we don't need user auth here,
    // but the action should ensure it's acting on behalf of an authenticated user indirectly.
    return await ctx.db.get(args.dreamId);
  },
});

// Update a dream with the generated story (called by the action)
export const updateDreamStory = mutation({
  args: {
    dreamId: v.id("dreams"),
    story: v.string(), // The generated story text
  },
  handler: async (ctx, args) => {
    // Internal mutation, assumes validation/auth happened before scheduling the action
    await ctx.db.patch(args.dreamId, {
      status: "storified",
      story: args.story,
    });
  },
});

// Optional: Mutation to update dream content if needed later
export const updateDreamContent = mutation({
    args: {
        dreamId: v.id("dreams"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const dream = await ctx.db.get(args.dreamId);
        if (!dream || dream.userId !== userId) throw new Error("Unauthorized or dream not found");

        // Reset status to pending if content changes, triggering re-generation
        await ctx.db.patch(args.dreamId, {
            content: args.content,
            status: "pending",
            story: undefined, // Clear old story
        });

        // Re-schedule the AI story generation action
        await ctx.scheduler.runAfter(0, api.dreamStorytelling.generateStory, { dreamId: args.dreamId });
    },
});