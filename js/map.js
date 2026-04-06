window.DE = window.DE || {};

DE.Map = {
    grid: [],
    waypoints: [],
    meshes: [],

    seededRandom: function(x, y) {
        var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    },

    buildLayout: function() {
        var cols = DE.CONFIG.GRID_COLS;
        var rows = DE.CONFIG.GRID_ROWS;
        this.grid = [];
        for (var r = 0; r < rows; r++) {
            this.grid[r] = [];
            for (var c = 0; c < cols; c++) {
                this.grid[r][c] = { type: 'ground', trap: null };
            }
        }

        // Same S-shaped winding path
        var pathCells = [];
        var row = 1;
        for (var c = 0; c <= 17; c++) pathCells.push({ r: row, c: c });
        for (var r2 = 2; r2 <= 3; r2++) pathCells.push({ r: r2, c: 17 });
        row = 3;
        for (var c = 16; c >= 3; c--) pathCells.push({ r: row, c: c });
        for (var r2 = 4; r2 <= 5; r2++) pathCells.push({ r: r2, c: 3 });
        row = 5;
        for (var c = 4; c <= 17; c++) pathCells.push({ r: row, c: c });
        for (var r2 = 6; r2 <= 7; r2++) pathCells.push({ r: r2, c: 17 });
        row = 7;
        for (var c = 16; c >= 3; c--) pathCells.push({ r: row, c: c });
        for (var r2 = 8; r2 <= 9; r2++) pathCells.push({ r: r2, c: 3 });
        row = 9;
        for (var c = 4; c <= 19; c++) pathCells.push({ r: row, c: c });

        for (var i = 0; i < pathCells.length; i++) {
            var pc = pathCells[i];
            if (pc.r >= 0 && pc.r < rows && pc.c >= 0 && pc.c < cols) {
                this.grid[pc.r][pc.c].type = 'path';
            }
        }
        this.grid[1][0].type = 'spawn';
        this.grid[9][19].type = 'exit';

        this.waypoints = [];
        for (var i = 0; i < pathCells.length; i++) {
            var wp = this.gridToWorld(pathCells[i].c, pathCells[i].r);
            this.waypoints.push(wp);
        }

        // Fence border
        for (var c = 0; c < cols; c++) {
            if (this.grid[0][c].type === 'ground') this.grid[0][c].type = 'fence';
            if (this.grid[rows-1][c].type === 'ground') this.grid[rows-1][c].type = 'fence';
        }
        for (var r = 0; r < rows; r++) {
            if (this.grid[r][0].type === 'ground') this.grid[r][0].type = 'fence';
            if (this.grid[r][cols-1].type === 'ground') this.grid[r][cols-1].type = 'fence';
        }

        // Buildings (can't place traps on these)
        var buildings = [
            {r: 0, c: 9}, {r: 0, c: 10}, {r: 0, c: 11}, // Visitor Center
            {r: 10, c: 1}, {r: 10, c: 2},                  // Control Room
            {r: 6, c: 19},                                   // Maintenance
        ];
        for (var i = 0; i < buildings.length; i++) {
            var b = buildings[i];
            if (this.grid[b.r] && this.grid[b.r][b.c] && this.grid[b.r][b.c].type === 'fence') {
                this.grid[b.r][b.c].type = 'building';
            }
        }
    },

    createScene: function(scene) {
        var cs = DE.CONFIG.CELL_SIZE;
        var cols = DE.CONFIG.GRID_COLS;
        var rows = DE.CONFIG.GRID_ROWS;
        var self = this;

        // Large ground plane
        var groundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(cols * cs + 10, rows * cs + 10),
            new THREE.MeshLambertMaterial({ color: 0x2a6a1a })
        );
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.set(cols * cs / 2, -0.05, rows * cs / 2);
        groundPlane.receiveShadow = true;
        scene.add(groundPlane);

        // Build grid cells
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = this.grid[r][c];
                var pos = this.gridToWorld(c, r);
                var rng = this.seededRandom(c, r);

                if (cell.type === 'path' || cell.type === 'spawn' || cell.type === 'exit') {
                    this.buildPathTile(scene, pos, cs, cell.type, c, r);
                } else if (cell.type === 'fence') {
                    this.buildFence(scene, pos, cs, c, r, cols, rows);
                } else if (cell.type === 'building') {
                    // Buildings handled separately below
                } else {
                    this.buildGroundTile(scene, pos, cs, c, r);
                }
            }
        }

        // Buildings
        this.buildVisitorCenter(scene, cs);
        this.buildControlRoom(scene, cs);
        this.buildMaintenanceShed(scene, cs);

        // Water feature - small pond
        this.buildPond(scene, cs);

        // Spawn gate (Jurassic Park style)
        this.buildSpawnGate(scene, cs);

        // Exit - broken fence
        this.buildBrokenExit(scene, cs);

        // Lamp posts at path turns
        this.buildLampPosts(scene, cs);
    },

    buildPathTile: function(scene, pos, cs, type, c, r) {
        var color = 0x9B8B6B;
        if (type === 'spawn') color = 0x994433;
        if (type === 'exit') color = 0xBB9933;

        // Path surface
        var path = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 0.98, 0.08, cs * 0.98),
            new THREE.MeshLambertMaterial({ color: color })
        );
        path.position.set(pos.x, 0.04, pos.z);
        path.receiveShadow = true;
        scene.add(path);

        // Darker border edges
        var borderMat = new THREE.MeshLambertMaterial({ color: 0x6B5B4B });
        var edge = new THREE.Mesh(new THREE.BoxGeometry(cs, 0.02, cs), borderMat);
        edge.position.set(pos.x, 0.01, pos.z);
        scene.add(edge);

        // Tire ruts (subtle darker lines)
        if ((c + r) % 3 === 0) {
            var rut = new THREE.Mesh(
                new THREE.BoxGeometry(cs * 0.08, 0.01, cs * 0.9),
                new THREE.MeshLambertMaterial({ color: 0x7B6B5B })
            );
            rut.position.set(pos.x - cs * 0.15, 0.09, pos.z);
            scene.add(rut);
            var rut2 = rut.clone();
            rut2.position.x = pos.x + cs * 0.15;
            scene.add(rut2);
        }

        // Rocks along path edges
        var rng = this.seededRandom(c * 3, r * 7);
        if (rng < 0.15) {
            var rock = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + rng * 0.1, 4, 3),
                new THREE.MeshLambertMaterial({ color: 0x888877 })
            );
            rock.position.set(pos.x + (rng - 0.5) * cs * 0.8, 0.08, pos.z + cs * 0.4);
            rock.scale.y = 0.5;
            scene.add(rock);
        }
    },

    buildGroundTile: function(scene, pos, cs, c, r) {
        var rng = this.seededRandom(c, r);
        var heightVar = 0.08 + rng * 0.07;
        var isNearPath = this.isAdjacentToPath(c, r);
        var baseColor = isNearPath ? 0x3a7520 : ((c + r) % 2 === 0 ? 0x3a7d2a : 0x348525);

        var tile = new THREE.Mesh(
            new THREE.BoxGeometry(cs, heightVar, cs),
            new THREE.MeshLambertMaterial({ color: baseColor })
        );
        tile.position.set(pos.x, heightVar / 2, pos.z);
        tile.receiveShadow = true;
        scene.add(tile);

        // Vegetation
        var rng2 = this.seededRandom(c * 13, r * 17);
        var rng3 = this.seededRandom(c * 31, r * 37);

        if (rng2 < 0.12) {
            this.addPalmTree(scene, pos.x + (rng3 - 0.5) * 0.8, pos.z + (rng2 - 0.5) * 0.8);
        } else if (rng2 < 0.22) {
            this.addJungleTree(scene, pos.x + (rng3 - 0.5) * 0.6, pos.z);
        } else if (rng2 < 0.35) {
            this.addFernCluster(scene, pos.x + (rng3 - 0.5) * 0.8, pos.z + (rng2 - 0.06) * 2);
        } else if (rng2 < 0.42) {
            this.addBush(scene, pos.x + (rng3 - 0.5), pos.z + (rng2 - 0.2));
        } else if (rng2 < 0.48) {
            this.addRock(scene, pos.x + (rng3 - 0.5) * 0.6, pos.z);
        }
    },

    isAdjacentToPath: function(c, r) {
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < DE.CONFIG.GRID_ROWS && nc >= 0 && nc < DE.CONFIG.GRID_COLS) {
                    var t = this.grid[nr][nc].type;
                    if (t === 'path' || t === 'spawn' || t === 'exit') return true;
                }
            }
        }
        return false;
    },

    buildFence: function(scene, pos, cs, c, r, cols, rows) {
        // Ground under fence
        var tile = new THREE.Mesh(
            new THREE.BoxGeometry(cs, 0.08, cs),
            new THREE.MeshLambertMaterial({ color: 0x3a7d2a })
        );
        tile.position.set(pos.x, 0.04, pos.z);
        tile.receiveShadow = true;
        scene.add(tile);

        // Concrete post
        var post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.13, 1.6, 6),
            new THREE.MeshLambertMaterial({ color: 0xAAAAAA })
        );
        post.position.set(pos.x, 0.8, pos.z);
        post.castShadow = true;
        scene.add(post);

        // Cross beam at top
        var beam = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.06, cs * 0.5),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        beam.position.set(pos.x, 1.5, pos.z);
        scene.add(beam);

        // Electric wires (yellow)
        var wireMat = new THREE.MeshLambertMaterial({ color: 0xCCCC00 });
        for (var w = 0; w < 3; w++) {
            var wire = new THREE.Mesh(
                new THREE.BoxGeometry(cs * 0.95, 0.03, 0.03),
                wireMat
            );
            wire.position.set(pos.x, 0.5 + w * 0.4, pos.z);
            scene.add(wire);
        }

        // Red warning light every 3rd post
        if ((c + r) % 3 === 0) {
            var light = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            light.position.set(pos.x, 1.65, pos.z);
            scene.add(light);
        }

        // Warning sign every 5th post
        if ((c + r * 3) % 5 === 0) {
            var sign = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.25, 0.04),
                new THREE.MeshLambertMaterial({ color: 0xddcc00 })
            );
            sign.position.set(pos.x, 1.0, pos.z + 0.15);
            scene.add(sign);
            // Danger stripe
            var stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.04, 0.05),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            stripe.position.set(pos.x, 1.0, pos.z + 0.17);
            scene.add(stripe);
        }
    },

    buildVisitorCenter: function(scene, cs) {
        var pos = this.gridToWorld(10, 0);

        // Main building
        var building = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 2.8, 2.0, cs * 0.9),
            new THREE.MeshLambertMaterial({ color: 0xD4C5A0 })
        );
        building.position.set(pos.x, 1.0, pos.z);
        building.castShadow = true;
        scene.add(building);

        // Roof (pitched)
        var roofGeo = new THREE.BufferGeometry();
        var hw = cs * 1.4, hd = cs * 0.45, rh = 0.8;
        var verts = new Float32Array([
            -hw, 0, -hd,  hw, 0, -hd,  0, rh, 0,
            hw, 0, -hd,   hw, 0, hd,   0, rh, 0,
            hw, 0, hd,   -hw, 0, hd,   0, rh, 0,
            -hw, 0, hd,  -hw, 0, -hd,  0, rh, 0
        ]);
        roofGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        roofGeo.computeVertexNormals();
        var roof = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0x4A4040, side: THREE.DoubleSide }));
        roof.position.set(pos.x, 2.0, pos.z);
        scene.add(roof);

        // Entrance door
        var door = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.2, 0.05),
            new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
        );
        door.position.set(pos.x, 0.6, pos.z + cs * 0.46);
        scene.add(door);

        // Windows
        var winMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 });
        for (var w = -1; w <= 1; w += 2) {
            var win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), winMat);
            win.position.set(pos.x + w * cs * 0.7, 1.2, pos.z + cs * 0.46);
            scene.add(win);
        }
    },

    buildControlRoom: function(scene, cs) {
        var pos = this.gridToWorld(1.5, 10);

        // Building
        var building = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 1.8, 1.5, cs * 0.8),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        building.position.set(pos.x, 0.75, pos.z);
        building.castShadow = true;
        scene.add(building);

        // Flat roof
        var roof = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 1.9, 0.1, cs * 0.9),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        roof.position.set(pos.x, 1.55, pos.z);
        scene.add(roof);

        // Satellite dish
        var dish = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.DoubleSide })
        );
        dish.position.set(pos.x + 0.5, 1.7, pos.z);
        dish.rotation.x = -0.3;
        scene.add(dish);
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4),
            new THREE.MeshLambertMaterial({ color: 0x666666 }));
        pole.position.set(pos.x + 0.5, 1.85, pos.z);
        scene.add(pole);

        // Blinking light
        var blink = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        blink.position.set(pos.x - 0.6, 1.65, pos.z);
        scene.add(blink);
    },

    buildMaintenanceShed: function(scene, cs) {
        var pos = this.gridToWorld(19, 6);

        var shed = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 0.8, 1.2, cs * 0.8),
            new THREE.MeshLambertMaterial({ color: 0x666655 })
        );
        shed.position.set(pos.x, 0.6, pos.z);
        shed.castShadow = true;
        scene.add(shed);

        // Corrugated roof
        var roof = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 0.9, 0.08, cs * 0.9),
            new THREE.MeshLambertMaterial({ color: 0x775544 })
        );
        roof.position.set(pos.x, 1.24, pos.z);
        scene.add(roof);

        // Garage door
        var garageDoor = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.05),
            new THREE.MeshLambertMaterial({ color: 0x444433 })
        );
        garageDoor.position.set(pos.x, 0.4, pos.z - cs * 0.41);
        scene.add(garageDoor);
    },

    buildPond: function(scene, cs) {
        // Place pond in open area around col 12, row 2
        var pos = this.gridToWorld(12, 2);
        var water = new THREE.Mesh(
            new THREE.CircleGeometry(cs * 0.8, 12),
            new THREE.MeshLambertMaterial({ color: 0x3388bb, transparent: true, opacity: 0.7 })
        );
        water.rotation.x = -Math.PI / 2;
        water.position.set(pos.x, 0.12, pos.z);
        scene.add(water);

        // Reeds around edge
        var reedMat = new THREE.MeshLambertMaterial({ color: 0x447733 });
        for (var i = 0; i < 8; i++) {
            var ang = (i / 8) * Math.PI * 2;
            var reed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.5 + Math.random() * 0.3, 3), reedMat);
            reed.position.set(
                pos.x + Math.cos(ang) * cs * 0.7,
                0.3,
                pos.z + Math.sin(ang) * cs * 0.7
            );
            reed.rotation.x = (Math.random() - 0.5) * 0.2;
            scene.add(reed);
        }
    },

    buildSpawnGate: function(scene, cs) {
        var pos = this.gridToWorld(0, 1);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });

        // Two tall gate posts
        for (var side = -1; side <= 1; side += 2) {
            var post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.0, 0.3), gateMat);
            post.position.set(pos.x - cs * 0.3, 1.5, pos.z + side * cs * 0.45);
            post.castShadow = true;
            scene.add(post);
        }

        // Crossbeam
        var beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, cs * 1.1), gateMat);
        beam.position.set(pos.x - cs * 0.3, 2.8, pos.z);
        scene.add(beam);

        // Gate sign
        var sign = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.3, cs * 0.8),
            new THREE.MeshLambertMaterial({ color: 0xddcc44 })
        );
        sign.position.set(pos.x - cs * 0.3, 2.4, pos.z);
        scene.add(sign);

        // Torch lights on posts
        var torchMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
        for (var side = -1; side <= 1; side += 2) {
            var torch = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), torchMat);
            torch.position.set(pos.x - cs * 0.3, 3.1, pos.z + side * cs * 0.45);
            scene.add(torch);
        }
    },

    buildBrokenExit: function(scene, cs) {
        var pos = this.gridToWorld(19, 9);
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });

        // Tilted broken post
        var post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 5), fenceMat);
        post1.position.set(pos.x + cs * 0.4, 0.5, pos.z - cs * 0.4);
        post1.rotation.z = 0.4;
        post1.rotation.x = -0.2;
        scene.add(post1);

        // Broken wire segments
        var wireMat = new THREE.MeshLambertMaterial({ color: 0xCCCC00 });
        for (var i = 0; i < 3; i++) {
            var wire = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.4, 0.03, 0.03), wireMat);
            wire.position.set(pos.x + cs * 0.3, 0.3 + i * 0.3, pos.z - cs * 0.3);
            wire.rotation.z = 0.3 + i * 0.1;
            scene.add(wire);
        }

        // Sparks (emissive spheres)
        var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffff44 });
        var spark = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), sparkMat);
        spark.position.set(pos.x + cs * 0.35, 0.8, pos.z - cs * 0.35);
        scene.add(spark);

        // Warning sign on ground
        var sign = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.3, 0.04),
            new THREE.MeshLambertMaterial({ color: 0xdd3333 })
        );
        sign.position.set(pos.x, 0.15, pos.z + cs * 0.4);
        sign.rotation.x = -Math.PI / 2;
        scene.add(sign);
    },

    buildLampPosts: function(scene, cs) {
        // Place lamps at path turn points
        var turnPoints = [
            { c: 17, r: 2 }, { c: 3, r: 4 }, { c: 17, r: 6 }, { c: 3, r: 8 }
        ];
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var lightMat = new THREE.MeshBasicMaterial({ color: 0xffdd66 });

        for (var i = 0; i < turnPoints.length; i++) {
            var tp = turnPoints[i];
            var pos = this.gridToWorld(tp.c, tp.r);
            // Check adjacent ground cell for lamp placement
            var lampX = pos.x + (tp.c > 10 ? cs : -cs);

            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.0, 5), lampMat);
            pole.position.set(lampX, 1.0, pos.z);
            pole.castShadow = true;
            scene.add(pole);

            var lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lightMat);
            lampHead.position.set(lampX, 2.1, pos.z);
            scene.add(lampHead);

            // Arm extending toward path
            var arm = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.4, 0.04, 0.04), lampMat);
            arm.position.set(lampX + (tp.c > 10 ? -cs * 0.2 : cs * 0.2), 2.0, pos.z);
            scene.add(arm);
        }
    },

    addPalmTree: function(scene, x, z) {
        var group = new THREE.Group();
        // Tall thin trunk
        var trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 2.5, 6),
            new THREE.MeshLambertMaterial({ color: 0x8B6914 })
        );
        trunk.position.y = 1.25;
        trunk.rotation.x = (Math.random() - 0.5) * 0.1;
        trunk.castShadow = true;
        group.add(trunk);

        // Fan-shaped fronds
        var frondMat = new THREE.MeshLambertMaterial({ color: 0x228B22, side: THREE.DoubleSide });
        for (var i = 0; i < 6; i++) {
            var frond = new THREE.Mesh(
                new THREE.PlaneGeometry(0.4, 1.2),
                frondMat
            );
            var ang = (i / 6) * Math.PI * 2;
            frond.position.set(Math.cos(ang) * 0.4, 2.6, Math.sin(ang) * 0.4);
            frond.rotation.x = -0.6;
            frond.rotation.y = ang;
            frond.castShadow = true;
            group.add(frond);
        }
        group.position.set(x, 0, z);
        scene.add(group);
    },

    addJungleTree: function(scene, x, z) {
        var group = new THREE.Group();
        var trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.22, 1.8, 6),
            new THREE.MeshLambertMaterial({ color: 0x5c3a1e })
        );
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        group.add(trunk);

        // Broad canopy
        var canopy = new THREE.Mesh(
            new THREE.SphereGeometry(1.0, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x1a6b1a })
        );
        canopy.position.y = 2.2;
        canopy.scale.y = 0.6;
        canopy.castShadow = true;
        group.add(canopy);

        group.position.set(x, 0, z);
        scene.add(group);
    },

    addFernCluster: function(scene, x, z) {
        var fernMat = new THREE.MeshLambertMaterial({ color: 0x2d8b1e });
        for (var i = 0; i < 3; i++) {
            var fern = new THREE.Mesh(
                new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 5, 4),
                fernMat
            );
            fern.scale.y = 0.4;
            fern.position.set(
                x + (Math.random() - 0.5) * 0.4,
                0.12,
                z + (Math.random() - 0.5) * 0.4
            );
            scene.add(fern);
        }
    },

    addBush: function(scene, x, z) {
        var bush = new THREE.Mesh(
            new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 5),
            new THREE.MeshLambertMaterial({ color: 0x2a7a22 })
        );
        bush.scale.y = 0.6;
        bush.position.set(x, 0.2, z);
        bush.castShadow = true;
        scene.add(bush);
    },

    addRock: function(scene, x, z) {
        var rock = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 4, 3),
            new THREE.MeshLambertMaterial({ color: 0x777766 })
        );
        rock.scale.set(1 + Math.random() * 0.5, 0.5, 1 + Math.random() * 0.3);
        rock.position.set(x, 0.08, z);
        scene.add(rock);
    },

    addTree: function(scene, x, z) {
        this.addPalmTree(scene, x, z);
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
        var cell = this.grid[row][col];
        return cell.type === 'ground' && cell.trap === null;
    },

    getPathWaypoints: function() {
        return this.waypoints;
    }
};
