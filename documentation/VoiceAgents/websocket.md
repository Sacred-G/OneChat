# OpenAIRealtimeWebSocket

Transport layer that’s handling the connection between the client and OpenAI’s Realtime API via WebSockets. While this transport layer is designed to be used within a RealtimeSession, it can also be used standalone if you want to have a direct connection to the Realtime API.

## Extends

* [`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/)

## Extended by

* [`OpenAIRealtimeSIP`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimesip/)

## Implements

* [`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/)

## Constructors

### Constructor

```
newOpenAIRealtimeWebSocket(options): OpenAIRealtimeWebSocket;
```

#### Parameters

| Parameter   | Type                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options` | [`OpenAIRealtimeWebSocketOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimewebsocketoptions/) |

#### Returns

`OpenAIRealtimeWebSocket`

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`constructor`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#constructor)

## Accessors

### _tracingConfig

#### Set Signature

```
set_tracingConfig(tracingConfig): void;
```

Sets the internal tracing config. This is used to track the tracing config that has been set during the session.create event.

##### Parameters

| Parameter         | Type                      |
| ----------------- | ------------------------- |
| `tracingConfig` | `RealtimeTracingConfig` |

##### Returns

`void`

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`_tracingConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#_tracingconfig)

---

### connectionState

#### Get Signature

```
getconnectionState(): WebSocketState;
```

The current connection state of the WebSocket connection.

##### Returns

[`WebSocketState`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/websocketstate/)

---

### currentModel

#### Get Signature

```
getcurrentModel(): OpenAIRealtimeModels;
```

The current model that is being used by the transport layer.

##### Returns

[`OpenAIRealtimeModels`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimemodels/)

#### Set Signature

```
setcurrentModel(model): void;
```

The current model that is being used by the transport layer.  **Note** : The model cannot be changed mid conversation.

##### Parameters

| Parameter | Type                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `model` | [`OpenAIRealtimeModels`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimemodels/) |

##### Returns

`void`

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`currentModel`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#currentmodel)

---

### muted

#### Get Signature

```
getmuted(): null;
```

Always returns `null` as the WebSocket transport layer does not handle muting. Instead, this should be handled by the client by not triggering the `sendAudio` method.

##### Returns

`null`

Whether the input audio track is currently muted null if the muting is not handled by the transport layer

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`muted`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#muted)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`muted`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#muted)

---

### status

#### Get Signature

```
getstatus(): "connecting"|"connected"|"disconnected";
```

The current status of the WebSocket connection.

##### Returns

`"connecting"` | `"connected"` | `"disconnected"`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`status`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#status)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`status`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#status)

## Methods

### _cancelResponse()

```
_cancelResponse(): void;
```

Send a cancel response event to the Realtime API. This is used to cancel an ongoing response that the model is currently generating.

#### Returns

`void`

---

### _interrupt()

```
_interrupt(elapsedTime, cancelOngoingResponse): void;
```

Do NOT call this method directly. Call `interrupt()` instead for proper interruption handling.

This method is used to send the right events to the API to inform the model that the user has interrupted the response. It might be overridden/extended by an extended transport layer. See the `TwilioRealtimeTransportLayer` for an example.

#### Parameters

| Parameter                 | Type        | Default value | Description                                  |
| ------------------------- | ----------- | ------------- | -------------------------------------------- |
| `elapsedTime`           | `number`  | `undefined` | The elapsed time since the response started. |
| `cancelOngoingResponse` | `boolean` | `true`      | ‐                                           |

#### Returns

`void`

---

### addImage()

```
addImage(image, options): void;
```

Sends an image to the model

#### Parameters

| Parameter                    | Type                                  | Description                                  |
| ---------------------------- | ------------------------------------- | -------------------------------------------- |
| `image`                    | `string`                            | The image to send                            |
| `options`                  | {`triggerResponse?`: `boolean`; } | Additional options                           |
| `options.triggerResponse?` | `boolean`                           | Whether to trigger a response from the model |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`addImage`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#addimage)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`addImage`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#addimage)

---

### buildSessionPayload()

```
buildSessionPayload(config): RealtimeSessionPayload;
```

Build the payload object expected by the Realtime API when creating or updating a session.

The helper centralises the conversion from camelCase runtime config to the snake_case payload required by the Realtime API so transports that need a one-off payload (for example SIP call acceptance) can reuse the same logic without duplicating private state.

#### Parameters

| Parameter  | Type                                                                                                                                                                                                                                                                               | Description                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `config` | `Partial`[[`RealtimeSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)](%5B%60RealtimeSessionConfig%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)) | The session config to merge with defaults. |

#### Returns

[`RealtimeSessionPayload`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionpayload/)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`buildSessionPayload`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#buildsessionpayload)

---

### close()

```
close(): void;
```

Close the WebSocket connection.

This will also reset any internal connection tracking used for interruption handling.

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`close`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#close)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`close`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#close)

---

### connect()

```
connect(options): Promise<void>;
```

Establishes the connection to the model and keeps the connection alive

#### Parameters

| Parameter   | Type                                                                                                                                                         | Description                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `options` | [`RealtimeTransportLayerConnectOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransportlayerconnectoptions/) | The options for the connection |

#### Returns

`Promise`<`void`>

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`connect`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#connect)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`connect`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#connect)

---

### emit()

```
emit<K>(type, ...args): boolean;
```

#### Type Parameters

| Type Parameter                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof [`RealtimeTransportEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransporteventtypes/) |

#### Parameters

| Parameter  | Type                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | `K`                                                                                                                                       |
| …`args` | [`OpenAIRealtimeEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimeeventtypes/)[`K`] |

#### Returns

`boolean`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`emit`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#emit)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`emit`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#emit)

---

### interrupt()

```
interrupt(cancelOngoingResponse): void;
```

Interrupt the ongoing response. This method is triggered automatically by the client when voice activity detection (VAD) is enabled (default) as well as when an output guardrail got triggered.

You can also call this method directly if you want to interrupt the conversation for example based on an event in the client.

#### Parameters

| Parameter                 | Type        | Default value |
| ------------------------- | ----------- | ------------- |
| `cancelOngoingResponse` | `boolean` | `true`      |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`interrupt`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#interrupt)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`interrupt`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#interrupt)

---

### mute()

```
mute(_muted): never;
```

Will throw an error as the WebSocket transport layer does not support muting.

#### Parameters

| Parameter  | Type        |
| ---------- | ----------- |
| `_muted` | `boolean` |

#### Returns

`never`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`mute`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#mute)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`mute`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#mute)

---

### off()

```
off<K>(type, listener): EventEmitter<EventTypes>;
```

#### Type Parameters

| Type Parameter                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof [`RealtimeTransportEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransporteventtypes/) |

#### Parameters

| Parameter    | Type                     |
| ------------ | ------------------------ |
| `type`     | `K`                    |
| `listener` | (…`args`) => `void` |

#### Returns

`EventEmitter`<`EventTypes`>

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`off`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#off)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`off`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#off)

---

### on()

```
on<K>(type, listener): EventEmitter<EventTypes>;
```

#### Type Parameters

| Type Parameter                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof [`RealtimeTransportEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransporteventtypes/) |

#### Parameters

| Parameter    | Type                     |
| ------------ | ------------------------ |
| `type`     | `K`                    |
| `listener` | (…`args`) => `void` |

#### Returns

`EventEmitter`<`EventTypes`>

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`on`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#on)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`on`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#on)

---

### once()

```
once<K>(type, listener): EventEmitter<EventTypes>;
```

#### Type Parameters

| Type Parameter                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K` *extends* keyof [`RealtimeTransportEventTypes`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransporteventtypes/) |

#### Parameters

| Parameter    | Type                     |
| ------------ | ------------------------ |
| `type`     | `K`                    |
| `listener` | (…`args`) => `void` |

#### Returns

`EventEmitter`<`EventTypes`>

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`once`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#once)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`once`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#once)

---

### resetHistory()

```
resetHistory(oldHistory, newHistory): void;
```

Reset the history of the conversation. This will create a diff between the old and new history and send the necessary events to the Realtime API to update the history.

#### Parameters

| Parameter      | Type                                                                                                           | Description                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `oldHistory` | [`RealtimeItem`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[] | The old history of the conversation. |
| `newHistory` | [`RealtimeItem`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimeitem/)[] | The new history of the conversation. |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`resetHistory`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#resethistory)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`resetHistory`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#resethistory)

---

### sendAudio()

```
sendAudio(audio, options): void;
```

Send an audio buffer to the Realtime API. This is used for your client to send audio to the model to respond.

#### Parameters

| Parameter           | Type                         | Description                       |
| ------------------- | ---------------------------- | --------------------------------- |
| `audio`           | `ArrayBuffer`              | The audio buffer to send.         |
| `options`         | {`commit?`: `boolean`; } | The options for the audio buffer. |
| `options.commit?` | `boolean`                  | ‐                                |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendAudio`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendaudio)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendAudio`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendaudio)

---

### sendEvent()

```
sendEvent(event): void;
```

Send an event to the Realtime API. This will stringify the event and send it directly to the API. This can be used if you want to take control over the connection and send events manually.

#### Parameters

| Parameter | Type                                                                                                                           | Description        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `event` | [`RealtimeClientMessage`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimeclientmessage/) | The event to send. |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendEvent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendevent)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendEvent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendevent)

---

### sendFunctionCallOutput()

```
sendFunctionCallOutput(toolCall,output,startResponse): void;
```

Send the output of a function call to the Realtime API.

#### Parameters

| Parameter         | Type                                                                                                                             | Default value | Description                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------- |
| `toolCall`      | [`TransportToolCallEvent`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/transporttoolcallevent/) | `undefined` | The tool call to send the output for.                     |
| `output`        | `string`                                                                                                                       | `undefined` | The output of the function call.                          |
| `startResponse` | `boolean`                                                                                                                      | `true`      | Whether to start a new response after sending the output. |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendFunctionCallOutput`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendfunctioncalloutput)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendFunctionCallOutput`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendfunctioncalloutput)

---

### sendMcpResponse()

```
sendMcpResponse(approvalRequest, approved): void;
```

Sends a response for an MCP tool call

#### Parameters

| Parameter                       | Type                            | Description                                                                                                                                                                  |
| ------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approvalRequest`             | {`approved?`: `boolean`     | `null`; `arguments`: `Record`<`string`, `any`>; `itemId`: `string`; `name`: `string`; `serverLabel`: `string`; `type`: `"mcp_approval_request"`; } |
| `approvalRequest.approved?`   | `boolean`                     | `null`                                                                                                                                                                     |
| `approvalRequest.arguments`   | `Record`<`string`, `any`> | ‐                                                                                                                                                                           |
| `approvalRequest.itemId`      | `string`                      | ‐                                                                                                                                                                           |
| `approvalRequest.name`        | `string`                      | ‐                                                                                                                                                                           |
| `approvalRequest.serverLabel` | `string`                      | ‐                                                                                                                                                                           |
| `approvalRequest.type`        | `"mcp_approval_request"`      | ‐                                                                                                                                                                           |
| `approved`                    | `boolean`                     | Whether the tool call was approved or rejected                                                                                                                               |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendMcpResponse`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendmcpresponse)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendMcpResponse`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendmcpresponse)

---

### sendMessage()

```
sendMessage(message,otherEventData,__namedParameters): void;
```

Send a message to the Realtime API. This will create a new item in the conversation and trigger a response.

#### Parameters

| Parameter                              | Type                                  | Description                    |
| -------------------------------------- | ------------------------------------- | ------------------------------ |
| `message`                            | `RealtimeUserInput`                 | The message to send.           |
| `otherEventData`                     | `Record`<`string`, `any`>       | Additional event data to send. |
| `__namedParameters`                  | {`triggerResponse?`: `boolean`; } | ‐                             |
| `__namedParameters.triggerResponse?` | `boolean`                           | ‐                             |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`sendMessage`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendmessage)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`sendMessage`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#sendmessage)

---

### updateSessionConfig()

```
updateSessionConfig(config): void;
```

Updates the session config. This will merge it with the current session config with the default values and send it to the Realtime API.

#### Parameters

| Parameter  | Type                                                                                                                                                                                                                                                                               | Description                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `config` | `Partial`[[`RealtimeSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)](%5B%60RealtimeSessionConfig%60%5D(https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimesessionconfig/)) | The session config to update. |

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`updateSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#updatesessionconfig)

#### Inherited from

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`updateSessionConfig`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#updatesessionconfig)
