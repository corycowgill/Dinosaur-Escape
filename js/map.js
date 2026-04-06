window.DE = window.DE || {};

DE.Map = {
    grid: [],
    waypoints: [],
    meshes: [],

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

        // Build a winding path from left spawn to right exit
        // Path goes: left edge -> right -> turn down -> left -> turn down -> right -> exit
        var pathCells = [];
        var row = 1;

        // Segment 1: row 1, col 0 -> 17
        for (var c = 0; c <= 17; c++) pathCells.push({ r: row, c: c });
        // Turn down
        for (var r2 = 2; r2 <= 3; r2++) pathCells.push({ r: r2, c: 17 });
        // Segment 2: row 3, col 16 -> 3 (start at 16 to avoid duplicate at turn)
        row = 3;
        for (var c = 16; c >= 3; c--) pathCells.push({ r: row, c: c });
        // Turn down
        for (var r2 = 4; r2 <= 5; r2++) pathCells.push({ r: r2, c: 3 });
        // Segment 3: row 5, col 4 -> 17 (start at 4 to avoid duplicate at turn)
        row = 5;
        for (var c = 4; c <= 17; c++) pathCells.push({ r: row, c: c });
        // Turn down
        for (var r2 = 6; r2 <= 7; r2++) pathCells.push({ r: r2, c: 17 });
        // Segment 4: row 7, col 16 -> 3 (start at 16 to avoid duplicate at turn)
        row = 7;
        for (var c = 16; c >= 3; c--) pathCells.push({ r: row, c: c });
        // Turn down
        for (var r2 = 8; r2 <= 9; r2++) pathCells.push({ r: r2, c: 3 });
        // Segment 5: row 9, col 4 -> 19 (start at 4 to avoid duplicate at turn)
        row = 9;
        for (var c = 4; c <= 19; c++) pathCells.push({ r: row, c: c });

        // Mark path cells
        for (var i = 0; i < pathCells.length; i++) {
            var pc = pathCells[i];
            if (pc.r >= 0 && pc.r < rows && pc.c >= 0 && pc.c < cols) {
                this.grid[pc.r][pc.c].type = 'path';
            }
        }

        // Mark spawn and exit
        this.grid[1][0].type = 'spawn';
        this.grid[9][19].type = 'exit';

        // Build waypoints (world coordinates at center of each path cell)
        this.waypoints = [];
        for (var i = 0; i < pathCells.length; i++) {
            var wp = this.gridToWorld(pathCells[i].c, pathCells[i].r);
            this.waypoints.push(wp);
        }

        // Mark fence border
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
        var cs = DE.CONFIG.CELL_SIZE;
        var cols = DE.CONFIG.GRID_COLS;
        var rows = DE.CONFIG.GRID_ROWS;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var cell = this.grid[r][c];
                var pos = this.gridToWorld(c, r);
                var mesh;

                if (cell.type === 'path' || cell.type === 'spawn' || cell.type === 'exit') {
                    var color = DE.COLORS.PATH;
                    if (cell.type === 'spawn') color = DE.COLORS.SPAWN;
                    if (cell.type === 'exit') color = DE.COLORS.EXIT;

                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(cs * 0.95, 0.15, cs * 0.95),
                        new THREE.MeshLambertMaterial({ color: color })
                    );
                    mesh.position.set(pos.x, 0.075, pos.z);
                    mesh.receiveShadow = true;
                    scene.add(mesh);
                } else if (cell.type === 'fence') {
                    // Ground under fence
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(cs, 0.1, cs),
                        new THREE.MeshLambertMaterial({ color: DE.COLORS.GROUND })
                    );
                    mesh.position.set(pos.x, 0.05, pos.z);
                    mesh.receiveShadow = true;
                    scene.add(mesh);

                    // Fence post
                    var post = new THREE.Mesh(
                        new THREE.BoxGeometry(cs * 0.8, 1.2, cs * 0.8),
                        new THREE.MeshLambertMaterial({ color: DE.COLORS.FENCE })
                    );
                    post.position.set(pos.x, 0.6, pos.z);
                    post.castShadow = true;
                    scene.add(post);

                    // Wire on top
                    if ((c + r) % 2 === 0) {
                        var wire = new THREE.Mesh(
                            new THREE.BoxGeometry(cs * 0.9, 0.08, cs * 0.9),
                            new THREE.MeshLambertMaterial({ color: 0x999999 })
                        );
                        wire.position.set(pos.x, 1.25, pos.z);
                        scene.add(wire);
                    }
                } else {
                    // Ground tile
                    var groundColor = (c + r) % 2 === 0 ? DE.COLORS.GROUND : DE.COLORS.GROUND_ALT;
                    mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(cs, 0.1, cs),
                        new THREE.MeshLambertMaterial({ color: groundColor })
                    );
                    mesh.position.set(pos.x, 0.05, pos.z);
                    mesh.receiveShadow = true;
                    scene.add(mesh);

                    // Random decorative trees
                    if (Math.random() < 0.15) {
                        this.addTree(scene, pos.x, pos.z);
                    }
                }
            }
        }

        // Spawn zone marker
        var spawnMarker = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 0.6, 0.3, cs * 0.6),
            new THREE.MeshLambertMaterial({ color: 0xff4444, transparent: true, opacity: 0.6 })
        );
        var sp = this.gridToWorld(0, 1);
        spawnMarker.position.set(sp.x, 0.2, sp.z);
        scene.add(spawnMarker);

        // Exit zone marker
        var exitMarker = new THREE.Mesh(
            new THREE.BoxGeometry(cs * 0.6, 0.3, cs * 0.6),
            new THREE.MeshLambertMaterial({ color: 0xffcc00, transparent: true, opacity: 0.6 })
        );
        var ep = this.gridToWorld(19, 9);
        exitMarker.position.set(ep.x, 0.2, ep.z);
        scene.add(exitMarker);
    },

    addTree: function(scene, x, z) {
        var group = new THREE.Group();
        // Trunk
        var trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.2, 1, 6),
            new THREE.MeshLambertMaterial({ color: DE.COLORS.TREE_TRUNK })
        );
        trunk.position.y = 0.5;
        trunk.castShadow = true;
        group.add(trunk);
        // Canopy
        var canopy = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 1.2, 6),
            new THREE.MeshLambertMaterial({ color: DE.COLORS.TREE_LEAVES })
        );
        canopy.position.y = 1.4;
        canopy.castShadow = true;
        group.add(canopy);

        group.position.set(x + (Math.random() - 0.5) * 0.5, 0, z + (Math.random() - 0.5) * 0.5);
        scene.add(group);
    },

    gridToWorld: function(col, row) {
        var cs = DE.CONFIG.CELL_SIZE;
        return {
            x: col * cs + cs / 2,
            z: row * cs + cs / 2
        };
    },

    worldToGrid: function(x, z) {
        var cs = DE.CONFIG.CELL_SIZE;
        return {
            col: Math.floor(x / cs),
            row: Math.floor(z / cs)
        };
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
