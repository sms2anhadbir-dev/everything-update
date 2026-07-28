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

    const script = document.createElement("script");
    script.textContent = code; // inline, not src -- no MIME/nosniff check applies
    document.head.appendChild(script);
    console.log("forceLoadMod: executed " + code.length + " chars from " + url);

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
