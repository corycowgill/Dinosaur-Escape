# Dinosaur Escape

A 3D tower defense game set in a Jurassic Park-inspired dinosaur facility. Place traps along the path to stop increasingly dangerous waves of dinosaurs before they escape containment.

![Genre](https://img.shields.io/badge/genre-tower%20defense-green)
![Engine](https://img.shields.io/badge/engine-Three.js%20r128-blue)
![Lines](https://img.shields.io/badge/code-~5000%20lines-orange)

## Gameplay

Dinosaurs spawn at a gate on the left side of the map and follow a winding path toward the exit on the right. You spend cash to place traps adjacent to the path that automatically target and damage dinosaurs within range. Each kill earns score and cash. If too many dinosaurs escape (10 lives), the park is breached and the game ends.

**15 hand-crafted waves** escalate from small Compy swarms to a T-Rex boss encounter, followed by procedurally generated waves that scale infinitely.

### Dinosaur Types

| Dinosaur | HP | Speed | Trait |
|---|---|---|---|
| Compsognathus | 2 | 3.0 | Small, fast swarm fodder |
| Dilophosaurus | 5 | 2.0 | Medium threat with frills and crests |
| Velociraptor | 3 | 4.2 | Extremely fast, feathered |
| Triceratops | 12 | 1.2 | Heavy tank with armor plates |
| T-Rex | 25 | 1.0 | Boss -- massive HP, glowing eyes |

### Trap Types

| Trap | Cost | Key | Effect |
|---|---|---|---|
| Stun Bomb | $25 | 1 | Area stun + damage |
| Pit Trap | $15 | 2 | Damages dinos walking over it |
| Snare Cannon | $35 | 3 | Long-range root + damage, auto-aims |
| Tranq Dart | $30 | 4 | Damage over time (poison) |
| Electro Trap | $40 | 5 | Chain lightning stun across multiple targets |

### Controls

| Input | Action |
|---|---|
| **Mouse click** | Place trap |
| **Right-click** | Sell trap (50% refund) |
| **Shift+Scroll** | Zoom in/out |
| **Scroll** | Cycle trap selection |
| **1-5** | Select trap |
| **WASD / Arrows** | Move grid cursor |
| **Space / Enter** | Place trap at cursor |
| **X** | Sell trap at cursor |
| **+/-** | Zoom |
| **,/.** | Decrease/increase game speed (1x/2x/4x) |
| **Esc / P** | Pause |
| **Touch** | Tap to place, long-press to sell, pinch to zoom |
| **Xbox controller** | D-pad move, A place, Y sell, LB/RB cycle traps, triggers zoom |

## How It Was Built

### Architecture

The game is a single-page HTML application with no build step, no bundler, and no frameworks. It loads Three.js r128 from CDN (with automatic fallback across three CDN providers) and then sequentially loads 10 game scripts that attach themselves to a shared `window.DE` namespace.

```
index.html          -- Entry point, HTML/CSS UI, script loader
js/config.js        -- Grid dimensions, trap/dino stats, wave definitions
js/audio.js         -- Web Audio API procedural music + sound effects
js/renderer.js      -- Three.js scene, camera, lighting, sky, atmosphere
js/map.js           -- Grid layout, terrain, vegetation, structures, animations
js/hud.js           -- DOM-based HUD updates (score, lives, wave, trap bar)
js/traps.js         -- Trap placement, targeting AI, cooldowns, visual effects
js/dinosaurs.js     -- Dino spawning, pathfinding, limb animation, death effects
js/waves.js         -- Wave sequencing, spawn timing, procedural generation
js/input.js         -- Mouse, keyboard, touch, and gamepad input handling
js/game.js          -- Main game loop, state management, initialization
```

Every module follows the same pattern: a plain object literal on `DE.<ModuleName>` with an `init()` or setup method, an `update(dt)` method called each frame, and helper methods for creating Three.js meshes. There are no classes, no ES modules, and no `this` binding tricks -- just straightforward function calls through the shared namespace.

### Rendering

The renderer uses an **orthographic camera** positioned at roughly 45 degrees from the ground plane, creating a **2.5D isometric** perspective. The scene uses physically-based rendering features:

- **ACES Filmic tone mapping** with tuned exposure for cinematic color response
- **PCF Soft shadow maps** at 4096x4096 resolution from a directional sun light
- **Five-light setup**: warm directional sun, cool fill light, rim/backlight, hemisphere sky/ground bounce, and soft ambient fill
- **Exponential fog** for atmospheric depth
- **Gradient sky sphere** with vertex colors blending from horizon haze to deep blue
- **Volumetric clouds** (16 groups of sphere puffs) that drift across the sky
- **Light shafts** (god ray planes) with opacity shimmer animation
- **Dust/pollen particles** floating in the air using additive-blended Points

### Map Construction

The map is a 20x12 grid. Path cells are defined as a hardcoded serpentine route with spawn/exit endpoints, and perimeter cells become electric fences. Everything else is "ground" where traps can be placed and vegetation spawns randomly.

Terrain detail is built procedurally at scene creation time:

- **Path tiles** get cobblestones, gravel pebbles, weeds, puddles, tire tracks, cracks, and worn center lines
- **Ground tiles** get grass tufts (crossed plane pairs for volume), wildflower patches, dirt patches, fallen leaves, and small stones -- each with randomized color variation driven by a pseudo-noise function
- **Electric fences** include concrete foundations, ceramic insulators, transformer boxes, high-voltage wires, warning lights, and animated spark effects
- **Vegetation** includes palm trees (segmented trunks with bark rings, 8-frond crowns), jungle trees, ferns, bushes, rock formations, mushroom clusters, and fallen logs
- **Structures**: a visitor center building, helipad, water features, spawn/exit gates with animated elements, paddock signs, park benches, lamp posts, and litter bins

### Dinosaur Models

Each dinosaur type is built from dozens of Three.js primitives (boxes, spheres, cones, cylinders) composed into anatomically-styled models:

- Articulated **limbs** (legs, arms, tail, jaw) stored as pivot groups for walk-cycle animation
- **Material details**: belly undersides with lighter color, darker back ridges, spotted/striped skin patterns
- **Anatomical features**: eyes with pupils (slit pupils on predators), nostrils, teeth, claws, and type-specific elements (Dilophosaurus frills/crests, Velociraptor sickle claws and feathers, Triceratops horns/frill/beak, T-Rex brow ridges and battle scars)
- **Walk animation**: sinusoidal leg swing, opposing arm swing, tail sway, body roll, jaw movement (T-Rex), and vertical bounce
- **Health bars** that billboard (quaternion-copy from camera) to always face the viewer
- **Death sequence**: fall-over animation with red flash, opacity fade, and ground scorch mark
- **Stun effect**: orbiting golden star sparkles around the head

### Trap Systems

Traps are placed on ground cells and auto-fire at dinosaurs within range:

- Each trap type has a unique **3D model** built from primitives (the Electro Trap has capacitor banks, Tesla coil rings, and a glowing energy orb)
- **Targeting AI**: Snare Cannon and Tranq Dart target the closest dinosaur; Stun Bomb hits all in range; Electro Trap chains to nearby targets; Pit Trap damages on contact
- **Cooldown visualization**: traps dim and sink slightly while recharging, with color restoration on ready
- **Idle animations**: Electro Trap rotates and pulses its glow; Snare Cannon barrel tracks the nearest dinosaur; Stun Bomb blinks its indicator light; Tranq Dart scope lens glints
- **Fire effects**: muzzle flash + smoke puff at origin, projectile trail arc, impact flash + ring + particles at target, chain lightning zigzag bolts

### Audio

All audio is **procedurally generated** using the Web Audio API -- no audio files are loaded. The system creates:

- **Background music**: a pentatonic chord progression played with triangle/sine/square wave oscillators, with bass, melody, off-beat harmonics, and percussive clicks on a 350ms interval
- **Sound effects**: synthesized from short oscillator bursts (place, hit, stun, kill, escape, wave start, game over, error) with frequency sweeps and layered tones

### Input

The input system supports four input methods simultaneously:

- **Mouse**: click to place, right-click to sell, wheel to cycle traps or zoom (with shift)
- **Keyboard**: number keys for trap selection, WASD for grid cursor, space to place, X to sell
- **Touch**: tap to place, long-press (500ms) to sell, pinch-to-zoom, mobile D-pad overlay
- **Gamepad**: full Xbox controller mapping with D-pad navigation, face buttons for actions, triggers for zoom, cooldown-gated to prevent input repeat

### Wave System

The first 15 waves are hand-designed templates that introduce dinosaur types gradually. Beyond wave 15, a procedural generator creates infinite waves by scaling counts and speeds based on difficulty, with a T-Rex boss every 5 waves. Between waves, players receive a cash bonus that scales with the wave number, and a preview panel shows the composition of the next wave.

## Running Locally

No build step required. Serve the directory with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Open `http://localhost:8000` in a browser. The game loads Three.js from CDN, so an internet connection is needed on first load.

## Project Stats

- **~4,900 lines** of JavaScript across 10 modules
- **~300 lines** of HTML/CSS
- **Zero dependencies** beyond Three.js r128 (loaded from CDN)
- **Zero build tools** -- just static files
- **Zero audio files** -- all sound is synthesized
- **Zero texture files** -- all visuals are procedural geometry and materials
