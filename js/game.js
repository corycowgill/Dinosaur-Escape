window.DE = window.DE || {};

DE.Game = {
    state: null,
    gameSpeed: 1,
    speedOptions: [1, 2, 4],
    speedIndex: 0,
    rangeRing: null,

    init: function() {
        var canvas = document.getElementById('game-canvas');
        this.resetState();
        DE.Renderer.init(canvas);
        DE.Map.buildLayout();
        DE.Map.createScene(DE.Renderer.scene);
        DE.HUD.buildTrapBar();

        // Create reusable range preview ring
        this.rangeRing = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 0.6, 32),
            new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
        );
        this.rangeRing.rotation.x = -Math.PI / 2;
        this.rangeRing.position.y = 0.15;
        this.rangeRing.visible = false;
        DE.Renderer.scene.add(this.rangeRing);

        var self = this;
        DE.Input.init(canvas, {
            onPlace: function(col, row) { self.onPlace(col, row); },
            onSelectTrap: function(idx) { self.onSelectTrap(idx); },
            onStartGame: function() { self.start(); },
            onRestart: function() { self.restart(); },
            onSell: function(col, row) { self.onSell(col, row); },
            onPause: function() { self.togglePause(); },
            onHover: function(col, row) { self.onHover(col, row); }
        });

        this.gameLoop();
    },

    resetState: function() {
        this.state = {
            score: 0, cash: DE.CONFIG.INITIAL_CASH,
            lives: DE.CONFIG.INITIAL_LIVES,
            started: false, gameOver: false, paused: false,
            // Stats
            kills: 0, trapsPlaced: 0, totalCashEarned: 0, escaped: 0
        };
    },

    start: function() {
        this.resetState();
        this.state.started = true;
        this.gameSpeed = 1;
        this.speedIndex = 0;

        DE.HUD.hideStartScreen();
        DE.HUD.hideGameOver();
        DE.HUD.hidePause();
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
        DE.HUD.updateWavePreview(DE.WaveManager.getNextWaveInfo(2));
    },

    togglePause: function() {
        if (!this.state || !this.state.started || this.state.gameOver) return;
        this.state.paused = !this.state.paused;
        if (this.state.paused) {
            DE.HUD.showPause();
        } else {
            DE.HUD.hidePause();
        }
    },

    cycleSpeed: function(dir) {
        this.speedIndex = (this.speedIndex + dir + this.speedOptions.length) % this.speedOptions.length;
        this.gameSpeed = this.speedOptions[this.speedIndex];
        DE.HUD.updateSpeed(this.gameSpeed);
    },

    onHover: function(col, row) {
        if (!this.rangeRing) return;
        if (!this.state || !this.state.started || this.state.gameOver) {
            this.rangeRing.visible = false;
            return;
        }
        var trapType = DE.TrapManager.getSelectedType();
        var pos = DE.Map.gridToWorld(col, row);
        var canPlace = DE.Map.canPlaceTrap(col, row);
        // Show range for selected trap at hovered position
        if (canPlace && trapType.range > 0) {
            var range = trapType.range;
            this.rangeRing.geometry.dispose();
            this.rangeRing.geometry = new THREE.RingGeometry(range - 0.08, range, 32);
            this.rangeRing.position.set(pos.x, 0.15, pos.z);
            this.rangeRing.material.color.setHex(0x44ff44);
            this.rangeRing.material.opacity = 0.25;
            this.rangeRing.visible = true;
        } else {
            // Check if there's a trap here to show sell info
            if (col >= 0 && col < DE.CONFIG.GRID_COLS && row >= 0 && row < DE.CONFIG.GRID_ROWS) {
                var cell = DE.Map.grid[row][col];
                if (cell.trap) {
                    var range = cell.trap.type.range;
                    if (range > 0) {
                        this.rangeRing.geometry.dispose();
                        this.rangeRing.geometry = new THREE.RingGeometry(range - 0.08, range, 32);
                        this.rangeRing.position.set(pos.x, 0.15, pos.z);
                        this.rangeRing.material.color.setHex(0xffaa44);
                        this.rangeRing.material.opacity = 0.2;
                        this.rangeRing.visible = true;
                    }
                    return;
                }
            }
            this.rangeRing.visible = false;
        }
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
            DE.Map.updateAnimations(gameDt);

            // Update floating damage numbers
            DE.DinoManager.updateFloaters(dt, DE.Renderer.camera);

            if (this.state.lives <= 0) this.gameOverSequence();
        }

        DE.Input.pollGamepad();
        DE.Renderer.render();
    },

    onPlace: function(col, row) {
        if (!this.state || !this.state.started || this.state.gameOver || this.state.paused) return;
        if (DE.TrapManager.placeTrap(col, row, DE.Renderer.scene, this.state)) {
            this.state.trapsPlaced++;
            // Placement flash effect
            this.placementEffect(col, row);
        }
    },

    onSell: function(col, row) {
        if (!this.state || !this.state.started || this.state.gameOver || this.state.paused) return;
        DE.TrapManager.sellTrap(col, row, DE.Renderer.scene, this.state);
    },

    placementEffect: function(col, row) {
        var pos = DE.Map.gridToWorld(col, row);
        var ring = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.8, 12),
            new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, 0.2, pos.z);
        DE.Renderer.scene.add(ring);
        setTimeout(function() { DE.Renderer.scene.remove(ring); }, 300);
    },

    onSelectTrap: function(idx) { DE.TrapManager.selectTrap(idx); },

    gameOverSequence: function() {
        this.state.gameOver = true;
        DE.Audio.stopMusic();
        DE.Audio.playSound('gameOver');
        DE.HUD.showGameOver(this.state.score, DE.WaveManager.currentWave, this.state);
        DE.Input.hideMobileControls();
        if (this.rangeRing) this.rangeRing.visible = false;
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
