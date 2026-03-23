import { LlmAgent, Runner, stringifyContent } from "@google/adk";
import type { BaseSessionService, Session } from "@google/adk";
import { createUserContent } from "@google/genai";

export async function runAgentQuery(
  agent: LlmAgent,
  query: string,
  session: Session,
  userId: string,
  appName: string,
  sessionService: BaseSessionService,
  //   isRouter: boolean = false,
) {
  const runner = new Runner({
    agent: agent,
    appName: appName,
    sessionService: sessionService,
  });

  let res = [];
  try {
    for await (const e of runner.runAsync({
      userId: userId,
      sessionId: session.id,
      newMessage: createUserContent(query),
    })) {
      //   if (!isRouter) {
      //     console.log("event!:", e);
      //   }
      res.push(e);
    }
  } catch (error) {
    console.error("errored while running agent query", error);
  }

  //   if (!isRouter) {
  //     console.log("\n", "Final Response:", res);
  //   }

  const finalResponse = res[res.length - 1];
  if (finalResponse?.content?.parts?.length) {
    console.log(stringifyContent(finalResponse));
  }

  return res;
}
