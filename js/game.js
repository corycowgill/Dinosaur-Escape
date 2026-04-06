window.DE = window.DE || {};

DE.Game = {
    state: null,
    mapMeshes: [],

    init: function() {
        var canvas = document.getElementById('game-canvas');

        // Initialize renderer and scene
        DE.Renderer.init(canvas);

        // Build map
        DE.Map.buildLayout();
        DE.Map.createScene(DE.Renderer.scene);

        // Build trap bar UI
        DE.HUD.buildTrapBar();

        // Setup input
        var self = this;
        DE.Input.init(canvas, {
            onPlace: function(col, row) { self.onPlace(col, row); },
            onSelectTrap: function(idx) { self.onSelectTrap(idx); },
            onStartGame: function() { self.start(); },
            onRestart: function() { self.restart(); }
        });

        // Reset state
        this.resetState();

        // Start render loop (but game not active yet)
        this.gameLoop();
    },

    resetState: function() {
        this.state = {
            score: 0,
            cash: DE.CONFIG.INITIAL_CASH,
            lives: DE.CONFIG.INITIAL_LIVES,
            started: false,
            gameOver: false,
            paused: false
        };
    },

    start: function() {
        this.resetState();
        this.state.started = true;

        DE.HUD.hideStartScreen();
        DE.HUD.hideGameOver();
        DE.HUD.showHUD();
        DE.HUD.updateScore(0);
        DE.HUD.updateCash(this.state.cash);
        DE.HUD.updateLives(this.state.lives, DE.CONFIG.MAX_LIVES);

        DE.Audio.init();
        DE.Audio.startMusic();

        DE.Input.showMobileControls();

        // Start wave 1
        DE.WaveManager.reset();
        DE.WaveManager.startWave(1);
    },

    gameLoop: function() {
        var self = this;
        requestAnimationFrame(function() { self.gameLoop(); });

        var dt = DE.Renderer.clock.getDelta();
        dt = Math.min(dt, 0.1); // Clamp

        if (this.state.started && !this.state.gameOver && !this.state.paused) {
            var scene = DE.Renderer.scene;
            var waypoints = DE.Map.getPathWaypoints();

            // Update systems
            DE.WaveManager.update(dt, DE.DinoManager, scene);
            DE.DinoManager.update(dt, waypoints, this.state, scene);
            DE.TrapManager.update(dt, DE.DinoManager.getAliveDinos(), scene);

            // Check game over
            if (this.state.lives <= 0) {
                this.gameOverSequence();
            }
        }

        // Poll gamepad every frame
        DE.Input.pollGamepad();

        // Render
        DE.Renderer.render();
    },

    onPlace: function(col, row) {
        if (!this.state.started || this.state.gameOver) return;
        DE.TrapManager.placeTrap(col, row, DE.Renderer.scene, this.state);
    },

    onSelectTrap: function(idx) {
        DE.TrapManager.selectTrap(idx);
    },

    gameOverSequence: function() {
        this.state.gameOver = true;
        DE.Audio.stopMusic();
        DE.Audio.playSound('gameOver');
        DE.HUD.showGameOver(this.state.score, DE.WaveManager.currentWave);
        DE.Input.hideMobileControls();
    },

    restart: function() {
        // Clear all entities
        DE.DinoManager.clear(DE.Renderer.scene);
        DE.TrapManager.clear();

        // Reset map trap references
        for (var r = 0; r < DE.CONFIG.GRID_ROWS; r++) {
            for (var c = 0; c < DE.CONFIG.GRID_COLS; c++) {
                DE.Map.grid[r][c].trap = null;
            }
        }

        this.start();
    }
};

// Boot
try {
    if (typeof THREE === 'undefined') {
        throw new Error('Three.js failed to load. Check your internet connection.');
    }
    DE.Game.init();
} catch (e) {
    console.error('Game failed to initialize:', e);
    var errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#f44;font-size:20px;text-align:center;z-index:9999;font-family:sans-serif;';
    errDiv.innerHTML = 'Failed to load game:<br>' + e.message + '<br><br><small>Check browser console for details</small>';
    document.body.appendChild(errDiv);
    var startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
}
