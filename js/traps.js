window.DE = window.DE || {};

DE.TrapManager = {
    traps: [],
    selectedTrapIndex: 0,

    selectTrap: function(index) {
        if (index >= 0 && index < DE.TRAP_TYPES.length) {
            this.selectedTrapIndex = index;
            DE.HUD.highlightTrapButton(index);
        }
    },

    getSelectedType: function() {
        return DE.TRAP_TYPES[this.selectedTrapIndex];
    },

    placeTrap: function(col, row, scene, gameState) {
        if (!DE.Map.canPlaceTrap(col, row)) {
            DE.Audio.playSound('error');
            return false;
        }

        var trapType = this.getSelectedType();
        if (gameState.cash < trapType.cost) {
            DE.Audio.playSound('error');
            return false;
        }

        gameState.cash -= trapType.cost;

        var pos = DE.Map.gridToWorld(col, row);
        var mesh = this.createTrapMesh(trapType);
        mesh.position.set(pos.x, 0.15, pos.z);
        scene.add(mesh);

        var trap = {
            type: trapType,
            col: col,
            row: row,
            x: pos.x,
            z: pos.z,
            mesh: mesh,
            cooldownTimer: 0,
            active: true
        };

        this.traps.push(trap);
        DE.Map.grid[row][col].trap = trap;

        DE.Audio.playSound('place');
        DE.HUD.updateCash(gameState.cash);
        return true;
    },

    createTrapMesh: function(trapType) {
        var group = new THREE.Group();
        var cs = DE.CONFIG.CELL_SIZE;

        switch (trapType.id) {
            case 'stun_bomb':
                var base = new THREE.Mesh(
                    new THREE.CylinderGeometry(cs * 0.3, cs * 0.35, 0.4, 8),
                    new THREE.MeshLambertMaterial({ color: trapType.color })
                );
                base.position.y = 0.2;
                group.add(base);
                var top = new THREE.Mesh(
                    new THREE.SphereGeometry(cs * 0.15, 8, 8),
                    new THREE.MeshLambertMaterial({ color: 0xff5500 })
                );
                top.position.y = 0.5;
                group.add(top);
                break;

            case 'pit':
                var pit = new THREE.Mesh(
                    new THREE.BoxGeometry(cs * 0.8, 0.05, cs * 0.8),
                    new THREE.MeshLambertMaterial({ color: trapType.color })
                );
                pit.position.y = -0.02;
                group.add(pit);
                // Spikes
                for (var i = 0; i < 4; i++) {
                    var spike = new THREE.Mesh(
                        new THREE.ConeGeometry(0.08, 0.3, 4),
                        new THREE.MeshLambertMaterial({ color: 0x666666 })
                    );
                    spike.position.set(
                        (i % 2 === 0 ? -0.3 : 0.3),
                        0.1,
                        (i < 2 ? -0.3 : 0.3)
                    );
                    group.add(spike);
                }
                break;

            case 'snare_cannon':
                var barrel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8),
                    new THREE.MeshLambertMaterial({ color: trapType.color })
                );
                barrel.position.y = 0.4;
                group.add(barrel);
                var stand = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.2, 0.5),
                    new THREE.MeshLambertMaterial({ color: 0x555555 })
                );
                stand.position.y = 0.1;
                group.add(stand);
                break;

            case 'tranq_dart':
                var launcher = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.3, 0.7),
                    new THREE.MeshLambertMaterial({ color: trapType.color })
                );
                launcher.position.y = 0.35;
                group.add(launcher);
                var tripod = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.15, 0.4, 3),
                    new THREE.MeshLambertMaterial({ color: 0x666666 })
                );
                tripod.position.y = 0.1;
                group.add(tripod);
                break;

            case 'electro':
                var coil = new THREE.Mesh(
                    new THREE.TorusGeometry(cs * 0.25, 0.08, 6, 12),
                    new THREE.MeshLambertMaterial({ color: trapType.color })
                );
                coil.rotation.x = Math.PI / 2;
                coil.position.y = 0.3;
                group.add(coil);
                var pole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6),
                    new THREE.MeshLambertMaterial({ color: 0x333344 })
                );
                pole.position.y = 0.3;
                group.add(pole);
                var orb = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 8, 8),
                    new THREE.MeshLambertMaterial({ color: 0xaaffff, emissive: 0x44aaff, emissiveIntensity: 0.5 })
                );
                orb.position.y = 0.65;
                group.add(orb);
                break;
        }

        group.castShadow = true;
        return group;
    },

    update: function(dt, dinosaurs, scene) {
        for (var i = 0; i < this.traps.length; i++) {
            var trap = this.traps[i];
            if (!trap.active) continue;

            trap.cooldownTimer = Math.max(0, trap.cooldownTimer - dt);
            if (trap.cooldownTimer > 0) continue;

            var type = trap.type;
            var hitSomething = false;

            if (type.id === 'pit') {
                // Pit damages dinos walking directly over it
                for (var d = 0; d < dinosaurs.length; d++) {
                    var dino = dinosaurs[d];
                    if (!dino.alive) continue;
                    var dx = dino.x - trap.x;
                    var dz = dino.z - trap.z;
                    var dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist < type.range) {
                        DE.DinoManager.damageDino(dino, type.damage, DE.Game.state, scene);
                        hitSomething = true;
                        this.showEffect(trap, dino, scene);
                    }
                }
                if (hitSomething) trap.cooldownTimer = 1.0;
            } else if (type.id === 'stun_bomb') {
                // Area stun
                for (var d = 0; d < dinosaurs.length; d++) {
                    var dino = dinosaurs[d];
                    if (!dino.alive) continue;
                    var dx = dino.x - trap.x;
                    var dz = dino.z - trap.z;
                    var dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist < type.range) {
                        DE.DinoManager.applyEffect(dino, 'stun', type.stunDuration);
                        DE.DinoManager.damageDino(dino, type.damage, DE.Game.state, scene);
                        hitSomething = true;
                    }
                }
                if (hitSomething) {
                    trap.cooldownTimer = type.cooldown;
                    this.showAreaEffect(trap, scene);
                    DE.Audio.playSound('stun');
                }
            } else if (type.id === 'snare_cannon') {
                // Single target, longest range
                var closest = null;
                var closestDist = type.range;
                for (var d = 0; d < dinosaurs.length; d++) {
                    var dino = dinosaurs[d];
                    if (!dino.alive || dino.stunTimer > 0) continue;
                    var dx = dino.x - trap.x;
                    var dz = dino.z - trap.z;
                    var dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = dino;
                    }
                }
                if (closest) {
                    DE.DinoManager.applyEffect(closest, 'stun', type.stunDuration);
                    trap.cooldownTimer = type.cooldown;
                    this.showEffect(trap, closest, scene);
                    DE.Audio.playSound('stun');
                }
            } else if (type.id === 'tranq_dart') {
                // Single target DOT
                var closest = null;
                var closestDist = type.range;
                for (var d = 0; d < dinosaurs.length; d++) {
                    var dino = dinosaurs[d];
                    if (!dino.alive) continue;
                    var dx = dino.x - trap.x;
                    var dz = dino.z - trap.z;
                    var dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = dino;
                    }
                }
                if (closest) {
                    DE.DinoManager.damageDino(closest, type.damage, DE.Game.state, scene);
                    DE.DinoManager.applyEffect(closest, 'dot', type.dotDuration, type.dotDamage);
                    trap.cooldownTimer = type.cooldown;
                    this.showEffect(trap, closest, scene);
                    DE.Audio.playSound('hit');
                }
            } else if (type.id === 'electro') {
                // Chain lightning stun
                var closest = null;
                var closestDist = type.range;
                for (var d = 0; d < dinosaurs.length; d++) {
                    var dino = dinosaurs[d];
                    if (!dino.alive) continue;
                    var dx = dino.x - trap.x;
                    var dz = dino.z - trap.z;
                    var dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = dino;
                    }
                }
                if (closest) {
                    DE.DinoManager.applyEffect(closest, 'stun', type.stunDuration);
                    DE.DinoManager.damageDino(closest, type.damage, DE.Game.state, scene);
                    this.showEffect(trap, closest, scene);

                    // Chain to nearby dinos
                    var chained = [closest];
                    var lastTarget = closest;
                    for (var ch = 0; ch < type.chainCount; ch++) {
                        var nextTarget = null;
                        var nextDist = type.chainRange;
                        for (var d = 0; d < dinosaurs.length; d++) {
                            var dino = dinosaurs[d];
                            if (!dino.alive || chained.indexOf(dino) >= 0) continue;
                            var dx = dino.x - lastTarget.x;
                            var dz = dino.z - lastTarget.z;
                            var dist = Math.sqrt(dx * dx + dz * dz);
                            if (dist < nextDist) {
                                nextDist = dist;
                                nextTarget = dino;
                            }
                        }
                        if (nextTarget) {
                            DE.DinoManager.applyEffect(nextTarget, 'stun', type.stunDuration * 0.7);
                            DE.DinoManager.damageDino(nextTarget, 1, DE.Game.state, scene);
                            this.showChainEffect(lastTarget, nextTarget, scene);
                            chained.push(nextTarget);
                            lastTarget = nextTarget;
                        }
                    }
                    trap.cooldownTimer = type.cooldown;
                    DE.Audio.playSound('stun');
                }
            }
        }
    },

    showEffect: function(trap, target, scene) {
        // Line from trap to target
        var mat = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
        var geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(trap.x, 0.5, trap.z),
            new THREE.Vector3(target.x, 0.5, target.z)
        ]);
        var line = new THREE.Line(geo, mat);
        scene.add(line);
        setTimeout(function() { scene.remove(line); }, 200);
    },

    showAreaEffect: function(trap, scene) {
        var ring = new THREE.Mesh(
            new THREE.RingGeometry(0.1, trap.type.range, 16),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(trap.x, 0.3, trap.z);
        scene.add(ring);
        setTimeout(function() { scene.remove(ring); }, 300);
    },

    showChainEffect: function(from, to, scene) {
        var mat = new THREE.LineBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.9 });
        var geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(from.x, 0.5, from.z),
            new THREE.Vector3(to.x, 0.5, to.z)
        ]);
        var line = new THREE.Line(geo, mat);
        scene.add(line);
        setTimeout(function() { scene.remove(line); }, 250);
    },

    clear: function() {
        for (var i = 0; i < this.traps.length; i++) {
            if (this.traps[i].mesh && this.traps[i].mesh.parent) {
                this.traps[i].mesh.parent.remove(this.traps[i].mesh);
            }
        }
        this.traps = [];
    }
};
