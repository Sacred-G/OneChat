# Handoffs

Handoffs let an agent delegate part of a conversation to another agent. This is useful when different agents specialise in specific areas. In a customer support app for example, you might have agents that handle bookings, refunds or FAQs.

Handoffs are represented as tools to the LLM. If you hand off to an agent called `Refund Agent`, the tool name would be `transfer_to_refund_agent`.

## Creating a handoff

Every agent accepts a `handoffs` option. It can contain other `Agent` instances or `Handoff` objects returned by the `handoff()` helper.

### Basic usage

Basic handoffs

```
import { Agent, handoff } from'@openai/agents';
constbillingAgent=newAgent({ name:'Billing agent' });constrefundAgent=newAgent({ name:'Refund agent' });
// Use Agent.create method to ensure the finalOutput type considers handoffsconsttriageAgent=Agent.create({name:'Triage agent',handoffs: [billingAgent, handoff(refundAgent)],});
```

### Customising handoffs via `handoff()`

The `handoff()` function lets you tweak the generated tool.

* `agent` – the agent to hand off to.
* `toolNameOverride` – override the default `transfer_to_<agent_name>` tool name.
* `toolDescriptionOverride` – override the default tool description.
* `onHandoff` – callback when the handoff occurs. Receives a `RunContext` and optionally parsed input.
* `inputType` – expected input schema for the handoff.
* `inputFilter` – filter the history passed to the next agent.

Customized handoffs

```
import { z } from'zod';import { Agent, handoff, RunContext } from'@openai/agents';
constFooSchema=z.object({ foo:z.string() });
functiononHandoff(ctx:RunContext, input?: { foo:string }) {console.log('Handoff called with:', input?.foo);}
constagent=newAgent({ name:'My agent' });
consthandoffObj=handoff(agent, {onHandoff,inputType:FooSchema,toolNameOverride:'custom_handoff_tool',toolDescriptionOverride:'Custom description',});
```

## Handoff inputs

Sometimes you want the LLM to provide data when invoking a handoff. Define an input schema and use it in `handoff()`.

Handoff inputs

```
import { z } from'zod';import { Agent, handoff, RunContext } from'@openai/agents';
constEscalationData=z.object({ reason:z.string() });typeEscalationData=z.infer<typeofEscalationData>;
asyncfunctiononHandoff(ctx:RunContext<EscalationData>,input:EscalationData|undefined,) {console.log(`Escalation agent called with reason: ${input?.reason}`);}
constagent=newAgent<EscalationData>({ name:'Escalation agent' });
consthandoffObj=handoff(agent, {onHandoff,inputType:EscalationData,});
```

## Input filters

By default a handoff receives the entire conversation history. To modify what gets passed to the next agent, provide an `inputFilter`. Common helpers live in `@openai/agents-core/extensions`.

Input filters

```
import { Agent, handoff } from'@openai/agents';import { removeAllTools } from'@openai/agents-core/extensions';
constagent=newAgent({ name:'FAQ agent' });
consthandoffObj=handoff(agent, {inputFilter:removeAllTools,});
```

## Recommended prompts

LLMs respond more reliably when your prompts mention handoffs. The SDK exposes a recommended prefix via `RECOMMENDED_PROMPT_PREFIX`.

Recommended prompts

```
import { Agent } from'@openai/agents';import { RECOMMENDED_PROMPT_PREFIX } from'@openai/agents-core/extensions';
constbillingAgent=newAgent({name:'Billing agent',instructions:`${RECOMMENDED_PROMPT_PREFIX}Fill in the rest of your prompt here.`,});
```
