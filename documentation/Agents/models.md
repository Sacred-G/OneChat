# Models

Every Agent ultimately calls an LLM. The SDK abstracts models behind two lightweight interfaces:

* [`Model`](https://openai.github.io/openai-agents-js/openai/agents/interfaces/model) – knows how to make *one* request against a specific API.
* [`ModelProvider`](https://openai.github.io/openai-agents-js/openai/agents/interfaces/modelprovider) – resolves human‑readable model **names** (e.g. `'gpt‑4o'`) to `Model` instances.

In day‑to‑day work you normally only interact with model **names** and occasionally `ModelSettings`.

Specifying a model per‑agent

```
import { Agent } from'@openai/agents';
constagent=newAgent({name:'Creative writer',model:'gpt-5.2',});
```

## Default model

When you don’t specify a model when initializing an `Agent`, the default model will be used. The default is currently [`gpt-4.1`](https://platform.openai.com/docs/models/gpt-4.1) for compatibility and low latency. If you have access, we recommend setting your agents to [`gpt-5.2`](https://platform.openai.com/docs/models/gpt-5.2) for higher quality while keeping explicit `modelSettings`.

If you want to switch to other models like [`gpt-5.2`](https://platform.openai.com/docs/models/gpt-5.2), there are two ways to configure your agents.

First, if you want to consistently use a specific model for all agents that do not set a custom model, set the `OPENAI_DEFAULT_MODEL` environment variable before running your agents.

Terminal window

```
exportOPENAI_DEFAULT_MODEL=gpt-5nodemy-awesome-agent.js
```

Second, you can set a default model for a `Runner` instance. If you don’t set a model for an agent, this `Runner`’s default model will be used.

Set a default model for a Runner

```
import { Runner } from'@openai/agents';
construnner=newRunner({ model:'gpt‑4.1-mini' });
```

### GPT-5 models

When you use any of GPT-5’s reasoning models ([`gpt-5`](https://platform.openai.com/docs/models/gpt-5), [`gpt-5-mini`](https://platform.openai.com/docs/models/gpt-5-mini), or [`gpt-5-nano`](https://platform.openai.com/docs/models/gpt-5-nano)) this way, the SDK applies sensible `modelSettings` by default. Specifically, it sets both `reasoning.effort` and `verbosity` to `"low"`. To adjust the reasoning effort for the default model, pass your own `modelSettings`:

Customize GPT-5 default settings

```
import { Agent } from'@openai/agents';
constmyAgent=newAgent({name:'My Agent',instructions:"You're a helpful agent.",modelSettings: {reasoning: { effort:'minimal' },text: { verbosity:'low' },},// If OPENAI_DEFAULT_MODEL=gpt-5 is set, passing only modelSettings works.// It's also fine to pass a GPT-5 model name explicitly:// model: 'gpt-5',});
```

For lower latency, using either [`gpt-5-mini`](https://platform.openai.com/docs/models/gpt-5-mini) or [`gpt-5-nano`](https://platform.openai.com/docs/models/gpt-5-nano) with `reasoning.effort="minimal"` will often return responses faster than the default settings. However, some built-in tools (such as file search and image generation) in Responses API do not support `"minimal"` reasoning effort, which is why this Agents SDK defaults to `"low"`.

### Non-GPT-5 models

If you pass a non–GPT-5 model name without custom `modelSettings`, the SDK reverts to generic `modelSettings` compatible with any model.

---

## The OpenAI provider

The default `ModelProvider` resolves names using the OpenAI APIs. It supports two distinct endpoints:

| API              | Usage                                                              | Call `setOpenAIAPI()`                     |
| ---------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Chat Completions | Standard chat & function calls                                     | `setOpenAIAPI('chat_completions')`        |
| Responses        | New streaming‑first generative API (tool calls, flexible outputs) | `setOpenAIAPI('responses')` *(default)* |

### Authentication

Set default OpenAI key

```
import { setDefaultOpenAIKey } from'@openai/agents';
setDefaultOpenAIKey(process.env.OPENAI_API_KEY!); // sk-...
```

You can also plug your own `OpenAI` client via `setDefaultOpenAIClient(client)` if you need custom networking settings.

---

## ModelSettings

`ModelSettings` mirrors the OpenAI parameters but is provider‑agnostic.

| Field                 | Type                                      | Notes                                                                                         |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `temperature`       | `number`                                | Creativity vs. determinism.                                                                   |
| `topP`              | `number`                                | Nucleus sampling.                                                                             |
| `frequencyPenalty`  | `number`                                | Penalise repeated tokens.                                                                     |
| `presencePenalty`   | `number`                                | Encourage new tokens.                                                                         |
| `toolChoice`        | `'auto' \| 'required' \| 'none' \| string` | See[forcing tool use](https://openai.github.io/openai-agents-js/guides/agents#forcing-tool-use). |
| `parallelToolCalls` | `boolean`                               | Allow parallel function calls where supported.                                                |
| `truncation`        | `'auto' \| 'disabled'`                   | Token truncation strategy.                                                                    |
| `maxTokens`         | `number`                                | Maximum tokens in the response.                                                               |
| `store`             | `boolean`                               | Persist the response for retrieval / RAG workflows.                                           |
| `reasoning.effort`  | `'minimal' \| 'low' \| 'medium' \| 'high'` | Reasoning effort for gpt-5 etc.                                                               |
| `text.verbosity`    | `'low' \| 'medium' \| 'high'`             | Text verbosity for gpt-5 etc.                                                                 |

Attach settings at either level:

Model settings

```
import { Runner, Agent } from'@openai/agents';
constagent=newAgent({name:'Creative writer',// ...modelSettings: { temperature:0.7, toolChoice:'auto' },});
// or globallynewRunner({ modelSettings: { temperature:0.3 } });
```

`Runner`‑level settings override any conflicting per‑agent settings.

---

## Prompt

Agents can be configured with a `prompt` parameter, indicating a server-stored prompt configuration that should be used to control the Agent’s behavior. Currently, this option is only supported when you use the OpenAI [Responses API](https://platform.openai.com/docs/api-reference/responses).

| Field         | Type       | Notes                                                                                                                                  |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `promptId`  | `string` | Unique identifier for a prompt.                                                                                                        |
| `version`   | `string` | Version of the prompt you wish to use.                                                                                                 |
| `variables` | `object` | A key/value pair of variables to substitute into the prompt. Values can be strings or content input types like text, images, or files. |

Agent with prompt

```
import { Agent, run } from'@openai/agents';
asyncfunctionmain() {constagent=newAgent({name:'Assistant',prompt: {promptId:'pmpt_68d50b26524c81958c1425070180b5e10ab840669e470fc7',variables: { name:'Kaz' },},});
constresult=awaitrun(agent, 'What is your name?');console.log(result.finalOutput);}
main().catch((error) => {console.error(error);process.exit(1);});
```

Any additional agent configuration, like tools or instructions, will override the values you may have configured in your stored prompt.

---

## Custom model providers

Implementing your own provider is straightforward – implement `ModelProvider` and `Model` and pass the provider to the `Runner` constructor:

Minimal custom provider

```
import {ModelProvider,Model,ModelRequest,ModelResponse,ResponseStreamEvent,} from'@openai/agents-core';
import { Agent, Runner } from'@openai/agents';
classEchoModelimplementsModel {name:string;constructor() {this.name='Echo';}asyncgetResponse(request:ModelRequest):Promise<ModelResponse> {return {usage: {},output: [{ role:'assistant', content:request.inputasstring }],} asany;}async*getStreamedResponse(_request:ModelRequest,):AsyncIterable<ResponseStreamEvent> {yield {type:'response.completed',response: { output: [], usage: {} },} asany;}}
classEchoProviderimplementsModelProvider {getModel(_modelName?:string):Promise<Model> |Model {returnnewEchoModel();}}
construnner=newRunner({ modelProvider:newEchoProvider() });console.log(runner.config.modelProvider.getModel());constagent=newAgent({name:'Test Agent',instructions:'You are a helpful assistant.',model:newEchoModel(),modelSettings: { temperature:0.7, toolChoice:'auto' },});console.log(agent.model);
```

---

## Tracing exporter

When using the OpenAI provider you can opt‑in to automatic trace export by providing your API key:

Tracing exporter

```
import { setTracingExportApiKey } from'@openai/agents';
setTracingExportApiKey('sk-...');
```

This sends traces to the [OpenAI dashboard](https://platform.openai.com/traces) where you can inspect the complete execution graph of your workflow.
