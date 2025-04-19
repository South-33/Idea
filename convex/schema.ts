import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  ideas: defineTable({
    userId: v.id("users"),
    content: v.string(),
    status: v.union(v.literal("pending"), v.literal("analyzed")),
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
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
