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

    const before = new Set(Object.keys(elements));

    const script = document.createElement("script");
    script.textContent = code;
    document.head.appendChild(script);

    let finalized = 0;
    for (const id in elements) {
        if (before.has(id)) continue;
        if (typeof finalizeColor === "function") finalizeColor(elements[id]);
        if (typeof checkAutoGen === "function") checkAutoGen(id, elements[id]);
        if (typeof finalizeElementAfter === "function") finalizeElementAfter(id);
        finalized++;
    }

    console.log("forceLoadMod: loaded " + url.split("/").pop() + " (" + code.length + " chars, " + finalized + " new element(s) finalized)");

    if (opts.persist) {
        installMod(url.split("/").pop(), code);
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

console.log("loader.js active. Use installMod(name, code), removeMod(name), listInstalledMods(), forceLoadMod(url, opts).");
