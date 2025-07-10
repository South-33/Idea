import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// This single mutation handles all new idea creations.
export const createIdea = mutation({
  args: {
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    audioId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const hasContentForAnalysis = !!args.content || !!args.audioId;

    // Insert the new idea into the database.
    const ideaId = await ctx.db.insert("ideas", {
      userId,
      content: args.content,
      imageId: args.imageId,
      audioId: args.audioId,
      status: hasContentForAnalysis ? "analyzing" : "analyzed",
      position: Date.now(),
    });

    // If there's an audio file, prioritize transcribing it. The transcription action
    // will then schedule the analysis action on the combined text.
    if (args.audioId) {
      await ctx.scheduler.runAfter(0, internal.ideaAnalysis.transcribeAndAnalyzeAudio, {
        ideaId,
        audioId: args.audioId,
      });
    } else if (args.content) {
      // If there's no audio but there is text, analyze the text content directly.
      await ctx.scheduler.runAfter(0, internal.ideaAnalysis.analyzeIdea, { ideaId });
    }

    return ideaId;
  },
});

export const addAudioToIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    audioId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) throw new Error("Unauthorized");

    // Securely schedule the internal action to process the audio.
    // The internal action will handle all status updates.
    await ctx.scheduler.runAfter(0, internal.ideaAnalysis.transcribeAndAnalyzeAudio, {
      ideaId: args.ideaId,
      audioId: args.audioId,
    });
  },
});

export const updateIdeaWithTranscription = internalMutation({
  args: {
    ideaId: v.id("ideas"),
    transcription: v.string(),
    audioId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      console.error(`Idea not found: ${args.ideaId}`);
      return;
    }

    // Update the idea with the new transcription and audioId.
    // The analysis action will combine the content and transcription later.
    await ctx.db.patch(args.ideaId, {
      transcription: args.transcription,
      audioId: args.audioId,
    });
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

    // For each idea, generate URLs for the image and audio if they exist
    const ideasWithUrls = await Promise.all(
      ideas.map(async (idea) => {
        const imageUrl = idea.imageId
          ? await ctx.storage.getUrl(idea.imageId)
          : null;
        const audioUrl = idea.audioId
          ? await ctx.storage.getUrl(idea.audioId)
          : null;
        return { ...idea, imageUrl, audioUrl };
      })
    );

    return ideasWithUrls;
  },
});

export const getIdeaForAnalysis = internalQuery({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ideaId);
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

export const reanalyze = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) {
      throw new Error("Idea not found or you don't have permission to reanalyze");
    }

    // Set status to analyzing to trigger the UI animation
    await ctx.db.patch(args.ideaId, { status: "analyzing" });
    await ctx.scheduler.runAfter(0, internal.ideaAnalysis.analyzeIdea, { ideaId: args.ideaId });
  },
});

export const updateAnalysis = internalMutation({
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
      analysis: args.analysis,
      status: "analyzed",
    });
  },
});

export const updateIdeaStatus = internalMutation({
  args: {
    ideaId: v.id("ideas"),
    status: v.union(v.literal("pending"), v.literal("analyzed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ideaId, { status: args.status });
  },
});
