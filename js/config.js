window.DE = window.DE || {};

DE.CONFIG = {
    GRID_COLS: 20,
    GRID_ROWS: 12,
    CELL_SIZE: 2,
    CAMERA_HEIGHT: 40,
    INITIAL_CASH: 150,
    INITIAL_LIVES: 10,
    MAX_LIVES: 10,
    WAVE_DELAY: 4,
    BASE_SPAWN_INTERVAL: 1.2,
};

DE.COLORS = {
    GROUND: 0x3a7d2a,
    GROUND_ALT: 0x348525,
    PATH: 0x8B7355,
    PATH_BORDER: 0x6B5335,
    FENCE: 0x5c4033,
    FENCE_POST: 0x3e2a1f,
    SPAWN: 0xcc3333,
    EXIT: 0xccaa33,
    TREE_TRUNK: 0x5c3a1e,
    TREE_LEAVES: 0x2d6b1e,
    WATER: 0x3388bb,
};

DE.TRAP_TYPES = [
    {
        id: 'stun_bomb', name: 'Stun Bomb', icon: '💥', cost: 25,
        damage: 1, range: 2.5, cooldown: 3, stunDuration: 2,
        description: 'Area stun', color: 0xffaa00, keyBind: '1'
    },
    {
        id: 'pit', name: 'Pit Trap', icon: '🕳️', cost: 15,
        damage: 3, range: 1.2, cooldown: 0, stunDuration: 0,
        description: 'Damages dinos walking over', color: 0x4a3520, keyBind: '2'
    },
    {
        id: 'snare_cannon', name: 'Snare Cannon', icon: '🔗', cost: 40,
        damage: 0, range: 5, cooldown: 5, stunDuration: 3,
        description: 'Long range root', color: 0x888888, keyBind: '3'
    },
    {
        id: 'tranq_dart', name: 'Tranq Dart', icon: '💉', cost: 30,
        damage: 2, range: 4, cooldown: 2, stunDuration: 0,
        dotDamage: 1, dotDuration: 3,
        description: 'Damage over time', color: 0x44aadd, keyBind: '4'
    },
    {
        id: 'electro', name: 'Electro Trap', icon: '⚡', cost: 50,
        damage: 2, range: 3, cooldown: 4, stunDuration: 1.5,
        chainRange: 2.5, chainCount: 3,
        description: 'Chain stun', color: 0x44ddff, keyBind: '5'
    },
];

DE.DINO_TYPES = {
    compy: {
        name: 'Compsognathus', hp: 2, speed: 3, points: 10, cash: 5,
        scale: 0.3, color: 0x66cc44, bodyType: 'small'
    },
    dilophosaurus: {
        name: 'Dilophosaurus', hp: 5, speed: 2, points: 25, cash: 10,
        scale: 0.5, color: 0xdd8833, bodyType: 'medium'
    },
    velociraptor: {
        name: 'Velociraptor', hp: 3, speed: 5.5, points: 30, cash: 12,
        scale: 0.4, color: 0xcc3333, bodyType: 'fast'
    },
    triceratops: {
        name: 'Triceratops', hp: 12, speed: 1.2, points: 50, cash: 20,
        scale: 0.7, color: 0x888899, bodyType: 'tank'
    },
    trex: {
        name: 'T-Rex', hp: 25, speed: 1.0, points: 100, cash: 40,
        scale: 0.9, color: 0x443322, bodyType: 'boss'
    },
};

DE.WAVE_TEMPLATES = [
    // Wave 1-3: easy
    [{ type: 'compy', count: 5, delay: 1.5 }],
    [{ type: 'compy', count: 8, delay: 1.2 }],
    [{ type: 'compy', count: 6, delay: 1.2 }, { type: 'dilophosaurus', count: 2, delay: 2 }],
    // Wave 4-6: introducing more types
    [{ type: 'compy', count: 5, delay: 1 }, { type: 'velociraptor', count: 3, delay: 1 }],
    [{ type: 'dilophosaurus', count: 5, delay: 1.5 }, { type: 'velociraptor', count: 3, delay: 0.8 }],
    [{ type: 'compy', count: 8, delay: 0.8 }, { type: 'dilophosaurus', count: 4, delay: 1.5 }, { type: 'triceratops', count: 1, delay: 3 }],
    // Wave 7-9: harder
    [{ type: 'velociraptor', count: 6, delay: 0.7 }, { type: 'triceratops', count: 2, delay: 2.5 }],
    [{ type: 'dilophosaurus', count: 6, delay: 1 }, { type: 'triceratops', count: 3, delay: 2 }, { type: 'velociraptor', count: 4, delay: 0.6 }],
    [{ type: 'compy', count: 10, delay: 0.5 }, { type: 'triceratops', count: 3, delay: 2 }, { type: 'velociraptor', count: 5, delay: 0.7 }],
    // Wave 10: first boss
    [{ type: 'dilophosaurus', count: 5, delay: 1 }, { type: 'triceratops', count: 3, delay: 2 }, { type: 'trex', count: 1, delay: 4 }],
];
