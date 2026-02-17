# Sessions

Sessions give the Agents SDK a  **persistent memory layer** . Provide any object that implements the `Session` interface to `Runner.run`, and the SDK handles the rest. When a session is present, the runner automatically:

1. Fetches previously stored conversation items and prepends them to the next turn.
2. Persists new user input and assistant output after each run completes.
3. Keeps the session available for future turns, whether you call the runner with new user text or resume from an interrupted `RunState`.

This removes the need to manually call `toInputList()` or stitch history between turns. The TypeScript SDK ships with two implementations: `OpenAIConversationsSession` for the Conversations API and `MemorySession`, which is intended for local development. Because they share the `Session` interface, you can plug in your own storage backend. For inspiration beyond the Conversations API, explore the sample session backends under `examples/memory/` (Prisma, file-backed, and more). When you use an OpenAI Responses model, wrap any session with `OpenAIResponsesCompactionSession` to automatically shrink stored transcripts via [`responses.compact`](https://platform.openai.com/docs/api-reference/responses/compact).

> Tip: To run the `OpenAIConversationsSession` examples on this page, set the `OPENAI_API_KEY` environment variable (or provide an `apiKey` when constructing the session) so the SDK can call the Conversations API.

---

## Quick start

Use `OpenAIConversationsSession` to sync memory with the [Conversations API](https://platform.openai.com/docs/api-reference/conversations), or swap in any other `Session` implementation.

Use the Conversations API as session memory

```
import { Agent, OpenAIConversationsSession, run } from'@openai/agents';
constagent=newAgent({name:'TourGuide',instructions:'Answer with compact travel facts.',});
// Any object that implements the Session interface works here. This example uses// the built-in OpenAIConversationsSession, but you can swap in a custom Session.constsession=newOpenAIConversationsSession();
constfirstTurn=awaitrun(agent, 'What city is the Golden Gate Bridge in?', {session,});console.log(firstTurn.finalOutput); // "San Francisco"
constsecondTurn=awaitrun(agent, 'What state is it in?', { session });console.log(secondTurn.finalOutput); // "California"
```

Reusing the same session instance ensures the agent receives the full conversation history before every turn and automatically persists new items. Switching to a different `Session` implementation requires no other code changes.

---

## How the runner uses sessions

* **Before each run** it retrieves the session history, merges it with the new turn’s input, and passes the combined list to your agent.
* **After a non-streaming run** one call to `session.addItems()` persists both the original user input and the model outputs from the latest turn.
* **For streaming runs** it writes the user input first and appends streamed outputs once the turn completes.
* **When resuming from `RunResult.state`** (for approvals or other interruptions) keep passing the same `session`. The resumed turn is added to memory without re-preparing the input.

---

## Inspecting and editing history

Sessions expose simple CRUD helpers so you can build “undo”, “clear chat”, or audit features.

Read and edit stored items

```
import { OpenAIConversationsSession } from'@openai/agents';importtype { AgentInputItem } from'@openai/agents-core';
// Replace OpenAIConversationsSession with any other Session implementation that// supports get/add/pop/clear if you store history elsewhere.constsession=newOpenAIConversationsSession({conversationId:'conv_123', // Resume an existing conversation if you have one.});
consthistory=awaitsession.getItems();console.log(`Loaded ${history.length} prior items.`);
constfollowUp:AgentInputItem[] = [{type:'message',role:'user',content: [{ type:'input_text', text:'Let’s continue later.' }],},];awaitsession.addItems(followUp);
constundone=awaitsession.popItem();
if (undone?.type==='message') {console.log(undone.role); // "user"}
awaitsession.clearSession();
```

`session.getItems()` returns the stored `AgentInputItem[]`. Call `popItem()` to remove the last entry—useful for user corrections before you rerun the agent.

---

## Bring your own storage

Implement the `Session` interface to back memory with Redis, DynamoDB, SQLite, or another datastore. Only five asynchronous methods are required.

Custom in-memory session implementation

```
import { Agent, run } from'@openai/agents';import { randomUUID } from'@openai/agents-core/_shims';import { logger, Logger } from'@openai/agents-core/dist/logger';importtype { AgentInputItem, Session } from'@openai/agents-core';
/*** Minimal example of a Session implementation; swap this class for any storage-backed version.*/exportclassCustomMemorySessionimplementsSession {privatereadonlysessionId:string;privatereadonlylogger:Logger;
privateitems:AgentInputItem[];
constructor(options: {sessionId?:string;initialItems?:AgentInputItem[];logger?:Logger;} = {},) {this.sessionId=options.sessionId??randomUUID();this.items=options.initialItems?options.initialItems.map(cloneAgentItem): [];this.logger=options.logger??logger;}
asyncgetSessionId():Promise<string> {returnthis.sessionId;}
asyncgetItems(limit?:number):Promise<AgentInputItem[]> {if (limit===undefined) {constcloned=this.items.map(cloneAgentItem);this.logger.debug(`Getting items from memory session (${this.sessionId}): ${JSON.stringify(cloned)}`,);returncloned;}if (limit<=0) {return [];}conststart=Math.max(this.items.length-limit, 0);constitems=this.items.slice(start).map(cloneAgentItem);this.logger.debug(`Getting items from memory session (${this.sessionId}): ${JSON.stringify(items)}`,);returnitems;}
asyncaddItems(items:AgentInputItem[]):Promise<void> {if (items.length===0) {return;}constcloned=items.map(cloneAgentItem);this.logger.debug(`Adding items to memory session (${this.sessionId}): ${JSON.stringify(cloned)}`,);this.items= [...this.items, ...cloned];}
asyncpopItem():Promise<AgentInputItem|undefined> {if (this.items.length===0) {returnundefined;}constitem=this.items[this.items.length-1];constcloned=cloneAgentItem(item);this.logger.debug(`Popping item from memory session (${this.sessionId}): ${JSON.stringify(cloned)}`,);this.items=this.items.slice(0, -1);returncloned;}
asyncclearSession():Promise<void> {this.logger.debug(`Clearing memory session (${this.sessionId})`);this.items= [];}}
functioncloneAgentItem<TextendsAgentInputItem>(item:T):T {returnstructuredClone(item);}
constagent=newAgent({name:'MemoryDemo',instructions:'Remember the running total.',});
// Using the above custom memory session implementation hereconstsession=newCustomMemorySession({sessionId:'session-123-4567',});
constfirst=awaitrun(agent, 'Add 3 to the total.', { session });console.log(first.finalOutput);
constsecond=awaitrun(agent, 'Add 4 more.', { session });console.log(second.finalOutput);
```

Custom sessions let you enforce retention policies, add encryption, or attach metadata to each conversation turn before persisting it.

---

## Control how history and new items merge

When you pass an array of `AgentInputItem`s as the run input, provide a `sessionInputCallback` to merge them with stored history deterministically. The runner loads the existing history, calls your callback  **before the model invocation** , and hands the returned array to the model as the turn’s complete input. This hook is ideal for trimming old items, deduplicating tool results, or highlighting only the context you want the model to see.

Truncate history with sessionInputCallback

```
import { Agent, OpenAIConversationsSession, run } from'@openai/agents';importtype { AgentInputItem } from'@openai/agents-core';
constagent=newAgent({name:'Planner',instructions:'Track outstanding tasks before responding.',});
// Any Session implementation can be passed here; customize storage as needed.constsession=newOpenAIConversationsSession();
consttodoUpdate:AgentInputItem[] = [{type:'message',role:'user',content: [{ type:'input_text', text:'Add booking a hotel to my todo list.' },],},];
awaitrun(agent, todoUpdate, {session,// function that combines session history with new input items before the model callsessionInputCallback: (history, newItems) => {constrecentHistory=history.slice(-8);return [...recentHistory, ...newItems];},});
```

For string inputs the runner merges history automatically, so the callback is optional.

---

## Handling approvals and resumable runs

Human-in-the-loop flows often pause a run to wait for approval:

```
constresult=awaitrunner.run(agent, 'Search the itinerary', {session,stream:true,});
if (result.requiresApproval) {// ... collect user feedback, then resume the agent in a later turnconstcontinuation=awaitrunner.run(agent, result.state, { session });console.log(continuation.finalOutput);}
```

When you resume from a previous `RunState`, the new turn is appended to the same memory record to preserve a single conversation history. Human-in-the-loop (HITL) flows stay fully compatible—approval checkpoints still round-trip through `RunState` while the session keeps the transcript complete.

---

## Compact OpenAI Responses history automatically

`OpenAIResponsesCompactionSession` decorates any `Session` and relies on the OpenAI Responses API to keep transcripts short. After each persisted turn the runner passes the latest `responseId` into `runCompaction`, which calls `responses.compact` when your decision hook returns true. The default trigger compacts once at least 10 non-user items have accumulated; override `shouldTriggerCompaction` to base the decision on token counts or custom heuristics. The decorator clears and rewrites the underlying session with the compacted output, so avoid pairing it with `OpenAIConversationsSession`, which uses a different server-managed history flow.

Decorate a session with OpenAIResponsesCompactionSession

```
import {Agent,MemorySession,OpenAIResponsesCompactionSession,run,} from'@openai/agents';
constagent=newAgent({name:'Support',instructions:'Answer briefly and keep track of prior context.',model:'gpt-5.2',});
// Wrap any Session to trigger responses.compact once history grows beyond your threshold.constsession=newOpenAIResponsesCompactionSession({// You can pass any Session implementation except OpenAIConversationsSessionunderlyingSession:newMemorySession(),// (optional) The model used for calling responses.compact APImodel:'gpt-5.2',// (optional) your custom logic hereshouldTriggerCompaction: ({ compactionCandidateItems }) => {returncompactionCandidateItems.length>=12;},});
awaitrun(agent, 'Summarize order #8472 in one sentence.', { session });awaitrun(agent, 'Remind me of the shipping address.', { session });
// Compaction runs automatically after each persisted turn. You can also force it manually.awaitsession.runCompaction({ force:true });
```

You can call `runCompaction({ force: true })` at any time to shrink history before archiving or handoff. Enable debug logs with `DEBUG=openai-agents:openai:compaction` to trace compaction decisions.

[Edit page](https://github.com/openai/openai-agents-js/edit/main/docs/src/content/docs/guides/sessions.mdx)

[Previous**Context management**](https://openai.github.io/openai-agents-js/guides/context)
