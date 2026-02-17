# Agents

Agents are the main building‑block of the OpenAI Agents SDK. An **Agent** is a Large Language Model (LLM) that has been configured with:

* **Instructions** – the system prompt that tells the model *who it is* and  *how it should respond* .
* **Model** – which OpenAI model to call, plus any optional model tuning parameters.
* **Tools** – a list of functions or APIs the LLM can invoke to accomplish a task.

Basic Agent definition

```
import { Agent } from'@openai/agents';
constagent=newAgent({name:'Haiku Agent',instructions:'Always respond in haiku form.',model:'gpt-5-nano', // optional – falls back to the default model});
```

The rest of this page walks through every Agent feature in more detail.

---

## Basic configuration

The `Agent` constructor takes a single configuration object. The most commonly‑used properties are shown below.

| Property          | Required | Description                                                                                                                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`          | yes      | A short human‑readable identifier.                                                                                                                    |
| `instructions`  | yes      | System prompt (string**or** function – see [Dynamic instructions](https://openai.github.io/openai-agents-js/guides/agents/#dynamic-instructions)). |
| `model`         | no       | Model name**or** a custom [`Model`](https://openai.github.io/openai-agents-js/openai/agents/interfaces/model/) implementation.                    |
| `modelSettings` | no       | Tuning parameters (temperature, top_p, etc.). If the properties you need aren’t at the top level, you can include them under `providerData`.        |
| `tools`         | no       | Array of[`Tool`](https://openai.github.io/openai-agents-js/openai/agents/type-aliases/tool/) instances the model can call.                              |

Agent with tools

```
import { Agent, tool } from'@openai/agents';import { z } from'zod';
constgetWeather=tool({name:'get_weather',description:'Return the weather for a given city.',parameters:z.object({ city:z.string() }),asyncexecute({ city }) {return`The weather in ${city} is sunny.`;},});
constagent=newAgent({name:'Weather bot',instructions:'You are a helpful weather bot.',model:'gpt-4.1',tools: [getWeather],});
```

---

## Context

Agents are **generic on their context type** – i.e. `Agent<TContext, TOutput>`. The *context* is a dependency‑injection object that you create and pass to `Runner.run()`. It is forwarded to every tool, guardrail, handoff, etc. and is useful for storing state or providing shared services (database connections, user metadata, feature flags, …).

Agent with context

```
import { Agent } from'@openai/agents';
interfacePurchase {id:string;uid:string;deliveryStatus:string;}interfaceUserContext {uid:string;isProUser:boolean;
// this function can be used within toolsfetchPurchases():Promise<Purchase[]>;}
constagent=newAgent<UserContext>({name:'Personal shopper',instructions:'Recommend products the user will love.',});
// Laterimport { run } from'@openai/agents';
constresult=awaitrun(agent, 'Find me a new pair of running shoes', {context: { uid:'abc', isProUser:true, fetchPurchases:async () => [] },});
```

---

## Output types

By default, an Agent returns **plain text** (`string`). If you want the model to return a structured object you can specify the `outputType` property. The SDK accepts:

1. A [Zod](https://github.com/colinhacks/zod) schema (`z.object({...})`).
2. Any JSON‑schema‑compatible object.

Structured output with Zod

```
import { Agent } from'@openai/agents';import { z } from'zod';
constCalendarEvent=z.object({name:z.string(),date:z.string(),participants:z.array(z.string()),});
constextractor=newAgent({name:'Calendar extractor',instructions:'Extract calendar events from the supplied text.',outputType:CalendarEvent,});
```

When `outputType` is provided, the SDK automatically uses [structured outputs](https://platform.openai.com/docs/guides/structured-outputs) instead of plain text.

---

## Multi-agent system design patterns

There are many ways to compose agents together. Two patterns we regularly see in production apps are:

1. **Manager (agents as tools)** – a central agent owns the conversation and invokes specialized agents that are exposed as tools.
2. **Handoffs** – the initial agent delegates the entire conversation to a specialist once it has identified the user’s request.

These approaches are complementary. Managers give you a single place to enforce guardrails or rate limits, while handoffs let each agent focus on a single task without retaining control of the conversation.

### Manager (agents as tools)

In this pattern the manager never hands over control—the LLM uses the tools and the manager summarizes the final answer. Read more in the [tools guide](https://openai.github.io/openai-agents-js/guides/tools#agents-as-tools).

Agents as tools

```
import { Agent } from'@openai/agents';
constbookingAgent=newAgent({name:'Booking expert',instructions:'Answer booking questions and modify reservations.',});
constrefundAgent=newAgent({name:'Refund expert',instructions:'Help customers process refunds and credits.',});
constcustomerFacingAgent=newAgent({name:'Customer-facing agent',instructions:'Talk to the user directly. When they need booking or refund help, call the matching tool.',tools: [bookingAgent.asTool({toolName:'booking_expert',toolDescription:'Handles booking questions and requests.',}),refundAgent.asTool({toolName:'refund_expert',toolDescription:'Handles refund questions and requests.',}),],});
```

### Handoffs

With handoffs the triage agent routes requests, but once a handoff occurs the specialist agent owns the conversation until it produces a final output. This keeps prompts short and lets you reason about each agent independently. Learn more in the [handoffs guide](https://openai.github.io/openai-agents-js/guides/handoffs).

Agent with handoffs

```
import { Agent } from'@openai/agents';
constbookingAgent=newAgent({name:'Booking Agent',instructions:'Help users with booking requests.',});
constrefundAgent=newAgent({name:'Refund Agent',instructions:'Process refund requests politely and efficiently.',});
// Use Agent.create method to ensure the finalOutput type considers handoffsconsttriageAgent=Agent.create({name:'Triage Agent',instructions:`Help the user with their questions.If the user asks about booking, hand off to the booking agent.If the user asks about refunds, hand off to the refund agent.`.trimStart(),handoffs: [bookingAgent, refundAgent],});
```

---

## Dynamic instructions

`instructions` can be a **function** instead of a string. The function receives the current `RunContext` and the Agent instance and can return a string *or* a `Promise<string>`.

Agent with dynamic instructions

```
import { Agent, RunContext } from'@openai/agents';
interfaceUserContext {name:string;}
functionbuildInstructions(runContext:RunContext<UserContext>) {return`The user's name is ${runContext.context.name}. Be extra friendly!`;}
constagent=newAgent<UserContext>({name:'Personalized helper',instructions:buildInstructions,});
```

Both synchronous and `async` functions are supported.

---

## Lifecycle hooks

For advanced use‑cases you can observe the Agent lifecycle by listening on events. To learn what’s available, refer to agent hook event names listed [here](https://github.com/openai/openai-agents-js/blob/main/packages/agents-core/src/lifecycle.ts).

Agent with lifecycle hooks

```
import { Agent } from'@openai/agents';
constagent=newAgent({name:'Verbose agent',instructions:'Explain things thoroughly.',});
agent.on('agent_start', (ctx, agent) => {console.log(`[${agent.name}] started`);});agent.on('agent_end', (ctx, output) => {console.log(`[agent] produced:`, output);});
```

---

## Guardrails

Guardrails allow you to validate or transform user input and agent output. They are configured via the `inputGuardrails` and `outputGuardrails` arrays. See the [guardrails guide](https://openai.github.io/openai-agents-js/guides/guardrails) for details.

---

## Cloning / copying agents

Need a slightly modified version of an existing agent? Use the `clone()` method, which returns an entirely new `Agent` instance.

Cloning Agents

```
import { Agent } from'@openai/agents';
constpirateAgent=newAgent({name:'Pirate',instructions:'Respond like a pirate – lots of “Arrr!”',model:'gpt-5-mini',});
constrobotAgent=pirateAgent.clone({name:'Robot',instructions:'Respond like a robot – be precise and factual.',});
```

---

## Forcing tool use

Supplying tools doesn’t guarantee the LLM will call one. You can **force** tool use with `modelSettings.tool_choice`:

1. `'auto'` (default) – the LLM decides whether to use a tool.
2. `'required'` – the LLM *must* call a tool (it can choose which one).
3. `'none'` – the LLM must **not** call a tool.
4. A specific tool name, e.g. `'calculator'` – the LLM must call that particular tool.

Forcing tool use

```
import { Agent, tool } from'@openai/agents';import { z } from'zod';
constcalculatorTool=tool({name:'Calculator',description:'Use this tool to answer questions about math problems.',parameters:z.object({ question:z.string() }),execute:async (input) => {thrownewError('TODO: implement this');},});
constagent=newAgent({name:'Strict tool user',instructions:'Always answer using the calculator tool.',tools: [calculatorTool],modelSettings: { toolChoice:'auto' },});
```

### Preventing infinite loops

After a tool call the SDK automatically resets `tool_choice` back to `'auto'`. This prevents the model from entering an infinite loop where it repeatedly tries to call the tool. You can override this behavior via the `resetToolChoice` flag or by configuring `toolUseBehavior`:

* `'run_llm_again'` (default) – run the LLM again with the tool result.
* `'stop_on_first_tool'` – treat the first tool result as the final answer.
* `{ stopAtToolNames: ['my_tool'] }` – stop when any of the listed tools is called.
* `(context, toolResults) => ...` – custom function returning whether the run should finish.

```
constagent=newAgent({...,toolUseBehavior:'stop_on_first_tool',});
```
