window.DE = window.DE || {};

DE.Map = {
    grid: [],
    waypoints: [],

    buildLayout: function() {
        var cols = DE.CONFIG.GRID_COLS, rows = DE.CONFIG.GRID_ROWS;
        this.grid = [];
        for (var r = 0; r < rows; r++) {
            this.grid[r] = [];
            for (var c = 0; c < cols; c++) this.grid[r][c] = { type: 'ground', trap: null };
        }
        var pathCells = [];
        var row = 1;
        for (var c = 0; c <= 17; c++) pathCells.push({ r: row, c: c });
        for (var r2 = 2; r2 <= 3; r2++) pathCells.push({ r: r2, c: 17 });
        for (var c = 16; c >= 3; c--) pathCells.push({ r: 3, c: c });
        for (var r2 = 4; r2 <= 5; r2++) pathCells.push({ r: r2, c: 3 });
        for (var c = 4; c <= 17; c++) pathCells.push({ r: 5, c: c });
        for (var r2 = 6; r2 <= 7; r2++) pathCells.push({ r: r2, c: 17 });
        for (var c = 16; c >= 3; c--) pathCells.push({ r: 7, c: c });
        for (var r2 = 8; r2 <= 9; r2++) pathCells.push({ r: r2, c: 3 });
        for (var c = 4; c <= 19; c++) pathCells.push({ r: 9, c: c });

        for (var i = 0; i < pathCells.length; i++) {
            var pc = pathCells[i];
            if (pc.r >= 0 && pc.r < rows && pc.c >= 0 && pc.c < cols) this.grid[pc.r][pc.c].type = 'path';
        }
        this.grid[1][0].type = 'spawn';
        this.grid[9][19].type = 'exit';
        this.waypoints = [];
        for (var i = 0; i < pathCells.length; i++) this.waypoints.push(this.gridToWorld(pathCells[i].c, pathCells[i].r));
        for (var c = 0; c < cols; c++) {
            if (this.grid[0][c].type === 'ground') this.grid[0][c].type = 'fence';
            if (this.grid[rows-1][c].type === 'ground') this.grid[rows-1][c].type = 'fence';
        }
        for (var r = 0; r < rows; r++) {
            if (this.grid[r][0].type === 'ground') this.grid[r][0].type = 'fence';
            if (this.grid[r][cols-1].type === 'ground') this.grid[r][cols-1].type = 'fence';
        }
    },

    createScene: function(scene) {
        var cs = DE.CONFIG.CELL_SIZE, cols = DE.CONFIG.GRID_COLS, rows = DE.CONFIG.GRID_ROWS;
        // Large ground
        var gp = new THREE.Mesh(new THREE.PlaneGeometry(cols * cs + 10, rows * cs + 10),
            new THREE.MeshStandardMaterial({ color: 0x2a6b1a, roughness: 0.9 }));
        gp.rotation.x = -Math.PI / 2;
        gp.position.set(cols * cs / 2, -0.01, rows * cs / 2);
        gp.receiveShadow = true;
        scene.add(gp);

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = this.grid[r][c], pos = this.gridToWorld(c, r);
                if (cell.type === 'path' || cell.type === 'spawn' || cell.type === 'exit') {
                    var rc = cell.type === 'spawn' ? 0xaa3333 : cell.type === 'exit' ? 0xbbaa33 : 0x8B7355;
                    var road = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.08, cs),
                        new THREE.MeshStandardMaterial({ color: rc, roughness: 0.95 }));
                    road.position.set(pos.x, 0.04, pos.z);
                    road.receiveShadow = true;
                    scene.add(road);
                    if ((c + r) % 3 === 0) {
                        for (var side = -1; side <= 1; side += 2) {
                            var track = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.12, 0.01, cs * 0.7),
                                new THREE.MeshStandardMaterial({ color: 0x6B5335, roughness: 1 }));
                            track.position.set(pos.x + side * cs * 0.2, 0.09, pos.z);
                            scene.add(track);
                        }
                    }
                } else if (cell.type === 'fence') {
                    this.addElectricFence(scene, pos.x, pos.z, cs, c, r, cols, rows);
                } else {
                    var gShade = 0.85 + Math.random() * 0.3;
                    var gnd = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.05, cs),
                        new THREE.MeshStandardMaterial({ color: new THREE.Color(0x2a6b1a).multiplyScalar(gShade), roughness: 0.9 }));
                    gnd.position.set(pos.x, 0.025, pos.z);
                    gnd.receiveShadow = true;
                    scene.add(gnd);
                }
            }
        }
        // Vegetation
        for (var r = 1; r < rows - 1; r++) {
            for (var c = 1; c < cols - 1; c++) {
                if (this.grid[r][c].type !== 'ground') continue;
                var pos = this.gridToWorld(c, r), rand = Math.random();
                if (rand < 0.12) this.addPalmTree(scene, pos.x, pos.z);
                else if (rand < 0.20) this.addBush(scene, pos.x, pos.z);
                else if (rand < 0.23) this.addRock(scene, pos.x, pos.z);
            }
        }
        this.addVisitorCenter(scene, cs);
        this.addHelipad(scene, cs);
        this.addWaterFeatures(scene, cs);
        this.addSpawnGate(scene, cs);
        this.addExitGate(scene, cs);
        this.addPaddockSigns(scene, cs);
    },

    addElectricFence: function(scene, x, z, cs, c, r, cols, rows) {
        var base = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.3, 0.2, cs * 0.3),
            new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 }));
        base.position.set(x, 0.1, z); scene.add(base);
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 }));
        post.position.set(x, 1.1, z); post.castShadow = true; scene.add(post);
        var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.15, 6),
            new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 }));
        cap.position.set(x, 2.05, z); scene.add(cap);
        var light = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), new THREE.MeshBasicMaterial({ color: 0xff4400 }));
        light.position.set(x, 2.15, z); scene.add(light);
        var wireMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
        if (c > 0 && c < cols - 1) for (var h = 0; h < 3; h++) {
            var w = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.02, 0.02), wireMat);
            w.position.set(x, 0.6 + h * 0.5, z); scene.add(w);
        }
        if (r > 0 && r < rows - 1) for (var h = 0; h < 3; h++) {
            var w = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, cs), wireMat);
            w.position.set(x, 0.6 + h * 0.5, z); scene.add(w);
        }
    },

    addPalmTree: function(scene, x, z) {
        var g = new THREE.Group();
        var tm = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
        for (var i = 0; i < 4; i++) {
            var s = new THREE.Mesh(new THREE.CylinderGeometry(0.12 - i * 0.015, 0.15 - i * 0.01, 0.6, 5), tm);
            s.position.y = 0.3 + i * 0.55; s.position.x = Math.sin(i * 0.3) * 0.1; s.castShadow = true; g.add(s);
        }
        var lm = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7, side: THREE.DoubleSide });
        for (var f = 0; f < 6; f++) {
            var fr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.2), lm);
            fr.position.set(0, 2.5, 0); fr.rotation.y = (f / 6) * Math.PI * 2; fr.rotation.x = -0.8 - Math.random() * 0.3;
            fr.castShadow = true; g.add(fr);
        }
        g.position.set(x + (Math.random() - 0.5) * 0.6, 0, z + (Math.random() - 0.5) * 0.6);
        scene.add(g);
    },

    addBush: function(scene, x, z) {
        var bm = new THREE.MeshStandardMaterial({ color: 0x1a8b2a, roughness: 0.8 });
        var g = new THREE.Group();
        for (var i = 0; i < 3; i++) {
            var sp = new THREE.Mesh(new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 5, 4), bm);
            sp.position.set((Math.random()-0.5)*0.3, 0.2+Math.random()*0.1, (Math.random()-0.5)*0.3);
            sp.castShadow = true; g.add(sp);
        }
        if (Math.random() < 0.4) {
            var fc = [0xff6699, 0xffcc00, 0xff4444, 0xaa66ff];
            for (var f = 0; f < 3; f++) {
                var fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 3, 3),
                    new THREE.MeshBasicMaterial({ color: fc[Math.floor(Math.random()*fc.length)] }));
                fl.position.set((Math.random()-0.5)*0.4, 0.35+Math.random()*0.15, (Math.random()-0.5)*0.4);
                g.add(fl);
            }
        }
        g.position.set(x+(Math.random()-0.5)*0.5, 0, z+(Math.random()-0.5)*0.5);
        scene.add(g);
    },

    addRock: function(scene, x, z) {
        var r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.2, 0),
            new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 }));
        r.scale.y = 0.5 + Math.random() * 0.3; r.rotation.y = Math.random() * Math.PI;
        r.position.set(x+(Math.random()-0.5)*0.5, 0.15, z+(Math.random()-0.5)*0.5);
        r.castShadow = true; scene.add(r);
    },

    addVisitorCenter: function(scene, cs) {
        var pos = this.gridToWorld(14, 0), g = new THREE.Group();
        var wm = new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.6 });
        var b = new THREE.Mesh(new THREE.BoxGeometry(cs * 3, 2.5, cs * 1.5), wm);
        b.position.y = 1.25; b.castShadow = true; g.add(b);
        var rf = new THREE.Mesh(new THREE.BoxGeometry(cs * 3.3, 0.3, cs * 1.8),
            new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.7 }));
        rf.position.y = 2.6; g.add(rf);
        var cm = new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.5 });
        for (var i = -1; i <= 1; i += 2) {
            var col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.4, 6), cm);
            col.position.set(i * cs * 1.2, 1.2, cs * 0.8); col.castShadow = true; g.add(col);
        }
        var wMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.2, metalness: 0.3 });
        for (var w = -2; w <= 2; w++) {
            var win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), wMat);
            win.position.set(w * 0.6, 1.5, cs * 0.76); g.add(win);
        }
        g.position.set(pos.x, 0, pos.z - cs * 0.3);
        scene.add(g);
    },

    addHelipad: function(scene, cs) {
        var pos = this.gridToWorld(2, 10);
        var pad = new THREE.Mesh(new THREE.CylinderGeometry(cs*0.8, cs*0.8, 0.1, 16),
            new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 }));
        pad.position.set(pos.x, 0.05, pos.z); scene.add(pad);
        var hm = new THREE.MeshBasicMaterial({ color: 0xffffff });
        var h1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.6), hm);
        h1.position.set(pos.x-0.2, 0.11, pos.z); scene.add(h1);
        var h2 = h1.clone(); h2.position.x = pos.x+0.2; scene.add(h2);
        var h3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.1), hm);
        h3.position.set(pos.x, 0.11, pos.z); scene.add(h3);
        var ring = new THREE.Mesh(new THREE.RingGeometry(cs*0.6, cs*0.65, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI/2; ring.position.set(pos.x, 0.11, pos.z); scene.add(ring);
    },

    addWaterFeatures: function(scene, cs) {
        var wps = [{c:7,r:2},{c:8,r:2},{c:12,r:8},{c:13,r:8}];
        var wm = new THREE.MeshStandardMaterial({ color: 0x2288aa, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8 });
        for (var i = 0; i < wps.length; i++) {
            var wp = wps[i];
            if (wp.r >= DE.CONFIG.GRID_ROWS || wp.c >= DE.CONFIG.GRID_COLS || this.grid[wp.r][wp.c].type !== 'ground') continue;
            var pos = this.gridToWorld(wp.c, wp.r);
            var water = new THREE.Mesh(new THREE.CircleGeometry(cs*0.45, 8), wm);
            water.rotation.x = -Math.PI/2; water.position.set(pos.x, 0.06, pos.z); scene.add(water);
        }
    },

    addSpawnGate: function(scene, cs) {
        var pos = this.gridToWorld(0, 1);
        var gm = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.6 });
        var mm = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
        for (var side = -1; side <= 1; side += 2) {
            var p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 0.3), gm);
            p.position.set(pos.x - cs*0.3, 1.25, pos.z + side*cs*0.5); p.castShadow = true; scene.add(p);
        }
        var arch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, cs*1.2), gm);
        arch.position.set(pos.x - cs*0.3, 2.5, pos.z); scene.add(arch);
        for (var b = 0; b < 4; b++) {
            var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 4), mm);
            bar.position.set(pos.x - cs*0.3, 1.1, pos.z - cs*0.35 + b*cs*0.23); scene.add(bar);
        }
        var wl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        wl.position.set(pos.x - cs*0.3, 2.8, pos.z); scene.add(wl);
    },

    addExitGate: function(scene, cs) {
        var pos = this.gridToWorld(19, 9);
        var gm = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.6 });
        for (var side = -1; side <= 1; side += 2) {
            var p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.0, 0.3), gm);
            p.position.set(pos.x + cs*0.3, 1.0, pos.z + side*cs*0.5); p.castShadow = true; scene.add(p);
        }
        var es = new THREE.Mesh(new THREE.BoxGeometry(cs*0.8, 0.4, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 }));
        es.position.set(pos.x + cs*0.3, 2.2, pos.z); scene.add(es);
        for (var b = 0; b < 3; b++) {
            var bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8+Math.random()*0.5, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
            bar.position.set(pos.x+cs*0.4, 0.4+Math.random()*0.3, pos.z-0.3+b*0.3);
            bar.rotation.z = (Math.random()-0.5)*0.4; scene.add(bar);
        }
    },

    addPaddockSigns: function(scene, cs) {
        var sps = [{c:9,r:2},{c:10,r:4},{c:10,r:6},{c:1,r:4},{c:1,r:8}];
        var sm = new THREE.MeshStandardMaterial({ color: 0xddcc00, roughness: 0.5 });
        var pm = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.5 });
        for (var i = 0; i < sps.length; i++) {
            var sp = sps[i];
            if (sp.r >= DE.CONFIG.GRID_ROWS || sp.c >= DE.CONFIG.GRID_COLS) continue;
            if (this.grid[sp.r][sp.c].type !== 'ground') continue;
            var pos = this.gridToWorld(sp.c, sp.r), g = new THREE.Group();
            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), pm);
            pole.position.y = 0.6; g.add(pole);
            var board = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), sm);
            board.position.y = 1.3; g.add(board);
            var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06),
                new THREE.MeshBasicMaterial({ color: 0x111111 }));
            stripe.position.y = 1.3; stripe.rotation.z = 0.5; g.add(stripe);
            g.position.set(pos.x, 0, pos.z); scene.add(g);
        }
    },

    gridToWorld: function(col, row) {
        var cs = DE.CONFIG.CELL_SIZE;
        return { x: col * cs + cs / 2, z: row * cs + cs / 2 };
    },
    worldToGrid: function(x, z) {
        var cs = DE.CONFIG.CELL_SIZE;
        return { col: Math.floor(x / cs), row: Math.floor(z / cs) };
    },
    canPlaceTrap: function(col, row) {
        if (row < 0 || row >= DE.CONFIG.GRID_ROWS || col < 0 || col >= DE.CONFIG.GRID_COLS) return false;
        return this.grid[row][col].type === 'ground' && this.grid[row][col].trap === null;
    },
    getPathWaypoints: function() { return this.waypoints; }
};
