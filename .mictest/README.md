# Microphone test harness (optional dev tooling)

Headless behavioural tests for the Chatbot microphone. Nothing in here is
imported by the app or included in the production build — the folder is dot-
prefixed and lives outside `src/`.

## Run

```bash
cd frontend
npm install                       # project deps
npm install --no-save jsdom       # the only extra dependency, not added to package.json
npx vite build --config .mictest/vite.config.js   # bundles the real Chatbot component
node .mictest/mic.test.mjs
```

## What it does

Mounts the **real** `Chatbot` component in jsdom, replaces `window.SpeechRecognition`
with a fake that mimics Chrome's event ordering (`onstart` → `onresult` →
`onend`, interim results resolving into finals, error codes), and drives each
scenario from the brief. Outgoing `/api/chat` requests are captured through an
axios adapter, so the tests assert on what the chat pipeline actually received.

23 tests cover: transcript assembly, interim vs final text, manual stop, silence,
permission denial, audio-capture failure, network errors, no-speech looping,
instance counting, double-send prevention, empty speech, unmount cleanup, and
that normal typing / Enter / the Send button still work.
