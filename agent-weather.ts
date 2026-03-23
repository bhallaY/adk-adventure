import { FunctionTool, InMemorySessionService, LlmAgent } from "@google/adk";
import { z } from "zod";
import { runAgentQuery } from "./helper.ts";

// hardcode example lat/long to avoid geocoding api
const LOCATION_COORDINATES: Record<string, string> = {
  sunnyvale: "37.3688,-122.0363",
  "san francisco": "37.7749,-122.4194",
  "lake tahoe": "39.0968,-120.0324",
};

async function getLiveWeatherForecastImpl(loc: string) {
  const coords = LOCATION_COORDINATES[loc.toLowerCase()];
  if (!coords) {
    return { status: "error", message: `I don't have coordinates for ${loc}.` };
  }

  try {
    const points_url = `https://api.weather.gov/points/${coords}`;
    const options = { headers: { "User-Agent": "ADK Example Agent 007" } };
    const pointsRes = await fetch(points_url, options);
    if (!pointsRes.ok) {
      throw new Error(
        `error connecting to weather api, error code: ${pointsRes}`,
      );
    }
    const res = await pointsRes.json();
    const forecastUrl = res["properties"]["forecast"];

    const forecastRes = await fetch(forecastUrl, options);
    if (!forecastRes.ok) {
      throw new Error(
        `error getting actual forecast, error code: ${pointsRes}`,
      );
    }
    const forecast = await forecastRes.json();
    const currPeriod = forecast["properties"]["periods"][0];
    return {
      status: "success",
      temperature: `${currPeriod["temperature"]}°${currPeriod["temperatureUnit"]}`,
      forecast: currPeriod["detailedForecast"],
    };
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        status: "error",
        message: `API Request failed: ${error}`,
      };
    }
  }
}

const getLiveWeatherForecast = new FunctionTool({
  name: "getLiveWeatherForecast",
  description:
    "Gets the current, real-time weather forecast for a specified location in the US.",
  parameters: z.object({
    loc: z.string().describe(`The city name, e.g., "San Francisco"`),
  }),
  execute: async ({ loc }) => {
    return await getLiveWeatherForecastImpl(loc);
  },
});

export const weatherAgent = new LlmAgent({
  name: "weather_aware_planner",
  model: "gemini-2.5-flash",
  description:
    "A trip planner that checks the real-time weather before making suggestions.",
  instruction:
    "You are a cautious trip planner. Before suggesting any outdoor activities, you MUST use the `getLiveWeatherForecast` tool to check conditions. Incorporate the live weather details into your recommendation.",
  tools: [getLiveWeatherForecast],
});

async function main() {
  const appName = "my_adk_adventure_continued";
  const userId = "agent007";
  const sessionService = new InMemorySessionService();
  const weatherSession = await sessionService.createSession({
    appName,
    userId,
  });
  const query = "I want to go hiking near Lake Tahoe, what's the weather like?";
  console.log("user query:", query);
  await runAgentQuery(
    weatherAgent,
    query,
    weatherSession,
    userId,
    appName,
    sessionService,
  );
}

await main();
