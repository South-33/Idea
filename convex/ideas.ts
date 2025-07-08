import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addIdea = mutation({
  args: {
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ideaId = await ctx.db.insert("ideas", {
      userId,
      content: args.content,
      imageId: args.imageId,
      status: "pending",
      position: Date.now(), // Use timestamp for ordering
    });

    await ctx.scheduler.runAfter(0, api.ideaAnalysis.analyzeIdea, { ideaId });
    return ideaId;
  },
});

export const deleteIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.ideaId);
  },
});

export const moveIdea = mutation({
  args: { 
    ideaId: v.id("ideas"),
    newPosition: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.ideaId, { position: args.newPosition });
  },
});

export const listIdeas = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // For each idea, generate a URL for the image if it exists
    const ideasWithUrls = await Promise.all(
      ideas.map(async (idea) => {
        if (idea.imageId) {
          const imageUrl = await ctx.storage.getUrl(idea.imageId);
          return { ...idea, imageUrl };
        }
        return { ...idea, imageUrl: null };
      })
    );

    return ideasWithUrls;
  },
});

export const getIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ideaId);
  },
});

export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.ideaId, { content: args.content });
  },
});

export const updateAnalysis = mutation({
  args: {
    ideaId: v.id("ideas"),
    analysis: v.object({
      score: v.number(),
      title: v.string(),
      reasoning: v.string(),
      feasibility: v.string(),
      similarIdeas: v.string(),
      summary: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ideaId, {
      status: "analyzed",
      analysis: args.analysis,
    });
  },
});

export const updateIdeaStatus = mutation({
  args: {
    ideaId: v.id("ideas"),
    status: v.union(v.literal("pending"), v.literal("analyzed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.ideaId, { status: args.status });
  },
});
