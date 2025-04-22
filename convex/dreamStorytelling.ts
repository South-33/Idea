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
You are a creative storyteller AI. Based on the dream description provided below, generate a JSON object with two fields:
1.  \`title\`: A concise and engaging title for the dream (under 10 words).
2.  \`story\`: A short, cohesive, and imaginative story (around 100-300 words) based on the dream description. Capture the mood and key elements.

--- DREAM DESCRIPTION START ---
${dream.content}
--- DREAM DESCRIPTION END ---

Provide only the JSON object in your response.
`;

    try {
      // 3. Call the Generative AI model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" }); // Or another suitable model

      console.log(`Generating story and title for dream ${args.dreamId}...`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text(); // Get the raw text response

      if (!responseText) {
        console.error("AI response content is empty for dream:", args.dreamId);
        throw new Error("No content from AI");
      }

      console.log("Raw Gemini response:", responseText); // Debug log raw response

      // Remove markdown code block fences if present
      let cleanedResponseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
      console.log("Cleaned Gemini response:", cleanedResponseText); // Debug log cleaned response

      // Parse the cleaned text response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedResponseText);
        console.log("Parsed Gemini response:", parsedResponse); // Debug log parsed response
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON for dream:", args.dreamId, "\nResponse:\n", responseText, "\nError:", parseError);
        throw new Error("Invalid JSON response from AI");
      }

      const titleText = parsedResponse?.title;
      const storyText = parsedResponse?.story;

      if (!storyText) {
         console.error("AI response did not contain a story for dream:", args.dreamId, "\nResponse:\n", responseText);
         throw new Error("AI response did not contain a story field");
      }

      console.log(`Successfully extracted story and title for dream ${args.dreamId}`);

      // 4. Construct update arguments and save to the database
      const updateArgs: any = {
        dreamId: args.dreamId,
        story: storyText,
      };

      // Only include the analysis object in the arguments if a title was extracted
      if (titleText !== undefined && titleText !== null && titleText !== '') {
          updateArgs.analysis = { title: titleText };
      }

      await ctx.runMutation(api.dreams.updateDreamStory, updateArgs);

      console.log(`Successfully updated dream ${args.dreamId} with story and title.`);

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