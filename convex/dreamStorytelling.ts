"use node"; // Specify this action runs in a Node.js environment

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Id } from "./_generated/dataModel";

// Ensure the API key is handled securely (environment variable)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY environment variable not set. Please set it in your Convex dashboard secrets.",
  );
}
const genAI = new GoogleGenerativeAI(apiKey);

export const generateStory = action({
  args: { dreamId: v.id("dreams") },
  handler: async (ctx, args) => {
    // 1. Fetch the dream content
    const dream = await ctx.runQuery(api.dreams.getDream, { dreamId: args.dreamId });
    if (!dream || !dream.content) {
      console.warn(`Dream ${args.dreamId} not found or has no content.`);
      // Optionally update status to error here if needed
      return; // Stop processing if no dream content
    }

    // 2. Construct the prompt for the AI
    const prompt = `
You are a creative storyteller AI. Based on the dream description provided below, write a short, cohesive, and imaginative story (around 100-300 words). Capture the mood and key elements of the dream.

--- DREAM DESCRIPTION START ---
${dream.content}
--- DREAM DESCRIPTION END ---

Write only the story itself, without any introductory or concluding phrases like "Here's the story:".
`;

    try {
      // 3. Call the Generative AI model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" }); // Or another suitable model

      console.log(`Generating story for dream ${args.dreamId}...`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const storyText = response.text();

      if (!storyText) {
        console.error("AI response content is empty for dream:", args.dreamId);
        throw new Error("No story content from AI");
      }

      console.log(`Successfully generated story for dream ${args.dreamId}`);

      // 4. Save the generated story back to the database
      await ctx.runMutation(api.dreams.updateDreamStory, {
        dreamId: args.dreamId,
        story: storyText.trim(), // Trim whitespace
      });

      console.log(`Successfully updated dream ${args.dreamId} with story.`);

    } catch (error) {
      console.error(`Failed to generate story for dream ${args.dreamId}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during story generation";

      // Optional: Update dream status to indicate failure
      // Consider adding an error field to the dreams table or using the story field
      // await ctx.runMutation(api.dreams.updateDreamStory, {
      //   dreamId: args.dreamId,
      //   story: `Error generating story: ${errorMessage.substring(0, 200)}`, // Store error message
      //   // You might need another mutation or modify updateDreamStory to handle error states
      // });
    }
  },
});