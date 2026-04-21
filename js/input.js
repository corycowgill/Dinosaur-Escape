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
    pinchStartDist: 0,
    pinchStartZoom: 1,

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
                if (self.callbacks.onHover) self.callbacks.onHover(self.hoverGridPos.col, self.hoverGridPos.row);
            }
        });
        this.canvas.addEventListener('pointerdown', function(e) {
            if (e.pointerType === 'touch') return;
            if (e.button !== 0) return; // left click only
            if (!DE.Game.state || !DE.Game.state.started || DE.Game.state.gameOver) return;
            var world = DE.Renderer.screenToWorld(e.clientX, e.clientY);
            if (world) { var g = DE.Map.worldToGrid(world.x, world.z); self.callbacks.onPlace(g.col, g.row); }
        });
        // Right-click to sell
        this.canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (!DE.Game.state || !DE.Game.state.started || DE.Game.state.gameOver) return;
            var world = DE.Renderer.screenToWorld(e.clientX, e.clientY);
            if (world) {
                var g = DE.Map.worldToGrid(world.x, world.z);
                if (self.callbacks.onSell) self.callbacks.onSell(g.col, g.row);
            }
        });
        // Scroll: zoom (hold shift) or cycle traps
        this.canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (e.shiftKey || e.ctrlKey) {
                // Zoom
                var delta = e.deltaY > 0 ? -0.15 : 0.15;
                DE.Renderer.setZoom(DE.Renderer.zoomLevel + delta);
            } else {
                var dir = e.deltaY > 0 ? 1 : -1;
                var idx = (DE.TrapManager.selectedTrapIndex + dir + DE.TRAP_TYPES.length) % DE.TRAP_TYPES.length;
                self.callbacks.onSelectTrap(idx);
            }
        }, { passive: false });
    },

    setupKeyboard: function() {
        var self = this;
        window.addEventListener('keydown', function(e) {
            // Speed controls work even in menus
            if (e.key === ',' || e.key === '<') { DE.Game.cycleSpeed(-1); return; }
            if (e.key === '.' || e.key === '>') { DE.Game.cycleSpeed(1); return; }
            // Zoom
            if (e.key === '=' || e.key === '+') { DE.Renderer.setZoom(DE.Renderer.zoomLevel + 0.2); return; }
            if (e.key === '-' || e.key === '_') { DE.Renderer.setZoom(DE.Renderer.zoomLevel - 0.2); return; }

            // Close settings panel first if open
            if (e.key === 'Escape' && DE.HUD.settingsOpen) {
                DE.HUD.toggleSettings();
                return;
            }

            // Pause
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (self.callbacks.onPause) self.callbacks.onPause();
                return;
            }

            if (!DE.Game.state || !DE.Game.state.started || DE.Game.state.gameOver || DE.Game.state.paused) return;
            var num = parseInt(e.key);
            if (num >= 1 && num <= 5) { self.callbacks.onSelectTrap(num - 1); return; }

            // Sell trap at cursor
            if (e.key === 'x' || e.key === 'X') {
                if (self.callbacks.onSell) self.callbacks.onSell(self.cursorGridPos.col, self.cursorGridPos.row);
                return;
            }

            self.useGridCursor = true;
            var moved = false;
            switch (e.key) {
                case 'w': case 'W': case 'ArrowUp':
                    self.cursorGridPos.row = Math.max(0, self.cursorGridPos.row - 1); moved = true; break;
                case 's': case 'S': case 'ArrowDown':
                    self.cursorGridPos.row = Math.min(DE.CONFIG.GRID_ROWS - 1, self.cursorGridPos.row + 1); moved = true; break;
                case 'a': case 'A': case 'ArrowLeft':
                    self.cursorGridPos.col = Math.max(0, self.cursorGridPos.col - 1); moved = true; break;
                case 'd': case 'D': case 'ArrowRight':
                    self.cursorGridPos.col = Math.min(DE.CONFIG.GRID_COLS - 1, self.cursorGridPos.col + 1); moved = true; break;
                case ' ': case 'Enter':
                    e.preventDefault();
                    self.callbacks.onPlace(self.cursorGridPos.col, self.cursorGridPos.row); break;
            }
            if (moved) {
                self.updateCursorIndicator(self.cursorGridPos.col, self.cursorGridPos.row);
                if (self.callbacks.onHover) self.callbacks.onHover(self.cursorGridPos.col, self.cursorGridPos.row);
            }
        });
    },

    setupTouch: function() {
        var self = this;
        // Tap on canvas to place trap / pinch to zoom
        self.longPressTimer = null;
        self.longPressGrid = null;
        this.canvas.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                // Pinch zoom start
                if (self.longPressTimer) { clearTimeout(self.longPressTimer); self.longPressTimer = null; }
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                self.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
                self.pinchStartZoom = DE.Renderer.zoomLevel;
                e.preventDefault();
                return;
            }
            if (!DE.Game.state || !DE.Game.state.started || DE.Game.state.gameOver) return;
            e.preventDefault();
            var touch = e.touches[0];
            var world = DE.Renderer.screenToWorld(touch.clientX, touch.clientY);
            if (world) {
                var g = DE.Map.worldToGrid(world.x, world.z);
                self.longPressGrid = g;
                // Long press to sell (500ms)
                self.longPressTimer = setTimeout(function() {
                    if (self.callbacks.onSell) self.callbacks.onSell(g.col, g.row);
                    self.longPressGrid = null;
                }, 500);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', function(e) {
            if (self.longPressTimer) {
                clearTimeout(self.longPressTimer);
                self.longPressTimer = null;
                // Short tap = place
                if (self.longPressGrid) {
                    self.callbacks.onPlace(self.longPressGrid.col, self.longPressGrid.row);
                    self.longPressGrid = null;
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', function(e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (self.pinchStartDist > 0) {
                    var scale = dist / self.pinchStartDist;
                    DE.Renderer.setZoom(self.pinchStartZoom * scale);
                }
            }
        }, { passive: false });

        // Mobile D-pad
        var dpadBtns = document.querySelectorAll('.dpad-btn');
        for (var i = 0; i < dpadBtns.length; i++) {
            (function(btn) {
                var dir = btn.dataset.dir, intervalId = null;
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
                btn.addEventListener('touchstart', function(e) { e.preventDefault(); move(); intervalId = setInterval(move, 200); }, { passive: false });
                btn.addEventListener('touchend', function(e) { e.preventDefault(); if (intervalId) { clearInterval(intervalId); intervalId = null; } }, { passive: false });
            })(dpadBtns[i]);
        }

        var placeBtn = document.getElementById('mobile-place-btn');
        placeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (!DE.Game.state || !DE.Game.state.started || DE.Game.state.gameOver) return;
            self.callbacks.onPlace(self.cursorGridPos.col, self.cursorGridPos.row);
        }, { passive: false });
    },

    setupButtons: function() {
        var self = this;
        function debounceCall(fn, guard) { var now = Date.now(); if (now - guard.t < 400) return; guard.t = now; fn(); }
        var startGuard = { t: 0 }, restartGuard = { t: 0 };
        document.getElementById('start-btn').addEventListener('click', function(e) {
            e.preventDefault(); debounceCall(function() { self.callbacks.onStartGame(); }, startGuard);
        });
        document.getElementById('restart-btn').addEventListener('click', function(e) {
            e.preventDefault(); debounceCall(function() { self.callbacks.onRestart(); }, restartGuard);
        });
        var resumeGuard = { t: 0 };
        document.getElementById('resume-btn').addEventListener('click', function(e) {
            e.preventDefault(); debounceCall(function() { if (self.callbacks.onPause) self.callbacks.onPause(); }, resumeGuard);
        });
        document.getElementById('trap-bar').addEventListener('click', function(e) {
            var btn = e.target.closest('.trap-btn');
            if (btn) self.callbacks.onSelectTrap(parseInt(btn.dataset.index));
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
        var vec = new THREE.Vector3(pos.x, 0.2, pos.z);
        vec.project(DE.Renderer.camera);
        var x = (vec.x * 0.5 + 0.5) * window.innerWidth;
        var y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
        this.cursorEl.style.display = 'block';
        this.cursorEl.style.left = (x - 25) + 'px';
        this.cursorEl.style.top = (y - 25) + 'px';
        var canPlace = DE.Map.canPlaceTrap(col, row);
        this.cursorEl.style.borderColor = canPlace ? 'rgba(0,255,0,0.6)' : 'rgba(255,0,0,0.6)';
        this.cursorEl.style.boxShadow = canPlace ? '0 0 10px rgba(0,255,0,0.3)' : '0 0 10px rgba(255,0,0,0.3)';
    },

    pollGamepad: function() {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        var gp = null;
        for (var i = 0; i < gamepads.length; i++) if (gamepads[i]) { gp = gamepads[i]; break; }
        if (!gp || !DE.Game.state || !DE.Game.state.started) return;

        this.gamepadCooldown = Math.max(0, this.gamepadCooldown - 1);
        if (this.gamepadCooldown > 0) return;

        // Start button (9) = pause, works even when paused or game over
        if (gp.buttons[9] && gp.buttons[9].pressed) {
            if (this.callbacks.onPause) this.callbacks.onPause();
            this.gamepadCooldown = 15;
            return;
        }

        if (DE.Game.state.gameOver || DE.Game.state.paused) return;
        this.useGridCursor = true;
        var moved = false;
        var lx = gp.axes[0] || 0, ly = gp.axes[1] || 0, dz = 0.4;

        if ((gp.buttons[12] && gp.buttons[12].pressed) || ly < -dz) { this.cursorGridPos.row = Math.max(0, this.cursorGridPos.row - 1); moved = true; }
        if ((gp.buttons[13] && gp.buttons[13].pressed) || ly > dz) { this.cursorGridPos.row = Math.min(DE.CONFIG.GRID_ROWS - 1, this.cursorGridPos.row + 1); moved = true; }
        if ((gp.buttons[14] && gp.buttons[14].pressed) || lx < -dz) { this.cursorGridPos.col = Math.max(0, this.cursorGridPos.col - 1); moved = true; }
        if ((gp.buttons[15] && gp.buttons[15].pressed) || lx > dz) { this.cursorGridPos.col = Math.min(DE.CONFIG.GRID_COLS - 1, this.cursorGridPos.col + 1); moved = true; }

        if (gp.buttons[0] && gp.buttons[0].pressed) { this.callbacks.onPlace(this.cursorGridPos.col, this.cursorGridPos.row); this.gamepadCooldown = 12; }
        // Y button (3) = sell
        if (gp.buttons[3] && gp.buttons[3].pressed) { if (this.callbacks.onSell) this.callbacks.onSell(this.cursorGridPos.col, this.cursorGridPos.row); this.gamepadCooldown = 12; }
        if (gp.buttons[4] && gp.buttons[4].pressed) { this.callbacks.onSelectTrap((DE.TrapManager.selectedTrapIndex - 1 + DE.TRAP_TYPES.length) % DE.TRAP_TYPES.length); this.gamepadCooldown = 12; }
        if (gp.buttons[5] && gp.buttons[5].pressed) { this.callbacks.onSelectTrap((DE.TrapManager.selectedTrapIndex + 1) % DE.TRAP_TYPES.length); this.gamepadCooldown = 12; }
        // Right trigger = zoom in, Left trigger = zoom out
        if (gp.buttons[7] && gp.buttons[7].value > 0.2) DE.Renderer.setZoom(DE.Renderer.zoomLevel + 0.03);
        if (gp.buttons[6] && gp.buttons[6].value > 0.2) DE.Renderer.setZoom(DE.Renderer.zoomLevel - 0.03);
        // X button = cycle speed
        if (gp.buttons[2] && gp.buttons[2].pressed) { DE.Game.cycleSpeed(1); this.gamepadCooldown = 15; }

        if (moved) { this.gamepadCooldown = 8; this.updateCursorIndicator(this.cursorGridPos.col, this.cursorGridPos.row); }
    }
};
