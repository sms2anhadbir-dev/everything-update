// loader.js
// ---------------------------------------------------------------
// Everything Update - Combined Installer + Auto-Updating Loader
//
// PASTE THIS INTO THE CONSOLE EXACTLY ONCE. After that:
//   - It re-saves itself into localStorage's "enabledMods" every
//     time it runs, so Sandboxels auto-runs it on every future page
//     load -- no more re-pasting.
//   - Every time it runs (including on every reload), it re-fetches
//     the mods listed in MOD_URLS straight from GitHub with caching
//     disabled, so you always get whatever is currently pushed
//     there. Nothing is frozen to the version you had when you
//     first installed it.
//
// If you edit MOD_URLS below, just paste this file into the console
// one more time to push the change into your persisted copy too.
// ---------------------------------------------------------------

if (typeof elements === "undefined") {
    throw new Error("Sandboxels elements object not found!");
}

// -----------------------------------------------------------
// Which mods to auto-load, in order, on every page load.
// -----------------------------------------------------------
const MOD_URLS = [
    "https://raw.githubusercontent.com/sms2anhadbir-dev/everything-update/main/wizard.js",
    "https://raw.githubusercontent.com/sms2anhadbir-dev/everything-update/main/extras.js",
    "https://raw.githubusercontent.com/sms2anhadbir-dev/everything-update/main/retexture.js",
];

const SELF_URL = "https://raw.githubusercontent.com/sms2anhadbir-dev/everything-update/main/loader.js";

// =====================
// INSTALL / MANAGE MODS (merged from install.js)
// =====================

function installMod(name, code) {
    if (!name || !code) {
        console.error("installMod(name, code): both a name and JS source are required");
        return;
    }
    var enabled = [];
    try { enabled = JSON.parse(localStorage.getItem("enabledMods") || "[]"); } catch (e) { enabled = []; }

    var tag = "/*__mod_name:" + name + "__*/";
    enabled = enabled.filter(function (m) { return m.indexOf(tag) === -1; });

    var taggedCode = tag + "\n" + code;
    var taggedEncoded = "data:text/javascript;base64," + btoa(unescape(encodeURIComponent(taggedCode)));

    enabled.push(taggedEncoded);
    localStorage.setItem("enabledMods", JSON.stringify(enabled));
    return taggedEncoded;
}

function removeMod(name) {
    var enabled = [];
    try { enabled = JSON.parse(localStorage.getItem("enabledMods") || "[]"); } catch (e) { enabled = []; }
    var tag = "/*__mod_name:" + name + "__*/";
    var before = enabled.length;
    enabled = enabled.filter(function (m) { return m.indexOf(tag) === -1; });
    localStorage.setItem("enabledMods", JSON.stringify(enabled));
    console.log("Removed " + (before - enabled.length) + ' entr(y/ies) named "' + name + '". Reload to apply.');
}

function listInstalledMods() {
    var enabled = [];
    try { enabled = JSON.parse(localStorage.getItem("enabledMods") || "[]"); } catch (e) { enabled = []; }
    enabled.forEach(function (m, i) {
        var match = /\/\*__mod_name:(.*?)__\*\//.exec(decodeURIComponent(escape(atob(m.split(",")[1] || ""))));
        console.log(i + ": " + (match ? match[1] : m.slice(0, 60) + "..."));
    });
    return enabled;
}

// =====================
// FORCE-LOAD + AUTO-FINALIZE (merged from force_load.js)
// =====================
// GitHub raw files are served as "Content-Type: text/plain" with
// "X-Content-Type-Options: nosniff", so a normal <script src="...">
// pointed at them gets silently blocked by the browser. Fetching
// the text and running it as an INLINE <script> sidesteps that
// entirely. On top of that, the base game only converts an
// element's `behavior` into a real `.tick`/`.id`/`.movable` once,
// in a window.onload handler -- anything added afterward (which is
// always true for mods loaded this way) needs that finalize step
// run manually, or it just floats with no gravity.

function euRunAndFinalize(code, label) {
    const before = new Set(Object.keys(elements));

    const script = document.createElement("script");
    script.textContent = code;
    document.head.appendChild(script);

    let finalized = 0;
    const newIds = [];
    for (const id in elements) {
        if (before.has(id)) continue;
        if (typeof finalizeColor === "function") finalizeColor(elements[id]);
        if (typeof checkAutoGen === "function") checkAutoGen(id, elements[id]);
        if (typeof finalizeElementAfter === "function") finalizeElementAfter(id);
        finalized++;
        newIds.push(id);
    }

    console.log((label || "euRunAndFinalize") + ": ran " + code.length + " chars, " + finalized + " new element(s) finalized" + (newIds.length ? " (" + newIds.join(", ") + ")" : ""));
    return newIds;
}

async function forceLoadMod(url, opts) {
    opts = opts || {};
    let res;
    try {
        res = await fetch(url, { cache: "no-store" });
    } catch (e) {
        console.error("forceLoadMod: fetch failed for " + url, e);
        return;
    }
    if (!res.ok) {
        console.error("forceLoadMod: HTTP " + res.status + " for " + url);
        return;
    }
    const code = await res.text();

    euRunAndFinalize(code, "forceLoadMod (" + url.split("/").pop() + ")");

    if (opts.persist) {
        installMod(url.split("/").pop(), code);
    }
    return code;
}

// =====================
// AI MOD GENERATOR (Groq -- OpenAI-compatible API, free tier)
// =====================
// setGroqKey(key) once to store your key (localStorage only, never
// committed to the repo). Then aiMakeMod("a mod that makes water
// explode on contact with fire") calls Groq, extracts the generated
// JS, runs it immediately via euRunAndFinalize (same gravity-fix
// pipeline as forceLoadMod), and optionally persists it.
//
// The system prompt bakes in everything this session found out the
// hard way: use behaviors.POWDER/WALL/LIQUID/GAS (real function
// references, not string literals like "powder"), there's no
// "fragile" tag, breakInto/reactions/tick are the real mechanics,
// and a downward instant ray should loop y from pixel.y+1.

const GROQ_MODEL_DEFAULT = "compound-mini";

function setGroqKey(key) {
    localStorage.setItem("euGroqKey", key);
    console.log("Groq API key saved to this browser's localStorage.");
}

function euExtractCode(text) {
    const fence = /```(?:js|javascript)?\s*([\s\S]*?)```/i.exec(text);
    return (fence ? fence[1] : text).trim();
}

const EU_AI_SYSTEM_PROMPT = `You write mods for the falling-sand game Sandboxels. Output ONLY raw JavaScript, no markdown fences, no explanation.

Rules learned from real testing against the live game:
- Elements are added via elements.someId = { ... }.
- "behavior" must be a real function reference: behaviors.POWDER (loose granular, falls/piles), behaviors.WALL (fully static, never moves -- use for real "solid" objects), behaviors.LIQUID, or behaviors.GAS. NEVER use plain strings like "powder"/"wall"/"liquid"/"gas" -- those are silently ignored and the element ends up floating with no physics at all.
- "category" and "state" are just metadata/organization (e.g. "solids"/"liquids"/"powders"/"gases"/"life"/"magic", state "solid"/"liquid"/"gas") -- they do NOT control physics, "behavior" does.
- "color" can be a hex string, an rgb(...) string, or an array of either for texture variation.
- Custom creatures/effects use a "tick" function instead of "behavior": function(pixel) { ... }, using isEmpty(x,y), tryMove(pixel,nx,ny), createPixel(elementId,x,y), deletePixel(x,y).
- There is NO "fragile" tag or any generic shatter-on-impact system. If you want something to break, use the real "breakInto" field (a string element id, triggered by the engine's own breakPixel() via explosions/tools) or a "reactions" object.
- An instant downward ray/beam (like the game's own "god_ray") should loop like: for (var y = pixel.y + 1; y < height + 1; y++) { if (outOfBounds(x,y)) break; if (isEmpty(x,y)) continue; ...apply effect...; } then deletePixel(pixel.x, pixel.y) -- starting at pixel.y+1, not pixel.y, or it immediately matches its own id and stops.
- Do not assume "elements" already has your new ids; only reference other elements that plausibly exist in vanilla Sandboxels or that you also define in the same snippet.
- End with a console.log describing what was loaded.`;

async function aiMakeMod(prompt, opts) {
    opts = opts || {};
    const key = localStorage.getItem("euGroqKey");
    if (!key) {
        console.error('aiMakeMod: no Groq API key set. Run setGroqKey("your-key-here") first (get a free key at console.groq.com).');
        return;
    }

    let res;
    try {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + key,
            },
            body: JSON.stringify({
                model: opts.model || GROQ_MODEL_DEFAULT,
                temperature: 0.4,
                messages: [
                    { role: "system", content: EU_AI_SYSTEM_PROMPT },
                    { role: "user", content: prompt },
                ],
            }),
        });
    } catch (e) {
        console.error("aiMakeMod: request to Groq failed", e);
        return;
    }

    if (!res.ok) {
        console.error("aiMakeMod: Groq HTTP " + res.status, await res.text().catch(() => ""));
        return;
    }

    const data = await res.json();
    const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!raw) {
        console.error("aiMakeMod: no content in Groq response", data);
        return;
    }

    const code = euExtractCode(raw);
    console.log("aiMakeMod: generated code for \"" + prompt + "\":\n" + code);

    try {
        euRunAndFinalize(code, "aiMakeMod");
    } catch (e) {
        console.error("aiMakeMod: generated code threw an error, nothing was persisted:", e);
        return;
    }

    if (opts.persist !== false) {
        const name = "ai_" + prompt.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40) + ".js";
        installMod(name, code);
        console.log('aiMakeMod: persisted as "' + name + '" -- it will auto-load on future reloads too.');
    }

    return code;
}

// =====================
// SELF-PERSIST + AUTO-UPDATE
// =====================

async function euRefreshLoaderInstall() {
    try {
        const res = await fetch(SELF_URL, { cache: "no-store" });
        if (!res.ok) { console.warn("euRefreshLoaderInstall: HTTP " + res.status + ", keeping existing persisted copy"); return; }
        const latest = await res.text();
        installMod("loader.js", latest);
        console.log("Everything Update: loader.js persisted/refreshed in enabledMods -- it will auto-run on every future reload.");
    } catch (e) {
        console.warn("Everything Update: could not refresh persisted loader.js, keeping existing copy", e);
    }
}

async function euLoadAllMods() {
    for (const url of MOD_URLS) {
        await forceLoadMod(url);
    }
    console.log("Everything Update: all mods refreshed from GitHub (" + MOD_URLS.length + " file(s)).");
}

// Run both every time this script executes -- whether that's you
// pasting it manually, or Sandboxels auto-running it from
// enabledMods on a fresh page load.
euRefreshLoaderInstall();
euLoadAllMods();

console.log("loader.js active. Use installMod(name, code), removeMod(name), listInstalledMods(), forceLoadMod(url, opts), setGroqKey(key), aiMakeMod(prompt, opts).");
