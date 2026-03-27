# Typescript Intro to Google ADK

This is my Typescript walkthrough of the [Codelab ADK Crash Course - From Beginner to Expert](https://codelabs.developers.google.com/onramp/instructions?hl=en#0).

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Project Structure](#project-structure)
- [Original Resources](#original-resources)
- [Takeaways](#takeaways)
- [Future Exploration](#future-exploration)

## Introduction

I went through the exercise of hand code translating the Codelab ADK crash course from Python to Typescript. I made the decision to stay mostly true to the interactive structure of the codelab, so each `agent*.ts` is executable (see below on how if not sure) by itself. Additionally, this means the code reads more Pythonic than some may like a Typescript walkthrough to be....

The `agent-*.ts` files are basic tool use and memory walkthroughs. The `agents-*.ts` files show various composition patterns: manually, and using ADK builtin Parallel, Sequential, and Goal Oriented.

## Prerequisites

- Node.js + npm
- Google Gemini API Key put in a .env or export it as `GEMINI_API_KEY=API_KEY` in terminal

## Quickstart

- Meet prerequisites
- `npm install`
- Run any agent with either `npm ts-node ${AGENT_FILE}.ts` or `npm adk run ${AGENT_FILE}.ts`

## Project Structure

adk-adventure/
├── helper.ts # Shared runner utility
├── agent-_.ts # Individual agents
├── agents-_.ts # Multi agent systems
├── package.json
└── tsconfig.json

## Original Resources

[Crash Course - ADK Beginner to Expert](https://codelabs.developers.google.com/onramp/instructions?hl=en#0)
[ADK Tools and Memory Colab](https://colab.research.google.com/drive/1zzTZ8t6aYFbsyrWpGAtmirNdA9R-bbWz#scrollTo=bIs87iFCm0Vg) in Python
[ADK Multi Agents](https://colab.research.google.com/drive/10aC9vrBD8y_UlR9CcmuXuvBBPnkZ8i7M?usp=sharing#scrollTo=T8ZWDtZgnL_i) in Python

## Takeaways

- ADK is pretty unstable for Typescript, they don't have a major version out yet and it is being iterated on quickly
- The docs for Typescript aren't very good. There's lots of go examples in the typescript sections
- The Python code translates pretty well. AI can also translate it pretty well (but then you miss out on skill formation for yourself).
- I found these [samples](https://github.com/google/adk-docs/tree/main/examples/typescript/snippets) more helpful than anything on the adk website.
- I'm sold on needing the correct abstraction level to understand LLM based applications (agents). I'm not sold on ADK being that correct level for Typescript based LLM apps/agents. It is convenient to have easy eval generation
- Cutting through the marketing noise, agents as LLMs + Tools + Memory (Context) are a straightforward idea. ADK shows this too. It's not fully opinionated on the workflow automation which is great, as it seems agents in this sense could be mixed with deterministic work to make a predictable workflow instead of hoping a carefully tuned prompt + memory context models a deterministic workflow.
- The examples lean heavily on giving LLMs a persona and a few shot example of what they're meant to do. It'd be very useful for the ADK web version to have a prompt evaluator itself, or some mechanism to test a prompt. It's still a bit guess and check for prompting, I don't think I've seen a great product treating prompts as first class objects yet.

## Future Exploration

- I saw someone ported ADK to typescript about a year ago: https://github.com/waldzellai/adk-typescript. This could be a good project to understand the orchestration layer better.
- Make multi modal agents with the framework use the built in evals capability to check this against using a team of specialists approach that transcribes then operates on text
- Start building useful agents.... or try figuring if agent skills are supported
