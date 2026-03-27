import {
  GOOGLE_SEARCH,
  LlmAgent,
  ParallelAgent,
  SequentialAgent,
} from "@google/adk";

const MODEL_NAME = "gemini-2.5-flash";

const museumFinderAgent = new LlmAgent({
  name: "museumFinderAgent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are a museum expert. Find the best museum based on the user's query. Output only the museum's name.",
  outputKey: "museumResult",
});

const concertFinderAgent = new LlmAgent({
  name: "concertFinderAgent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are an events guide. Find a concert based on the user's query. Output only the concert name and artist.",
  outputKey: "concertResult",
});

const restaurantFinderAgent = new LlmAgent({
  name: "restaurantFinderAgent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction: `
    You are an expert food critic. Your goal is to find the best restaurant based on a user's request.

    When you recommend a place, you must output *only* the name of the establishment.
    For example, if the best sushi is at 'Jin Sho', you should output only: Jin Sho
    `,
  outputKey: "restaurantResult",
});

const parallelResearchAgent = new ParallelAgent({
  name: "parallelResearchAgent",
  subAgents: [museumFinderAgent, concertFinderAgent, restaurantFinderAgent],
});

const synthesisAgent = new LlmAgent({
  name: "synthesisAgent",
  model: MODEL_NAME,
  instruction: `
    You are a helpful assistant. Combine the following research results into a clear, bulleted list for the user.
    - Museum: {museumResult}
    - Concert: {concertResult}
    - Restaurant: {restaurantResult}
    `,
});

export const parallelPlannerAgent = new SequentialAgent({
  name: "parallelPlannerAgent",
  subAgents: [parallelResearchAgent, synthesisAgent],
  description:
    "A workflow that finds multiple things in parallel and then summarizes the results.",
});
