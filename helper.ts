import { Runner, stringifyContent } from "@google/adk";
import type { BaseAgent, BaseSessionService, Session } from "@google/adk";
import { createUserContent } from "@google/genai";

export async function runAgentQuery(
  agent: BaseAgent,
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
      res.push(e);
    }
  } catch (error: any) {
    const msg = error?.message ?? String(error);

    console.error("errored while running agent query", msg);
  }

  const finalResponse = res[res.length - 1];
  if (finalResponse?.content?.parts?.length) {
    console.log(stringifyContent(finalResponse));
  }
  if (!finalResponse) {
    console.warn("no response from agent");
    return "";
  }

  return stringifyContent(finalResponse);
}
