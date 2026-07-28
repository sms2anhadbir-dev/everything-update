// install.js
// ---------------------------------------------------------------
// Paste this into the browser console while Sandboxels is open.
// It registers a mod's source code as a permanent mod the exact
// same way Sandboxels' own Mod Manager does: by pushing a script
// URL into the "enabledMods" array in localStorage, which the
// game re-runs (as a <script src="..."> tag) on every load.
//
// The trick: instead of hosting the .js file somewhere, we encode
// the source as a data: URL, so you can install a mod purely from
// the console with no server/hosting needed.
//
// Usage:
//   1. Paste this whole file into the console (defines installMod/removeMod).
//   2. Grab a mod's source as a string (e.g. paste getall.js's output,
//      or fetch a raw github url, or just paste code inline) and run:
//
//        installMod("retexture.js", `...paste retexture.js contents here...`);
//
//   3. Reload the page. The mod is now loaded every time, just like
//      any mod added through Settings > Mods.
// ---------------------------------------------------------------

function installMod(name, code) {
    if (typeof localStorage === "undefined") {
        console.error("installMod: localStorage not available");
        return;
    }
    if (!name || !code) {
        console.error("installMod(name, code): both a name and JS source are required");
        return;
    }

    // Encode the mod source as a data: URL, same shape a normal
    // "mods/whatever.js" or "https://.../whatever.js" entry has,
    // just self-contained instead of pointing at a file.
    var encoded = "data:text/javascript;base64," + btoa(unescape(encodeURIComponent(code)));

    var enabled = [];
    try {
        enabled = JSON.parse(localStorage.getItem("enabledMods") || "[]");
    } catch (e) {
        enabled = [];
    }

    // Replace any previous install under the same name (tagged via a comment
    // header we inject so we can find + remove it later by name).
    var tag = "/*__mod_name:" + name + "__*/";
    enabled = enabled.filter(function (m) {
        return m.indexOf(tag) === -1;
    });

    var taggedCode = tag + "\n" + code;
    var taggedEncoded = "data:text/javascript;base64," + btoa(unescape(encodeURIComponent(taggedCode)));

    enabled.push(taggedEncoded);
    localStorage.setItem("enabledMods", JSON.stringify(enabled));

    console.log('Mod "' + name + '" installed (' + code.length + ' chars). Reload the page to activate it.');
}

function removeMod(name) {
    var enabled = [];
    try {
        enabled = JSON.parse(localStorage.getItem("enabledMods") || "[]");
    } catch (e) {
        enabled = [];
    }
    var tag = "/*__mod_name:" + name + "__*/";
    var before = enabled.length;
    enabled = enabled.filter(function (m) {
        return m.indexOf(tag) === -1;
    });
    localStorage.setItem("enabledMods", JSON.stringify(enabled));
    console.log("Removed " + (before - enabled.length) + ' entr(y/ies) named "' + name + '". Reload to apply.');
}

function listInstalledMods() {
    var enabled = [];
    try {
        enabled = JSON.parse(localStorage.getItem("enabledMods") || "[]");
    } catch (e) {
        enabled = [];
    }
    enabled.forEach(function (m, i) {
        var match = /\/\*__mod_name:(.*?)__\*\//.exec(decodeURIComponent(escape(atob(m.split(",")[1] || ""))));
        console.log(i + ": " + (match ? match[1] : m.slice(0, 60) + "..."));
    });
    return enabled;
}

console.log("install.js loaded. Use installMod(name, code), removeMod(name), listInstalledMods().");
