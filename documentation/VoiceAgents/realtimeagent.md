# RealtimeAgent

A specialized agent instance that is meant to be used within a `RealtimeSession` to build voice agents. Due to the nature of this agent, some configuration options are not supported that are supported by regular `Agent` instances. For example:

* `model` choice is not supported as all RealtimeAgents will be handled by the same model within a `RealtimeSession`
* `modelSettings` is not supported as all RealtimeAgents will be handled by the same model within a `RealtimeSession`
* `outputType` is not supported as RealtimeAgents do not support structured outputs
* `toolUseBehavior` is not supported as all RealtimeAgents will be handled by the same model within a `RealtimeSession`
* `voice` can be configured on an `Agent` level however it cannot be changed after the first agent within a `RealtimeSession` spoke

## Example

```
constagent=newRealtimeAgent({name:'my-agent',instructions:'You are a helpful assistant that can answer questions and help with tasks.',})
constsession=newRealtimeSession(agent);
```

## Extends

* `Agent`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `TextOutput`>

## Type Parameters

| Type Parameter | Default type       |
| -------------- | ------------------ |
| `TContext`   | `UnknownContext` |

## Constructors

### Constructor

```
newRealtimeAgent<TContext>(config): RealtimeAgent<TContext>;
```

#### Parameters

| Parameter  | Type                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config` | [`RealtimeAgentConfiguration`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimeagentconfiguration/)<`TContext`> |

#### Returns

`RealtimeAgent`<`TContext`>

#### Overrides

```
Agent<RealtimeContextData<TContext>,TextOutput>.constructor
```

## Properties

### handoffDescription

```
handoffDescription: string;
```

A description of the agent. This is used when the agent is used as a handoff, so that an LLM knows what it does and when to invoke it.

#### Inherited from

```
Agent.handoffDescription
```

---

### handoffs

```
handoffs: (Handoff<any, "text">|Agent<any, "text">)[];
```

Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs, and the agent can choose to delegate to them if relevant. Allows for separation of concerns and modularity.

#### Inherited from

```
Agent.handoffs
```

---

### inputGuardrails

```
inputGuardrails: InputGuardrail[];
```

A list of checks that run in parallel to the agent by default; set `runInParallel` to false to block LLM/tool calls until the guardrail completes. Runs only if the agent is the first agent in the chain.

#### Inherited from

```
Agent.inputGuardrails
```

---

### instructions

```
instructions: string| (runContext, agent) =>string|Promise<string>;
```

The instructions for the agent. Will be used as the “system prompt” when this agent is invoked. Describes what the agent should do, and how it responds.

Can either be a string, or a function that dynamically generates instructions for the agent. If you provide a function, it will be called with the context and the agent instance. It must return a string.

#### Inherited from

```
Agent.instructions
```

---

### mcpServers

```
mcpServers: MCPServer[];
```

A list of [Model Context Protocol](https://modelcontextprotocol.io/) servers the agent can use. Every time the agent runs, it will include tools from these servers in the list of available tools.

NOTE: You are expected to manage the lifecycle of these servers. Specifically, you must call `server.connect()` before passing it to the agent, and `server.cleanup()` when the server is no longer needed.

#### Inherited from

```
Agent.mcpServers
```

---

### model

```
model: string|Model;
```

The model implementation to use when invoking the LLM.

By default, if not set, the agent will use the default model returned by getDefaultModel (currently “gpt-4.1”).

#### Inherited from

```
Agent.model
```

---

### modelSettings

```
modelSettings: ModelSettings;
```

Configures model-specific tuning parameters (e.g. temperature, top_p, etc.)

#### Inherited from

```
Agent.modelSettings
```

---

### name

```
name: string;
```

#### Inherited from

```
Agent.name
```

---

### outputGuardrails

```
outputGuardrails: OutputGuardrail<AgentOutputType<unknown>>[];
```

A list of checks that run on the final output of the agent, after generating a response. Runs only if the agent produces a final output.

#### Inherited from

```
Agent.outputGuardrails
```

---

### outputType

```
outputType: "text";
```

The type of the output object. If not provided, the output will be a string.

#### Inherited from

```
Agent.outputType
```

---

### prompt?

```
optional prompt: Prompt| (runContext, agent) =>Prompt|Promise<Prompt>;
```

The prompt template to use for the agent (OpenAI Responses API only).

Can either be a prompt template object, or a function that returns a prompt template object. If a function is provided, it will be called with the run context and the agent instance. It must return a prompt template object.

#### Inherited from

```
Agent.prompt
```

---

### resetToolChoice

```
resetToolChoice: boolean;
```

Whether to reset the tool choice to the default value after a tool has been called. Defaults to `true`. This ensures that the agent doesn’t enter an infinite loop of tool usage.

#### Inherited from

```
Agent.resetToolChoice
```

---

### tools

```
tools: Tool<RealtimeContextData<TContext>>[];
```

A list of tools the agent can use.

#### Inherited from

```
Agent.tools
```

---

### toolUseBehavior

```
toolUseBehavior: ToolUseBehavior;
```

This lets you configure how tool use is handled.

* run_llm_again: The default behavior. Tools are run, and then the LLM receives the results and gets to respond.
* stop_on_first_tool: The output of the first tool call is used as the final output. This means that the LLM does not process the result of the tool call.
* A list of tool names: The agent will stop running if any of the tools in the list are called. The final output will be the output of the first matching tool call. The LLM does not process the result of the tool call.
* A function: if you pass a function, it will be called with the run context and the list of tool results. It must return a `ToolsToFinalOutputResult`, which determines whether the tool call resulted in a final output.

NOTE: This configuration is specific to `FunctionTools`. Hosted tools, such as file search, web search, etc. are always processed by the LLM

#### Inherited from

```
Agent.toolUseBehavior
```

---

### voice?

```
readonlyoptional voice: string;
```

The voice intended to be used by the agent. If another agent already spoke during the RealtimeSession, changing the voice during a handoff will fail.

---

### DEFAULT_MODEL_PLACEHOLDER

```
static DEFAULT_MODEL_PLACEHOLDER: string;
```

#### Inherited from

```
Agent.DEFAULT_MODEL_PLACEHOLDER
```

## Accessors

### outputSchemaName

#### Get Signature

```
getoutputSchemaName(): string;
```

Output schema name.

##### Returns

`string`

#### Inherited from

```
Agent.outputSchemaName
```

## Methods

### asTool()

```
asTool<TAgent>(this, options): AgentTool<RealtimeContextData<TContext>, TAgent>;
```

Transform this agent into a tool, callable by other agents.

This is different from handoffs in two ways:

1. In handoffs, the new agent receives the conversation history. In this tool, the new agent receives generated input.
2. In handoffs, the new agent takes over the conversation. In this tool, the new agent is called as a tool, and the conversation is continued by the original agent.

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                              | Default type                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TAgent` *extends* `Agent`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`> | `Agent`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`> |

#### Parameters

| Parameter                          | Type                                                                                                                                                                                                                                                                                                                   | Description                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `this`                           | `TAgent`                                                                                                                                                                                                                                                                                                             | ‐                                                                                        |
| `options`                        | {`customOutputExtractor?`: (`output`) => `string`                                                                                                                                                                                                                                                                | `Promise`<`string`>; `isEnabled?`: `boolean`                                      |
| `options.customOutputExtractor?` | (`output`) => `string`                                                                                                                                                                                                                                                                                             | `Promise`<`string`>                                                                   |
| `options.isEnabled?`             | `boolean`                                                                                                                                                                                                                                                                                                            | (`args`) => `boolean`                                                                 |
| `options.needsApproval?`         |                                                                                                                                                                                                                                                                                                                        | `boolean`                                                                               |
| `options.onStream?`              | (`event`) => `void`                                                                                                                                                                                                                                                                                                | `Promise`<`void`>                                                                     |
| `options.runConfig?`             | `Partial`<`RunConfig`>                                                                                                                                                                                                                                                                                             | Run configuration for initializing the internal agent runner.                             |
| `options.runOptions?`            | `AgentToolRunOptions`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)> | Additional run options for the agent (as tool) execution.                                 |
| `options.toolDescription?`       | `string`                                                                                                                                                                                                                                                                                                             | The description of the tool, which should indicate what the tool does and when to use it. |
| `options.toolName?`              | `string`                                                                                                                                                                                                                                                                                                             | The name of the tool. If not provided, the name of the agent will be used.                |

#### Returns

`AgentTool`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `TAgent`>

A tool that runs the agent and returns the output text.

#### Inherited from

```
Agent.asTool
```

---

### clone()

```
clone(config): Agent<RealtimeContextData<TContext>, "text">;
```

Makes a copy of the agent, with the given arguments changed. For example, you could do:

```
const newAgent = agent.clone({ instructions: 'New instructions' })
```

#### Parameters

| Parameter  | Type                                                           | Description                        |
| ---------- | -------------------------------------------------------------- | ---------------------------------- |
| `config` | `Partial`<`AgentConfiguration`<`TContext`, `TOutput`>> | A partial configuration to change. |

#### Returns

`Agent`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`>

A new agent with the given changes.

#### Inherited from

```
Agent.clone
```

---

### emit()

```
emit<K>(type, ...args): boolean;
```

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof `AgentHookEvents`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`> |

#### Parameters

| Parameter  | Type                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | `K`                                                                                                                                                                                                                                                                                                                                 |
| …`args` | `AgentHookEvents`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`>[`K`] |

#### Returns

`boolean`

#### Inherited from

```
Agent.emit
```

---

### getAllTools()

```
getAllTools(runContext): Promise<Tool<RealtimeContextData<TContext>>[]>;
```

ALl agent tools, including the MCPl and function tools.

#### Parameters

| Parameter      | Type                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runContext` | `RunContext`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)> |

#### Returns

`Promise`[`Tool`&lt;[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%60Tool%60%3C%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)>[]>

all configured tools

#### Inherited from

```
Agent.getAllTools
```

---

### getEnabledHandoffs()

```
getEnabledHandoffs(runContext): Promise<Handoff<any, any>[]>;
```

Returns the handoffs that should be exposed to the model for the current run.

Handoffs that provide an `isEnabled` function returning `false` are omitted.

#### Parameters

| Parameter      | Type                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runContext` | `RunContext`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)> |

#### Returns

`Promise`<`Handoff`<`any`, `any`>[]>

#### Inherited from

```
Agent.getEnabledHandoffs
```

---

### getMcpTools()

```
getMcpTools(runContext): Promise<Tool<RealtimeContextData<TContext>>[]>;
```

Fetches the available tools from the MCP servers.

#### Parameters

| Parameter      | Type                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runContext` | `RunContext`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)> |

#### Returns

`Promise`[`Tool`&lt;[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%60Tool%60%3C%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)>[]>

the MCP powered tools

#### Inherited from

```
Agent.getMcpTools
```

---

### getPrompt()

```
getPrompt(runContext): Promise<Prompt|undefined>;
```

Returns the prompt template for the agent, if defined.

If the agent has a function as its prompt, this function will be called with the runContext and the agent instance.

#### Parameters

| Parameter      | Type                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runContext` | `RunContext`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)> |

#### Returns

`Promise`<`Prompt` | `undefined`>

#### Inherited from

```
Agent.getPrompt
```

---

### getSystemPrompt()

```
getSystemPrompt(runContext): Promise<string|undefined>;
```

Returns the system prompt for the agent.

If the agent has a function as its instructions, this function will be called with the runContext and the agent instance.

#### Parameters

| Parameter      | Type                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runContext` | `RunContext`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60)> |

#### Returns

`Promise`<`string` | `undefined`>

#### Inherited from

```
Agent.getSystemPrompt
```

---

### hasExplicitToolConfig()

```
hasExplicitToolConfig(): boolean;
```

#### Returns

`boolean`

#### Inherited from

```
Agent.hasExplicitToolConfig
```

---

### off()

```
off<K>(type, listener): EventEmitter<EventTypes>;
```

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof `AgentHookEvents`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`> |

#### Parameters

| Parameter    | Type                     |
| ------------ | ------------------------ |
| `type`     | `K`                    |
| `listener` | (…`args`) => `void` |

#### Returns

`EventEmitter`<`EventTypes`>

#### Inherited from

```
Agent.off
```

---

### on()

```
on<K>(type, listener): EventEmitter<EventTypes>;
```

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof `AgentHookEvents`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`> |

#### Parameters

| Parameter    | Type                     |
| ------------ | ------------------------ |
| `type`     | `K`                    |
| `listener` | (…`args`) => `void` |

#### Returns

`EventEmitter`<`EventTypes`>

#### Inherited from

```
Agent.on
```

---

### once()

```
once<K>(type, listener): EventEmitter<EventTypes>;
```

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof `AgentHookEvents`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TContext%60), `"text"`> |

#### Parameters

| Parameter    | Type                     |
| ------------ | ------------------------ |
| `type`     | `K`                    |
| `listener` | (…`args`) => `void` |

#### Returns

`EventEmitter`<`EventTypes`>

#### Inherited from

```
Agent.once
```

---

### processFinalOutput()

```
processFinalOutput(output): string;
```

Processes the final output of the agent.

#### Parameters

| Parameter  | Type       | Description              |
| ---------- | ---------- | ------------------------ |
| `output` | `string` | The output of the agent. |

#### Returns

`string`

The parsed out.

#### Inherited from

```
Agent.processFinalOutput
```

---

### toJSON()

```
toJSON(): object;
```

Returns a JSON representation of the agent, which is serializable.

#### Returns

`object`

A JSON object containing the agent’s name.

##### name

```
name: string;
```

#### Inherited from

```
Agent.toJSON
```

---

### create()

```
staticcreate<TOutput, Handoffs>(config): Agent<unknown, TOutput|HandoffsOutputUnion<Handoffs>>;
```

Create an Agent with handoffs and automatically infer the union type for TOutput from the handoff agents’ output types.

#### Type Parameters

| Type Parameter                                                 | Default type                     |
| -------------------------------------------------------------- | -------------------------------- |
| `TOutput` *extends* `AgentOutputType`<`unknown`>       | `"text"`                       |
| `Handoffs` *extends* readonly (`Agent`<`any`, `any`> | `Handoff`<`any`, `any`>)[] |

#### Parameters

| Parameter  | Type                                                   |
| ---------- | ------------------------------------------------------ |
| `config` | `AgentConfigWithHandoffs`<`TOutput`, `Handoffs`> |

#### Returns

`Agent`<`unknown`, `TOutput` | `HandoffsOutputUnion`<`Handoffs`>>

#### Inherited from

```
Agent.create
```
