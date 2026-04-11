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
        // Large ground base
        var gp = new THREE.Mesh(new THREE.PlaneGeometry(cols * cs + 20, rows * cs + 20),
            new THREE.MeshStandardMaterial({ color: 0x2a6b1a, roughness: 0.9 }));
        gp.rotation.x = -Math.PI / 2;
        gp.position.set(cols * cs / 2, -0.02, rows * cs / 2);
        gp.receiveShadow = true;
        scene.add(gp);

        var grassMat = new THREE.MeshStandardMaterial({ color: 0x3d8c24, roughness: 0.85 });
        var dirtMat = new THREE.MeshStandardMaterial({ color: 0x7a6040, roughness: 1.0 });

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = this.grid[r][c], pos = this.gridToWorld(c, r);
                if (cell.type === 'path' || cell.type === 'spawn' || cell.type === 'exit') {
                    var rc = cell.type === 'spawn' ? 0xaa3333 : cell.type === 'exit' ? 0xbbaa33 : 0x8B7355;
                    // Road base
                    var road = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.08, cs),
                        new THREE.MeshStandardMaterial({ color: rc, roughness: 0.95 }));
                    road.position.set(pos.x, 0.04, pos.z);
                    road.receiveShadow = true;
                    scene.add(road);
                    // Cobblestone edge borders
                    if (cell.type === 'path') {
                        var edgeMat = new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.8 });
                        for (var side = -1; side <= 1; side += 2) {
                            var edge = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.12, 0.12), edgeMat);
                            edge.position.set(pos.x, 0.06, pos.z + side * cs * 0.46);
                            scene.add(edge);
                            var edge2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, cs), edgeMat);
                            edge2.position.set(pos.x + side * cs * 0.46, 0.06, pos.z);
                            scene.add(edge2);
                        }
                        // Gravel pebbles on path
                        var pebbleMat = new THREE.MeshStandardMaterial({ color: 0x9a8a70, roughness: 0.9 });
                        for (var p = 0; p < 4; p++) {
                            var peb = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 3, 3), pebbleMat);
                            peb.position.set(pos.x + (Math.random() - 0.5) * cs * 0.7, 0.09,
                                pos.z + (Math.random() - 0.5) * cs * 0.7);
                            peb.scale.y = 0.4;
                            scene.add(peb);
                        }
                        // Worn center line
                        if ((c + r) % 4 === 0) {
                            var worn = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.6, 0.01, 0.08),
                                new THREE.MeshStandardMaterial({ color: 0x7a6a50, roughness: 1 }));
                            worn.position.set(pos.x, 0.09, pos.z);
                            scene.add(worn);
                        }
                    }
                    // Tire tracks
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
                    // Ground tile with shade variation
                    var gShade = 0.85 + Math.random() * 0.3;
                    var gnd = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.05, cs),
                        new THREE.MeshStandardMaterial({ color: new THREE.Color(0x2a6b1a).multiplyScalar(gShade), roughness: 0.9 }));
                    gnd.position.set(pos.x, 0.025, pos.z);
                    gnd.receiveShadow = true;
                    scene.add(gnd);
                    // Grass tufts - small vertical planes
                    if (Math.random() < 0.5) {
                        var tuftCount = 1 + Math.floor(Math.random() * 3);
                        for (var t = 0; t < tuftCount; t++) {
                            var tuftH = 0.08 + Math.random() * 0.12;
                            var tuft = new THREE.Mesh(
                                new THREE.PlaneGeometry(0.06, tuftH),
                                new THREE.MeshStandardMaterial({ color: new THREE.Color(0x2d8c1a).multiplyScalar(0.8 + Math.random() * 0.4),
                                    roughness: 0.9, side: THREE.DoubleSide }));
                            tuft.position.set(pos.x + (Math.random() - 0.5) * cs * 0.8,
                                tuftH / 2 + 0.05, pos.z + (Math.random() - 0.5) * cs * 0.8);
                            tuft.rotation.y = Math.random() * Math.PI;
                            scene.add(tuft);
                        }
                    }
                    // Occasional dirt patches
                    if (Math.random() < 0.15) {
                        var dirt = new THREE.Mesh(new THREE.CircleGeometry(0.15 + Math.random() * 0.2, 6), dirtMat);
                        dirt.rotation.x = -Math.PI / 2;
                        dirt.position.set(pos.x + (Math.random() - 0.5) * 0.5, 0.06,
                            pos.z + (Math.random() - 0.5) * 0.5);
                        scene.add(dirt);
                    }
                    // Small stones
                    if (Math.random() < 0.1) {
                        var stone = new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 3),
                            new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.9 }));
                        stone.scale.y = 0.5;
                        stone.position.set(pos.x + (Math.random() - 0.5) * 0.6, 0.06,
                            pos.z + (Math.random() - 0.5) * 0.6);
                        scene.add(stone);
                    }
                }
            }
        }
        // Vegetation
        for (var r = 1; r < rows - 1; r++) {
            for (var c = 1; c < cols - 1; c++) {
                if (this.grid[r][c].type !== 'ground') continue;
                var pos = this.gridToWorld(c, r), rand = Math.random();
                if (rand < 0.10) this.addPalmTree(scene, pos.x, pos.z);
                else if (rand < 0.15) this.addFern(scene, pos.x, pos.z);
                else if (rand < 0.22) this.addBush(scene, pos.x, pos.z);
                else if (rand < 0.26) this.addRock(scene, pos.x, pos.z);
            }
        }
        this.addVisitorCenter(scene, cs);
        this.addHelipad(scene, cs);
        this.addWaterFeatures(scene, cs);
        this.addSpawnGate(scene, cs);
        this.addExitGate(scene, cs);
        this.addPaddockSigns(scene, cs);
        this.addAmbientProps(scene, cs);
    },

    addElectricFence: function(scene, x, z, cs, c, r, cols, rows) {
        // Concrete foundation
        var base = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.4, 0.25, cs * 0.4),
            new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 }));
        base.position.set(x, 0.125, z); base.receiveShadow = true; scene.add(base);
        // Foundation bolts
        var boltMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.2 });
        for (var bx = -1; bx <= 1; bx += 2) {
            for (var bz = -1; bz <= 1; bz += 2) {
                var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 4), boltMat);
                bolt.position.set(x + bx * cs * 0.12, 0.27, z + bz * cs * 0.12);
                scene.add(bolt);
            }
        }
        // Steel post with taper
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.0, 6),
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 }));
        post.position.set(x, 1.25, z); post.castShadow = true; scene.add(post);
        // Cross-brace support
        var braceMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
        var brace = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, cs * 0.3), braceMat);
        brace.position.set(x, 0.6, z); brace.rotation.y = Math.PI * 0.25; scene.add(brace);
        // Ceramic insulators (3 white cylinders)
        var insMat = new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.4 });
        for (var h = 0; h < 3; h++) {
            var ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 6), insMat);
            ins.position.set(x + 0.08, 0.7 + h * 0.55, z); scene.add(ins);
        }
        // Red insulator cap
        var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.15, 6),
            new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 }));
        cap.position.set(x, 2.3, z); scene.add(cap);
        // Warning light with glow
        var light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff4400 }));
        light.position.set(x, 2.42, z); scene.add(light);
        // Light housing
        var housing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
        housing.position.set(x, 2.35, z); scene.add(housing);
        // High-voltage wires
        var wireMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.1 });
        if (c > 0 && c < cols - 1) for (var h = 0; h < 4; h++) {
            var w = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.02, 0.02), wireMat);
            w.position.set(x, 0.5 + h * 0.45, z); scene.add(w);
        }
        if (r > 0 && r < rows - 1) for (var h = 0; h < 4; h++) {
            var w = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, cs), wireMat);
            w.position.set(x, 0.5 + h * 0.45, z); scene.add(w);
        }
        // Spark effect between wires (small yellow sphere)
        if (Math.random() < 0.3) {
            var spark = new THREE.Mesh(new THREE.SphereGeometry(0.03, 3, 3),
                new THREE.MeshBasicMaterial({ color: 0xffff44 }));
            spark.position.set(x + (Math.random() - 0.5) * 0.1, 0.7 + Math.random() * 1.2, z);
            scene.add(spark);
        }
        // Transformer box on some posts
        if ((c + r) % 4 === 0) {
            var tbox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.15),
                new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 }));
            tbox.position.set(x - 0.08, 0.9, z); scene.add(tbox);
            var dial = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            dial.position.set(x - 0.16, 0.95, z); dial.rotation.y = -Math.PI / 2;
            scene.add(dial);
        }
    },

    addPalmTree: function(scene, x, z) {
        var g = new THREE.Group();
        var tm = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
        var barkMat = new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 1.0 });
        // Trunk segments with bark rings
        for (var i = 0; i < 5; i++) {
            var seg = new THREE.Mesh(new THREE.CylinderGeometry(0.10 - i * 0.012, 0.14 - i * 0.01, 0.5, 6), tm);
            seg.position.y = 0.25 + i * 0.48;
            seg.position.x = Math.sin(i * 0.4) * 0.08;
            seg.position.z = Math.cos(i * 0.3) * 0.05;
            seg.castShadow = true; g.add(seg);
            // Bark ring at each joint
            var ring = new THREE.Mesh(new THREE.TorusGeometry(0.12 - i * 0.01, 0.015, 4, 8), barkMat);
            ring.position.y = 0.01 + i * 0.48;
            ring.position.x = seg.position.x;
            ring.rotation.x = Math.PI / 2;
            g.add(ring);
        }
        // Crown bulge
        var crown = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4),
            new THREE.MeshStandardMaterial({ color: 0x4a7a22, roughness: 0.8 }));
        crown.position.y = 2.7; crown.scale.y = 0.7; g.add(crown);
        // Fronds - multi-segment leaves with midrib
        var leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7, side: THREE.DoubleSide });
        var darkLeaf = new THREE.MeshStandardMaterial({ color: 0x1a6b18, roughness: 0.7, side: THREE.DoubleSide });
        for (var f = 0; f < 8; f++) {
            var frondGroup = new THREE.Group();
            // Main leaf blade
            var blade = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 1.4), f % 2 === 0 ? leafMat : darkLeaf);
            blade.position.y = 0.3; blade.position.z = 0.5;
            frondGroup.add(blade);
            // Midrib (thin cylinder along leaf)
            var rib = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.005, 1.3, 3),
                new THREE.MeshStandardMaterial({ color: 0x336622 }));
            rib.position.y = 0.3; rib.position.z = 0.5;
            rib.rotation.x = Math.PI / 2;
            frondGroup.add(rib);
            // Leaf tip
            var tip = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.3), leafMat);
            tip.position.y = 0.15; tip.position.z = 1.2;
            frondGroup.add(tip);
            frondGroup.position.y = 2.65;
            frondGroup.rotation.y = (f / 8) * Math.PI * 2;
            frondGroup.rotation.x = -0.7 - Math.random() * 0.4;
            frondGroup.castShadow = true;
            g.add(frondGroup);
        }
        // Coconuts (2-3 hanging under crown)
        var cocoMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.8 });
        var cocoCount = 2 + Math.floor(Math.random() * 2);
        for (var cc = 0; cc < cocoCount; cc++) {
            var coco = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), cocoMat);
            coco.position.set(Math.sin(cc * 2.1) * 0.12, 2.45, Math.cos(cc * 2.1) * 0.12);
            g.add(coco);
        }
        // Exposed roots at base
        var rootMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 1 });
        for (var rt = 0; rt < 3; rt++) {
            var root = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.4, 3), rootMat);
            root.position.set(Math.sin(rt * 2.1) * 0.15, 0.1, Math.cos(rt * 2.1) * 0.15);
            root.rotation.z = Math.sin(rt) * 0.6;
            g.add(root);
        }
        g.position.set(x + (Math.random() - 0.5) * 0.6, 0, z + (Math.random() - 0.5) * 0.6);
        scene.add(g);
    },

    addFern: function(scene, x, z) {
        var g = new THREE.Group();
        var fernMat = new THREE.MeshStandardMaterial({ color: 0x2d7a20, roughness: 0.8, side: THREE.DoubleSide });
        var darkFern = new THREE.MeshStandardMaterial({ color: 0x1d5a15, roughness: 0.8, side: THREE.DoubleSide });
        // Fern fronds radiating from center
        var frondCount = 5 + Math.floor(Math.random() * 4);
        for (var f = 0; f < frondCount; f++) {
            var fh = 0.4 + Math.random() * 0.3;
            var frond = new THREE.Mesh(new THREE.PlaneGeometry(0.15, fh), f % 2 === 0 ? fernMat : darkFern);
            frond.position.y = fh * 0.4;
            frond.rotation.y = (f / frondCount) * Math.PI * 2 + Math.random() * 0.3;
            frond.rotation.x = -0.3 - Math.random() * 0.3;
            frond.castShadow = true;
            g.add(frond);
        }
        // Center curl (fiddle head)
        var curl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3),
            new THREE.MeshStandardMaterial({ color: 0x3a8a28, roughness: 0.7 }));
        curl.position.y = 0.35; curl.scale.set(1, 1.5, 1);
        g.add(curl);
        g.position.set(x + (Math.random() - 0.5) * 0.6, 0, z + (Math.random() - 0.5) * 0.6);
        scene.add(g);
    },

    addBush: function(scene, x, z) {
        var g = new THREE.Group();
        // Multiple overlapping spheres for volume
        var colors = [0x1a8b2a, 0x1f7a25, 0x258a30, 0x207520];
        for (var i = 0; i < 5; i++) {
            var bm = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.85 });
            var sp = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.15, 6, 5), bm);
            sp.position.set((Math.random()-0.5)*0.35, 0.18+Math.random()*0.15, (Math.random()-0.5)*0.35);
            sp.castShadow = true; g.add(sp);
        }
        // Inner darker foliage depth
        var inner = new THREE.Mesh(new THREE.SphereGeometry(0.22, 5, 4),
            new THREE.MeshStandardMaterial({ color: 0x0f5515, roughness: 0.9 }));
        inner.position.y = 0.15; g.add(inner);
        // Flowers
        if (Math.random() < 0.5) {
            var fc = [0xff6699, 0xffcc00, 0xff4444, 0xaa66ff, 0xff8844];
            for (var f = 0; f < 4; f++) {
                var fl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3),
                    new THREE.MeshBasicMaterial({ color: fc[Math.floor(Math.random()*fc.length)] }));
                fl.position.set((Math.random()-0.5)*0.4, 0.3+Math.random()*0.15, (Math.random()-0.5)*0.4);
                g.add(fl);
                // Flower center
                var cen = new THREE.Mesh(new THREE.SphereGeometry(0.015, 3, 3),
                    new THREE.MeshBasicMaterial({ color: 0xffff88 }));
                cen.position.copy(fl.position); cen.position.y += 0.04;
                g.add(cen);
            }
        }
        // Berries
        if (Math.random() < 0.3) {
            var berryMat = new THREE.MeshStandardMaterial({ color: 0xcc2244, roughness: 0.4 });
            for (var b = 0; b < 5; b++) {
                var berry = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 3), berryMat);
                berry.position.set((Math.random()-0.5)*0.3, 0.25+Math.random()*0.1, (Math.random()-0.5)*0.3);
                g.add(berry);
            }
        }
        // Small branches/twigs poking out
        var twigMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 1 });
        for (var tw = 0; tw < 2; tw++) {
            var twig = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.25, 3), twigMat);
            twig.position.set((Math.random()-0.5)*0.3, 0.35, (Math.random()-0.5)*0.3);
            twig.rotation.z = (Math.random()-0.5) * 0.8;
            g.add(twig);
        }
        g.position.set(x+(Math.random()-0.5)*0.5, 0, z+(Math.random()-0.5)*0.5);
        scene.add(g);
    },

    addRock: function(scene, x, z) {
        var g = new THREE.Group();
        var ox = x + (Math.random()-0.5) * 0.5;
        var oz = z + (Math.random()-0.5) * 0.5;
        // Main rock
        var mainSize = 0.2 + Math.random() * 0.2;
        var rockMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
        var r = new THREE.Mesh(new THREE.DodecahedronGeometry(mainSize, 0), rockMat);
        r.scale.y = 0.5 + Math.random() * 0.3; r.rotation.y = Math.random() * Math.PI;
        r.position.set(0, mainSize * 0.4, 0);
        r.castShadow = true; g.add(r);
        // Smaller satellite rocks
        for (var i = 0; i < 2; i++) {
            var sr = new THREE.Mesh(new THREE.DodecahedronGeometry(mainSize * 0.4, 0),
                new THREE.MeshStandardMaterial({ color: 0x666666 + Math.floor(Math.random() * 0x222222), roughness: 0.95 }));
            sr.scale.y = 0.4 + Math.random() * 0.3;
            sr.rotation.y = Math.random() * Math.PI;
            sr.position.set((Math.random()-0.5) * 0.3, mainSize * 0.15, (Math.random()-0.5) * 0.3);
            sr.castShadow = true; g.add(sr);
        }
        // Moss patches on top
        if (Math.random() < 0.6) {
            var mossMat = new THREE.MeshStandardMaterial({ color: 0x4a7a30, roughness: 1.0 });
            var moss = new THREE.Mesh(new THREE.CircleGeometry(mainSize * 0.5, 5), mossMat);
            moss.rotation.x = -Math.PI / 2 + (Math.random()-0.5) * 0.3;
            moss.position.set((Math.random()-0.5) * 0.1, mainSize * 0.6 + 0.02, (Math.random()-0.5) * 0.1);
            g.add(moss);
        }
        // Lichen spots
        if (Math.random() < 0.4) {
            var lichenMat = new THREE.MeshStandardMaterial({ color: 0xbbaa77, roughness: 1.0 });
            var lichen = new THREE.Mesh(new THREE.CircleGeometry(0.05, 4), lichenMat);
            lichen.position.set(mainSize * 0.3, mainSize * 0.4, mainSize * 0.2);
            lichen.rotation.y = Math.random() * Math.PI;
            g.add(lichen);
        }
        g.position.set(ox, 0, oz);
        scene.add(g);
    },

    addVisitorCenter: function(scene, cs) {
        var pos = this.gridToWorld(14, 0), g = new THREE.Group();
        var wm = new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.6 });
        var trimMat = new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.5 });
        // Main building
        var b = new THREE.Mesh(new THREE.BoxGeometry(cs * 3, 2.5, cs * 1.5), wm);
        b.position.y = 1.25; b.castShadow = true; g.add(b);
        // Foundation
        var found = new THREE.Mesh(new THREE.BoxGeometry(cs * 3.1, 0.2, cs * 1.6),
            new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }));
        found.position.y = 0.1; g.add(found);
        // Roof with overhang
        var roofMat = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.7 });
        var rf = new THREE.Mesh(new THREE.BoxGeometry(cs * 3.4, 0.15, cs * 1.9), roofMat);
        rf.position.y = 2.55; g.add(rf);
        // Roof ridge
        var ridge = new THREE.Mesh(new THREE.BoxGeometry(cs * 3.0, 0.5, cs * 0.8), roofMat);
        ridge.position.y = 2.85;
        ridge.scale.set(1, 1, 1);
        g.add(ridge);
        // Roof peak
        var peak = new THREE.Mesh(new THREE.BoxGeometry(cs * 2.8, 0.15, cs * 0.3), roofMat);
        peak.position.y = 3.1; g.add(peak);
        // Columns with bases and capitals
        for (var i = -1; i <= 1; i += 2) {
            var colBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), trimMat);
            colBase.position.set(i * cs * 1.2, 0.28, cs * 0.8); g.add(colBase);
            var col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.1, 8), trimMat);
            col.position.set(i * cs * 1.2, 1.35, cs * 0.8); col.castShadow = true; g.add(col);
            var cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), trimMat);
            cap.position.set(i * cs * 1.2, 2.42, cs * 0.8); g.add(cap);
        }
        // Entrance door
        var doorMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.7 });
        var door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.06), doorMat);
        door.position.set(0, 0.9, cs * 0.76); g.add(door);
        // Door handle
        var handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4),
            new THREE.MeshStandardMaterial({ color: 0xddaa44, metalness: 0.8, roughness: 0.2 }));
        handle.position.set(0.2, 0.9, cs * 0.8); g.add(handle);
        // Door frame
        var frameMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.6 });
        var frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.07), frameMat);
        frameTop.position.set(0, 1.62, cs * 0.76); g.add(frameTop);
        for (var ds = -1; ds <= 1; ds += 2) {
            var frameSide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.07), frameMat);
            frameSide.position.set(ds * 0.33, 0.9, cs * 0.76); g.add(frameSide);
        }
        // Front steps
        var stepMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
        for (var st = 0; st < 3; st++) {
            var step = new THREE.Mesh(new THREE.BoxGeometry(0.9 + st * 0.15, 0.1, 0.2), stepMat);
            step.position.set(0, 0.15 - st * 0.05, cs * 0.86 + st * 0.15); g.add(step);
        }
        // Windows with frames and sills
        var wMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.2, metalness: 0.3 });
        var sillMat = new THREE.MeshStandardMaterial({ color: 0xbbaa99, roughness: 0.6 });
        for (var w = -2; w <= 2; w++) {
            if (w === 0) continue; // door in center
            var win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.06), wMat);
            win.position.set(w * 0.7, 1.5, cs * 0.76); g.add(win);
            // Window frame
            var wfTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.07), frameMat);
            wfTop.position.set(w * 0.7, 1.76, cs * 0.76); g.add(wfTop);
            // Window sill
            var sill = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.1), sillMat);
            sill.position.set(w * 0.7, 1.24, cs * 0.78); g.add(sill);
            // Cross panes
            var pane = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.07), frameMat);
            pane.position.set(w * 0.7, 1.5, cs * 0.77); g.add(pane);
            // Interior warm glow behind window
            var glow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.01),
                new THREE.MeshBasicMaterial({ color: 0xffddaa, transparent: true, opacity: 0.3 }));
            glow.position.set(w * 0.7, 1.5, cs * 0.73); g.add(glow);
        }
        // Awning over entrance
        var awningMat = new THREE.MeshStandardMaterial({ color: 0xcc4422, roughness: 0.6, side: THREE.DoubleSide });
        var awning = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.6), awningMat);
        awning.position.set(0, 2.1, cs * 1.0); awning.rotation.x = 0.15; g.add(awning);
        // Awning supports
        for (var as = -1; as <= 1; as += 2) {
            var sup = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 3),
                new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 }));
            sup.position.set(as * 0.5, 1.9, cs * 1.1); sup.rotation.x = 0.3; g.add(sup);
        }
        // Sign board above entrance
        var signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.5 }));
        signBoard.position.set(0, 2.3, cs * 0.78); g.add(signBoard);
        // Sign letters (simple blocks spelling "VISITOR CENTER")
        var letterMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
        for (var lt = 0; lt < 7; lt++) {
            var letter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.02), letterMat);
            letter.position.set(-0.6 + lt * 0.2, 2.3, cs * 0.82); g.add(letter);
        }
        // Side windows
        for (var sw = -1; sw <= 1; sw += 2) {
            for (var swi = 0; swi < 2; swi++) {
                var swin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.3), wMat);
                swin.position.set(sw * cs * 1.5, 1.5, -cs * 0.2 + swi * cs * 0.6); g.add(swin);
            }
        }
        g.position.set(pos.x, 0, pos.z - cs * 0.3);
        scene.add(g);
    },

    addHelipad: function(scene, cs) {
        var pos = this.gridToWorld(2, 10);
        // Concrete pad with texture
        var padMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.85 });
        var pad = new THREE.Mesh(new THREE.CylinderGeometry(cs*0.85, cs*0.85, 0.12, 20), padMat);
        pad.position.set(pos.x, 0.06, pos.z); pad.receiveShadow = true; scene.add(pad);
        // Outer yellow circle
        var yRing = new THREE.Mesh(new THREE.RingGeometry(cs*0.72, cs*0.78, 24),
            new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide }));
        yRing.rotation.x = -Math.PI/2; yRing.position.set(pos.x, 0.13, pos.z); scene.add(yRing);
        // Inner white circle
        var wRing = new THREE.Mesh(new THREE.RingGeometry(cs*0.55, cs*0.59, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
        wRing.rotation.x = -Math.PI/2; wRing.position.set(pos.x, 0.13, pos.z); scene.add(wRing);
        // H marking - thicker
        var hm = new THREE.MeshBasicMaterial({ color: 0xffffff });
        var h1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.7), hm);
        h1.position.set(pos.x-0.22, 0.13, pos.z); scene.add(h1);
        var h2 = h1.clone(); h2.position.x = pos.x+0.22; scene.add(h2);
        var h3 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.14), hm);
        h3.position.set(pos.x, 0.13, pos.z); scene.add(h3);
        // Corner landing lights (4 yellow spheres)
        var lightMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        for (var lx = -1; lx <= 1; lx += 2) {
            for (var lz = -1; lz <= 1; lz += 2) {
                var lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 4),
                    new THREE.MeshStandardMaterial({ color: 0x555555 }));
                lBase.position.set(pos.x + lx * cs * 0.6, 0.13, pos.z + lz * cs * 0.6); scene.add(lBase);
                var lt = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), lightMat);
                lt.position.set(pos.x + lx * cs * 0.6, 0.19, pos.z + lz * cs * 0.6); scene.add(lt);
            }
        }
        // Windsock pole
        var poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 });
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.5, 4), poleMat);
        pole.position.set(pos.x + cs * 0.9, 0.75, pos.z - cs * 0.5); scene.add(pole);
        // Windsock (cone shape)
        var sockMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.8, side: THREE.DoubleSide });
        var sock = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), sockMat);
        sock.position.set(pos.x + cs * 0.9 + 0.15, 1.45, pos.z - cs * 0.5);
        sock.rotation.z = Math.PI / 2; scene.add(sock);
        // Windsock stripes
        var stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        var wStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.06, 0.08, 6), stripeMat);
        wStripe.position.set(pos.x + cs * 0.9 + 0.15, 1.45, pos.z - cs * 0.5);
        wStripe.rotation.z = Math.PI / 2; scene.add(wStripe);
    },

    addWaterFeatures: function(scene, cs) {
        var wps = [{c:7,r:2},{c:8,r:2},{c:12,r:8},{c:13,r:8}];
        var wm = new THREE.MeshStandardMaterial({ color: 0x2288aa, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 });
        var deepWm = new THREE.MeshStandardMaterial({ color: 0x1a6688, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 });
        var shoreMat = new THREE.MeshStandardMaterial({ color: 0x8a7a55, roughness: 1.0 });
        var lilyMat = new THREE.MeshStandardMaterial({ color: 0x2a8a30, roughness: 0.7, side: THREE.DoubleSide });
        var reedMat = new THREE.MeshStandardMaterial({ color: 0x4a7a30, roughness: 0.9 });
        for (var i = 0; i < wps.length; i++) {
            var wp = wps[i];
            if (wp.r >= DE.CONFIG.GRID_ROWS || wp.c >= DE.CONFIG.GRID_COLS || this.grid[wp.r][wp.c].type !== 'ground') continue;
            var pos = this.gridToWorld(wp.c, wp.r);
            // Shore/bank ring
            var shore = new THREE.Mesh(new THREE.RingGeometry(cs * 0.42, cs * 0.52, 12), shoreMat);
            shore.rotation.x = -Math.PI / 2; shore.position.set(pos.x, 0.055, pos.z); scene.add(shore);
            // Deep center
            var deep = new THREE.Mesh(new THREE.CircleGeometry(cs * 0.3, 10), deepWm);
            deep.rotation.x = -Math.PI / 2; deep.position.set(pos.x, 0.058, pos.z); scene.add(deep);
            // Water surface
            var water = new THREE.Mesh(new THREE.CircleGeometry(cs * 0.45, 12), wm);
            water.rotation.x = -Math.PI / 2; water.position.set(pos.x, 0.06, pos.z); scene.add(water);
            // Ripple rings
            for (var rr = 0; rr < 2; rr++) {
                var ripple = new THREE.Mesh(new THREE.RingGeometry(0.12 + rr * 0.15, 0.14 + rr * 0.15, 12),
                    new THREE.MeshBasicMaterial({ color: 0xaaddee, transparent: true, opacity: 0.2, side: THREE.DoubleSide }));
                ripple.rotation.x = -Math.PI / 2;
                ripple.position.set(pos.x + (Math.random() - 0.5) * 0.3, 0.065, pos.z + (Math.random() - 0.5) * 0.3);
                scene.add(ripple);
            }
            // Lily pads
            var lilyCount = 1 + Math.floor(Math.random() * 3);
            for (var lp = 0; lp < lilyCount; lp++) {
                var lily = new THREE.Mesh(new THREE.CircleGeometry(0.07 + Math.random() * 0.04, 8), lilyMat);
                lily.rotation.x = -Math.PI / 2;
                lily.position.set(pos.x + (Math.random() - 0.5) * cs * 0.5, 0.065,
                    pos.z + (Math.random() - 0.5) * cs * 0.5);
                scene.add(lily);
                // Flower on some lily pads
                if (Math.random() < 0.4) {
                    var flower = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 3),
                        new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xff88aa : 0xffffff }));
                    flower.position.set(lily.position.x, 0.09, lily.position.z);
                    scene.add(flower);
                }
            }
            // Reeds/cattails at edges
            var reedCount = 2 + Math.floor(Math.random() * 3);
            for (var rd = 0; rd < reedCount; rd++) {
                var angle = Math.random() * Math.PI * 2;
                var rDist = cs * 0.38 + Math.random() * 0.1;
                var rx = pos.x + Math.cos(angle) * rDist;
                var rz = pos.z + Math.sin(angle) * rDist;
                // Reed stem
                var reedH = 0.4 + Math.random() * 0.3;
                var reed = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, reedH, 3), reedMat);
                reed.position.set(rx, reedH / 2 + 0.05, rz);
                reed.rotation.z = (Math.random() - 0.5) * 0.15;
                scene.add(reed);
                // Cattail top
                if (Math.random() < 0.5) {
                    var cattail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.1, 4),
                        new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 1 }));
                    cattail.position.set(rx, reedH + 0.05, rz); scene.add(cattail);
                }
            }
        }
    },

    addSpawnGate: function(scene, cs) {
        var pos = this.gridToWorld(0, 1);
        var gm = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.6 });
        var mm = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
        var concMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 });
        // Stone pillars with caps
        for (var side = -1; side <= 1; side += 2) {
            var pBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.45), concMat);
            pBase.position.set(pos.x - cs * 0.3, 0.1, pos.z + side * cs * 0.5); scene.add(pBase);
            var p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.6, 0.35), gm);
            p.position.set(pos.x - cs * 0.3, 1.5, pos.z + side * cs * 0.5); p.castShadow = true; scene.add(p);
            var pCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), gm);
            pCap.position.set(pos.x - cs * 0.3, 2.85, pos.z + side * cs * 0.5); scene.add(pCap);
            // Tiki torch on top
            var torch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 4),
                new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.8 }));
            torch.position.set(pos.x - cs * 0.3, 3.05, pos.z + side * cs * 0.5); scene.add(torch);
            var flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4),
                new THREE.MeshBasicMaterial({ color: 0xff6600 }));
            flame.position.set(pos.x - cs * 0.3, 3.25, pos.z + side * cs * 0.5); scene.add(flame);
        }
        // Arch crossbeam
        var arch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, cs * 1.3), gm);
        arch.position.set(pos.x - cs * 0.3, 2.65, pos.z); scene.add(arch);
        // Metal gate bars
        for (var b = 0; b < 5; b++) {
            var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.3, 4), mm);
            bar.position.set(pos.x - cs * 0.3, 1.15, pos.z - cs * 0.4 + b * cs * 0.2); scene.add(bar);
            // Pointed tips
            var tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), mm);
            tip.position.set(pos.x - cs * 0.3, 2.35, pos.z - cs * 0.4 + b * cs * 0.2); scene.add(tip);
        }
        // Horizontal bar across gate
        var hBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, cs * 0.9), mm);
        hBar.position.set(pos.x - cs * 0.3, 1.5, pos.z); scene.add(hBar);
        // Warning light with housing
        var wlHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.08, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333 }));
        wlHousing.position.set(pos.x - cs * 0.3, 2.9, pos.z); scene.add(wlHousing);
        var wl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        wl.position.set(pos.x - cs * 0.3, 3.0, pos.z); scene.add(wl);
        // DANGER sign
        var dangerBoard = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 }));
        dangerBoard.position.set(pos.x - cs * 0.3, 2.1, pos.z); scene.add(dangerBoard);
        var dangerStripe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x111111 }));
        dangerStripe.position.set(pos.x - cs * 0.3, 2.1, pos.z); scene.add(dangerStripe);
        // Triangle warning symbol
        var triMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        var tri = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 3), triMat);
        tri.position.set(pos.x - cs * 0.3, 2.2, pos.z + 0.03); scene.add(tri);
    },

    addExitGate: function(scene, cs) {
        var pos = this.gridToWorld(19, 9);
        var gm = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.6 });
        var mm = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
        // Damaged pillars (shorter, cracked look)
        for (var side = -1; side <= 1; side += 2) {
            var pH = 1.6 + Math.random() * 0.5;
            var p = new THREE.Mesh(new THREE.BoxGeometry(0.3, pH, 0.3), gm);
            p.position.set(pos.x + cs * 0.3, pH / 2, pos.z + side * cs * 0.5);
            p.castShadow = true; scene.add(p);
            // Rubble at base
            for (var rb = 0; rb < 3; rb++) {
                var rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 0),
                    new THREE.MeshStandardMaterial({ color: 0x776655, roughness: 1 }));
                rubble.position.set(pos.x + cs * 0.3 + (Math.random() - 0.5) * 0.3, 0.06,
                    pos.z + side * cs * 0.5 + (Math.random() - 0.5) * 0.2);
                scene.add(rubble);
            }
        }
        // Damaged warning sign (tilted)
        var es = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.7, 0.35, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 }));
        es.position.set(pos.x + cs * 0.3, 2.0, pos.z);
        es.rotation.z = 0.15; scene.add(es);
        var esStripe = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.55, 0.05, 0.09),
            new THREE.MeshBasicMaterial({ color: 0x111111 }));
        esStripe.position.set(pos.x + cs * 0.3, 2.0, pos.z); esStripe.rotation.z = 0.15; scene.add(esStripe);
        // Broken/bent gate bars
        for (var b = 0; b < 4; b++) {
            var barH = 0.6 + Math.random() * 0.7;
            var bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, barH, 0.04), mm);
            bar.position.set(pos.x + cs * 0.35, barH * 0.4, pos.z - 0.35 + b * 0.25);
            bar.rotation.z = (Math.random() - 0.5) * 0.5;
            bar.rotation.x = (Math.random() - 0.5) * 0.2;
            scene.add(bar);
        }
        // Broken chain on ground
        var chainMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.7, roughness: 0.3 });
        for (var ch = 0; ch < 4; ch++) {
            var link = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 4, 6), chainMat);
            link.position.set(pos.x + cs * 0.2 + ch * 0.08, 0.04, pos.z + 0.1);
            link.rotation.y = ch * 0.5;
            scene.add(link);
        }
        // Claw marks on ground near exit
        var clawMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 1 });
        for (var cl = 0; cl < 3; cl++) {
            var claw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 0.4), clawMat);
            claw.position.set(pos.x + cs * 0.1 - cl * 0.12, 0.06, pos.z);
            claw.rotation.y = 0.1;
            scene.add(claw);
        }
    },

    addPaddockSigns: function(scene, cs) {
        var sps = [{c:9,r:2},{c:10,r:4},{c:10,r:6},{c:1,r:4},{c:1,r:8}];
        var pm = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.5 });
        for (var i = 0; i < sps.length; i++) {
            var sp = sps[i];
            if (sp.r >= DE.CONFIG.GRID_ROWS || sp.c >= DE.CONFIG.GRID_COLS) continue;
            if (this.grid[sp.r][sp.c].type !== 'ground') continue;
            var pos = this.gridToWorld(sp.c, sp.r), g = new THREE.Group();
            // Metal pole
            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.3, 5), pm);
            pole.position.y = 0.65; g.add(pole);
            // Pole base plate
            var basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 6), pm);
            basePlate.position.y = 0.02; g.add(basePlate);
            // Sign board - yellow with black border
            var board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.05),
                new THREE.MeshStandardMaterial({ color: 0xddcc00, roughness: 0.5 }));
            board.position.y = 1.35; g.add(board);
            // Black border frame
            var frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
            var fTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.06), frameMat);
            fTop.position.y = 1.58; g.add(fTop);
            var fBot = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.06), frameMat);
            fBot.position.y = 1.12; g.add(fBot);
            for (var fs = -1; fs <= 1; fs += 2) {
                var fSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.06), frameMat);
                fSide.position.set(fs * 0.36, 1.35, 0); g.add(fSide);
            }
            // Warning triangle
            var tri = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 3),
                new THREE.MeshBasicMaterial({ color: 0xff2200 }));
            tri.position.set(-0.15, 1.38, 0.03); g.add(tri);
            // Dino silhouette (simple T shape)
            var silMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
            var silBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.02), silMat);
            silBody.position.set(0.1, 1.35, 0.03); g.add(silBody);
            var silHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), silMat);
            silHead.position.set(0.18, 1.4, 0.03); g.add(silHead);
            var silTail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.02), silMat);
            silTail.position.set(0.0, 1.36, 0.03); g.add(silTail);
            g.position.set(pos.x, 0, pos.z); scene.add(g);
        }
    },

    addAmbientProps: function(scene, cs) {
        var cols = DE.CONFIG.GRID_COLS, rows = DE.CONFIG.GRID_ROWS;
        // Barrels near visitor center
        var barrelMat = new THREE.MeshStandardMaterial({ color: 0x885533, roughness: 0.7 });
        var barrelPos = [{c:12, r:2}, {c:16, r:2}];
        for (var i = 0; i < barrelPos.length; i++) {
            var bp = barrelPos[i];
            if (bp.r >= rows || bp.c >= cols || this.grid[bp.r][bp.c].type !== 'ground') continue;
            var bpos = this.gridToWorld(bp.c, bp.r);
            var bg = new THREE.Group();
            var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.5, 8), barrelMat);
            barrel.position.y = 0.25; barrel.castShadow = true; bg.add(barrel);
            // Metal bands
            var bandMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
            for (var band = 0; band < 2; band++) {
                var b = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 4, 8), bandMat);
                b.position.y = 0.12 + band * 0.26; bg.add(b);
            }
            bg.position.set(bpos.x + (Math.random()-0.5)*0.3, 0, bpos.z + (Math.random()-0.5)*0.3);
            scene.add(bg);
        }
        // Wooden crates
        var crateMat = new THREE.MeshStandardMaterial({ color: 0xaa8855, roughness: 0.8 });
        var cratePos = [{c:15, r:2}, {c:6, r:4}];
        for (var i = 0; i < cratePos.length; i++) {
            var cp = cratePos[i];
            if (cp.r >= rows || cp.c >= cols || this.grid[cp.r][cp.c].type !== 'ground') continue;
            var cpos = this.gridToWorld(cp.c, cp.r);
            var cg = new THREE.Group();
            var crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.35), crateMat);
            crate.position.y = 0.175; crate.castShadow = true; cg.add(crate);
            // Cross slats
            var slatMat = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.9 });
            var slat1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), slatMat);
            slat1.position.set(0, 0.25, 0.18); cg.add(slat1);
            var slat2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), slatMat);
            slat2.position.set(0, 0.1, 0.18); cg.add(slat2);
            cg.position.set(cpos.x, 0, cpos.z);
            cg.rotation.y = Math.random() * 0.5;
            scene.add(cg);
        }
        // Jeep near helipad
        var jeepCell = {c: 4, r: 10};
        if (jeepCell.r < rows && jeepCell.c < cols && this.grid[jeepCell.r][jeepCell.c].type === 'ground') {
            var jpos = this.gridToWorld(jeepCell.c, jeepCell.r);
            var jg = new THREE.Group();
            var jeepMat = new THREE.MeshStandardMaterial({ color: 0x447744, roughness: 0.6 });
            // Body
            var jBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.4), jeepMat);
            jBody.position.y = 0.35; jBody.castShadow = true; jg.add(jBody);
            // Hood
            var hood = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.38), jeepMat);
            hood.position.set(0.35, 0.28, 0); jg.add(hood);
            // Cab
            var cabMat = new THREE.MeshStandardMaterial({ color: 0x336633, roughness: 0.6 });
            var cab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.38), cabMat);
            cab.position.set(-0.05, 0.6, 0); cab.castShadow = true; jg.add(cab);
            // Windshield
            var windMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.1, metalness: 0.3 });
            var wind = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.34), windMat);
            wind.position.set(0.1, 0.6, 0); jg.add(wind);
            // Wheels
            var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
            var wheelPositions = [{x:0.2, z:0.22}, {x:0.2, z:-0.22}, {x:-0.2, z:0.22}, {x:-0.2, z:-0.22}];
            for (var wi = 0; wi < wheelPositions.length; wi++) {
                var wp = wheelPositions[wi];
                var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), wheelMat);
                wheel.rotation.x = Math.PI / 2;
                wheel.position.set(wp.x, 0.1, wp.z); jg.add(wheel);
                // Hub cap
                var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 5),
                    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
                hub.rotation.x = Math.PI / 2;
                hub.position.set(wp.x, 0.1, wp.z); jg.add(hub);
            }
            // Headlights
            var hlMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
            for (var hl = -1; hl <= 1; hl += 2) {
                var headlight = new THREE.Mesh(new THREE.CircleGeometry(0.03, 5), hlMat);
                headlight.position.set(0.48, 0.32, hl * 0.12);
                headlight.rotation.y = Math.PI / 2;
                jg.add(headlight);
            }
            // JP logo stripe on side
            var stripeMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
            var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.01), stripeMat);
            stripe.position.set(0, 0.4, 0.21); jg.add(stripe);
            jg.position.set(jpos.x, 0, jpos.z);
            jg.rotation.y = 0.3;
            scene.add(jg);
        }
        // Tiki torches along path edges
        var torchCells = [{c:2, r:2}, {c:15, r:4}, {c:5, r:6}, {c:15, r:8}];
        for (var ti = 0; ti < torchCells.length; ti++) {
            var tc = torchCells[ti];
            if (tc.r >= rows || tc.c >= cols || this.grid[tc.r][tc.c].type !== 'ground') continue;
            var tpos = this.gridToWorld(tc.c, tc.r);
            var tg = new THREE.Group();
            // Bamboo pole
            var tPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.2, 5),
                new THREE.MeshStandardMaterial({ color: 0x887744, roughness: 0.8 }));
            tPole.position.y = 0.6; tg.add(tPole);
            // Torch cup
            var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.12, 5),
                new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.7 }));
            cup.position.y = 1.2; tg.add(cup);
            // Flame
            var flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4),
                new THREE.MeshBasicMaterial({ color: 0xff6600 }));
            flame.position.y = 1.35; tg.add(flame);
            // Flame inner
            var flameInner = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 4),
                new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
            flameInner.position.y = 1.33; tg.add(flameInner);
            tg.position.set(tpos.x, 0, tpos.z);
            scene.add(tg);
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
