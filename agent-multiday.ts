import { GOOGLE_SEARCH, InMemorySessionService, LlmAgent } from "@google/adk";
import { runAgentQuery } from "./helper.ts";

export const multiDayTripAgent = new LlmAgent({
  name: "multi_day_trip_agent",
  model: "gemini-2.5-flash",
  description:
    "Agent that progressively plans a multi-day trip, remembering previous days and adapting to user feedback.",
  instruction: `
    You are the "Adaptive Trip Planner" 🗺️ - an AI assistant that builds multi-day travel iteneraries step-by-step. 

    Your defining Feature:
    You have short-term memory. You MUST refer back to our conversation to understand the trip's context, what has already been planned, and the user's preferences. If the user asks for a change, you must adapt the plan while keeping the unchanged parts consistent.

    Your Mission:
    1. **Initiate**: Start by asking for the destination, trip duration, and interests.
    2. **Plan Progressively**: Plan ONLY ONE DAY at a time. After presenting a plan, ask for confirmation. 
    3. **Handle Feedback**: If a user dislikes a suggestion (e.g., "I don't like museums"), acknowledge their feedback, adn provide a *new, alternative* suggestion for that time slot that still fits the overall theme. 
    4. **Maintain Context**: For each new day, ensure the activities are unique and build logically on the previous days. Do not suggest the same things repeatedly.
    5. **Final Output**: Return each day's itinerary in MARKDOWN format.
    `,
  tools: [GOOGLE_SEARCH],
});

const sessionService = new InMemorySessionService();

async function adaptiveMemoryDemo(userId: string) {
  const tripSession = await sessionService.createSession({
    appName: multiDayTripAgent.name,
    userId: userId,
  });
  const query1 =
    "Hi! I want to plan a 2-day trip to Lisbon, Portugal. I'm interested in historic sites and great local food.";

  await runAgentQuery(
    multiDayTripAgent,
    query1,
    tripSession,
    userId,
    multiDayTripAgent.name,
    sessionService,
  );

  const query2 =
    "That sounds pretty good, but I'm not a huge fan of castles. Can you replace the morning activity for Day 1 with something else historical?";

  await runAgentQuery(
    multiDayTripAgent,
    query2,
    tripSession,
    userId,
    multiDayTripAgent.name,
    sessionService,
  );

  const query3 =
    "Yes, the new plan for Day 1 is perfect! Please plan Day 2 now, keeping the food theme in mind.";

  await runAgentQuery(
    multiDayTripAgent,
    query3,
    tripSession,
    userId,
    multiDayTripAgent.name,
    sessionService,
  );
}

async function memoryFailureDemo(userId: string) {
  const sessionOne = await sessionService.createSession({
    appName: multiDayTripAgent.name,
    userId,
  });

  const query1 =
    "Hi! I want to plan a 2-day trip to Lisbon, Portugal. I'm interested in historic sites and great local food.";
  await runAgentQuery(
    multiDayTripAgent,
    query1,
    sessionOne,
    userId,
    multiDayTripAgent.name,
    sessionService,
  );

  const sessionTwo = await sessionService.createSession({
    appName: multiDayTripAgent.name,
    userId,
  });
  const query2 = "Yes, that looks perfect! Please plan Day 2.";
  await runAgentQuery(
    multiDayTripAgent,
    query2,
    sessionTwo,
    userId,
    multiDayTripAgent.name,
    sessionService,
  );
}

async function main() {
  //   await adaptiveMemoryDemo("longTermAgent");
  await memoryFailureDemo("agentAmnesiac");
}

await main();
