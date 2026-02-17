# OpenAIRealtimeWebRTC

Transport layer that’s handling the connection between the client and OpenAI’s Realtime API via WebRTC. While this transport layer is designed to be used within a RealtimeSession, it can also be used standalone if you want to have a direct connection to the Realtime API.

Unless you specify a `mediaStream` or `audioElement` option, the transport layer will automatically configure the microphone and audio output to be used by the session.

## Extends

* [`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/)

## Implements

* [`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/)

## Constructors

### Constructor

```
newOpenAIRealtimeWebRTC(options): OpenAIRealtimeWebRTC;
```

#### Parameters

| Parameter   | Type                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `options` | [`OpenAIRealtimeWebRTCOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/openairealtimewebrtcoptions/) |

#### Returns

`OpenAIRealtimeWebRTC`

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

### callId

#### Get Signature

```
getcallId(): string|undefined;
```

The current call ID of the WebRTC connection.

##### Returns

`string` | `undefined`

---

### connectionState

#### Get Signature

```
getconnectionState(): WebRTCState;
```

The current connection state of the WebRTC connection including the peer connection and data channel.

##### Returns

[`WebRTCState`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/webrtcstate/)

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

[`OpenAIRealtimeWebSocket`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimewebsocket/).[`currentModel`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimewebsocket/#currentmodel)

---

### muted

#### Get Signature

```
getmuted(): boolean;
```

Whether the session is muted.

##### Returns

`boolean`

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

The current status of the WebRTC connection.

##### Returns

`"connecting"` | `"connected"` | `"disconnected"`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`status`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#status)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`status`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#status)

## Methods

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

Close the connection to the Realtime API and disconnects the underlying WebRTC connection.

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

Connect to the Realtime API. This will establish the connection to the OpenAI Realtime API via WebRTC.

If you are using a browser, the transport layer will also automatically configure the microphone and audio output to be used by the session.

#### Parameters

| Parameter   | Type                                                                                                                                                         | Description                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `options` | [`RealtimeTransportLayerConnectOptions`](https://openai.github.io/openai-agents-js/openai/agents-realtime/type-aliases/realtimetransportlayerconnectoptions/) | The options for the connection. |

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
interrupt(): void;
```

Interrupt the current response if one is ongoing and clear the audio buffer so that the agent stops talking.

#### Returns

`void`

#### Implementation of

[`RealtimeTransportLayer`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/).[`interrupt`](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#interrupt)

#### Overrides

[`OpenAIRealtimeBase`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/).[`interrupt`](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/openairealtimebase/#interrupt)

---

### mute()

```
mute(muted): void;
```

Mute or unmute the session.

#### Parameters

| Parameter | Type        | Description                  |
| --------- | ----------- | ---------------------------- |
| `muted` | `boolean` | Whether to mute the session. |

#### Returns

`void`

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

Send an audio buffer to the Realtime API. If `{ commit: true }` is passed, the audio buffer will be committed and the model will start processing it. This is necessary if you have disabled turn detection / voice activity detection (VAD).

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

#### Inherited from

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
