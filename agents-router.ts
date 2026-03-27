import { BaseAgent, InMemorySessionService, LlmAgent } from "@google/adk";
import { dayTripAgent } from "./agent-dayTrip.ts";
import { findAndNavigateCombo, foodieAgent } from "./agents-adkSequential.ts";
import { iterativePlannerAgent } from "./agents-loop.ts";
import { parallelPlannerAgent } from "./agents-parallel.ts";
import { runAgentQuery } from "./helper.ts";

const MODEL_NAME = "gemini-2.5-flash";

export const routerAgent = new LlmAgent({
  name: "routerAgent",
  model: MODEL_NAME,
  instruction: `
    You are a master request router. Your job is to analyze a user's query and decide which of the following agents or workflows is best suited to handle it.
    Do not answer the query yourself, only return the name of the most appropriate choice.

    Available Options:
    - 'foodie_agent': For queries *only* about finding a single food place.
    - 'find_and_navigate_agent': For queries that ask to *first find a place* and *then get directions* to it.
    - 'iterative_planner_agent': For planning a trip with a specific constraint that needs checking, like travel time.
    - 'parallel_planner_agent': For queries that ask to find multiple, independent things at once (e.g., a museum AND a concert AND a restaurant).
    - 'day_trip_agent': A general planner for any other simple day trip requests.
    
    Only return the single, most appropriate option's name and nothing else.
    `,
});

const workerAgents: Record<string, BaseAgent> = {
  day_trip_agent: dayTripAgent,
  foodie_agent: foodieAgent,
  find_and_navigate_agent: findAndNavigateCombo,
  iterative_planner_agent: iterativePlannerAgent,
  parallel_planner_agent: parallelPlannerAgent,
};

async function runFullyLoadedApp() {
  const sessionService = new InMemorySessionService();

  const queries = [
    // simple sequential
    "Find me the best sushi in Palo Alto and then tell me how to get there from the Caltrain station.",

    // iterative loop
    "Plan me a day in San Franscisco with a museum and a nice dinner, but make sure the travel time between them is very short.",

    // parallel flow
    "Help me plan a trip to SF. I need one museum, one concert, and one great restaurant.",
  ];

  for (const q in queries) {
    console.log("processing query", q);
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
    console.log("chosen route is", chosenRoute);

    if (workerAgents[chosenRoute]) {
      const workerAgent = workerAgents[chosenRoute];
      const workerSession = await sessionService.createSession({
        appName: workerAgent.name,
        userId: "worker007",
      });
      await runAgentQuery(
        workerAgent,
        q,
        workerSession,
        "agent007",
        workerAgent.name,
        sessionService,
      );
    } else {
      console.log("Error unknown route selected", chosenRoute);
    }
  }
}

await runFullyLoadedApp();
