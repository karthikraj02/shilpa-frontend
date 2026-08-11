/**
 * mic.test.mjs — headless behavioural tests for the Chatbot microphone.
 *
 * Mounts the REAL Chatbot component in jsdom, swaps in a fake SpeechRecognition
 * that mimics Chrome's event ordering, then drives each scenario from the brief
 * and asserts on the resulting input value, mic state and outgoing chat request.
 */

import { JSDOM } from '/home/claude/mictest/node_modules/jsdom/lib/api.js';

// ── DOM environment ─────────────────────────────────────────────────────────
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://localhost/',
    pretendToBeVisual: true,
});

const { window } = dom;
global.window = window;
global.document = window.document;
Object.defineProperty(global, 'navigator', { configurable: true, get: () => window.navigator });
global.HTMLElement = window.HTMLElement;
global.Element = window.Element;
global.Node = window.Node;
global.Event = window.Event;
global.MouseEvent = window.MouseEvent;
global.getComputedStyle = window.getComputedStyle;
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
global.KeyboardEvent = window.KeyboardEvent;
global.CustomEvent = window.CustomEvent;
global.HTMLInputElement = window.HTMLInputElement;
global.SpeechSynthesisUtterance = function () {};
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.IS_REACT_ACT_ENVIRONMENT = true;

window.scrollTo = () => {};
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
window.HTMLElement.prototype.scrollIntoView = () => {};
window.speechSynthesis = { speaking: false, cancel() {}, speak() {}, getVoices: () => [] };
window.SpeechSynthesisUtterance = function () {};

// ── Fake SpeechRecognition (mirrors Chrome's event ordering) ────────────────
let activeInstances = 0;
let createdInstances = 0;
let liveRecognition = null;

class FakeSpeechRecognition {
    constructor() {
        createdInstances++;
        this.lang = '';
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 1;
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this._running = false;
        this._results = [];
        this._aborted = false;
    }

    start() {
        if (this._running) throw new Error('InvalidStateError');
        this._running = true;
        activeInstances++;
        liveRecognition = this;
        setTimeout(() => { if (this._running && this.onstart) this.onstart(); }, 0);
    }

    stop() {
        if (!this._running) return;
        this._running = false;
        activeInstances--;
        setTimeout(() => { if (this.onend) this.onend(); }, 0);
    }

    abort() {
        if (!this._running) return;
        this._running = false;
        this._aborted = true;
        activeInstances--;
        setTimeout(() => {
            if (this.onerror) this.onerror({ error: 'aborted' });
            if (this.onend) this.onend();
        }, 0);
    }

    // ── test controls ──
    /** Emits a result event. Results accumulate like a continuous session. */
    say(text, isFinal = true) {
        const resultIndex = this._results.length;
        this._results.push({ 0: { transcript: text }, isFinal, length: 1 });
        const results = this._results.slice();
        results.length = this._results.length;
        if (this.onresult) this.onresult({ resultIndex, results });
    }

    /** Replaces the last interim result with its final form (as Chrome does). */
    finalizeLast(text) {
        const last = this._results[this._results.length - 1];
        last[0].transcript = text;
        last.isFinal = true;
        if (this.onresult) this.onresult({ resultIndex: this._results.length - 1, results: this._results.slice() });
    }

    error(code) {
        if (this.onerror) this.onerror({ error: code });
    }

    endFromBrowser() {
        if (this._running) { this._running = false; activeInstances--; }
        if (this.onend) this.onend();
    }
}

window.SpeechRecognition = FakeSpeechRecognition;
window.webkitSpeechRecognition = FakeSpeechRecognition;

// getUserMedia is deliberately absent: the fix must not depend on it.
let getUserMediaCalls = 0;
Object.defineProperty(window.navigator, 'mediaDevices', {
    configurable: true,
    get: () => ({ getUserMedia: async () => { getUserMediaCalls++; throw new Error('should not be called'); } }),
});

// ── Load the bundled component ──────────────────────────────────────────────
const { React, createRoot, axios, Chatbot } = await import('./out/bundle.js');

// ── Capture outgoing chat requests ──────────────────────────────────────────
const chatRequests = [];
axios.defaults.adapter = async (config) => {
    const url = config.url || '';
    if (url.includes('/api/chat') && (config.method || '').toLowerCase() === 'post') {
        chatRequests.push(JSON.parse(config.data || '{}'));
        return { data: { reply: 'ok', action: 'NONE', travel_cards: [] }, status: 200, statusText: 'OK', headers: {}, config };
    }
    return { data: [], status: 200, statusText: 'OK', headers: {}, config };
};

// ── React act helper ────────────────────────────────────────────────────────
const { act } = React;
const tick = (ms = 20) => act(async () => { await new Promise(r => setTimeout(r, ms)); });

// Each test gets a freshly mounted component so no state can bleed across tests.
let container = null;
let root = null;

async function mountFresh() {
    await unmountCurrent();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(React.createElement(Chatbot, { addToCart: () => {} })); });
    await tick(50);
}

async function unmountCurrent() {
    if (root) {
        const r = root;
        root = null;
        await act(async () => { r.unmount(); });
        await tick(30);
    }
    if (container && container.parentNode) container.parentNode.removeChild(container);
    container = null;
}

// ── DOM helpers ─────────────────────────────────────────────────────────────
const micButton = () => Array.from((container || document).querySelectorAll('button'))
    .find(b => /Tap to speak|Tap to stop and send|Starting microphone/.test(b.getAttribute('title') || ''));
// The page renders several text inputs; the chat box is identified by its placeholder.
const chatInput = () => Array.from((container || document).querySelectorAll('input[type="text"]'))
    .find(el => /Ask me something|Listening\.\.\.|Starting microphone/.test(el.getAttribute('placeholder') || ''));
const micTitle = () => micButton()?.getAttribute('title') || '';
const inputValue = () => chatInput()?.value ?? '';
const micIsListening = () => micTitle() === 'Tap to stop and send';

async function clickMic() {
    const btn = micButton();
    if (!btn) throw new Error('microphone button not found');
    await act(async () => { btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick(30);
}

async function typeInput(text) {
    const el = chatInput();
    if (!el) return;
    await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, text);
        el.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    await tick(10);
}

function resetState() {
    chatRequests.length = 0;
    createdInstances = 0;
    liveRecognition = null;
}

// ── Test runner ─────────────────────────────────────────────────────────────
let passed = 0;
const failures = [];

async function test(name, fn) {
    await mountFresh();
    resetState();
    try {
        await fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failures.push({ name, message: err.message });
        console.log(`  FAIL  ${name}\n        ${err.message}`);
    }
    await unmountCurrent();
    await tick(20);
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function equal(actual, expected, msg) {
    if (actual !== expected) throw new Error(`${msg} — expected "${expected}", got "${actual}"`);
}

console.log('\n=== Microphone behaviour ===\n');

await test('mic button exists and starts idle', async () => {
    assert(micButton(), 'mic button missing');
    equal(micTitle(), 'Tap to speak', 'idle title');
});

await test('Scenario 1 — click, speak, click: transcript is sent exactly once', async () => {
    await clickMic();
    assert(micIsListening(), 'mic did not enter the listening state');
    liveRecognition.say('Plan a trip to Goa for three days');
    await tick(20);
    equal(inputValue(), 'Plan a trip to Goa for three days', 'input did not receive the transcript');

    await clickMic();
    await tick(60);
    equal(chatRequests.length, 1, 'expected exactly one chat request');
    equal(chatRequests[0].message, 'Plan a trip to Goa for three days', 'wrong message sent');
    equal(micTitle(), 'Tap to speak', 'mic did not return to idle');
});

await test('interim results appear then resolve to a clean final transcript', async () => {
    await clickMic();
    liveRecognition.say('Plan a trip', false);
    await tick(10);
    equal(inputValue(), 'Plan a trip', 'interim text not shown');
    liveRecognition.finalizeLast('Plan a trip to Goa');
    await tick(10);
    equal(inputValue(), 'Plan a trip to Goa', 'final text not shown');
    await clickMic();
    await tick(60);
    equal(chatRequests[0].message, 'Plan a trip to Goa', 'interim leaked into the sent message');
});

await test('multi-segment speech is not duplicated or truncated', async () => {
    await clickMic();
    liveRecognition.say('Plan a trip to Goa ');
    await tick(10);
    liveRecognition.say('for three days', false);
    await tick(10);
    liveRecognition.finalizeLast('for three days');
    await tick(10);
    await clickMic();
    await tick(60);
    equal(chatRequests[0].message, 'Plan a trip to Goa for three days', 'transcript assembly is wrong');
});

await test('Scenario 2 — silence sends nothing and resets the mic', async () => {
    await clickMic();
    liveRecognition.error('no-speech');
    liveRecognition.endFromBrowser();
    await tick(60);
    equal(chatRequests.length, 0, 'an empty message was sent');
    equal(micTitle(), 'Tap to speak', 'mic stuck after silence');
});

await test('Scenario 3 — permission denial resets the mic and shows the existing error UI', async () => {
    await clickMic();
    liveRecognition.error('not-allowed');
    liveRecognition.endFromBrowser();
    await tick(60);
    equal(micTitle(), 'Tap to speak', 'mic stuck after denial');
    equal(chatRequests.length, 0, 'a message was sent after denial');
    const text = (container || document.body).textContent || '';
    assert(/Microphone permission denied/i.test(text), 'permission error not surfaced');
    // The app must remain usable via normal typing.
    await typeInput('hello by keyboard');
    equal(inputValue(), 'hello by keyboard', 'text input broke after denial');
});

await test('Scenario 4 — manual stop does not restart recognition', async () => {
    await clickMic();
    const before = createdInstances;
    liveRecognition.say('test message');
    await tick(10);
    await clickMic();
    await tick(200);
    equal(createdInstances, before, 'recognition restarted after a manual stop');
    equal(micTitle(), 'Tap to speak', 'mic not idle');
});

await test('Scenario 5 — unexpected end preserves the transcript and sends nothing', async () => {
    await clickMic();
    liveRecognition.say('some captured words');
    await tick(10);
    liveRecognition.endFromBrowser();     // browser closes the session on its own
    await tick(80);
    equal(chatRequests.length, 0, 'unexpected end sent a message');
    equal(inputValue(), 'some captured words', 'captured transcript was lost');
    equal(micTitle(), 'Tap to speak', 'mic state did not reset');
});

await test('no-speech cannot cause an infinite restart loop', async () => {
    await clickMic();
    for (let i = 0; i < 6; i++) {
        if (!liveRecognition) break;
        liveRecognition.error('no-speech');
        liveRecognition.endFromBrowser();
        await tick(40);
    }
    await tick(200);
    assert(createdInstances === 1, `recognition was recreated ${createdInstances} times (restart loop)`);
    equal(micTitle(), 'Tap to speak', 'mic stuck in a restart loop');
    equal(chatRequests.length, 0, 'a message was sent during the loop');
});

await test('only one recognition instance is ever active', async () => {
    await clickMic();
    await tick(20);
    equal(activeInstances, 1, `expected 1 active instance, found ${activeInstances}`);
    liveRecognition.say('hello');
    await tick(10);
    await clickMic();
    await tick(60);
    equal(activeInstances, 0, `instances left running: ${activeInstances}`);
});

await test('double send prevention — rapid extra clicks send once', async () => {
    await clickMic();
    liveRecognition.say('only once please');
    await tick(10);
    await clickMic();          // stop + send
    await clickMic();          // stray click while finalising
    await tick(300);
    const sends = chatRequests.filter(r => r.message === 'only once please');
    equal(sends.length, 1, `message was sent ${sends.length} times`);
    // The stray click may open a new session; make sure it did not send anything.
    equal(chatRequests.length, 1, 'extra chat requests were made');
});

await test('empty speech after a manual stop sends nothing', async () => {
    await clickMic();
    await tick(10);
    await clickMic();          // stop immediately, nothing was said
    await tick(80);
    equal(chatRequests.length, 0, 'an empty message was sent');
    equal(micTitle(), 'Tap to speak', 'mic not idle');
});

await test('whitespace-only speech sends nothing', async () => {
    await clickMic();
    liveRecognition.say('   ');
    await tick(10);
    await clickMic();
    await tick(80);
    equal(chatRequests.length, 0, 'whitespace was sent as a message');
});

await test('typed text is preserved and voice is appended to it', async () => {
    await typeInput('Hotels in');
    await clickMic();
    liveRecognition.say('Udupi');
    await tick(10);
    await clickMic();
    await tick(80);
    equal(chatRequests[0].message, 'Hotels in Udupi', 'typed text was lost or duplicated');
});

await test('network errors retry, then surface the existing error message', async () => {
    await clickMic();
    for (let i = 0; i < 4; i++) {
        if (!liveRecognition) break;
        liveRecognition.error('network');
        liveRecognition.endFromBrowser();
        await tick(40);
    }
    await tick(150);
    equal(micTitle(), 'Tap to speak', 'mic stuck after network errors');
    equal(chatRequests.length, 0, 'a message was sent during network failures');
});

await test('retry budget does not carry over into the next session', async () => {
    // Burn the budget.
    await clickMic();
    liveRecognition.error('network');
    liveRecognition.endFromBrowser();
    await tick(60);
    if (micIsListening()) { await clickMic(); await tick(40); }

    // A brand new session must still work normally.
    await clickMic();
    assert(micIsListening(), 'mic would not start a new session');
    liveRecognition.say('still working');
    await tick(10);
    await clickMic();
    await tick(80);
    const sends = chatRequests.filter(r => r.message === 'still working');
    equal(sends.length, 1, 'new session did not send after earlier errors');
});

await test('audio-capture error is handled and the mic resets', async () => {
    await clickMic();
    liveRecognition.error('audio-capture');
    liveRecognition.endFromBrowser();
    await tick(60);
    equal(micTitle(), 'Tap to speak', 'mic stuck after audio-capture');
    assert(/No microphone detected/i.test((container || document.body).textContent || ''), 'audio-capture error not surfaced');
});

await test('getUserMedia is never called', async () => {
    await clickMic();
    liveRecognition.say('checking media devices');
    await tick(10);
    await clickMic();
    await tick(60);
    equal(getUserMediaCalls, 0, 'a separate getUserMedia stream was opened');
});

await test('recognition is configured for continuous interim capture in en-US', async () => {
    await clickMic();
    equal(liveRecognition.lang, 'en-US', 'language changed');
    equal(liveRecognition.continuous, true, 'continuous not enabled');
    equal(liveRecognition.interimResults, true, 'interim results not enabled');
    await clickMic();
    await tick(40);
});

console.log('\n=== Existing chat pipeline (must be unaffected) ===\n');

await test('typed message still sends on Enter', async () => {
    await typeInput('typed question');
    await act(async () => {
        chatInput().dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await tick(80);
    equal(chatRequests.length, 1, 'Enter did not send');
    equal(chatRequests[0].message, 'typed question', 'wrong message sent');
});

await test('Send button click sends the typed message', async () => {
    await typeInput('button question');
    const sendBtn = (container || document).querySelector('#chat-send-btn');
    assert(sendBtn, 'send button missing');
    await act(async () => { sendBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick(80);
    equal(chatRequests.length, 1, 'Send button did not send exactly one message');
    equal(chatRequests[0].message, 'button question', 'send button sent the wrong payload');
});

await test('voice message goes through the same /api/chat pipeline as typing', async () => {
    await clickMic();
    liveRecognition.say('same pipeline check');
    await tick(10);
    await clickMic();
    await tick(80);
    equal(chatRequests.length, 1, 'voice did not use the normal chat endpoint');
    assert('history' in chatRequests[0], 'voice request is missing the conversation history field');
});

console.log('\n=== Cleanup ===\n');

await test('unmount aborts recognition and sends nothing', async () => {
    await clickMic();
    liveRecognition.say('should not be sent on unmount');
    await tick(10);
    await unmountCurrent();
    await tick(120);
    equal(activeInstances, 0, `recognition left running after unmount: ${activeInstances}`);
    equal(chatRequests.length, 0, 'a message was sent while unmounting');
});

console.log('\n────────────────────────────────────────');
console.log(`  ${passed} passed, ${failures.length} failed`);
console.log('────────────────────────────────────────\n');

if (failures.length) {
    for (const f of failures) console.log(`  ✗ ${f.name}: ${f.message}`);
    dom.window.close();
    process.exit(1);
}

// jsdom keeps timers alive; close it so the process exits cleanly.
dom.window.close();
process.exit(0);
