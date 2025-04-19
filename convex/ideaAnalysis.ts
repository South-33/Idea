"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use environment variable for API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export const analyzeIdea = action({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const idea = await ctx.runQuery(api.ideas.getIdea, { ideaId: args.ideaId });
    if (!idea) throw new Error("Idea not found");

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables");
      throw new Error("GEMINI_API_KEY not configured");
    }

    const prompt = `Please analyze this idea and provide your response in exactly this format:
Score: [number between 1-10]
Title: [short 3-5 word summary]
Reasoning: [brief explanation of the score]
Feasibility: [assessment of how feasible the idea is]
Similar Ideas: [existing similar ideas or products]

The idea to analyze is: ${idea.content}

Remember to strictly follow the format with the exact labels and line breaks as shown above.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      const result = await model.generateContent(prompt);
      const content = result.response.text();
      
      console.log("Gemini response:", content); // Debug log
      
      if (!content) throw new Error("No response from AI");

      // Parse the response using regex to handle the labeled format
      const scoreMatch = content.match(/Score:\s*(\d+)/);
      const titleMatch = content.match(/Title:\s*([^\n]+)/);
      const reasoningMatch = content.match(/Reasoning:\s*([^\n]+)/);
      const feasibilityMatch = content.match(/Feasibility:\s*([^\n]+)/);
      const similarIdeasMatch = content.match(/Similar Ideas:\s*([^\n]+)/);

      if (!scoreMatch || !titleMatch || !reasoningMatch || !feasibilityMatch || !similarIdeasMatch) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid AI response format");
      }

      const analysis = {
        score: parseInt(scoreMatch[1]),
        title: titleMatch[1].trim(),
        reasoning: reasoningMatch[1].trim(),
        feasibility: feasibilityMatch[1].trim(),
        similarIdeas: similarIdeasMatch[1].trim(),
      };

      await ctx.runMutation(api.ideas.updateAnalysis, {
        ideaId: args.ideaId,
        analysis,
      });
    } catch (error) {
      console.error("Failed to analyze idea:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await ctx.runMutation(api.ideas.updateAnalysis, {
        ideaId: args.ideaId,
        analysis: {
          score: 5,
          title: "Analysis Failed",
          reasoning: `Error: ${errorMessage}`,
          feasibility: "Unable to assess",
          similarIdeas: "Unable to find similar ideas",
        },
      });
    }
  },
});
