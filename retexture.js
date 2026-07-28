// retexture.js
// ---------------------------------------------------------------
// Everything Update - Global Retexture Pass
//
// Loaded as a normal Sandboxels mod (Settings > Mods > add this
// file's URL, or install it from the console with install.js).
// It runs AFTER the base game's elements are registered and
// re-skins every existing element's color procedurally, instead
// of hardcoding a color per element id (which would break the
// moment R74n adds/renames elements). Run getall.js first if you
// want to hand-pick overrides for specific ids -- the OVERRIDES
// object below is where those go.
// ---------------------------------------------------------------

if (typeof elements === "undefined") {
    throw new Error("Sandboxels elements object not found!");
}

// -----------------------------------------------------------
// Hand-picked overrides (id -> new color/colors). Fill this in
// using the ids from getall.js's dump for anything you want an
// exact, non-procedural look for.
// -----------------------------------------------------------
var OVERRIDES = {
    // water: "#3fa7ff",
    // sand: ["#e8c37a", "#dab364"],
};

// -----------------------------------------------------------
// Procedural reshade: shifts hue/brightness of a hex color so
// every element gets a consistent "Everything Update" palette
// without needing per-element data.
// -----------------------------------------------------------
function parseColor(str) {
    // Sandboxels elements are colored either as "#rrggbb"/"#rgb" hex
    // or as "rgb(r,g,b)" strings -- handle both.
    if (str[0] === "#") {
        var hex = str.replace("#", "");
        if (hex.length === 3) {
            hex = hex.split("").map(function (c) { return c + c; }).join("");
        }
        var num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, format: "hex" };
    }
    var m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(str);
    if (m) {
        return { r: +m[1], g: +m[2], b: +m[3], format: "rgb" };
    }
    return null;
}

function formatColor(r, g, b, format) {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    if (format === "rgb") {
        return "rgb(" + r + "," + g + "," + b + ")";
    }
    return "#" + [r, g, b].map(function (v) {
        return v.toString(16).padStart(2, "0");
    }).join("");
}

// Category -> tint applied on top of the original color, so
// different kinds of elements read as different "materials"
// (liquids get a cool/glassy push, powders get warmer/grainier,
// gases get lighter/hazier, solids get a slight metallic push).
var CATEGORY_TINT = {
    liquids: { r: -10, g: 10, b: 30 },
    powders: { r: 15, g: 5, b: -10 },
    gases: { r: 20, g: 20, b: 20 },
    solids: { r: 5, g: 5, b: 5 },
    land: { r: 10, g: 5, b: -5 },
    life: { r: -5, g: 15, b: -5 },
    food: { r: 15, g: 10, b: -10 },
    energy: { r: 10, g: 10, b: 25 },
    machines: { r: 5, g: 5, b: 15 },
    weapons: { r: 15, g: -5, b: -5 },
    special: { r: -10, g: -10, b: 20 },
    magic: { r: -10, g: -10, b: 30 },
};

function retextureColor(str, category) {
    if (typeof str !== "string") return str;
    var rgb = parseColor(str);
    if (!rgb) return str;
    var tint = CATEGORY_TINT[category] || { r: 0, g: 0, b: 0 };
    return formatColor(rgb.r + tint.r, rgb.g + tint.g, rgb.b + tint.b, rgb.format);
}

function retextureElement(id) {
    var el = elements[id];
    if (!el || el.hidden) return;

    if (OVERRIDES.hasOwnProperty(id)) {
        el.color = OVERRIDES[id];
        return;
    }

    if (Array.isArray(el.color)) {
        el.color = el.color.map(function (c) {
            return typeof c === "string" ? retextureColor(c, el.category) : c;
        });
    } else if (typeof el.color === "string") {
        el.color = retextureColor(el.color, el.category);
    }
    // functions-as-color (rare, procedural elements) are left alone on purpose
}

var count = 0;
for (var id in elements) {
    retextureElement(id);
    count++;
}

console.log("Everything Update: Retexture pass applied to " + count + " elements.");
