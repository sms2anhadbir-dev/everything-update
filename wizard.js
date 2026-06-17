// wizard_system.js
// Everything Update - Wizard System (FINAL)

if (typeof elements === "undefined") {
    throw new Error("Sandboxels elements object not found!");
}

// =====================
// MAGIC ELEMENTS
// =====================

elements.mana_crystal = {
    color: ["#66ccff", "#99ddff", "#ccffff"],
    behavior: "wall",
    category: "magic",
    state: "solid",
    density: 2500,
};

elements.mana = {
    color: "#66aaff",
    behavior: "gas",
    category: "magic",
    state: "gas",
    density: 1,
};

// =====================
// SPELL ELEMENTS
// =====================

elements.fire_bolt = {
    color: "#ff5500",
    behavior: "powder",
    category: "magic",
    state: "solid",
    temp: 600,
};

elements.ice_shard = {
    color: "#99ddff",
    behavior: "powder",
    category: "magic",
    state: "solid",
    temp: -50,
};

elements.lightning_bolt = {
    color: "#ffff66",
    behavior: "powder",
    category: "magic",
    state: "solid",
    temp: 1000,
};

elements.shadow_orb = {
    color: "#222222",
    behavior: "powder",
    category: "magic",
    state: "solid",
};

elements.healing_light = {
    color: "#ffffcc",
    behavior: "gas",
    category: "magic",
    state: "gas",
};

// =====================
// WIZARD CORE SYSTEM
// =====================

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

    // RANDOM MOVEMENT
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
// LOADED MESSAGE
// =====================

console.log("Everything Update: Wizard System Loaded (FINAL)");
