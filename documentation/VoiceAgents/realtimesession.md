# RealtimeSession

A `RealtimeSession` is the cornerstone of building Voice Agents. It’s the equivalent of a Runner in text-based agents except that it automatically handles multiple turns by maintaining a connection with the underlying transport layer.

The session handles managing the local history copy, executes tools, runs output guardrails, and facilitates handoffs.

The actual audio handling and generation of model responses is handled by the underlying transport layer. By default if you are using a browser with WebRTC support, the session will automatically use the WebRTC version of the OpenAI Realtime API. On the server or if you pass `websocket` as the transport layer, the session will establish a connection using WebSockets.

In the case of WebRTC, in the browser, the transport layer will also automatically configure the microphone and audio output to be used by the session.

You can also create a transport layer instance yourself and pass it in to have more control over the configuration or even extend the existing ones. Check out the `TwilioRealtimeTransportLayer` for an example of how to create a custom transport layer.

## Example

```
constagent=newRealtimeAgent({name:'my-agent',instructions:'You are a helpful assistant that can answer questions and help with tasks.',})
constsession=newRealtimeSession(agent);session.connect({apiKey:'your-api-key',});
```

## Extends

* `EventEmitter`[[`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)&lt;`TBaseContext`](%5B%60RealtimeSessionEventTypes%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)%3C%60TBaseContext%60)>

## Type Parameters

| Type Parameter   | Default type |
| ---------------- | ------------ |
| `TBaseContext` | `unknown`  |

## Constructors

### Constructor

```
newRealtimeSession<TBaseContext>(initialAgent, options): RealtimeSession<TBaseContext>;
```

#### Parameters

| Parameter        | Type                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialAgent` |                                                                                                                                                                                                                                                                                                                                |
| `options`      | `Partial`[[`RealtimeSessionOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionoptions/)&lt;`TBaseContext`](%5B%60RealtimeSessionOptions%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionoptions/)%3C%60TBaseContext%60)> |

#### Returns

`RealtimeSession`<`TBaseContext`>

#### Overrides

```
RuntimeEventEmitter<RealtimeSessionEventTypes<TBaseContext>>.constructor
```

## Properties

### initialAgent

```
readonly initialAgent:|RealtimeAgent<TBaseContext>|RealtimeAgent<RealtimeContextData<TBaseContext>>;
```

---

### options

```
readonly options: Partial<RealtimeSessionOptions<TBaseContext>>= {};
```

---

### captureRejections

```
static captureRejections: boolean;
```

Value: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)

Change the default `captureRejections` option on all new `EventEmitter` objects.

#### Since

v13.4.0, v12.16.0

#### Inherited from

```
RuntimeEventEmitter.captureRejections
```

---

### captureRejectionSymbol

```
readonlystatic captureRejectionSymbol: typeofcaptureRejectionSymbol;
```

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom `rejection handler`.

#### Since

v13.4.0, v12.16.0

#### Inherited from

```
RuntimeEventEmitter.captureRejectionSymbol
```

---

### defaultMaxListeners

```
static defaultMaxListeners: number;
```

By default, a maximum of `10` listeners can be registered for any single event. This limit can be changed for individual `EventEmitter` instances using the `emitter.setMaxListeners(n)` method. To change the default for *all* `EventEmitter` instances, the `events.defaultMaxListeners` property can be used. If this value is not a positive number, a `RangeError` is thrown.

Take caution when setting the `events.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. However, calling `emitter.setMaxListeners(n)` still has precedence over `events.defaultMaxListeners`.

This is not a hard limit. The `EventEmitter` instance will allow more listeners to be added but will output a trace warning to stderr indicating that a “possible EventEmitter memory leak” has been detected. For any single `EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to temporarily avoid this warning:

```
import { EventEmitter } from'node:events';constemitter=newEventEmitter();emitter.setMaxListeners(emitter.getMaxListeners() +1);emitter.once('event', () => {// do stuffemitter.setMaxListeners(Math.max(emitter.getMaxListeners() -1, 0));});
```

The `--trace-warnings` command-line flag can be used to display the stack trace for such warnings.

The emitted warning can be inspected with `process.on('warning')` and will have the additional `emitter`, `type`, and `count` properties, referring to the event emitter instance, the event’s name and the number of attached listeners, respectively. Its `name` property is set to `'MaxListenersExceededWarning'`.

#### Since

v0.11.2

#### Inherited from

```
RuntimeEventEmitter.defaultMaxListeners
```

---

### errorMonitor

```
readonlystatic errorMonitor: typeoferrorMonitor;
```

This symbol shall be used to install a listener for only monitoring `'error'` events. Listeners installed using this symbol are called before the regular `'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an `'error'` event is emitted. Therefore, the process will still crash if no regular `'error'` listener is installed.

#### Since

v13.6.0, v12.17.0

#### Inherited from

```
RuntimeEventEmitter.errorMonitor
```

## Accessors

### availableMcpTools

#### Get Signature

```
getavailableMcpTools(): RealtimeMcpToolInfo[];
```

##### Returns

`RealtimeMcpToolInfo`[]

---

### context

#### Get Signature

```
getcontext(): RunContext<RealtimeContextData<TBaseContext>>;
```

The current context of the session.

##### Returns

`RunContext`[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TBaseContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TBaseContext%60)>

---

### currentAgent

#### Get Signature

```
getcurrentAgent():|RealtimeAgent<TBaseContext>|RealtimeAgent<RealtimeContextData<TBaseContext>>;
```

The current agent in the session.

##### Returns

| [`RealtimeAgent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)<`TBaseContext`> | [`RealtimeAgent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)[[`RealtimeContextData`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)&lt;`TBaseContext`](%5B%60RealtimeContextData%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimecontextdata/)%3C%60TBaseContext%60)>

---

### history

#### Get Signature

```
gethistory(): RealtimeItem[];
```

The history of the session.

##### Returns

[`RealtimeItem`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[]

---

### muted

#### Get Signature

```
getmuted(): boolean|null;
```

Whether the session is muted. Might be `null` if the underlying transport layer does not support muting.

##### Returns

`boolean` | `null`

---

### transport

#### Get Signature

```
gettransport(): RealtimeTransportLayer;
```

The transport layer used by the session.

##### Returns

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/)

---

### usage

#### Get Signature

```
getusage(): Usage;
```

The current usage of the session.

##### Returns

`Usage`

## Methods

### [captureRejectionSymbol]()?

```
optional [captureRejectionSymbol]<K>(error,event, ...args): void;
```

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter  | Type                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`  | `Error`                                                                                                                                                                                                                                                                                                                                                             |
| `event`  | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                     |
| …`args` | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] : `never` |

#### Returns

`void`

#### Inherited from

```
RuntimeEventEmitter.[captureRejectionSymbol]
```

---

### addImage()

```
addImage(image, __namedParameters): void;
```

Add image to the session

#### Parameters

| Parameter                              | Type                                  | Description       |
| -------------------------------------- | ------------------------------------- | ----------------- |
| `image`                              | `string`                            | The image to add. |
| `__namedParameters`                  | {`triggerResponse?`: `boolean`; } | ‐                |
| `__namedParameters.triggerResponse?` | `boolean`                           | ‐                |

#### Returns

`void`

---

### addListener()

```
addListener<K>(eventName, listener): this;
```

Alias for `emitter.on(eventName, listener)`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` |

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

```
RuntimeEventEmitter.addListener
```

---

### approve()

```
approve(approvalItem, options): Promise<void>;
```

Approve a tool call. This will also trigger the tool call to the agent.

#### Parameters

| Parameter                  | Type                                | Description                              |
| -------------------------- | ----------------------------------- | ---------------------------------------- |
| `approvalItem`           | `RunToolApprovalItem`             | The approval item to approve.            |
| `options`                | {`alwaysApprove?`: `boolean`; } | Additional options.                      |
| `options.alwaysApprove?` | `boolean`                         | Whether to always approve the tool call. |

#### Returns

`Promise`<`void`>

---

### close()

```
close(): void;
```

Disconnect from the session.

#### Returns

`void`

---

### connect()

```
connect(options): Promise<void>;
```

Connect to the session. This will establish the connection to the underlying transport layer and start the session.

After connecting, the session will also emit a `history_updated` event with an empty history.

#### Parameters

| Parameter   | Type                                                                                                                                           | Description                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `options` | [`RealtimeSessionConnectOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconnectoptions/) | The options for the connection. |

#### Returns

`Promise`<`void`>

---

### emit()

```
emit<K>(eventName, ...args): boolean;
```

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments to each.

Returns `true` if the event had listeners, `false` otherwise.

```
import { EventEmitter } from'node:events';constmyEmitter=newEventEmitter();
// First listenermyEmitter.on('event', functionfirstListener() {console.log('Helloooo! first listener');});// Second listenermyEmitter.on('event', functionsecondListener(arg1, arg2) {console.log(`event with parameters ${arg1}, ${arg2} in second listener`);});// Third listenermyEmitter.on('event', functionthirdListener(...args) {constparameters=args.join(', ');console.log(`event with parameters ${parameters} in third listener`);});
console.log(myEmitter.listeners('event'));
myEmitter.emit('event', 1, 2, 3, 4, 5);
// Prints:// [//   [Function: firstListener],//   [Function: secondListener],//   [Function: thirdListener]// ]// Helloooo! first listener// event with parameters 1, 2 in second listener// event with parameters 1, 2, 3, 4, 5 in third listener
```

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                     |
| …`args`    | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] : `never` |

#### Returns

`boolean`

#### Since

v0.1.26

#### Inherited from

```
RuntimeEventEmitter.emit
```

---

### eventNames()

```
eventNames(): (|"audio"|"error"|"audio_interrupted"|"mcp_tool_call_completed"|"agent_start"|"agent_end"|"agent_handoff"|"agent_tool_start"|"agent_tool_end"|"transport_event"|"audio_start"|"audio_stopped"|"guardrail_tripped"|"history_updated"|"history_added"|"tool_approval_requested"|"mcp_tools_changed")[];
```

Returns an array listing the events for which the emitter has registered listeners. The values in the array are strings or `Symbol`s.

```
import { EventEmitter } from'node:events';
constmyEE=newEventEmitter();myEE.on('foo', () => {});myEE.on('bar', () => {});
constsym=Symbol('symbol');myEE.on(sym, () => {});
console.log(myEE.eventNames());// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

#### Returns

( | `"audio"` | `"error"` | `"audio_interrupted"` | `"mcp_tool_call_completed"` | `"agent_start"` | `"agent_end"` | `"agent_handoff"` | `"agent_tool_start"` | `"agent_tool_end"` | `"transport_event"` | `"audio_start"` | `"audio_stopped"` | `"guardrail_tripped"` | `"history_updated"` | `"history_added"` | `"tool_approval_requested"` | `"mcp_tools_changed"`)[]

#### Since

v6.0.0

#### Inherited from

```
RuntimeEventEmitter.eventNames
```

---

### getInitialSessionConfig()

```
getInitialSessionConfig(overrides): Promise<Partial<RealtimeSessionConfig>>;
```

Compute the initial session config that the current session will use when connecting.

This mirrors the configuration payload we send during `connect`, including dynamic values such as the upstream agent instructions, tool definitions, and prompt content generated at runtime. Keeping this helper exposed allows transports or orchestration layers to precompute a CallAccept-compatible payload without opening a socket.

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                               | Description                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `overrides` | `Partial`[[`RealtimeSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)](%5B%60RealtimeSessionConfig%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)) | Additional config overrides applied on top of the session options. |

#### Returns

`Promise`[`Partial`&lt;[`RealtimeSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)](%60Partial%60%3C%5B%60RealtimeSessionConfig%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/))>

---

### getMaxListeners()

```
getMaxListeners(): number;
```

Returns the current max listener value for the `EventEmitter` which is either set by `emitter.setMaxListeners(n)` or defaults to [EventEmitter.defaultMaxListeners](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimesession/#defaultmaxlisteners).

#### Returns

`number`

#### Since

v1.0.0

#### Inherited from

```
RuntimeEventEmitter.getMaxListeners
```

---

### interrupt()

```
interrupt(): void;
```

Interrupt the session artificially for example if you want to build a “stop talking” button.

#### Returns

`void`

---

### listenerCount()

```
listenerCount<K>(eventName, listener?):number;
```

Returns the number of listeners listening for the event named `eventName`. If `listener` is provided, it will return how many times the listener is found in the list of the listeners of the event.

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   | Description                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      | `K`                      |
| `listener?` | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` | The event handler function |

#### Returns

`number`

#### Since

v3.2.0

#### Inherited from

```
RuntimeEventEmitter.listenerCount
```

---

### listeners()

```
listeners<K>(eventName):KextendskeyofRealtimeSessionEventTypes<TBaseContext> ?RealtimeSessionEventTypes<TBaseContext>[K<K>] extendsunknown[] ? (...args) =>void:never:never[];
```

Returns a copy of the array of listeners for the event named `eventName`.

```
server.on('connection', (stream) => {console.log('someone connected!');});console.log(util.inspect(server.listeners('connection')));// Prints: [ [Function] ]
```

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                              |
| ------------- | ------------------------------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>` |

#### Returns

`K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never`[]

#### Since

v0.1.26

#### Inherited from

```
RuntimeEventEmitter.listeners
```

---

### mute()

```
mute(muted): void;
```

Mute the session.

#### Parameters

| Parameter | Type        | Description                  |
| --------- | ----------- | ---------------------------- |
| `muted` | `boolean` | Whether to mute the session. |

#### Returns

`void`

---

### off()

```
off<K>(eventName, listener): this;
```

Alias for `emitter.removeListener()`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` |

#### Returns

`this`

#### Since

v10.0.0

#### Inherited from

```
RuntimeEventEmitter.off
```

---

### on()

```
on<K>(eventName, listener): this;
```

Adds the `listener` function to the end of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```
server.on('connection', (stream) => {console.log('someone connected!');});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```
import { EventEmitter } from'node:events';constmyEE=newEventEmitter();myEE.on('foo', () =>console.log('a'));myEE.prependListener('foo', () =>console.log('b'));myEE.emit('foo');// Prints://   b//   a
```

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   | Description           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      | `K`                 |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` | The callback function |

#### Returns

`this`

#### Since

v0.1.101

#### Inherited from

```
RuntimeEventEmitter.on
```

---

### once()

```
once<K>(eventName, listener): this;
```

Adds a **one-time** `listener` function for the event named `eventName`. The next time `eventName` is triggered, this listener is removed and then invoked.

```
server.once('connection', (stream) => {console.log('Ah, we have our first user!');});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependOnceListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```
import { EventEmitter } from'node:events';constmyEE=newEventEmitter();myEE.once('foo', () =>console.log('a'));myEE.prependOnceListener('foo', () =>console.log('b'));myEE.emit('foo');// Prints://   b//   a
```

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   | Description           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      | `K`                 |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` | The callback function |

#### Returns

`this`

#### Since

v0.3.0

#### Inherited from

```
RuntimeEventEmitter.once
```

---

### prependListener()

```
prependListener<K>(eventName, listener): this;
```

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```
server.prependListener('connection', (stream) => {console.log('someone connected!');});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   | Description           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      | `K`                 |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` | The callback function |

#### Returns

`this`

#### Since

v6.0.0

#### Inherited from

```
RuntimeEventEmitter.prependListener
```

---

### prependOnceListener()

```
prependOnceListener<K>(eventName, listener): this;
```

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. The next time `eventName` is triggered, this listener is removed, and then invoked.

```
server.prependOnceListener('connection', (stream) => {console.log('Ah, we have our first user!');});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   | Description           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      | `K`                 |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` | The callback function |

#### Returns

`this`

#### Since

v6.0.0

#### Inherited from

```
RuntimeEventEmitter.prependOnceListener
```

---

### rawListeners()

```
rawListeners<K>(eventName):KextendskeyofRealtimeSessionEventTypes<TBaseContext> ?RealtimeSessionEventTypes<TBaseContext>[K<K>] extendsunknown[] ? (...args) =>void:never:never[];
```

Returns a copy of the array of listeners for the event named `eventName`, including any wrappers (such as those created by `.once()`).

```
import { EventEmitter } from'node:events';constemitter=newEventEmitter();emitter.once('log', () =>console.log('log once'));
// Returns a new Array with a function `onceWrapper` which has a property// `listener` which contains the original listener bound aboveconstlisteners=emitter.rawListeners('log');constlogFnWrapper=listeners[0];
// Logs "log once" to the console and does not unbind the `once` eventlogFnWrapper.listener();
// Logs "log once" to the console and removes the listenerlogFnWrapper();
emitter.on('log', () =>console.log('log persistently'));// Will return a new Array with a single function bound by `.on()` aboveconstnewListeners=emitter.rawListeners('log');
// Logs "log persistently" twicenewListeners[0]();emitter.emit('log');
```

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                              |
| ------------- | ------------------------------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>` |

#### Returns

`K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never`[]

#### Since

v9.4.0

#### Inherited from

```
RuntimeEventEmitter.rawListeners
```

---

### reject()

```
reject(approvalItem, options): Promise<void>;
```

Reject a tool call. This will also trigger the tool call to the agent.

#### Parameters

| Parameter                 | Type                               | Description                             |
| ------------------------- | ---------------------------------- | --------------------------------------- |
| `approvalItem`          | `RunToolApprovalItem`            | The approval item to reject.            |
| `options`               | {`alwaysReject?`: `boolean`; } | Additional options.                     |
| `options.alwaysReject?` | `boolean`                        | Whether to always reject the tool call. |

#### Returns

`Promise`<`void`>

---

### removeAllListeners()

```
removeAllListeners(eventName?):this;
```

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Parameter      | Type        |
| -------------- | ----------- |
| `eventName?` | `unknown` |

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

```
RuntimeEventEmitter.removeAllListeners
```

---

### removeListener()

```
removeListener<K>(eventName, listener): this;
```

Removes the specified `listener` from the listener array for the event named `eventName`.

```
constcallback= (stream) => {console.log('someone connected!');};server.on('connection', callback);// ...server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the time of emitting are called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Subsequent events behave as expected.

```
import { EventEmitter } from'node:events';classMyEmitterextendsEventEmitter {}constmyEmitter=newMyEmitter();
constcallbackA= () => {console.log('A');myEmitter.removeListener('event', callbackB);};
constcallbackB= () => {console.log('B');};
myEmitter.on('event', callbackA);
myEmitter.on('event', callbackB);
// callbackA removes listener callbackB but it will still be called.// Internal listener array at time of emit [callbackA, callbackB]myEmitter.emit('event');// Prints://   A//   B
// callbackB is now removed.// Internal listener array [callbackA]myEmitter.emit('event');// Prints://   A
```

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. This will not impact the order in which listeners are called, but it means that any copies of the listener array as returned by the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single event (as in the example below), `removeListener()` will remove the most recently added instance. In the example the `once('ping')` listener is removed:

```
import { EventEmitter } from'node:events';constee=newEventEmitter();
functionpong() {console.log('pong');}
ee.on('ping', pong);ee.once('ping', pong);ee.removeListener('ping', pong);
ee.emit('ping');ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Type Parameters

| Type Parameter |
| -------------- |
| `K`          |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventName` | keyof RealtimeSessionEventTypes`<TBaseContext>`                                                                                                                                                                                                                                                                                                                                                                                      |
| `listener`  | `K` *extends* keyof [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`> ? [`RealtimeSessionEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessioneventtypes/)<`TBaseContext`>[`K`<`K`>] *extends* `unknown`[] ? (…`args`) => `void` : `never` : `never` |

#### Returns

`this`

#### Since

v0.1.26

#### Inherited from

```
RuntimeEventEmitter.removeListener
```

---

### sendAudio()

```
sendAudio(audio, options): void;
```

Send audio to the session.

#### Parameters

| Parameter           | Type                         | Description                                 |
| ------------------- | ---------------------------- | ------------------------------------------- |
| `audio`           | `ArrayBuffer`              | The audio to send.                          |
| `options`         | {`commit?`: `boolean`; } | Additional options.                         |
| `options.commit?` | `boolean`                  | Whether to finish the turn with this audio. |

#### Returns

`void`

---

### sendMessage()

```
sendMessage(message, otherEventData): void;
```

Send a message to the session.

#### Parameters

| Parameter          | Type                            | Description                    |
| ------------------ | ------------------------------- | ------------------------------ |
| `message`        | `RealtimeUserInput`           | The message to send.           |
| `otherEventData` | `Record`<`string`, `any`> | Additional event data to send. |

#### Returns

`void`

---

### setMaxListeners()

```
setMaxListeners(n): this;
```

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. This is a useful default that helps finding memory leaks. The `emitter.setMaxListeners()` method allows the limit to be modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Parameter | Type       |
| --------- | ---------- |
| `n`     | `number` |

#### Returns

`this`

#### Since

v0.3.5

#### Inherited from

```
RuntimeEventEmitter.setMaxListeners
```

---

### updateAgent()

```
updateAgent(newAgent): Promise<RealtimeAgent<TBaseContext>>;
```

#### Parameters

| Parameter    | Type                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `newAgent` | [`RealtimeAgent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)<`TBaseContext`> |

#### Returns

`Promise`[[`RealtimeAgent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)&lt;`TBaseContext`](%5B%60RealtimeAgent%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)%3C%60TBaseContext%60)>

---

### updateHistory()

```
updateHistory(newHistory): void;
```

Update the history of the session.

#### Parameters

| Parameter      | Type | Description                                                                                                    |
| -------------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| `newHistory` |      | [`RealtimeItem`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[] |

#### Returns

`void`

---

### addAbortListener()

```
staticaddAbortListener(signal, resource): Disposable;
```

Listens once to the `abort` event on the provided `signal`.

Listening to the `abort` event on abort signals is unsafe and may lead to resource leaks since another third party with the signal can call `e.stopImmediatePropagation()`. Unfortunately Node.js cannot change this since it would violate the web standard. Additionally, the original API makes it easy to forget to remove listeners.

This API allows safely using `AbortSignal`s in Node.js APIs by solving these two issues by listening to the event such that `stopImmediatePropagation` does not prevent the listener from running.

Returns a disposable so that it may be unsubscribed from more easily.

```
import { addAbortListener } from'node:events';
functionexample(signal) {letdisposable;try {signal.addEventListener('abort', (e) =>e.stopImmediatePropagation());disposable=addAbortListener(signal, (e) => {// Do something when signal is aborted.});} finally {disposable?.[Symbol.dispose]();}}
```

#### Parameters

| Parameter    | Type                    |
| ------------ | ----------------------- |
| `signal`   | `AbortSignal`         |
| `resource` | (`event`) => `void` |

#### Returns

`Disposable`

Disposable that removes the `abort` listener.

#### Since

v20.5.0

#### Inherited from

```
RuntimeEventEmitter.addAbortListener
```

---

### computeInitialSessionConfig()

```
staticcomputeInitialSessionConfig<TBaseContext>(agent,options,overrides): Promise<Partial<RealtimeSessionConfig>>;
```

Convenience helper to compute the initial session config without manually instantiating and connecting a session.

This is primarily useful for integrations that must provide the session configuration to a third party (for example the SIP `calls.accept` endpoint) before the actual realtime session is attached. The helper instantiates a throwaway session so all agent-driven dynamic fields resolve in exactly the same way as the live session path.

#### Type Parameters

| Type Parameter   | Default type |
| ---------------- | ------------ |
| `TBaseContext` | `unknown`  |

#### Parameters

| Parameter     | Type                                                                                                                                                                                                                                                                                                                           | Description                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `agent`     |                                                                                                                                                                                                                                                                                                                                | [`RealtimeAgent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)<`TBaseContext`> |
| `options`   | `Partial`[[`RealtimeSessionOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionoptions/)&lt;`TBaseContext`](%5B%60RealtimeSessionOptions%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionoptions/)%3C%60TBaseContext%60)> | Session options used to seed the config calculation.                                                                        |
| `overrides` | `Partial`[[`RealtimeSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)](%5B%60RealtimeSessionConfig%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/))                                             | Additional config overrides applied on top of the provided options.                                                         |

#### Returns

`Promise`[`Partial`&lt;[`RealtimeSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)](%60Partial%60%3C%5B%60RealtimeSessionConfig%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/))>

---

### getEventListeners()

```
staticgetEventListeners(emitter, name): Function[];
```

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on the emitter.

For `EventTarget`s this is the only way to get the event listeners for the event target. This is useful for debugging and diagnostic purposes.

```
import { getEventListeners, EventEmitter } from'node:events';
{constee=newEventEmitter();constlistener= () =>console.log('Events are fun');ee.on('foo', listener);console.log(getEventListeners(ee, 'foo')); // [ [Function: listener] ]}{constet=newEventTarget();constlistener= () =>console.log('Events are fun');et.addEventListener('foo', listener);console.log(getEventListeners(et, 'foo')); // [ [Function: listener] ]}
```

#### Parameters

| Parameter   | Type            |
| ----------- | --------------- |
| `emitter` | `EventTarget` |
| `name`    | `string`      |

#### Returns

`Function`[]

#### Since

v15.2.0, v14.17.0

#### Inherited from

```
RuntimeEventEmitter.getEventListeners
```

---

### getMaxListeners()

```
staticgetMaxListeners(emitter): number;
```

Returns the currently set max amount of listeners.

For `EventEmitter`s this behaves exactly the same as calling `.getMaxListeners` on the emitter.

For `EventTarget`s this is the only way to get the max event listeners for the event target. If the number of event handlers on a single EventTarget exceeds the max set, the EventTarget will print a warning.

```
import { getMaxListeners, setMaxListeners, EventEmitter } from'node:events';
{constee=newEventEmitter();console.log(getMaxListeners(ee)); // 10setMaxListeners(11, ee);console.log(getMaxListeners(ee)); // 11}{constet=newEventTarget();console.log(getMaxListeners(et)); // 10setMaxListeners(11, et);console.log(getMaxListeners(et)); // 11}
```

#### Parameters

| Parameter   | Type            |
| ----------- | --------------- |
| `emitter` | `EventTarget` |

#### Returns

`number`

#### Since

v19.9.0

#### Inherited from

```
RuntimeEventEmitter.getMaxListeners
```

---

### ~listenerCount()~

```
staticlistenerCount(emitter, eventName): number;
```

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```
import { EventEmitter, listenerCount } from'node:events';
constmyEmitter=newEventEmitter();myEmitter.on('event', () => {});myEmitter.on('event', () => {});console.log(listenerCount(myEmitter, 'event'));// Prints: 2
```

Deprecated

Since v3.2.0 - Use `listenerCount` instead.

#### Parameters

| Parameter     | Type             | Description          |
| ------------- | ---------------- | -------------------- |
| `emitter`   | `EventEmitter` | The emitter to query |
| `eventName` | `string`       | `symbol`           |

#### Returns

`number`

#### Since

v0.9.12

#### Inherited from

```
RuntimeEventEmitter.listenerCount
```

---

### on()

#### Call Signature

```
staticon(emitter,eventName,options?):AsyncIterator<any[]>;
```

```
import { on, EventEmitter } from'node:events';importprocessfrom'node:process';
constee=newEventEmitter();
// Emit later onprocess.nextTick(() => {ee.emit('foo', 'bar');ee.emit('foo', 42);});
forawait (consteventofon(ee, 'foo')) {// The execution of this inner block is synchronous and it// processes one event at a time (even with await). Do not use// if concurrent execution is required.console.log(event); // prints ['bar'] [42]}// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw if the `EventEmitter` emits `'error'`. It removes all listeners when exiting the loop. The `value` returned by each iteration is an array composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```
import { on, EventEmitter } from'node:events';importprocessfrom'node:process';
constac=newAbortController();
(async () => {constee=newEventEmitter();
// Emit later onprocess.nextTick(() => {ee.emit('foo', 'bar');ee.emit('foo', 42);});
forawait (consteventofon(ee, 'foo', { signal:ac.signal })) {// The execution of this inner block is synchronous and it// processes one event at a time (even with await). Do not use// if concurrent execution is required.console.log(event); // prints ['bar'] [42]}// Unreachable here})();
process.nextTick(() =>ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```
import { on, EventEmitter } from'node:events';importprocessfrom'node:process';
constee=newEventEmitter();
// Emit later onprocess.nextTick(() => {ee.emit('foo', 'bar');ee.emit('foo', 42);ee.emit('close');});
forawait (consteventofon(ee, 'foo', { close: ['close'] })) {console.log(event); // prints ['bar'] [42]}// the loop will exit after 'close' is emittedconsole.log('done'); // prints 'done'
```

##### Parameters

| Parameter     | Type                                  |
| ------------- | ------------------------------------- |
| `emitter`   | `EventEmitter`                      |
| `eventName` | `string`                            |
| `options?`  | `StaticEventEmitterIteratorOptions` |

##### Returns

`AsyncIterator`<`any`[]>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

##### Since

v13.6.0, v12.16.0

##### Inherited from

```
RuntimeEventEmitter.on
```

#### Call Signature

```
staticon(emitter,eventName,options?):AsyncIterator<any[]>;
```

```
import { on, EventEmitter } from'node:events';importprocessfrom'node:process';
constee=newEventEmitter();
// Emit later onprocess.nextTick(() => {ee.emit('foo', 'bar');ee.emit('foo', 42);});
forawait (consteventofon(ee, 'foo')) {// The execution of this inner block is synchronous and it// processes one event at a time (even with await). Do not use// if concurrent execution is required.console.log(event); // prints ['bar'] [42]}// Unreachable here
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw if the `EventEmitter` emits `'error'`. It removes all listeners when exiting the loop. The `value` returned by each iteration is an array composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```
import { on, EventEmitter } from'node:events';importprocessfrom'node:process';
constac=newAbortController();
(async () => {constee=newEventEmitter();
// Emit later onprocess.nextTick(() => {ee.emit('foo', 'bar');ee.emit('foo', 42);});
forawait (consteventofon(ee, 'foo', { signal:ac.signal })) {// The execution of this inner block is synchronous and it// processes one event at a time (even with await). Do not use// if concurrent execution is required.console.log(event); // prints ['bar'] [42]}// Unreachable here})();
process.nextTick(() =>ac.abort());
```

Use the `close` option to specify an array of event names that will end the iteration:

```
import { on, EventEmitter } from'node:events';importprocessfrom'node:process';
constee=newEventEmitter();
// Emit later onprocess.nextTick(() => {ee.emit('foo', 'bar');ee.emit('foo', 42);ee.emit('close');});
forawait (consteventofon(ee, 'foo', { close: ['close'] })) {console.log(event); // prints ['bar'] [42]}// the loop will exit after 'close' is emittedconsole.log('done'); // prints 'done'
```

##### Parameters

| Parameter     | Type                                  |
| ------------- | ------------------------------------- |
| `emitter`   | `EventTarget`                       |
| `eventName` | `string`                            |
| `options?`  | `StaticEventEmitterIteratorOptions` |

##### Returns

`AsyncIterator`<`any`[]>

An `AsyncIterator` that iterates `eventName` events emitted by the `emitter`

##### Since

v13.6.0, v12.16.0

##### Inherited from

```
RuntimeEventEmitter.on
```

---

### once()

#### Call Signature

```
staticonce(emitter,eventName,options?):Promise<any[]>;
```

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given event or that is rejected if the `EventEmitter` emits `'error'` while waiting. The `Promise` will resolve with an array of all the arguments emitted to the given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special `'error'` event semantics and does not listen to the `'error'` event.

```
import { once, EventEmitter } from'node:events';importprocessfrom'node:process';
constee=newEventEmitter();
process.nextTick(() => {ee.emit('myevent', 42);});
const [value] =awaitonce(ee, 'myevent');console.log(value);
consterr=newError('kaboom');process.nextTick(() => {ee.emit('error', err);});
try {awaitonce(ee, 'myevent');} catch (err) {console.error('error happened', err);}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the ‘`error'` event itself, then it is treated as any other kind of event without special handling:

```
import { EventEmitter, once } from'node:events';
constee=newEventEmitter();
once(ee, 'error').then(([err]) =>console.log('ok', err.message)).catch((err) =>console.error('error', err.message));
ee.emit('error', newError('boom'));
// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```
import { EventEmitter, once } from'node:events';
constee=newEventEmitter();constac=newAbortController();
asyncfunctionfoo(emitter, event, signal) {try {awaitonce(emitter, event, { signal });console.log('event emitted!');} catch (error) {if (error.name==='AbortError') {console.error('Waiting for the event was canceled!');} else {console.error('There was an error', error.message);}}}
foo(ee, 'foo', ac.signal);ac.abort(); // Abort waiting for the eventee.emit('foo'); // Prints: Waiting for the event was canceled!
```

##### Parameters

| Parameter     | Type                          |
| ------------- | ----------------------------- |
| `emitter`   | `EventEmitter`              |
| `eventName` | `string`                    |
| `options?`  | `StaticEventEmitterOptions` |

##### Returns

`Promise`<`any`[]>

##### Since

v11.13.0, v10.16.0

##### Inherited from

```
RuntimeEventEmitter.once
```

#### Call Signature

```
staticonce(emitter,eventName,options?):Promise<any[]>;
```

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given event or that is rejected if the `EventEmitter` emits `'error'` while waiting. The `Promise` will resolve with an array of all the arguments emitted to the given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special `'error'` event semantics and does not listen to the `'error'` event.

```
import { once, EventEmitter } from'node:events';importprocessfrom'node:process';
constee=newEventEmitter();
process.nextTick(() => {ee.emit('myevent', 42);});
const [value] =awaitonce(ee, 'myevent');console.log(value);
consterr=newError('kaboom');process.nextTick(() => {ee.emit('error', err);});
try {awaitonce(ee, 'myevent');} catch (err) {console.error('error happened', err);}
```

The special handling of the `'error'` event is only used when `events.once()` is used to wait for another event. If `events.once()` is used to wait for the ‘`error'` event itself, then it is treated as any other kind of event without special handling:

```
import { EventEmitter, once } from'node:events';
constee=newEventEmitter();
once(ee, 'error').then(([err]) =>console.log('ok', err.message)).catch((err) =>console.error('error', err.message));
ee.emit('error', newError('boom'));
// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```
import { EventEmitter, once } from'node:events';
constee=newEventEmitter();constac=newAbortController();
asyncfunctionfoo(emitter, event, signal) {try {awaitonce(emitter, event, { signal });console.log('event emitted!');} catch (error) {if (error.name==='AbortError') {console.error('Waiting for the event was canceled!');} else {console.error('There was an error', error.message);}}}
foo(ee, 'foo', ac.signal);ac.abort(); // Abort waiting for the eventee.emit('foo'); // Prints: Waiting for the event was canceled!
```

##### Parameters

| Parameter     | Type                          |
| ------------- | ----------------------------- |
| `emitter`   | `EventTarget`               |
| `eventName` | `string`                    |
| `options?`  | `StaticEventEmitterOptions` |

##### Returns

`Promise`<`any`[]>

##### Since

v11.13.0, v10.16.0

##### Inherited from

```
RuntimeEventEmitter.once
```

---

### setMaxListeners()

```
staticsetMaxListeners(n?, ...eventTargets?):void;
```

```
import { setMaxListeners, EventEmitter } from'node:events';
consttarget=newEventTarget();constemitter=newEventEmitter();
setMaxListeners(5, target, emitter);
```

#### Parameters

| Parameter           | Type             | Description                                                                       |
| ------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `n?`              | `number`       | A non-negative number. The maximum number of listeners per `EventTarget` event. |
| …`eventTargets?` | (`EventTarget` | `EventEmitter`<`DefaultEventMap`>)[]                                          |

#### Returns

`void`

#### Since

v15.4.0

#### Inherited from

```
RuntimeEventEmitter.setMaxListeners
```
