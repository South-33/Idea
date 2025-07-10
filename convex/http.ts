import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

const geminiAnalysis = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { ideaId, analysis } = body;

  if (!ideaId || !analysis) {
    return new Response("Missing ideaId or analysis in request body", {
      status: 400,
    });
  }

  try {
    await ctx.runMutation(internal.ideas.updateAnalysis, {
      ideaId,
      analysis,
    });
    return new Response("Analysis received and processed.", { status: 200 });
  } catch (error) {
    console.error("Failed to process analysis:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

http.route({
  path: "/gemini-analysis",
  method: "POST",
  handler: geminiAnalysis,
});


export default http;
