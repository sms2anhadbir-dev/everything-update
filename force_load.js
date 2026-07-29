// force_load.js
// ---------------------------------------------------------------
// Paste this into the browser console on Sandboxels.
// Fixes the case where a mod URL (e.g. raw.githubusercontent.com)
// won't load because the server sends the file as
// "Content-Type: text/plain" + "X-Content-Type-Options: nosniff".
// Browsers refuse to *execute* a <script src="..."> under those
// headers, but they do NOT refuse to fetch() the same URL as plain
// text. So instead of pointing a <script src> at the URL, this
// fetches the raw source and injects it as an INLINE <script>,
// which has no MIME restriction at all.
//
// Usage:
//   forceLoadMod("https://raw.githubusercontent.com/sms2anhadbir-dev/everything-update/main/retexture.js")
//
// Pass { persist: true } as a second arg to also register it in
// enabledMods (via install.js's installMod, if loaded) so it keeps
// loading on future page loads, not just this session.
// ---------------------------------------------------------------

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

    // Snapshot element ids before running the mod so we can tell
    // what it added, and auto-finalize those. This matters because
    // the base game only runs its element-finalize pass once, on
    // window.onload -- any element a mod adds AFTER that (which is
    // always true here, since you're pasting this into an
    // already-loaded game) never gets a real .tick/.id/.movable and
    // just floats with no gravity unless something finalizes it.
    const before = new Set(Object.keys(elements));

    const script = document.createElement("script");
    script.textContent = code; // inline, not src -- no MIME/nosniff check applies
    document.head.appendChild(script);
    console.log("forceLoadMod: executed " + code.length + " chars from " + url);

    let finalized = 0;
    for (const id in elements) {
        if (before.has(id)) continue;
        if (typeof finalizeColor === "function") finalizeColor(elements[id]);
        if (typeof checkAutoGen === "function") checkAutoGen(id, elements[id]);
        if (typeof finalizeElementAfter === "function") finalizeElementAfter(id);
        finalized++;
    }
    if (finalized > 0) {
        console.log("forceLoadMod: auto-finalized " + finalized + " new element(s) so they get gravity/physics.");
    }

    if (opts.persist) {
        const name = url.split("/").pop();
        if (typeof installMod === "function") {
            installMod(name, code);
            console.log("forceLoadMod: persisted as \"" + name + "\" via installMod (paste install.js first if this didn't log).");
        } else {
            console.warn("forceLoadMod: installMod() not found. Paste install.js first if you want this mod to persist across reloads.");
        }
    }
}

console.log("force_load.js loaded. Use forceLoadMod(url) or forceLoadMod(url, {persist: true}).");
