import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  ideas: defineTable({
    imageId: v.optional(v.id("_storage")),
    audioId: v.optional(v.id("_storage")),
    transcription: v.optional(v.string()),

    userId: v.id("users"),
    content: v.string(),
    status: v.union(v.literal("pending"), v.literal("analyzing"), v.literal("analyzed")),
    position: v.number(),
    analysis: v.optional(v.object({
      score: v.number(),
      title: v.string(),
      reasoning: v.string(),
      feasibility: v.string(),
      similarIdeas: v.string(),
      summary: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"]),
  dreams: defineTable({
    userId: v.id("users"),
    content: v.string(),
    status: v.union(v.literal("pending"), v.literal("storified")),
    position: v.number(),
    story: v.optional(v.string()),
    analysis: v.optional(v.object({ // Add optional analysis object
      title: v.optional(v.string()), // Add optional title field
      // Add other potential analysis fields for dreams later if needed
    })),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
