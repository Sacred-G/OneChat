# Running agents

Agents do nothing by themselves – you **run** them with the `Runner` class or the `run()` utility.

Simple run

```
import { Agent, run } from'@openai/agents';
constagent=newAgent({name:'Assistant',instructions:'You are a helpful assistant',});
constresult=awaitrun(agent,'Write a haiku about recursion in programming.',);console.log(result.finalOutput);
// Code within the code,// Functions calling themselves,// Infinite loop's dance.
```

When you don’t need a custom runner, you can also use the `run()` utility, which runs a singleton default `Runner` instance.

Alternatively, you can create your own runner instance:

Simple run

```
import { Agent, Runner } from'@openai/agents';
constagent=newAgent({name:'Assistant',instructions:'You are a helpful assistant',});
// You can pass custom configuration to the runnerconstrunner=newRunner();
constresult=awaitrunner.run(agent,'Write a haiku about recursion in programming.',);console.log(result.finalOutput);
// Code within the code,// Functions calling themselves,// Infinite loop's dance.
```

After running your agent, you will receive a [result](https://openai.github.io/openai-agents-js/guides/results) object that contains the final output and the full history of the run.

## The agent loop

When you use the run method in Runner, you pass in a starting agent and input. The input can either be a string (which is considered a user message), or a list of input items, which are the items in the OpenAI Responses API.

The runner then runs a loop:

1. Call the current agent’s model with the current input.
2. Inspect the LLM response.
   * **Final output** → return.
   * **Handoff** → switch to the new agent, keep the accumulated conversation history, go to 1.
   * **Tool calls** → execute tools, append their results to the conversation, go to 1.
3. Throw [`MaxTurnsExceededError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/maxturnsexceedederror) once `maxTurns` is reached.

Note

The rule for whether the LLM output is considered as a “final output” is that it produces text output with the desired type, and there are no tool calls.

### Runner lifecycle

Create a `Runner` when your app starts and reuse it across requests. The instance stores global configuration such as model provider and tracing options. Only create another `Runner` if you need a completely different setup. For simple scripts you can also call `run()` which uses a default runner internally.

## Run arguments

The input to the `run()` method is an initial agent to start the run on, input for the run and a set of options.

The input can either be a string (which is considered a user message), or a list of [input items](https://openai.github.io/openai-agents-js/openai/agents-core/type-aliases/agentinputitem), or a [`RunState`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/runstate) object in case you are building a [human-in-the-loop](https://openai.github.io/openai-agents-js/guides/human-in-the-loop) agent.

The additional options are:

| Option       | Default   | Description                                                                                                                                              |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stream`   | `false` | If `true` the call returns a `StreamedRunResult` and emits events as they arrive from the model.                                                     |
| `context`  | –        | Context object forwarded to every tool / guardrail / handoff. Learn more in the[context guide](https://openai.github.io/openai-agents-js/guides/context).   |
| `maxTurns` | `10`    | Safety limit – throws[`MaxTurnsExceededError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/maxturnsexceedederror) when reached. |
| `signal`   | –        | `AbortSignal` for cancellation.                                                                                                                        |

## Streaming

Streaming allows you to additionally receive streaming events as the LLM runs. Once the stream is started, the `StreamedRunResult` will contain the complete information about the run, including all the new outputs produces. You can iterate over the streaming events using a `for await` loop. Read more in the [streaming guide](https://openai.github.io/openai-agents-js/guides/streaming).

## Run config

If you are creating your own `Runner` instance, you can pass in a `RunConfig` object to configure the runner.

| Field                         | Type                    | Purpose                                                                                           |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `model`                     | `string \| Model`      | Force a specific model for**all** agents in the run.                                        |
| `modelProvider`             | `ModelProvider`       | Resolves model names – defaults to the OpenAI provider.                                          |
| `modelSettings`             | `ModelSettings`       | Global tuning parameters that override per‑agent settings.                                       |
| `handoffInputFilter`        | `HandoffInputFilter`  | Mutates input items when performing handoffs (if the handoff itself doesn’t already define one). |
| `inputGuardrails`           | `InputGuardrail[]`    | Guardrails applied to the*initial* user input.                                                  |
| `outputGuardrails`          | `OutputGuardrail[]`   | Guardrails applied to the*final* output.                                                        |
| `tracingDisabled`           | `boolean`             | Disable OpenAI Tracing completely.                                                                |
| `traceIncludeSensitiveData` | `boolean`             | Exclude LLM/tool inputs & outputs from traces while still emitting spans.                         |
| `workflowName`              | `string`              | Appears in the Traces dashboard – helps group related runs.                                      |
| `traceId` / `groupId`     | `string`              | Manually specify the trace or group ID instead of letting the SDK generate one.                   |
| `traceMetadata`             | `Record<string, any>` | Arbitrary metadata to attach to every span.                                                       |

## Conversations / chat threads

Each call to `runner.run()` (or `run()` utility) represents one **turn** in your application-level conversation. You choose how much of the `RunResult` you show the end‑user – sometimes only `finalOutput`, other times every generated item.

Example of carrying over the conversation history

```
import { Agent, run } from'@openai/agents';importtype { AgentInputItem } from'@openai/agents';
letthread:AgentInputItem[] = [];
constagent=newAgent({name:'Assistant',});
asyncfunctionuserSays(text:string) {constresult=awaitrun(agent,thread.concat({ role:'user', content:text }),);
thread=result.history; // Carry over history + newly generated itemsreturnresult.finalOutput;}
awaituserSays('What city is the Golden Gate Bridge in?');// -> "San Francisco"
awaituserSays('What state is it in?');// -> "California"
```

See [the chat example](https://github.com/openai/openai-agents-js/tree/main/examples/basic/chat.ts) for an interactive version.

### Server-managed conversations

You can let the OpenAI Responses API persist conversation history for you instead of sending your entire local transcript on every turn. This is useful when you are coordinating long conversations or multiple services. See the [Conversation state guide](https://platform.openai.com/docs/guides/conversation-state?api-mode=responses) for details.

OpenAI exposes two ways to reuse server-side state:

#### 1. `conversationId` for an entire conversation

You can create a conversation once using [Conversations API](https://platform.openai.com/docs/api-reference/conversations/create) and then reuse its ID for every turn. The SDK automatically includes only the newly generated items.

Reusing a server conversation

```
import { Agent, run } from'@openai/agents';import { OpenAI } from'openai';
constagent=newAgent({name:'Assistant',instructions:'Reply very concisely.',});
asyncfunctionmain() {// Create a server-managed conversation:constclient=newOpenAI();const { id: conversationId } =awaitclient.conversations.create({});
constfirst=awaitrun(agent, 'What city is the Golden Gate Bridge in?', {conversationId,});console.log(first.finalOutput);// -> "San Francisco"
constsecond=awaitrun(agent, 'What state is it in?', { conversationId });console.log(second.finalOutput);// -> "California"}
main().catch(console.error);
```

#### 2. `previousResponseId` to continue from the last turn

If you want to start only with Responses API anyway, you can chain each request using the ID returned from the previous response. This keeps the context alive across turns without creating a full conversation resource.

Chaining with previousResponseId

```
import { Agent, run } from'@openai/agents';
constagent=newAgent({name:'Assistant',instructions:'Reply very concisely.',});
asyncfunctionmain() {constfirst=awaitrun(agent, 'What city is the Golden Gate Bridge in?');console.log(first.finalOutput);// -> "San Francisco"
constpreviousResponseId=first.lastResponseId;constsecond=awaitrun(agent, 'What state is it in?', {previousResponseId,});console.log(second.finalOutput);// -> "California"}
main().catch(console.error);
```

## Exceptions

The SDK throws a small set of errors you can catch:

* [`MaxTurnsExceededError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/maxturnsexceedederror) – `maxTurns` reached.
* [`ModelBehaviorError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/modelbehaviorerror) – model produced invalid output (e.g. malformed JSON, unknown tool).
* [`InputGuardrailTripwireTriggered`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/inputguardrailtripwiretriggered) / [`OutputGuardrailTripwireTriggered`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/outputguardrailtripwiretriggered) – guardrail violations.
* [`GuardrailExecutionError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/guardrailexecutionerror) – guardrails failed to complete.
* [`ToolCallError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/toolcallerror) – any of function tool calls failed.
* [`UserError`](https://openai.github.io/openai-agents-js/openai/agents-core/classes/usererror) – any error thrown based on configuration or user input.

All extend the base `AgentsError` class, which could provide the `state` property to access the current run state.

Here is an example code that handles `GuardrailExecutionError`:

Guardrail execution error

```
import {Agent,run,GuardrailExecutionError,InputGuardrail,InputGuardrailTripwireTriggered,} from'@openai/agents';import { z } from'zod';
constguardrailAgent=newAgent({name:'Guardrail check',instructions:'Check if the user is asking you to do their math homework.',outputType:z.object({isMathHomework:z.boolean(),reasoning:z.string(),}),});
constunstableGuardrail:InputGuardrail= {name:'Math Homework Guardrail (unstable)',execute:async () => {thrownewError('Something is wrong!');},};
constfallbackGuardrail:InputGuardrail= {name:'Math Homework Guardrail (fallback)',execute:async ({ input, context }) => {constresult=awaitrun(guardrailAgent, input, { context });return {outputInfo:result.finalOutput,tripwireTriggered:result.finalOutput?.isMathHomework??false,};},};
constagent=newAgent({name:'Customer support agent',instructions:'You are a customer support agent. You help customers with their questions.',inputGuardrails: [unstableGuardrail],});
asyncfunctionmain() {try {constinput='Hello, can you help me solve for x: 2x + 3 = 11?';constresult=awaitrun(agent, input);console.log(result.finalOutput);} catch (e) {if (einstanceofGuardrailExecutionError) {console.error(`Guardrail execution failed: ${e}`);// If you want to retry the execution with different settings,// you can reuse the runner's latest state this way:if (e.state) {try {agent.inputGuardrails= [fallbackGuardrail]; // fallbackconstresult=awaitrun(agent, e.state);console.log(result.finalOutput);} catch (ee) {if (eeinstanceofInputGuardrailTripwireTriggered) {console.log('Math homework guardrail tripped');}}}} else {throwe;}}}
main().catch(console.error);
```

When you run the above example, you will see the following output:

```
Guardrail execution failed: Error: Input guardrail failed to complete: Error: Something is wrong!Math homework guardrail tripped
```
