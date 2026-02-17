# Model Context Protocol (MCP)

The [**Model Context Protocol (MCP)**](https://modelcontextprotocol.io/) is an open protocol that standardizes how applications provide tools and context to LLMs. From the MCP docs:

> MCP is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.

There are three types of MCP servers this SDK supports:

1. **Hosted MCP server tools** – remote MCP servers used as tools by the [OpenAI Responses API](https://platform.openai.com/docs/guides/tools-remote-mcp)
2. **Streamable HTTP MCP servers** – local or remote servers that implement the [Streamable HTTP transport](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http)
3. **Stdio MCP servers** – servers accessed via standard input/output (the simplest option)

Choose a server type based on your use‑case:

| What you need                                                                    | Recommended option            |
| -------------------------------------------------------------------------------- | ----------------------------- |
| Call publicly accessible remote servers with default OpenAI responses models     | **1. Hosted MCP tools** |
| Use publicly accessible remote servers but have the tool calls triggered locally | **2. Streamable HTTP**  |
| Use locally running Streamable HTTP servers                                      | **2. Streamable HTTP**  |
| Use any Streamable HTTP servers with non-OpenAI-Responses models                 | **2. Streamable HTTP**  |
| Work with local MCP servers that only support the standard-I/O protocol          | **3. Stdio**            |

## 1. Hosted MCP server tools

Hosted tools push the entire round‑trip into the model. Instead of your code calling an MCP server, the OpenAI Responses API invokes the remote tool endpoint and streams the result back to the model.

Here is the simplest example of using hosted MCP tools. You can pass the remote MCP server’s label and URL to the `hostedMcpTool` utility function, which is helpful for creating hosted MCP server tools.

hostedAgent.ts

```
import { Agent, hostedMcpTool } from'@openai/agents';
exportconstagent=newAgent({name:'MCP Assistant',instructions:'You must always use the MCP tools to answer questions.',tools: [hostedMcpTool({serverLabel:'gitmcp',serverUrl:'https://gitmcp.io/openai/codex',}),],});
```

Then, you can run the Agent with the `run` function (or your own customized `Runner` instance’s `run` method):

Run with hosted MCP tools

```
import { run } from'@openai/agents';import { agent } from'./hostedAgent';
asyncfunctionmain() {constresult=awaitrun(agent,'Which language is the repo I pointed in the MCP tool settings written in?',);console.log(result.finalOutput);}
main().catch(console.error);
```

To stream incremental MCP results, pass `stream: true` when you run the `Agent`:

Run with hosted MCP tools (streaming)

```
import { run } from'@openai/agents';import { agent } from'./hostedAgent';
asyncfunctionmain() {constresult=awaitrun(agent,'Which language is the repo I pointed in the MCP tool settings written in?',{ stream:true },);
forawait (consteventofresult) {if (event.type==='raw_model_stream_event'&&event.data.type==='model'&&event.data.event.type!=='response.mcp_call_arguments.delta'&&event.data.event.type!=='response.output_text.delta') {console.log(`Got event of type ${JSON.stringify(event.data)}`);}}console.log(`Done streaming; final result: ${result.finalOutput}`);}
main().catch(console.error);
```

#### Optional approval flow

For sensitive operations you can require human approval of individual tool calls. Pass either `requireApproval: 'always'` or a fine‑grained object mapping tool names to `'never'`/`'always'`.

If you can programmatically determine whether a tool call is safe, you can use the [`onApproval` callback](https://github.com/openai/openai-agents-js/blob/main/examples/mcp/hosted-mcp-on-approval.ts) to approve or reject the tool call. If you require human approval, you can use the same [human-in-the-loop (HITL) approach](https://openai.github.io/openai-agents-js/guides/human-in-the-loop/) using `interruptions` as for local function tools.

Human in the loop with hosted MCP tools

```
import { Agent, run, hostedMcpTool, RunToolApprovalItem } from'@openai/agents';
asyncfunctionmain():Promise<void> {constagent=newAgent({name:'MCP Assistant',instructions:'You must always use the MCP tools to answer questions.',tools: [hostedMcpTool({serverLabel:'gitmcp',serverUrl:'https://gitmcp.io/openai/codex',// 'always' | 'never' | { never, always }requireApproval: {never: {toolNames: ['search_codex_code', 'fetch_codex_documentation'],},always: {toolNames: ['fetch_generic_url_content'],},},}),],});
letresult=awaitrun(agent, 'Which language is this repo written in?');while (result.interruptions&&result.interruptions.length) {for (constinterruptionofresult.interruptions) {// Human in the loop hereconstapproval=awaitconfirm(interruption);if (approval) {result.state.approve(interruption);} else {result.state.reject(interruption);}}result=awaitrun(agent, result.state);}console.log(result.finalOutput);}
import { stdin, stdout } from'node:process';import*asreadlinefrom'node:readline/promises';
asyncfunctionconfirm(item:RunToolApprovalItem):Promise<boolean> {constrl=readline.createInterface({ input:stdin, output:stdout });constname=item.name;constparams=item.arguments;constanswer=awaitrl.question(`Approve running tool (mcp: ${name}, params: ${params})? (y/n) `,);rl.close();returnanswer.toLowerCase().trim() ==='y';}
main().catch(console.error);
```

### Connector-backed hosted servers

Hosted MCP also supports OpenAI connectors. Instead of providing a `serverUrl`, pass the connector’s `connectorId` and an `authorization` token. The Responses API then handles authentication and exposes the connector’s tools through the hosted MCP interface.

Connector-backed hosted MCP tool

```
import { Agent, hostedMcpTool } from'@openai/agents';
constauthorization=process.env.GOOGLE_CALENDAR_AUTHORIZATION!;
exportconstconnectorAgent=newAgent({name:'Calendar Assistant',instructions:"You are a helpful assistant that can answer questions about the user's calendar.",tools: [hostedMcpTool({serverLabel:'google_calendar',connectorId:'connector_googlecalendar',authorization,requireApproval:'never',}),],});
```

In this example the `GOOGLE_CALENDAR_AUTHORIZATION` environment variable holds an OAuth token obtained from the Google OAuth Playground, which authorizes the connector-backed server to call the Calendar API. For a runnable sample that also demonstrates streaming, see [`examples/connectors`](https://github.com/openai/openai-agents-js/tree/main/examples/connectors).

Fully working samples (Hosted tools/Streamable HTTP/stdio + Streaming, HITL, onApproval) are [examples/mcp](https://github.com/openai/openai-agents-js/tree/main/examples/mcp) in our GitHub repository.

## 2. Streamable HTTP MCP servers

When your Agent talks directly to a Streamable HTTP MCP server—local or remote—instantiate `MCPServerStreamableHttp` with the server `url`, `name`, and any optional settings:

Run with Streamable HTTP MCP servers

```
import { Agent, run, MCPServerStreamableHttp } from'@openai/agents';
asyncfunctionmain() {constmcpServer=newMCPServerStreamableHttp({url:'https://gitmcp.io/openai/codex',name:'GitMCP Documentation Server',});constagent=newAgent({name:'GitMCP Assistant',instructions:'Use the tools to respond to user requests.',mcpServers: [mcpServer],});
try {awaitmcpServer.connect();constresult=awaitrun(agent, 'Which language is this repo written in?');console.log(result.finalOutput);} finally {awaitmcpServer.close();}}
main().catch(console.error);
```

The constructor also accepts additional MCP TypeScript‑SDK options such as `authProvider`, `requestInit`, `fetch`, `reconnectionOptions`, and `sessionId`. See the [MCP TypeScript SDK repository](https://github.com/modelcontextprotocol/typescript-sdk) and its documents for details.

## 3. Stdio MCP servers

For servers that expose only standard I/O, instantiate `MCPServerStdio` with a `fullCommand`:

Run with Stdio MCP servers

```
import { Agent, run, MCPServerStdio } from'@openai/agents';import*aspathfrom'node:path';
asyncfunctionmain() {constsamplesDir=path.join(__dirname, 'sample_files');constmcpServer=newMCPServerStdio({name:'Filesystem MCP Server, via npx',fullCommand:`npx -y @modelcontextprotocol/server-filesystem ${samplesDir}`,});awaitmcpServer.connect();try {constagent=newAgent({name:'FS MCP Assistant',instructions:'Use the tools to read the filesystem and answer questions based on those files. If you are unable to find any files, you can say so instead of assuming they exist.',mcpServers: [mcpServer],});constresult=awaitrun(agent, 'Read the files and list them.');console.log(result.finalOutput);} finally {awaitmcpServer.close();}}
main().catch(console.error);
```

## Other things to know

For **Streamable HTTP** and **Stdio** servers, each time an `Agent` runs it may call `list_tools()` to discover available tools. Because that round‑trip can add latency—especially to remote servers—you can cache the results in memory by passing `cacheToolsList: true` to `MCPServerStdio` or `MCPServerStreamableHttp`.

Only enable this if you’re confident the tool list won’t change. To invalidate the cache later, call `invalidateToolsCache()` on the server instance.

### Tool filtering

You can restrict which tools are exposed from each server by passing either a static filter via `createMCPToolStaticFilter` or a custom function. Here’s a combined example showing both approaches:

Tool filtering

```
import {MCPServerStdio,MCPServerStreamableHttp,createMCPToolStaticFilter,MCPToolFilterContext,} from'@openai/agents';
interfaceToolFilterContext {allowAll:boolean;}
constserver=newMCPServerStdio({fullCommand:'my-server',toolFilter:createMCPToolStaticFilter({allowed: ['safe_tool'],blocked: ['danger_tool'],}),});
constdynamicServer=newMCPServerStreamableHttp({url:'http://localhost:3000',toolFilter:async ({ runContext }:MCPToolFilterContext, tool) =>(runContext.contextasToolFilterContext).allowAll||tool.name!=='admin',});
```

## Further reading
