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
        var metalMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
        var darkMetal = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });

        switch (trapType.id) {
            case 'stun_bomb': {
                // Base platform
                var platform = new THREE.Mesh(new THREE.CylinderGeometry(cs * 0.35, cs * 0.38, 0.1, 10),
                    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.5 }));
                platform.position.y = 0.05; group.add(platform);
                // Main canister body
                var body = new THREE.Mesh(new THREE.CylinderGeometry(cs * 0.25, cs * 0.3, 0.4, 10),
                    new THREE.MeshStandardMaterial({ color: trapType.color, roughness: 0.5, metalness: 0.3 }));
                body.position.y = 0.3; body.castShadow = true; group.add(body);
                // Warning stripes (2 black bands)
                var stripeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
                for (var st = 0; st < 2; st++) {
                    var stripe = new THREE.Mesh(new THREE.CylinderGeometry(cs * 0.26, cs * 0.28, 0.04, 10), stripeMat);
                    stripe.position.y = 0.18 + st * 0.22; group.add(stripe);
                }
                // Detonator dome on top
                var dome = new THREE.Mesh(new THREE.SphereGeometry(cs * 0.12, 8, 6),
                    new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.4, metalness: 0.2 }));
                dome.position.y = 0.55; group.add(dome);
                // Blinking indicator light
                var indicator = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 5),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 }));
                indicator.position.set(cs * 0.2, 0.35, 0); group.add(indicator);
                // Wires from canister to dome
                var wireMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
                for (var w = 0; w < 2; w++) {
                    var wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 3), wireMat);
                    wire.position.set(Math.sin(w * Math.PI) * cs * 0.15, 0.45, Math.cos(w * Math.PI) * cs * 0.15);
                    wire.rotation.z = Math.sin(w * Math.PI) * 0.3;
                    group.add(wire);
                }
                // Mounting bolts
                for (var b = 0; b < 4; b++) {
                    var bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 4), darkMetal);
                    bolt.position.set(Math.sin(b * Math.PI * 0.5) * cs * 0.32, 0.07,
                        Math.cos(b * Math.PI * 0.5) * cs * 0.32);
                    group.add(bolt);
                }
                break;
            }
            case 'pit': {
                // Dirt rim around edge
                var rimMat = new THREE.MeshStandardMaterial({ color: 0x6a5530, roughness: 1.0 });
                var rim = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.85, 0.08, cs * 0.85), rimMat);
                rim.position.y = 0.04; group.add(rim);
                // Dark pit center
                var pitMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1.0 });
                var pit = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.7, 0.06, cs * 0.7), pitMat);
                pit.position.y = -0.01; group.add(pit);
                // Wooden plank covers (partially covering)
                var plankMat = new THREE.MeshStandardMaterial({ color: 0x8a7040, roughness: 0.9 });
                var plank1 = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.6, 0.04, 0.12), plankMat);
                plank1.position.set(0.1, 0.06, -cs * 0.25); plank1.rotation.y = 0.1; group.add(plank1);
                var plank2 = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.4, 0.04, 0.1), plankMat);
                plank2.position.set(-0.15, 0.06, cs * 0.3); plank2.rotation.y = -0.2; group.add(plank2);
                // Wooden stakes with pointed tips
                var stakeMat = new THREE.MeshStandardMaterial({ color: 0x7a6035, roughness: 0.8 });
                var tipMat = new THREE.MeshStandardMaterial({ color: 0x555544, roughness: 0.5, metalness: 0.3 });
                for (var i = 0; i < 6; i++) {
                    var sx = (i % 3 - 1) * 0.25;
                    var sz = (i < 3 ? -0.2 : 0.2);
                    // Wooden shaft
                    var stake = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.25, 4), stakeMat);
                    stake.position.set(sx, 0.1, sz); group.add(stake);
                    // Metal tip
                    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), tipMat);
                    tip.position.set(sx, 0.25, sz); group.add(tip);
                }
                // Scattered leaves/debris
                var debrisMat = new THREE.MeshStandardMaterial({ color: 0x5a7a30, roughness: 1.0 });
                for (var d = 0; d < 4; d++) {
                    var leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.1),
                        new THREE.MeshStandardMaterial({ color: 0x4a6a25, roughness: 1, side: THREE.DoubleSide }));
                    leaf.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
                    leaf.rotation.z = Math.random() * Math.PI;
                    leaf.position.set((Math.random()-0.5)*cs*0.6, 0.07, (Math.random()-0.5)*cs*0.6);
                    group.add(leaf);
                }
                break;
            }
            case 'snare_cannon': {
                // Sandbag base
                var sandMat = new THREE.MeshStandardMaterial({ color: 0x9a8a6a, roughness: 1.0 });
                for (var sb = 0; sb < 3; sb++) {
                    var bag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.15), sandMat);
                    bag.position.set(Math.sin(sb * 2.1) * 0.12, 0.06, Math.cos(sb * 2.1) * 0.12);
                    bag.rotation.y = sb * 1.0;
                    group.add(bag);
                }
                // Metal turret base
                var basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.12, 8), metalMat);
                basePlate.position.y = 0.18; group.add(basePlate);
                // Swivel mount
                var swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.1, 6), darkMetal);
                swivel.position.y = 0.28; group.add(swivel);
                // Gun barrel
                var barrelMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });
                var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 8), barrelMat);
                barrel.position.y = 0.55; barrel.castShadow = true; group.add(barrel);
                // Barrel muzzle ring
                var muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 4, 8), darkMetal);
                muzzle.position.y = 0.9; group.add(muzzle);
                // Scope on side
                var scope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 5),
                    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 }));
                scope.position.set(0.12, 0.6, 0); scope.rotation.z = 0.1; group.add(scope);
                // Scope lens
                var lens = new THREE.Mesh(new THREE.CircleGeometry(0.025, 6),
                    new THREE.MeshBasicMaterial({ color: 0x44aaff }));
                lens.position.set(0.13, 0.7, 0); lens.rotation.z = Math.PI / 2; group.add(lens);
                // Ammo box on base
                var ammoMat = new THREE.MeshStandardMaterial({ color: 0x445533, roughness: 0.7 });
                var ammo = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.12), ammoMat);
                ammo.position.set(-0.18, 0.18, 0.08); group.add(ammo);
                // Ammo box latch
                var latch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.08), metalMat);
                latch.position.set(-0.18, 0.24, 0.08); group.add(latch);
                break;
            }
            case 'tranq_dart': {
                // Tripod legs
                var legMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 });
                for (var leg = 0; leg < 3; leg++) {
                    var lAngle = (leg / 3) * Math.PI * 2;
                    var tripLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.4, 4), legMat);
                    tripLeg.position.set(Math.sin(lAngle) * 0.12, 0.15, Math.cos(lAngle) * 0.12);
                    tripLeg.rotation.x = Math.cos(lAngle) * 0.3;
                    tripLeg.rotation.z = -Math.sin(lAngle) * 0.3;
                    group.add(tripLeg);
                    // Rubber foot
                    var foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.03, 4),
                        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 }));
                    foot.position.set(Math.sin(lAngle) * 0.18, 0.01, Math.cos(lAngle) * 0.18);
                    group.add(foot);
                }
                // Tripod hub
                var hub = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), legMat);
                hub.position.y = 0.3; group.add(hub);
                // Launcher body
                var launchMat = new THREE.MeshStandardMaterial({ color: trapType.color, roughness: 0.5, metalness: 0.2 });
                var launcher = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), launchMat);
                launcher.position.y = 0.38; launcher.castShadow = true; group.add(launcher);
                // Barrel
                var barrelMat2 = new THREE.MeshStandardMaterial({ color: 0x3388aa, metalness: 0.5, roughness: 0.3 });
                var lBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.25, 6), barrelMat2);
                lBarrel.rotation.x = Math.PI / 2;
                lBarrel.position.set(0, 0.38, 0.4); group.add(lBarrel);
                // Dart magazine (cylinder on top)
                var magMat = new THREE.MeshStandardMaterial({ color: 0x44aadd, roughness: 0.4, metalness: 0.3 });
                var mag = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 6), magMat);
                mag.position.set(0, 0.52, -0.05); group.add(mag);
                // Visible darts in magazine
                var dartMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5 });
                for (var dt = 0; dt < 3; dt++) {
                    var dart = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 3), dartMat);
                    dart.position.set(Math.sin(dt * 2.1) * 0.03, 0.56, -0.05 + Math.cos(dt * 2.1) * 0.03);
                    group.add(dart);
                }
                // Scope
                var scope2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.15, 5),
                    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 }));
                scope2.position.set(0, 0.52, 0.15); scope2.rotation.x = Math.PI / 2; group.add(scope2);
                // Scope lens
                var lens2 = new THREE.Mesh(new THREE.CircleGeometry(0.02, 5),
                    new THREE.MeshBasicMaterial({ color: 0x88ff88 }));
                lens2.position.set(0, 0.52, 0.23); group.add(lens2);
                break;
            }
            case 'electro': {
                // Base plate with circuitry pattern
                var baseMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.3 });
                var base = new THREE.Mesh(new THREE.CylinderGeometry(cs * 0.32, cs * 0.35, 0.1, 8), baseMat);
                base.position.y = 0.05; group.add(base);
                // Circuit traces on base
                var traceMat = new THREE.MeshBasicMaterial({ color: 0x44aaff });
                for (var tr = 0; tr < 4; tr++) {
                    var trace = new THREE.Mesh(new THREE.BoxGeometry(cs * 0.5, 0.01, 0.015), traceMat);
                    trace.position.y = 0.11;
                    trace.rotation.y = tr * Math.PI * 0.25;
                    group.add(trace);
                }
                // Central pole
                var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 6), darkMetal);
                pole.position.y = 0.35; pole.castShadow = true; group.add(pole);
                // Capacitor banks (4 small cylinders around base)
                var capMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.5, roughness: 0.4 });
                for (var cp = 0; cp < 4; cp++) {
                    var capAngle = (cp / 4) * Math.PI * 2;
                    var capacitor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), capMat);
                    capacitor.position.set(Math.sin(capAngle) * cs * 0.2, 0.2, Math.cos(capAngle) * cs * 0.2);
                    group.add(capacitor);
                    // Cap top
                    var capTop = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), metalMat);
                    capTop.position.set(Math.sin(capAngle) * cs * 0.2, 0.32, Math.cos(capAngle) * cs * 0.2);
                    group.add(capTop);
                }
                // Tesla coil rings
                var coilMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, metalness: 0.7, roughness: 0.2 });
                for (var cr = 0; cr < 3; cr++) {
                    var coil = new THREE.Mesh(new THREE.TorusGeometry(0.08 + cr * 0.03, 0.01, 4, 10), coilMat);
                    coil.position.y = 0.45 + cr * 0.08;
                    group.add(coil);
                }
                // Energy orb on top with glow
                var orbMat = new THREE.MeshStandardMaterial({
                    color: 0xaaffff, roughness: 0.1, metalness: 0.1,
                    emissive: 0x44aaff, emissiveIntensity: 0.8 });
                var orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), orbMat);
                orb.position.y = 0.72; group.add(orb);
                // Outer glow shell
                var glowMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.2 });
                var glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), glowMat);
                glow.position.y = 0.72; group.add(glow);
                // Small arc effects
                var arcMat = new THREE.MeshBasicMaterial({ color: 0x88ddff });
                for (var a = 0; a < 2; a++) {
                    var arc = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.01), arcMat);
                    arc.position.set(Math.sin(a * 3.14) * 0.12, 0.65, Math.cos(a * 3.14) * 0.12);
                    arc.rotation.z = (Math.random() - 0.5) * 0.5;
                    group.add(arc);
                }
                break;
            }
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
                    if (type.damage > 0) {
                        DE.DinoManager.damageDino(closest, type.damage, DE.Game.state, scene);
                    }
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
