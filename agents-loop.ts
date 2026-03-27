import {
  FunctionTool,
  GOOGLE_SEARCH,
  LlmAgent,
  LoopAgent,
  SequentialAgent,
  ToolContext,
} from "@google/adk";

const COMPLETION_PHRASE = "The plan is feasible and meets all constraints.";
const MODEL_NAME = "gemini-2.5-flash";

function exitLoopImpl(toolContext?: ToolContext) {
  if (!toolContext) {
    return {};
  }
  console.log(`[Tool Call] exitLoop triggered by ${toolContext?.agentName}`);
  toolContext.actions.escalate = true;
  return {};
}

const exitLoop = new FunctionTool({
  name: "exitLoop",
  description:
    "Call this function ONLY when the plan is approved, signaling the loop should end.",
  execute: async ({}, toolContext) => {
    return await exitLoopImpl(toolContext);
  },
});

const plannerAgent = new LlmAgent({
  name: "planner_agent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction:
    "You are a trip planner. Based on the user's request, propose a single activity and a single restaurant. Output only the names, like 'Activity: Exploratorium, Restaurant: La Mar'.",
  outputKey: "current_plan",
});

const criticAgent = new LlmAgent({
  name: "critic_agent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH],
  instruction: `
    You are a logistics expert. Your job is to critique a travel plan. The user has a strict constraint: total travel time must be short.
    Current Plan: {{current_plan}}
    Use your tools to check the travel time between the two locations.
    IF the travel time is over 45 minutes, provide a critique, like: 'This plan is inefficient. Find a restaurant closer to the activity.'
    ELSE, respond with the exact phrase: ${COMPLETION_PHRASE}
    `,
  outputKey: "criticism",
});

const refinerAgent = new LlmAgent({
  name: "refiner_agent",
  model: MODEL_NAME,
  tools: [GOOGLE_SEARCH, exitLoop],
  instruction: `
  You are a trip planner, refining a plan based on criticism.
  Original Request: {{session.query}}
  Critique: {{criticism}}
  IF the critique is '${COMPLETION_PHRASE}', you MUST call the 'exitLoop' tool.
  ELSE, generate a NEW plan that addresses the critique. Output only the new plan names, like: 'Activity: de Young Museum, Restaurant: Nopa'.
  `,
  outputKey: "current_plan",
});

const refinementLoop = new LoopAgent({
  name: "refinement_loop",
  subAgents: [criticAgent, refinerAgent],
  maxIterations: 3,
});

export const iterativePlannerAgent = new SequentialAgent({
  name: "iterativePlannerAgent",
  subAgents: [plannerAgent, refinementLoop],
  description:
    "A workflow that iteratively plans and refines a trip to meet constraints.",
});
