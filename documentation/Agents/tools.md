# Tools

Tools let an Agent **take actions** – fetch data, call external APIs, execute code, or even use a computer. The JavaScript/TypeScript SDK supports four categories:

1. **Hosted tools** – run alongside the model on OpenAI servers. *(web search, file search, computer use, code interpreter, image generation)*
2. **Function tools** – wrap any local function with a JSON schema so the LLM can call it.
3. **Agents as tools** – expose an entire Agent as a callable tool.
4. **Local MCP servers** – attach a Model Context Protocol server running on your machine.

---

## 1. Hosted tools

When you use the `OpenAIResponsesModel` you can add the following built‑in tools:

| Tool                    | Type string            | Purpose                               |
| ----------------------- | ---------------------- | ------------------------------------- |
| Web search              | `'web_search'`       | Internet search.                      |
| File / retrieval search | `'file_search'`      | Query vector stores hosted on OpenAI. |
| Computer use            | `'computer'`         | Automate GUI interactions.            |
| Shell                   | `'shell'`            | Run shell commands on the host.       |
| Apply patch             | `'apply_patch'`      | Apply V4A diffs to local files.       |
| Code Interpreter        | `'code_interpreter'` | Run code in a sandboxed environment.  |
| Image generation        | `'image_generation'` | Generate images based on text.        |

Hosted tools

```
import { Agent, webSearchTool, fileSearchTool } from'@openai/agents';
constagent=newAgent({name:'Travel assistant',tools: [webSearchTool(), fileSearchTool('VS_ID')],});
```

The exact parameter sets match the OpenAI Responses API – refer to the official documentation for advanced options like `rankingOptions` or semantic filters.

---

## 2. Function tools

You can turn **any** function into a tool with the `tool()` helper.

Function tool with Zod parameters

```
import { tool } from'@openai/agents';import { z } from'zod';
constgetWeatherTool=tool({name:'get_weather',description:'Get the weather for a given city',parameters:z.object({ city:z.string() }),asyncexecute({ city }) {return`The weather in ${city} is sunny.`;},});
```

### Options reference

| Field             | Required | Description                                                                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `name`          | No       | Defaults to the function name (e.g.,`get_weather`).                                                                         |
| `description`   | Yes      | Clear, human-readable description shown to the LLM.                                                                           |
| `parameters`    | Yes      | Either a Zod schema or a raw JSON schema object. Zod parameters automatically enable**strict** mode.                    |
| `strict`        | No       | When `true` (default), the SDK returns a model error if the arguments don’t validate. Set to `false` for fuzzy matching. |
| `execute`       | Yes      | `(args, context) => string \| Promise<string>`– your business logic. The optional second parameter is the `RunContext`.   |
| `errorFunction` | No       | Custom handler `(context, error) => string` for transforming internal errors into a user-visible string.                    |

### Non‑strict JSON‑schema tools

If you need the model to *guess* invalid or partial input you can disable strict mode when using raw JSON schema:

Non-strict JSON schema tools

```
import { tool } from'@openai/agents';
interfaceLooseToolInput {text:string;}
constlooseTool=tool({description:'Echo input; be forgiving about typos',strict:false,parameters: {type:'object',properties: { text: { type:'string' } },required: ['text'],additionalProperties:true,},execute:async (input) => {// because strict is false we need to do our own verificationif (typeofinput!=='object'||input===null||!('text'ininput)) {return'Invalid input. Please try again';}return (inputasLooseToolInput).text;},});
```

---

## 3. Agents as tools

Sometimes you want an Agent to *assist* another Agent without fully handing off the conversation. Use `agent.asTool()`:

Agents as tools

```
import { Agent } from'@openai/agents';
constsummarizer=newAgent({name:'Summarizer',instructions:'Generate a concise summary of the supplied text.',});
constsummarizerTool=summarizer.asTool({toolName:'summarize_text',toolDescription:'Generate a concise summary of the supplied text.',});
constmainAgent=newAgent({name:'Research assistant',tools: [summarizerTool],});
```

Under the hood the SDK:

* Creates a function tool with a single `input` parameter.
* Runs the sub‑agent with that input when the tool is called.
* Returns either the last message or the output extracted by `customOutputExtractor`.

When you run an agent as a tool, Agents SDK creates a runner with the default settings and run the agent with it within the function execution. If you want to provide any properties of `runConfig` or `runOptions`, you can pass them to the `asTool()` method to customize the runner’s behavior.

### Streaming events from agent tools

Agent tools can stream all nested run events back to your app. Choose the hook style that fits how you construct the tool:

Streaming agent tools

```
import { Agent } from'@openai/agents';
constbillingAgent=newAgent({name:'Billing Agent',instructions:'Answer billing questions and compute simple charges.',});
constbillingTool=billingAgent.asTool({toolName:'billing_agent',toolDescription:'Handles customer billing questions.',// onStream: simplest catch-all when you define the tool inline.onStream: (event) => {console.log(`[onStream] ${event.event.type}`, event);},});
// on(eventName) lets you subscribe selectively (or use '*' for all).billingTool.on('run_item_stream_event', (event) => {console.log('[on run_item_stream_event]', event);});billingTool.on('raw_model_stream_event', (event) => {console.log('[on raw_model_stream_event]', event);});
constorchestrator=newAgent({name:'Support Orchestrator',instructions:'Delegate billing questions to the billing agent tool.',tools: [billingTool],});
```

* Event types match `RunStreamEvent['type']`: `raw_model_stream_event`, `run_item_stream_event`, `agent_updated_stream_event`.
* `onStream` is the simplest “catch-all” and works well when you declare the tool inline (`tools: [agent.asTool({ onStream })]`). Use it if you do not need per-event routing.
* `on(eventName, handler)` lets you subscribe selectively (or with `'*'`) and is best when you need finer-grained handling or want to attach listeners after creation.
* If you provide either `onStream` or any `on(...)` handler, the agent-as-tool will run in streaming mode automatically; without them it stays on the non-streaming path.
* Handlers are invoked in parallel so a slow `onStream` callback will not block `on(...)` handlers (and vice versa).
* `toolCallId` is provided when the tool was invoked via a model tool call; direct `invoke()` calls or provider quirks may omit it.

---

## 4. MCP servers

You can expose tools via [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers and attach them to an agent. For instance, you can use `MCPServerStdio` to spawn and connect to the stdio MCP server:

Local MCP server

```
import { Agent, MCPServerStdio } from'@openai/agents';
constserver=newMCPServerStdio({fullCommand:'npx -y @modelcontextprotocol/server-filesystem ./sample_files',});
awaitserver.connect();
constagent=newAgent({name:'Assistant',mcpServers: [server],});
```

See [`filesystem-example.ts`](https://github.com/openai/openai-agents-js/tree/main/examples/mcp/filesystem-example.ts) for a complete example. Also, if you’re looking for a comprehensitve guide for MCP server tool integration, refer to [MCP guide](https://openai.github.io/openai-agents-js/guides/mcp) for details.

---

## Tool use behavior

Refer to the [Agents guide](https://openai.github.io/openai-agents-js/guides/agents#forcing-tool-use) for controlling when and how a model must use tools (`tool_choice`, `toolUseBehavior`, etc.).

---

## Best practices

* **Short, explicit descriptions** – describe *what* the tool does  *and when to use it* .
* **Validate inputs** – use Zod schemas for strict JSON validation where possible.
* **Avoid side‑effects in error handlers** – `errorFunction` should return a helpful string, not throw.
* **One responsibility per tool** – small, composable tools lead to better model reasoning.

---

## Next steps

* Learn about [forcing tool use](https://openai.github.io/openai-agents-js/guides/agents#forcing-tool-use).
* Add [guardrails](https://openai.github.io/openai-agents-js/guides/guardrails) to validate tool inputs or outputs.
* Dive into the TypeDoc reference for [`tool()`](https://openai.github.io/openai-agents-js/openai/agents/functions/tool) and the various hosted tool types.
