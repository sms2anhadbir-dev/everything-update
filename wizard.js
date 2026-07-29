// wizard_system.js
// Everything Update - Wizard System (FINAL)

if (typeof elements === "undefined") {
    throw new Error("Sandboxels elements object not found!");
}

// -----------------------------------------------------------
// Finalizes newly-added elements the same way the base game does
// on window.onload. Needed because mods loaded mid-session (e.g.
// via forceLoadMod) run AFTER that one-time finalize pass, so
// without this, new elements never get a real .tick/.id/.movable
// and end up floating with no gravity.
// -----------------------------------------------------------
function euFinalize(ids) {
    ids.forEach(function (id) {
        if (typeof finalizeColor === "function") finalizeColor(elements[id]);
        if (typeof checkAutoGen === "function") checkAutoGen(id, elements[id]);
        if (typeof finalizeElementAfter === "function") finalizeElementAfter(id);
    });
}

// =====================
// MAGIC ELEMENTS
// =====================

elements.mana_crystal = {
    color: ["#66ccff", "#99ddff", "#ccffff"],
    behavior: behaviors.WALL,
    category: "magic",
    state: "solid",
    density: 2500,
};

elements.mana = {
    color: "#66aaff",
    behavior: behaviors.GAS,
    category: "magic",
    state: "gas",
    density: 1,
};

// =====================
// SPELL ELEMENTS
// =====================

elements.fire_bolt = {
    color: "#ff5500",
    behavior: behaviors.POWDER,
    category: "magic",
    state: "solid",
    temp: 600,
};

elements.ice_shard = {
    color: "#99ddff",
    behavior: behaviors.POWDER,
    category: "magic",
    state: "solid",
    temp: -50,
};

elements.lightning_bolt = {
    color: "#ffff66",
    behavior: behaviors.POWDER,
    category: "magic",
    state: "solid",
    temp: 1000,
};

elements.shadow_orb = {
    color: "#222222",
    behavior: behaviors.POWDER,
    category: "magic",
    state: "solid",
};

// healing_light is meant to be an instant downward ray, the same way
// Sandboxels' own "god_ray" element works: on the single tick it
// exists, it scans straight down from its own position to the bottom
// of the map, applies an effect to whatever it passes over (here,
// bless's own cure/heal logic), then deletes itself immediately.
// That's a completely different mechanism from a slow-moving
// particle -- it's a one-frame beam, not something that crawls one
// tile per tick.
elements.healing_light = {
    color: ["#ffffcc", "#fff2a8"],
    category: "magic",
    state: "gas",
    density: 1,
    excludeRandom: true,
    noMix: true,
    tick: function (pixel) {
        var x = pixel.x;
        for (var y = pixel.y + 1; y < height + 1; y++) {
            if (outOfBounds(x, y)) break;
            if (isEmpty(x, y)) continue;
            if (elements[pixelMap[x][y].element].id === elements.healing_light.id) break;
            if (typeof elements.bless !== "undefined" && elements.bless.tool) {
                elements.bless.tool(pixelMap[x][y]);
            }
        }
        deletePixel(pixel.x, pixel.y);
    },
};

// =====================
// WIZARD CORE SYSTEM
// =====================
// Wizards use a custom tick (movement + spellcasting) instead of a
// stock behavior matrix, so no `behavior` key is set for them --
// that's intentional, not a bug. They still need euFinalize() below
// so the engine assigns them a real id and marks them movable.

function wizardTick(pixel) {

    // CAST SPELL
    if (Math.random() < 0.003) {

        const dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];

        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const nx = pixel.x + dir[0];
        const ny = pixel.y + dir[1];

        if (isEmpty(nx, ny)) {
            createPixel(pixel.spell, nx, ny);
        }
    }

    // GRAVITY (wizards are living creatures, not floating orbs)
    tryMove(pixel, pixel.x, pixel.y + 1);

    // RANDOM SIDEWAYS MOVEMENT
    if (Math.random() < 0.1) {
        tryMove(
            pixel,
            pixel.x + (Math.random() < 0.5 ? -1 : 1),
            pixel.y
        );
    }
}

// =====================
// WIZARD FACTORY
// =====================

function makeWizard(color, spell) {
    return {
        color: color,
        category: "life",   // ALL WIZARDS IN LIFE CATEGORY
        state: "solid",
        density: 1200,
        spell: spell,
        tick: wizardTick
    };
}

// =====================
// WIZARDS
// =====================

elements.fire_wizard = makeWizard("#ff3300", "fire_bolt");

elements.ice_wizard = makeWizard("#88ddff", "ice_shard");

elements.storm_wizard = makeWizard("#ffff55", "lightning_bolt");

elements.dark_wizard = makeWizard("#333333", "shadow_orb");

elements.light_wizard = makeWizard("#ffffcc", "healing_light");

// safer fallback wizard (no missing element risk)
elements.nature_wizard = makeWizard("#22aa22", "mana");

// =====================
// FINALIZE + LOADED MESSAGE
// =====================

euFinalize([
    "mana_crystal", "mana",
    "fire_bolt", "ice_shard", "lightning_bolt", "shadow_orb", "healing_light",
    "fire_wizard", "ice_wizard", "storm_wizard", "dark_wizard", "light_wizard", "nature_wizard"
]);

console.log("Everything Update: Wizard System Loaded (FINAL)");
