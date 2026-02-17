# Realtime Transport Layer

## Default transport layers

### Connecting over WebRTC

The default transport layer uses WebRTC. Audio is recorded from the microphone and played back automatically.

To use your own media stream or audio element, provide an `OpenAIRealtimeWebRTC` instance when creating the session.

```
import { RealtimeAgent, RealtimeSession, OpenAIRealtimeWebRTC } from'@openai/agents/realtime';
constagent=newRealtimeAgent({name:'Greeter',instructions:'Greet the user with cheer and answer questions.',});
asyncfunctionmain() {consttransport=newOpenAIRealtimeWebRTC({mediaStream:awaitnavigator.mediaDevices.getUserMedia({ audio:true }),audioElement:document.createElement('audio'),});
constcustomSession=newRealtimeSession(agent, { transport });}
```

### Connecting over WebSocket

Pass `transport: 'websocket'` or an instance of `OpenAIRealtimeWebSocket` when creating the session to use a WebSocket connection instead of WebRTC. This works well for server-side use cases, for example building a phone agent with Twilio.

```
import { RealtimeAgent, RealtimeSession } from'@openai/agents/realtime';
constagent=newRealtimeAgent({name:'Greeter',instructions:'Greet the user with cheer and answer questions.',});
constmyRecordedArrayBuffer=newArrayBuffer(0);
constwsSession=newRealtimeSession(agent, {transport:'websocket',model:'gpt-realtime',});awaitwsSession.connect({ apiKey:process.env.OPENAI_API_KEY! });
wsSession.on('audio', (event) => {// event.data is a chunk of PCM16 audio});
wsSession.sendAudio(myRecordedArrayBuffer);
```

Use any recording/playback library to handle the raw PCM16 audio bytes.

### Connecting over SIP

Bridge SIP calls from providers such as Twilio by using the `OpenAIRealtimeSIP` transport. The transport keeps the Realtime session synchronized with SIP events emitted by your telephony provider.

1. Accept the incoming call by generating an initial session configuration with `OpenAIRealtimeSIP.buildInitialConfig()`. This ensures the SIP invitation and Realtime session share identical defaults.
2. Attach a `RealtimeSession` that uses the `OpenAIRealtimeSIP` transport and connect with the `callId` issued by the provider webhook.
3. Listen for session events to drive call analytics, transcripts, or escalation logic.

```
importOpenAIfrom'openai';import {OpenAIRealtimeSIP,RealtimeAgent,RealtimeSession,typeRealtimeSessionOptions,} from'@openai/agents/realtime';
constopenai=newOpenAI({apiKey:process.env.OPENAI_API_KEY!,webhookSecret:process.env.OPENAI_WEBHOOK_SECRET!,});
constagent=newRealtimeAgent({name:'Receptionist',instructions:'Welcome the caller, answer scheduling questions, and hand off if the caller requests a human.',});
constsessionOptions:Partial<RealtimeSessionOptions> = {model:'gpt-realtime',config: {audio: {input: {turnDetection: { type:'semantic_vad', interruptResponse:true },},},},};
exportasyncfunctionacceptIncomingCall(callId:string):Promise<void> {constinitialConfig=awaitOpenAIRealtimeSIP.buildInitialConfig(agent,sessionOptions,);awaitopenai.realtime.calls.accept(callId, initialConfig);}
exportasyncfunctionattachRealtimeSession(callId:string,):Promise<RealtimeSession> {constsession=newRealtimeSession(agent, {transport:newOpenAIRealtimeSIP(),...sessionOptions,});
session.on('history_added', (item) => {console.log('Realtime update:', item.type);});
awaitsession.connect({apiKey:process.env.OPENAI_API_KEY!,callId,});
returnsession;}
```

#### Cloudflare Workers (workerd) note

Cloudflare Workers and other workerd runtimes cannot open outbound WebSockets using the global `WebSocket` constructor. Use the Cloudflare transport from the extensions package, which performs the `fetch()`-based upgrade internally.

```
import { CloudflareRealtimeTransportLayer } from'@openai/agents-extensions';import { RealtimeAgent, RealtimeSession } from'@openai/agents/realtime';
constagent=newRealtimeAgent({name:'My Agent',});
// Create a transport that connects to OpenAI Realtime via Cloudflare/workerd's fetch-based upgrade.constcfTransport=newCloudflareRealtimeTransportLayer({url:'wss://api.openai.com/v1/realtime?model=gpt-realtime',});
constsession=newRealtimeSession(agent, {// Set your own transport.transport:cfTransport,});
```

### Building your own transport mechanism

If you want to use a different speech-to-speech API or have your own custom transport mechanism, you can create your own by implementing the `RealtimeTransportLayer` interface and emit the `RealtimeTransportEventTypes` events.

## Interacting with the Realtime API more directly

If you want to use the OpenAI Realtime API but have more direct access to the Realtime API, you have two options:

### Option 1 - Accessing the transport layer

If you still want to benefit from all of the capabilities of the `RealtimeSession` you can access your transport layer through `session.transport`.

The transport layer will emit every event it receives under the `*` event and you can send raw events using the `sendEvent()` method.

```
import { RealtimeAgent, RealtimeSession } from'@openai/agents/realtime';
constagent=newRealtimeAgent({name:'Greeter',instructions:'Greet the user with cheer and answer questions.',});
constsession=newRealtimeSession(agent, {model:'gpt-realtime',});
session.transport.on('*', (event) => {// JSON parsed version of the event received on the connection});
// Send any valid event as JSON. For example triggering a new responsesession.transport.sendEvent({type:'response.create',// ...});
```

### Option 2 — Only using the transport layer

If you don’t need automatic tool execution, guardrails, etc. you can also use the transport layer as a “thin” client that just manages connection and interruptions.

```
import { OpenAIRealtimeWebRTC } from'@openai/agents/realtime';
constclient=newOpenAIRealtimeWebRTC();constaudioBuffer=newArrayBuffer(0);
awaitclient.connect({apiKey:'<api key>',model:'gpt-4o-mini-realtime-preview',initialSessionConfig: {instructions:'Speak like a pirate',voice:'ash',modalities: ['text', 'audio'],inputAudioFormat:'pcm16',outputAudioFormat:'pcm16',},});
// optionally for WebSocketsclient.on('audio', (newAudio) => {});
client.sendAudio(audioBuffer);
```
