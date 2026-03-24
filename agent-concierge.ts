import {
  AgentTool,
  FunctionTool,
  InMemorySessionService,
  LlmAgent,
  ToolContext,
} from "@google/adk";
import z from "zod";
import { runAgentQuery } from "./helper.ts";

const dbAgent = new LlmAgent({
  name: "db_agent",
  model: "gemini-2.5-flash",
  instruction:
    "You are a database agent. When asked for data, return this mock JSON object: {'status': 'success', 'data': [{'name': 'The Grand Hotel', 'rating': 5, 'reviews': 450}, {'name': 'Seaside Inn', 'rating': 4, 'reviews': 620}]}",
});

const foodCriticAgent = new LlmAgent({
  name: "food_critic_agent",
  model: "gemini-2.5-flash",
  instruction:
    "You are a snobby but brilliant food critic. You ONLY respond with a single, witty restaurant suggestion near the provided location.",
});

const conciergeAgent = new LlmAgent({
  name: "concierge_agent",
  model: "gemini-2.5-flash",
  instruction:
    "You are a five-star hotel concierge. If the user asks for a restaurant recommendation, you MUST use the `food_critic_agent` tool. Present the opinion to the user politely.",
  tools: [new AgentTool({ agent: foodCriticAgent })],
});

async function callDbAgent(question: string, toolContext?: ToolContext) {
  if (!toolContext) {
    throw Error("tool context not injected");
  }

  console.log("called db agent");
  const agentTool = new AgentTool({ agent: dbAgent });
  const dbAgentOutput = await agentTool.runAsync({
    args: { request: question },
    toolContext: toolContext,
  });
  toolContext.state.set("retrievedData", dbAgentOutput);
  return dbAgentOutput;
}

async function callConciergeAgent(question: string, toolContext?: ToolContext) {
  if (!toolContext) {
    throw Error("tool context not injected");
  }
  console.log("called concierge agent");
  const inputData = toolContext.state.get("retrievedData", "No data found.");

  const questionWithData = `
    Context: The database returned the following data: ${inputData}

    User's Request: ${question}
    `;
  const agentTool = new AgentTool({ agent: conciergeAgent });
  const conciergeOutput = await agentTool.runAsync({
    args: { request: questionWithData },
    toolContext: toolContext,
  });
  return conciergeOutput;
}

const conciergeAgentCallerTool = new FunctionTool({
  name: "callConciergeAgent",
  description:
    "After getting data with call_db_agent, use this tool to get travel advice, opinions, or recommendations.",
  parameters: z.object({
    question: z.string().describe(`User query`),
  }),
  execute: async ({ question }, toolContext) => {
    return await callConciergeAgent(question, toolContext);
  },
});

const dbAgentCallerTool = new FunctionTool({
  name: "callDbAgent",
  description:
    "Use this tool FIRST to connect to the database and retrieve a list of places, like hotels or landmarks.",
  parameters: z.object({
    question: z.string().describe("User query"),
  }),
  execute: async ({ question }, toolContext) => {
    return await callDbAgent(question, toolContext);
  },
});

export const tripDataConciergeAgent = new LlmAgent({
  name: "trip_data_concierge_agent",
  model: "gemini-2.5-flash",
  description:
    "Top-level agent that queries a database for travel data, then calls a concierge agent for recommendations",
  tools: [dbAgentCallerTool, conciergeAgentCallerTool],
  instruction: `
    You are a master travel planner who uses data to make recommendations. 

    1. **Always start with the 'call_db_agent' tool** to fetch a list of places (like hotels) that match the user's criteria.

    2. After you have the data, **use the 'call_concierge_agent' tool** to answer any follow-up questions for recommendatinos, opinions, or advice related to the data you just found.
    `,
});

async function main() {
  const appName = "my_adk_adventure_2a";
  const userId = "agent007s";
  const sessionService = new InMemorySessionService();
  const conciergeSession = await sessionService.createSession({
    appName,
    userId,
  });
  const query =
    "Find the top-rated hotels in San Francisco from the database, then suggest a dinner spot near the one with the most reviews.";
  console.log("user query", query);
  await runAgentQuery(
    tripDataConciergeAgent,
    query,
    conciergeSession,
    userId,
    appName,
    sessionService,
  );
}

// await main();
