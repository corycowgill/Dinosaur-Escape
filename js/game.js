window.DE = window.DE || {};

DE.Game = {
    state: null,
    gameSpeed: 1,
    speedOptions: [1, 2, 4],
    speedIndex: 0,

    init: function() {
        var canvas = document.getElementById('game-canvas');
        this.resetState();
        DE.Renderer.init(canvas);
        DE.Map.buildLayout();
        DE.Map.createScene(DE.Renderer.scene);
        DE.HUD.buildTrapBar();

        var self = this;
        DE.Input.init(canvas, {
            onPlace: function(col, row) { self.onPlace(col, row); },
            onSelectTrap: function(idx) { self.onSelectTrap(idx); },
            onStartGame: function() { self.start(); },
            onRestart: function() { self.restart(); }
        });

        this.gameLoop();
    },

    resetState: function() {
        this.state = {
            score: 0, cash: DE.CONFIG.INITIAL_CASH,
            lives: DE.CONFIG.INITIAL_LIVES,
            started: false, gameOver: false, paused: false
        };
    },

    start: function() {
        this.resetState();
        this.state.started = true;
        this.gameSpeed = 1;
        this.speedIndex = 0;

        DE.HUD.hideStartScreen();
        DE.HUD.hideGameOver();
        DE.HUD.showHUD();
        DE.HUD.updateScore(0);
        DE.HUD.updateCash(this.state.cash);
        DE.HUD.updateLives(this.state.lives, DE.CONFIG.MAX_LIVES);
        DE.HUD.updateSpeed(this.gameSpeed);

        DE.Audio.init();
        DE.Audio.startMusic();
        DE.Input.showMobileControls();

        DE.WaveManager.reset();
        DE.WaveManager.startWave(1);
    },

    cycleSpeed: function(dir) {
        this.speedIndex = (this.speedIndex + dir + this.speedOptions.length) % this.speedOptions.length;
        this.gameSpeed = this.speedOptions[this.speedIndex];
        DE.HUD.updateSpeed(this.gameSpeed);
    },

    gameLoop: function() {
        var self = this;
        requestAnimationFrame(function() { self.gameLoop(); });

        var dt = DE.Renderer.clock.getDelta();
        dt = Math.min(dt, 0.1);

        if (this.state && this.state.started && !this.state.gameOver && !this.state.paused) {
            var gameDt = dt * this.gameSpeed;
            var scene = DE.Renderer.scene;
            var waypoints = DE.Map.getPathWaypoints();

            DE.WaveManager.update(gameDt, DE.DinoManager, scene);
            DE.DinoManager.update(gameDt, waypoints, this.state, scene);
            DE.TrapManager.update(gameDt, DE.DinoManager.getAliveDinos(), scene);

            if (this.state.lives <= 0) this.gameOverSequence();
        }

        DE.Input.pollGamepad();
        DE.Renderer.render();
    },

    onPlace: function(col, row) {
        if (!this.state || !this.state.started || this.state.gameOver) return;
        DE.TrapManager.placeTrap(col, row, DE.Renderer.scene, this.state);
    },

    onSelectTrap: function(idx) { DE.TrapManager.selectTrap(idx); },

    gameOverSequence: function() {
        this.state.gameOver = true;
        DE.Audio.stopMusic();
        DE.Audio.playSound('gameOver');
        DE.HUD.showGameOver(this.state.score, DE.WaveManager.currentWave);
        DE.Input.hideMobileControls();
    },

    restart: function() {
        DE.DinoManager.clear(DE.Renderer.scene);
        DE.TrapManager.clear();
        for (var r = 0; r < DE.CONFIG.GRID_ROWS; r++)
            for (var c = 0; c < DE.CONFIG.GRID_COLS; c++) DE.Map.grid[r][c].trap = null;
        this.start();
    }
};

DE.Game.init();
