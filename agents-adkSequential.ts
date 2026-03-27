import {
  GOOGLE_SEARCH,
  InMemorySessionService,
  LlmAgent,
  SequentialAgent,
} from "@google/adk";
import { dayTripAgent } from "./agent-dayTrip.ts";
import { runAgentQuery } from "./helper.ts";

const MODEL_NAME = "gemini-2.5-flash";
export const foodieAgent = new LlmAgent({
  name: "foodie_agent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction: `
  You are an expert food critic. Your goal is to find the best restaurant based on a user's request.

  When you recommend a place, you must output *only* the name of the establishment and nothing else.
  For example, if the best sushi is at 'Jin Sho', you should output only: Jin Sho
  `,
  outputKey: "destination",
});

const transporationAgent = new LlmAgent({
  name: "transportation_agent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction: `
    You are a navigation assistant. Given a destination, provide clear directions.
    The user wants to go to: {destination}.

    Analyze the user's full original query to find their starting point.
    Then, provide clear directions from that starting point to {destination}.
    `,
});

export const findAndNavigateCombo = new SequentialAgent({
  name: "find_and_navigate_agent",
  subAgents: [foodieAgent, transporationAgent],
  description:
    "A workflow that first finds a location and then provides directions to it.",
});

const weekendGuideAgent = new LlmAgent({
  name: "weekend_guide_agent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are a local events guide. Your task is to find interesting events, concerts, festivals, and activities happening on a specific weekend.",
});

export const routerAgent = new LlmAgent({
  name: "router_agent",
  model: MODEL_NAME,
  instruction: `
    You are a request router. Your job is to analyze a user's query and decide which of the following agents or workflows is best suited to handle it.
    Do not answer the query yourself, only return the name of the most appropriate choice.

    Available Options: 
    - 'foodie_agent': FOr queries *only* about food, restaurants, or eating.
    - 'weekend_guide_agent': For queries about events, concerts, or activities happening on a specific timeframe like a weekend.
    - 'day_trip_agent': A general planner for any other day trip requests.
    - 'find_and_navigate_agent': Use this for complex queries that ask to *first find a place* and *then get directions* to it.

    Only return the single, most appropriate option's name and nothing else.
    `,
});

const workerAgents: Record<string, LlmAgent | SequentialAgent> = {
  day_trip_agent: dayTripAgent,
  foodie_agent: foodieAgent,
  weekend_guide_agent: weekendGuideAgent,
  find_and_navigate_agent: findAndNavigateCombo,
};

const sessionService = new InMemorySessionService();

async function runSequentialApp() {
  const queries = [
    "I want to eat the best sushi in Palo Alto,", // should go to foodie_agent
    "Are there any cool outdoor concerts this weekend?", // should go to weekend_guide_agent
    "Find me the best sushi in Palo Alto and then tell me how to get there from the Caltrain station.", // should SequentialAgent
  ];

  for (const query of queries) {
    console.log("processing new query:", query);

    const routerSession = await sessionService.createSession({
      appName: routerAgent.name,
      userId: "router007",
    });
    const chosenRoute = await runAgentQuery(
      routerAgent,
      query,
      routerSession,
      "router007",
      routerAgent.name,
      sessionService,
    );
    console.log("route is", chosenRoute);

    if (workerAgents[chosenRoute]) {
      const workerAgent = workerAgents[chosenRoute];
      const workerSession = await sessionService.createSession({
        appName: workerAgent.name,
        userId: "worker007",
      });
      await runAgentQuery(
        workerAgent,
        query,
        workerSession,
        "worker007",
        workerAgent.name,
        sessionService,
      );
    }
  }
}

await runSequentialApp();
