// extras.js
// ---------------------------------------------------------------
// Everything Update - Extra Content Pack
// Adds new elements/interactions on top of wizard.js: a mana
// generator block, brewable potions, and a familiar creature.
// Load order: wizard.js, then extras.js (extras references the
// magic elements wizard.js defines).
// ---------------------------------------------------------------

if (typeof elements === "undefined") {
    throw new Error("Sandboxels elements object not found!");
}
if (typeof elements.mana === "undefined") {
    console.warn("extras.js: wizard.js not loaded first, some reactions won't register.");
}

// Same finalize helper as wizard.js -- see that file for why it's
// needed (mods injected mid-session miss the base game's one-time
// window.onload finalize pass, so new elements never get gravity).
function euFinalize(ids) {
    ids.forEach(function (id) {
        if (typeof finalizeColor === "function") finalizeColor(elements[id]);
        if (typeof checkAutoGen === "function") checkAutoGen(id, elements[id]);
        if (typeof finalizeElementAfter === "function") finalizeElementAfter(id);
    });
}

// =====================
// MANA GENERATOR
// =====================
elements.mana_generator = {
    color: "#4488ff",
    behavior: behaviors.WALL,
    category: "magic",
    state: "solid",
    density: 4000,
    tick: function (pixel) {
        if (Math.random() < 0.05) {
            var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            var dir = dirs[Math.floor(Math.random() * dirs.length)];
            var nx = pixel.x + dir[0];
            var ny = pixel.y + dir[1];
            if (isEmpty(nx, ny)) {
                createPixel("mana", nx, ny);
            }
        }
    }
};

// =====================
// POTIONS
// =====================
elements.potion_bottle = {
    color: "#88ffaa",
    behavior: behaviors.POWDER,
    category: "magic",
    state: "solid",
    tags: ["fragile"],
    breakInto: "healing_light",
};

elements.strength_potion = {
    color: "#ff8844",
    behavior: behaviors.LIQUID,
    category: "magic",
    state: "liquid",
    density: 900,
    reactions: {
        fire_wizard: { elem2: null, chance: 0.05, tag: "buffed" },
    },
};

// =====================
// FAMILIAR
// =====================
function familiarTick(pixel) {
    // Wander
    if (Math.random() < 0.15) {
        tryMove(pixel, pixel.x + (Math.random() < 0.5 ? -1 : 1), pixel.y + (Math.random() < 0.5 ? -1 : 1));
    }
    // Occasionally sprinkle mana near a wizard-type neighbor
    if (Math.random() < 0.02) {
        var nx = pixel.x + (Math.random() < 0.5 ? -1 : 1);
        var ny = pixel.y - 1;
        if (isEmpty(nx, ny)) {
            createPixel("mana", nx, ny);
        }
    }
}

elements.familiar = {
    color: ["#cc88ff", "#dd99ff", "#bb77ee"],
    category: "life",
    state: "solid",
    density: 700,
    tick: familiarTick,
};

euFinalize(["mana_generator", "potion_bottle", "strength_potion", "familiar"]);

console.log("Everything Update: Extras Pack Loaded (mana generator, potions, familiar)");
