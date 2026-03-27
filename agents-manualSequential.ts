import { GOOGLE_SEARCH, InMemorySessionService, LlmAgent } from "@google/adk";
import { runAgentQuery } from "./helper.ts";

const model = "gemini-2.5-flash";

const dayTripAgent = new LlmAgent({
  name: "day_trip_agent",
  model: model,
  description:
    "Agent specialized in generating spontaneous full-day itineraries based on mood, interests, and budget.",
  instruction: `
    You are the "Spontaneous Day Trip" Generator - a specialized AI assistant that creates engaging full-day itineraries.

    Your Mission:
    Transform a simple mood or interest into a complete day-trip adventure with real-time details, while respecting a budget.

    Guidelines:
    1. **Budget-Aware**: Pay close attention to budget hints like 'cheap', 'affordable', or 'splurge'. Use Google Searc to find activities (free museums, parks, paid attractions) that match the user's budget.
    2. **Full-Day Structure**: Create morning, afternoon, and evening activities.
    3. **Real-Time Focus**: Search for current operating hours and special events.
    4. **Mood Matching**: Align suggestions with the requested mood (adventurous, relaxing, artsy, etc.).

    RETURN itinerary in MARKDOWN FORMAT with clear time blocks and specific venue names.
    `,
  tools: [GOOGLE_SEARCH],
});

const foodieAgent = new LlmAgent({
  name: "foodie_agent",
  model: model,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are an expert food critic. Your goal is to find the absolute best food, restaurants, or culinary experiences based on a user's request. When you recommend a place, state its name clearly. For example: 'The best sushi is at **Jin Sho**.'",
});

const weekendGuideAgent = new LlmAgent({
  name: "weekend_guide_agent",
  model: model,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are a local events guide. Your task is to find interesting events, concerts, festivals, and activities happening on a specific weekend.",
});

const transportationAgent = new LlmAgent({
  name: "transportation_agent",
  model: model,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are a navigation assistant. Given a starting point and a destination, provide clear directions on how to get from the start to the end.",
});

export const routerAgent = new LlmAgent({
  name: "router_agent",
  model: model,
  tools: [GOOGLE_SEARCH],
  instruction: `
    You are a request router. Your job is to analyze a user's query and decide which of the following agents or workflows is best suited to handle it.
    Do not answer the query yourself, only return the name of the most appropriate choice.

    Available Options:
    - 'foodie_agent': For queries *only* about food, restaurants, or eating.
    - 'weekend_guide_agent': For queries about events, concerts, or activities happening on a specific timeframe like a weekend.
    - 'day_trip_agent': A general planner for any other day trip requests.
    - 'find_and_navigate_combo': Use this for complex queries that ask to *first find a place* and *then get directions* to it.

    Only return the single, most appropriate option's name and nothing else.
    `,
});

const workerAgents: Record<string, LlmAgent> = {
  day_trip_agent: dayTripAgent,
  foodie_agent: foodieAgent,
  weekend_guide_agent: weekendGuideAgent,
  transportation_agent: transportationAgent,
};

const sessionService = new InMemorySessionService();

async function runSequentialApp() {
  const queries = [
    "I want to eat the best sushi in Palo Alto,", // should go to foodie_agent
    "Are there any cool outdoor concerts this weekend?", // should go to weekend_guide_agent
    "Find me the best sushi in Palo Alto and then tell me how to get there from the Caltrain station.", // should trigger combo
  ];

  for (const q of queries) {
    console.log("processing query:", q, "\n");

    // ask router agent to choose agent/workflow
    const routerSession = await sessionService.createSession({
      appName: routerAgent.name,
      userId: "router007",
    });
    const chosenRoute = await runAgentQuery(
      routerAgent,
      q,
      routerSession,
      "router007",
      routerAgent.name,
      sessionService,
    );
    console.log("chose route is:", chosenRoute);

    if (chosenRoute === "find_and_navigate_combo") {
      const foodieSession = await sessionService.createSession({
        appName: routerAgent.name,
        userId: "foodie007",
      });
      const foodieResponse = await runAgentQuery(
        foodieAgent,
        q,
        foodieSession,
        "foodie007",
        routerAgent.name,
        sessionService,
      );

      const match = foodieResponse.match(/\*\*(.*?)\*\*/);
      if (!match) {
        console.log(
          "could not determine the restaurant name from the response.",
        );
        continue;
      }
      const destination = match?.[0];
      console.log("destination is:", destination);

      const directionsQuery = `Give me directions to ${destination} from the Palo Alto Caltrain station.`;
      console.log("new query directions", directionsQuery);
      const transportSession = await sessionService.createSession({
        appName: transportationAgent.name,
        userId: "transportation007",
      });
      const transportationRes = await runAgentQuery(
        transportationAgent,
        directionsQuery,
        transportSession,
        "transportation007",
        transportationAgent.name,
        sessionService,
      );
      console.log("done with workflow ", transportationRes);
    } else if (workerAgents[chosenRoute]) {
      const workerAgent = workerAgents[chosenRoute];
      const workerSession = await sessionService.createSession({
        appName: workerAgent.name,
        userId: "worker007",
      });
      const workerRes = await runAgentQuery(
        workerAgent,
        q,
        workerSession,
        "worker007",
        workerAgent.name,
        sessionService,
      );
      console.log("done with single agent", workerRes);
    } else {
      console.log("Error unknown route chosen", chosenRoute);
    }
  }
}

await runSequentialApp();
