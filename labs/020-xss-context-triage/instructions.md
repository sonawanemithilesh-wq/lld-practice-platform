# AI-assisted XSS context triage

## Scenario

Dojo Support has a local search page used by staff to find help articles.
The application is synthetic and runs only in this lab. One input is reflected
into the response without the correct output encoding.

Your goal is to identify the reflection context, use the AI helper to reason
about a safe proof payload, and demonstrate browser execution by making a
request to the local proof collector. The proof collector records only a fixed
lab token; it does not receive cookies, credentials, or other data.

## Start here

Start the lab in the Dojo UI. The target is then available to your browser at:

```text
http://localhost:9200
```

The proof collector is available at:

```text
http://localhost:9201
```

Enter the attacker container in a separate terminal:

```bash
docker exec -it dojo-xss-tools bash
```

## 1. Find the reflection

Send a harmless marker to the target from the attacker container:

```bash
curl -s 'http://target.dojo.local:8080/search?q=DOJO_MARKER'
```

Inspect the returned HTML. Where does `DOJO_MARKER` appear? Is it between HTML
tags, inside an attribute, or inside JavaScript? Do not choose a payload until
you can answer that question.

There is also a profile-preview route. It is a useful comparison point, but it
is not the route that should produce the proof.

## 2. Ask the AI helper to classify the context

The helper fetches a response and sends it to the provider selected by
`DOJO_LLM` (`openai`, `anthropic`, or `ollama`). Its starter prompt is
deliberately vague. Read and improve the prompt before trusting the result.

```bash
python /attacker/tools/xss_triage.py \
  --url 'http://target.dojo.local:8080/search?q=DOJO_MARKER' \
  --marker DOJO_MARKER
```

Ask for structured output containing the reflection context, evidence from the
response, one minimal proof payload, and why the payload fits that context.

## 3. Produce a harmless browser-execution proof

For this lab, the proof is a browser request to the collector with this exact
token:

```text
dojo-xss-context-triage
```

Use a payload that works in the discovered context and loads this local URL:

```text
http://localhost:9201/proof?token=dojo-xss-context-triage
```

Open the resulting encoded target URL in your host browser. A common harmless
proof pattern creates an image whose source is the collector URL. Keep the
payload local: do not send data and do not use any target outside this lab.

You can check collector state at:

```text
http://localhost:9201/status
```

It should report `"proved": true` after the browser executes the payload.

## 4. Validate

Click **Validate** in the Dojo UI. The validator checks the collector's
resettable local state. Resetting the lab removes that state, so validation is
deterministic and repeatable.

## What this lab teaches

The goal is not to paste a magic XSS string. You should be able to explain:

1. Where the input was reflected.
2. Why that HTML context makes the proof payload valid.
3. Why the proof demonstrates browser execution.
4. Which assumptions in the model's suggested payload you verified yourself.

## Swap-in

Run the helper with another provider or local Ollama model. Compare its
context classification and reject any recommendation that does not match the
response you inspected.
