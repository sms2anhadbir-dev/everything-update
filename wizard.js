// wizard_system.js
// Everything Update - Wizard System

if (typeof elements === "undefined") {
    throw new Error("Sandboxels elements object not found!");
}

// ===== MANA =====

elements.mana_crystal = {
    color: ["#66ccff","#99ddff","#ccffff"],
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

// ===== SPELLS =====

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

// ===== BASE WIZARD =====

function wizardTick(pixel) {

    if (Math.random() < 0.002) {
        let dirs = [
            [1,0],[-1,0],[0,1],[0,-1]
        ];

        let dir = dirs[Math.floor(Math.random()*dirs.length)];

        let nx = pixel.x + dir[0];
        let ny = pixel.y + dir[1];

        if (isEmpty(nx, ny)) {
            createPixel(pixel.spell, nx, ny);
        }
    }

    if (Math.random() < 0.1) {
        tryMove(pixel, pixel.x + (Math.random() < 0.5 ? -1 : 1), pixel.y);
    }
}

// ===== FIRE WIZARD =====

elements.fire_wizard = {
    color: "#ff3300",
    category: "wizards",
    state: "solid",
    density: 1200,
    spell: "fire_bolt",
    tick: function(pixel) {
        wizardTick(pixel);
    }
};

// ===== ICE WIZARD =====

elements.ice_wizard = {
    color: "#88ddff",
    category: "wizards",
    state: "solid",
    density: 1200,
    spell: "ice_shard",
    tick: function(pixel) {
        wizardTick(pixel);
    }
};

// ===== STORM WIZARD =====

elements.storm_wizard = {
    color: "#ffff55",
    category: "wizards",
    state: "solid",
    density: 1200,
    spell: "lightning_bolt",
    tick: function(pixel) {
        wizardTick(pixel);
    }
};

// ===== DARK WIZARD =====

elements.dark_wizard = {
    color: "#333333",
    category: "wizards",
    state: "solid",
    density: 1200,
    spell: "shadow_orb",
    tick: function(pixel) {
        wizardTick(pixel);
    }
};

// ===== LIGHT WIZARD =====

elements.light_wizard = {
    color: "#ffffcc",
    category: "wizards",
    state: "solid",
    density: 1200,
    spell: "healing_light",
    tick: function(pixel) {
        wizardTick(pixel);
    }
};

// ===== NATURE WIZARD =====

elements.nature_wizard = {
    color: "#22aa22",
    category: "wizards",
    state: "solid",
    density: 1200,
    spell: "plant",
    tick: function(pixel) {
        wizardTick(pixel);
    }
};

console.log("Everything Update: Wizard System Loaded");
