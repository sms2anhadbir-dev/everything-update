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

elements.healing_light = {
    color: "#ffffcc",
    behavior: behaviors.GAS,
    category: "magic",
    state: "gas",
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
