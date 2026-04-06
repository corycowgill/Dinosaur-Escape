window.DE = window.DE || {};

DE.Input = {
    cursorGridPos: { col: 10, row: 6 },
    isMobile: false,
    gamepadCooldown: 0,
    hoverGridPos: null,
    callbacks: null,
    canvas: null,
    cursorEl: null,
    useGridCursor: false,

    init: function(canvas, callbacks) {
        this.canvas = canvas;
        this.callbacks = callbacks;
        this.cursorEl = document.getElementById('cursor-indicator');
        this.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

        this.setupMouse();
        this.setupKeyboard();
        this.setupTouch();
        this.setupButtons();
    },

    setupMouse: function() {
        var self = this;

        this.canvas.addEventListener('pointermove', function(e) {
            if (e.pointerType === 'touch') return;
            var world = DE.Renderer.screenToWorld(e.clientX, e.clientY);
            if (world) {
                self.hoverGridPos = DE.Map.worldToGrid(world.x, world.z);
                self.useGridCursor = false;
            }
        });

        this.canvas.addEventListener('pointerdown', function(e) {
            if (e.pointerType === 'touch') return;
            if (!DE.Game.state.started || DE.Game.state.gameOver) return;
            var world = DE.Renderer.screenToWorld(e.clientX, e.clientY);
            if (world) {
                var grid = DE.Map.worldToGrid(world.x, world.z);
                self.callbacks.onPlace(grid.col, grid.row);
            }
        });

        this.canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            var dir = e.deltaY > 0 ? 1 : -1;
            var idx = (DE.TrapManager.selectedTrapIndex + dir + DE.TRAP_TYPES.length) % DE.TRAP_TYPES.length;
            self.callbacks.onSelectTrap(idx);
        }, { passive: false });
    },

    setupKeyboard: function() {
        var self = this;
        window.addEventListener('keydown', function(e) {
            if (!DE.Game.state.started || DE.Game.state.gameOver) return;

            // Trap selection 1-5
            var num = parseInt(e.key);
            if (num >= 1 && num <= 5) {
                self.callbacks.onSelectTrap(num - 1);
                return;
            }

            self.useGridCursor = true;
            var moved = false;

            switch (e.key) {
                case 'w': case 'W': case 'ArrowUp':
                    self.cursorGridPos.row = Math.max(0, self.cursorGridPos.row - 1);
                    moved = true; break;
                case 's': case 'S': case 'ArrowDown':
                    self.cursorGridPos.row = Math.min(DE.CONFIG.GRID_ROWS - 1, self.cursorGridPos.row + 1);
                    moved = true; break;
                case 'a': case 'A': case 'ArrowLeft':
                    self.cursorGridPos.col = Math.max(0, self.cursorGridPos.col - 1);
                    moved = true; break;
                case 'd': case 'D': case 'ArrowRight':
                    self.cursorGridPos.col = Math.min(DE.CONFIG.GRID_COLS - 1, self.cursorGridPos.col + 1);
                    moved = true; break;
                case ' ': case 'Enter':
                    e.preventDefault();
                    self.callbacks.onPlace(self.cursorGridPos.col, self.cursorGridPos.row);
                    break;
            }

            if (moved) {
                self.updateCursorIndicator(self.cursorGridPos.col, self.cursorGridPos.row);
            }
        });
    },

    setupTouch: function() {
        var self = this;

        // Tap on canvas to place trap
        this.canvas.addEventListener('touchstart', function(e) {
            if (!DE.Game.state.started || DE.Game.state.gameOver) return;
            e.preventDefault();

            var touch = e.touches[0];
            var world = DE.Renderer.screenToWorld(touch.clientX, touch.clientY);
            if (world) {
                var grid = DE.Map.worldToGrid(world.x, world.z);
                self.callbacks.onPlace(grid.col, grid.row);
            }
        }, { passive: false });

        // Mobile D-pad
        var dpadBtns = document.querySelectorAll('.dpad-btn');
        for (var i = 0; i < dpadBtns.length; i++) {
            (function(btn) {
                var dir = btn.dataset.dir;
                var intervalId = null;

                var move = function() {
                    self.useGridCursor = true;
                    switch (dir) {
                        case 'up': self.cursorGridPos.row = Math.max(0, self.cursorGridPos.row - 1); break;
                        case 'down': self.cursorGridPos.row = Math.min(DE.CONFIG.GRID_ROWS - 1, self.cursorGridPos.row + 1); break;
                        case 'left': self.cursorGridPos.col = Math.max(0, self.cursorGridPos.col - 1); break;
                        case 'right': self.cursorGridPos.col = Math.min(DE.CONFIG.GRID_COLS - 1, self.cursorGridPos.col + 1); break;
                    }
                    self.updateCursorIndicator(self.cursorGridPos.col, self.cursorGridPos.row);
                };

                btn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    move();
                    intervalId = setInterval(move, 200);
                }, { passive: false });

                btn.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    if (intervalId) { clearInterval(intervalId); intervalId = null; }
                }, { passive: false });
            })(dpadBtns[i]);
        }

        // Place button
        var placeBtn = document.getElementById('mobile-place-btn');
        placeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (!DE.Game.state.started || DE.Game.state.gameOver) return;
            self.callbacks.onPlace(self.cursorGridPos.col, self.cursorGridPos.row);
        }, { passive: false });
    },

    setupButtons: function() {
        var self = this;

        // Start button
        document.getElementById('start-btn').addEventListener('click', function() {
            self.callbacks.onStartGame();
        });
        document.getElementById('start-btn').addEventListener('touchend', function(e) {
            e.preventDefault();
            self.callbacks.onStartGame();
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', function() {
            self.callbacks.onRestart();
        });
        document.getElementById('restart-btn').addEventListener('touchend', function(e) {
            e.preventDefault();
            self.callbacks.onRestart();
        });

        // Trap bar buttons
        document.getElementById('trap-bar').addEventListener('click', function(e) {
            var btn = e.target.closest('.trap-btn');
            if (btn) {
                self.callbacks.onSelectTrap(parseInt(btn.dataset.index));
            }
        });
        document.getElementById('trap-bar').addEventListener('touchend', function(e) {
            e.preventDefault();
            var btn = e.target.closest('.trap-btn');
            if (btn) {
                self.callbacks.onSelectTrap(parseInt(btn.dataset.index));
            }
        });
    },

    showMobileControls: function() {
        if (this.isMobile) {
            document.getElementById('mobile-dpad').style.display = 'block';
            document.getElementById('mobile-place-btn').style.display = 'flex';
        }
    },

    hideMobileControls: function() {
        document.getElementById('mobile-dpad').style.display = 'none';
        document.getElementById('mobile-place-btn').style.display = 'none';
    },

    updateCursorIndicator: function(col, row) {
        var pos = DE.Map.gridToWorld(col, row);
        // Project world position to screen
        var vec = new THREE.Vector3(pos.x, 0.2, pos.z);
        vec.project(DE.Renderer.camera);
        var x = (vec.x * 0.5 + 0.5) * window.innerWidth;
        var y = (-vec.y * 0.5 + 0.5) * window.innerHeight;

        this.cursorEl.style.display = 'block';
        this.cursorEl.style.left = (x - 25) + 'px';
        this.cursorEl.style.top = (y - 25) + 'px';

        // Color based on whether placement is valid
        var canPlace = DE.Map.canPlaceTrap(col, row);
        this.cursorEl.style.borderColor = canPlace ? 'rgba(0,255,0,0.6)' : 'rgba(255,0,0,0.6)';
        this.cursorEl.style.boxShadow = canPlace ? '0 0 10px rgba(0,255,0,0.3)' : '0 0 10px rgba(255,0,0,0.3)';
    },

    pollGamepad: function() {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        var gp = null;
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) { gp = gamepads[i]; break; }
        }
        if (!gp) return;
        if (!DE.Game.state.started || DE.Game.state.gameOver) return;

        this.gamepadCooldown = Math.max(0, this.gamepadCooldown - 1);
        if (this.gamepadCooldown > 0) return;

        this.useGridCursor = true;
        var moved = false;

        // D-pad or left stick
        var lx = gp.axes[0] || 0;
        var ly = gp.axes[1] || 0;
        var deadzone = 0.4;

        var up = gp.buttons[12] && gp.buttons[12].pressed;
        var down = gp.buttons[13] && gp.buttons[13].pressed;
        var left = gp.buttons[14] && gp.buttons[14].pressed;
        var right = gp.buttons[15] && gp.buttons[15].pressed;

        if (up || ly < -deadzone) {
            this.cursorGridPos.row = Math.max(0, this.cursorGridPos.row - 1);
            moved = true;
        }
        if (down || ly > deadzone) {
            this.cursorGridPos.row = Math.min(DE.CONFIG.GRID_ROWS - 1, this.cursorGridPos.row + 1);
            moved = true;
        }
        if (left || lx < -deadzone) {
            this.cursorGridPos.col = Math.max(0, this.cursorGridPos.col - 1);
            moved = true;
        }
        if (right || lx > deadzone) {
            this.cursorGridPos.col = Math.min(DE.CONFIG.GRID_COLS - 1, this.cursorGridPos.col + 1);
            moved = true;
        }

        // A button (button 0) - place trap
        if (gp.buttons[0] && gp.buttons[0].pressed) {
            this.callbacks.onPlace(this.cursorGridPos.col, this.cursorGridPos.row);
            this.gamepadCooldown = 12;
        }

        // LB (button 4) - previous trap
        if (gp.buttons[4] && gp.buttons[4].pressed) {
            var idx = (DE.TrapManager.selectedTrapIndex - 1 + DE.TRAP_TYPES.length) % DE.TRAP_TYPES.length;
            this.callbacks.onSelectTrap(idx);
            this.gamepadCooldown = 12;
        }

        // RB (button 5) - next trap
        if (gp.buttons[5] && gp.buttons[5].pressed) {
            var idx = (DE.TrapManager.selectedTrapIndex + 1) % DE.TRAP_TYPES.length;
            this.callbacks.onSelectTrap(idx);
            this.gamepadCooldown = 12;
        }

        if (moved) {
            this.gamepadCooldown = 8;
            this.updateCursorIndicator(this.cursorGridPos.col, this.cursorGridPos.row);
        }
    },

    getActiveGridPos: function() {
        if (this.useGridCursor) {
            return this.cursorGridPos;
        }
        return this.hoverGridPos;
    }
};
