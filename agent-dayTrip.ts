import {
  BaseSessionService,
  GOOGLE_SEARCH,
  InMemorySessionService,
  LlmAgent,
} from "@google/adk";
import { runAgentQuery } from "./helper.ts";

export const dayTripAgent = new LlmAgent({
  name: "day_trip_agent",
  model: "gemini-2.5-flash",
  description:
    "Agent specialized in generating spontaneous full-day itineraries based on mood, interests, and budget.",
  instruction: `
  You are the "Spontaneous Day Trip" Generator - a specialized AI Assistant that creates engaging full day itineraries.

  Your mission:
  Transform a simple mood or interest into a complete day trip adventure with real time details, while respecing a budget.

  Guidelines:
  1. **Budget-Aware**: Pay close attention to budget hints like 'cheap', 'affordable', or 'splurge'. Use Google Search to find activities (free museums, parks, paid attrations) that match the user's budget.
  2. **Full Day Structure**: Create morning, afternoon, and evening activities. 
  3. **Real Time Focus**: Search for current operating hours and special events. 
  4. **Mood Matching**: Align suggestions with the requested mood (adventurous, relaxing, artsy, etc...).

  RETURN itinerary in MARKDOWN FORMAT with clear time blocks and specific venue names.
  `,
  tools: [GOOGLE_SEARCH],
});

async function runDayTripGenie(
  appName: string,
  userId: string,
  sessionService: BaseSessionService,
) {
  const dayTripSession = await sessionService.createSession({
    appName: appName,
    userId: userId,
  });

  const query =
    "Plan a relaxing and artsy day trip near Sunnyvale, CA. Keep it affordable!";
  console.log("user query", query);
  await runAgentQuery(
    dayTripAgent,
    query,
    dayTripSession,
    userId,
    appName,
    sessionService,
  );
}

async function main() {
  const appName = "my_adk_adventure";
  const userId = "agent007";
  const sessionService = new InMemorySessionService();

  await runDayTripGenie(appName, userId, sessionService);
}

await main();
