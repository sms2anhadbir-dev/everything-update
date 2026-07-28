// getall.js
// ---------------------------------------------------------------
// Paste this into the browser console on Sandboxels FIRST, before
// building/installing other mods. It scans the live `elements`
// object and dumps every element's id, category, color, state,
// density and tags, so you know exactly what exists to retexture
// or hook into. It also downloads the dump as JSON and stashes it
// on window for quick console access.
// ---------------------------------------------------------------

(function () {
    if (typeof elements === "undefined") {
        console.error("getall.js: Sandboxels `elements` object not found. Make sure the game finished loading.");
        return;
    }

    var dump = {};
    var ids = Object.keys(elements);

    ids.forEach(function (id) {
        var e = elements[id];
        dump[id] = {
            color: e.color,
            category: e.category,
            state: e.state,
            density: e.density,
            temp: e.temp,
            tags: e.tags,
            hidden: e.hidden,
            behavior: Array.isArray(e.behavior) ? "[compiled array]" : e.behavior
        };
    });

    window.__everythingUpdateElements = dump;

    console.log("getall.js: found " + ids.length + " elements. Full dump stored at window.__everythingUpdateElements");
    console.table(dump);

    try {
        var blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "sandboxels_elements.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        console.log("getall.js: sandboxels_elements.json downloaded.");
    } catch (e) {
        console.warn("getall.js: could not trigger download automatically, use window.__everythingUpdateElements instead.", e);
    }
})();
