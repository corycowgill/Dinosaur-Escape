window.DE = window.DE || {};

DE.DinoManager = {
    dinos: [],

    spawnDino: function(typeName, scene) {
        var typeData = DE.DINO_TYPES[typeName];
        if (!typeData) return null;

        var waypoints = DE.Map.getPathWaypoints();
        var startPos = waypoints[0];

        var mesh = this.createDinoMesh(typeName, typeData);
        mesh.position.set(startPos.x, 0.3, startPos.z);
        scene.add(mesh);

        // Health bar
        var hpBarGroup = new THREE.Group();
        var hpBg = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.15, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        hpBarGroup.add(hpBg);
        var hpFill = new THREE.Mesh(
            new THREE.BoxGeometry(1.15, 0.1, 0.06),
            new THREE.MeshBasicMaterial({ color: 0x44ff44 })
        );
        hpFill.position.z = 0.01;
        hpBarGroup.add(hpFill);
        hpBarGroup.position.y = typeData.scale * 2 + 0.5;
        hpBarGroup.rotation.x = -Math.PI / 4;
        mesh.add(hpBarGroup);

        var dino = {
            type: typeData,
            typeName: typeName,
            hp: typeData.hp,
            maxHp: typeData.hp,
            speed: typeData.speed,
            currentSpeed: typeData.speed,
            waypointIndex: 0,
            x: startPos.x,
            z: startPos.z,
            mesh: mesh,
            hpFill: hpFill,
            alive: true,
            stunTimer: 0,
            dotTimer: 0,
            dotDamage: 0,
            dotTickTimer: 0,
            bobPhase: Math.random() * Math.PI * 2
        };

        this.dinos.push(dino);
        return dino;
    },

    createDinoMesh: function(typeName, typeData) {
        var group = new THREE.Group();
        var s = typeData.scale;
        var mat = new THREE.MeshLambertMaterial({ color: typeData.color });

        switch (typeData.bodyType) {
            case 'small': // Compy
                // Small body
                var body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.8, 8, 6), mat);
                body.position.y = s;
                body.scale.set(1, 0.8, 1.3);
                group.add(body);
                // Head
                var head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.4, 6, 6), mat);
                head.position.set(0, s * 1.3, s * 0.7);
                group.add(head);
                // Tail
                var tail = new THREE.Mesh(
                    new THREE.ConeGeometry(s * 0.2, s * 1.2, 4),
                    mat
                );
                tail.rotation.x = Math.PI / 2;
                tail.position.set(0, s * 0.8, -s * 0.9);
                group.add(tail);
                break;

            case 'medium': // Dilophosaurus
                var body = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 1, s * 2), mat);
                body.position.y = s;
                group.add(body);
                // Head
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.6, s * 0.8), mat);
                head.position.set(0, s * 1.5, s * 1.0);
                group.add(head);
                // Frills
                var frillMat = new THREE.MeshLambertMaterial({ color: 0xff6633 });
                var frill = new THREE.Mesh(new THREE.CircleGeometry(s * 0.5, 8), frillMat);
                frill.position.set(s * 0.4, s * 1.5, s * 0.6);
                frill.rotation.y = Math.PI / 4;
                group.add(frill);
                var frill2 = new THREE.Mesh(new THREE.CircleGeometry(s * 0.5, 8), frillMat);
                frill2.position.set(-s * 0.4, s * 1.5, s * 0.6);
                frill2.rotation.y = -Math.PI / 4;
                group.add(frill2);
                break;

            case 'fast': // Velociraptor
                var body = new THREE.Mesh(
                    new THREE.BoxGeometry(s * 0.8, s * 0.7, s * 2),
                    mat
                );
                body.position.y = s;
                group.add(body);
                // Sleek head
                var head = new THREE.Mesh(
                    new THREE.ConeGeometry(s * 0.3, s * 1.0, 4),
                    mat
                );
                head.rotation.x = -Math.PI / 2;
                head.position.set(0, s * 1.2, s * 1.3);
                group.add(head);
                // Claws
                var clawMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
                for (var side = -1; side <= 1; side += 2) {
                    var claw = new THREE.Mesh(
                        new THREE.ConeGeometry(0.06, 0.25, 3),
                        clawMat
                    );
                    claw.position.set(side * s * 0.4, s * 0.3, s * 0.5);
                    group.add(claw);
                }
                break;

            case 'tank': // Triceratops
                var body = new THREE.Mesh(
                    new THREE.BoxGeometry(s * 2, s * 1.5, s * 2.5),
                    mat
                );
                body.position.y = s * 1.2;
                group.add(body);
                // Head shield
                var shield = new THREE.Mesh(
                    new THREE.CircleGeometry(s * 1, 8),
                    new THREE.MeshLambertMaterial({ color: 0x7777aa, side: THREE.DoubleSide })
                );
                shield.position.set(0, s * 1.8, s * 1.3);
                group.add(shield);
                // Horns
                var hornMat = new THREE.MeshLambertMaterial({ color: 0xeeeecc });
                for (var i = -1; i <= 1; i++) {
                    var horn = new THREE.Mesh(
                        new THREE.ConeGeometry(0.08, s * 1.0, 4),
                        hornMat
                    );
                    horn.rotation.x = -Math.PI / 3;
                    horn.position.set(i * s * 0.5, s * 1.8 + (i === 0 ? 0.2 : 0), s * 1.5 + (i === 0 ? 0.3 : 0));
                    group.add(horn);
                }
                break;

            case 'boss': // T-Rex
                var body = new THREE.Mesh(
                    new THREE.BoxGeometry(s * 2, s * 2, s * 3),
                    mat
                );
                body.position.y = s * 1.8;
                group.add(body);
                // Head with jaw
                var head = new THREE.Mesh(
                    new THREE.BoxGeometry(s * 1.2, s * 1.0, s * 1.5),
                    mat
                );
                head.position.set(0, s * 3, s * 1.5);
                group.add(head);
                // Jaw
                var jaw = new THREE.Mesh(
                    new THREE.BoxGeometry(s * 1.0, s * 0.3, s * 1.2),
                    new THREE.MeshLambertMaterial({ color: 0x553322 })
                );
                jaw.position.set(0, s * 2.3, s * 1.6);
                group.add(jaw);
                // Teeth
                var teethMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
                for (var t = -2; t <= 2; t++) {
                    var tooth = new THREE.Mesh(
                        new THREE.ConeGeometry(0.04, 0.2, 3),
                        teethMat
                    );
                    tooth.rotation.x = Math.PI;
                    tooth.position.set(t * s * 0.2, s * 2.5, s * 2.1);
                    group.add(tooth);
                }
                // Tiny arms
                var armMat = new THREE.MeshLambertMaterial({ color: typeData.color });
                for (var side = -1; side <= 1; side += 2) {
                    var arm = new THREE.Mesh(
                        new THREE.BoxGeometry(s * 0.2, s * 0.6, s * 0.2),
                        armMat
                    );
                    arm.position.set(side * s * 1.1, s * 2.2, s * 0.8);
                    group.add(arm);
                }
                // Eyes
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(
                        new THREE.SphereGeometry(s * 0.12, 6, 6),
                        eyeMat
                    );
                    eye.position.set(side * s * 0.4, s * 3.3, s * 2.0);
                    group.add(eye);
                }
                break;
        }

        group.castShadow = true;
        return group;
    },

    update: function(dt, waypoints, gameState, scene) {
        for (var i = this.dinos.length - 1; i >= 0; i--) {
            var dino = this.dinos[i];
            if (!dino.alive) continue;

            // Process stun
            if (dino.stunTimer > 0) {
                dino.stunTimer -= dt;
                dino.currentSpeed = 0;
                // Stun visual - pulse color
                if (dino.mesh.children[0] && dino.mesh.children[0].material) {
                    var flash = Math.sin(Date.now() * 0.02) > 0;
                    dino.mesh.children[0].material.emissive = flash ?
                        new THREE.Color(0xffff00) : new THREE.Color(0x000000);
                }
            } else {
                dino.currentSpeed = dino.speed;
                if (dino.mesh.children[0] && dino.mesh.children[0].material) {
                    dino.mesh.children[0].material.emissive = new THREE.Color(0x000000);
                }
            }

            // Process DOT
            if (dino.dotTimer > 0) {
                dino.dotTimer -= dt;
                dino.dotTickTimer -= dt;
                if (dino.dotTickTimer <= 0) {
                    dino.dotTickTimer = 1.0;
                    this.damageDino(dino, dino.dotDamage, gameState, scene);
                }
                // Green tint for poison
                if (dino.mesh.children[0] && dino.mesh.children[0].material) {
                    dino.mesh.children[0].material.emissive.addScalar(0.05);
                }
            }

            if (!dino.alive) continue;

            // Move along waypoints
            if (dino.currentSpeed > 0 && dino.waypointIndex < waypoints.length) {
                var target = waypoints[dino.waypointIndex];
                var dx = target.x - dino.x;
                var dz = target.z - dino.z;
                var dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 0.2) {
                    dino.waypointIndex++;
                    if (dino.waypointIndex >= waypoints.length) {
                        // Escaped!
                        this.escapeDino(dino, gameState, scene);
                        continue;
                    }
                } else {
                    var moveSpeed = dino.currentSpeed * dt;
                    dino.x += (dx / dist) * moveSpeed;
                    dino.z += (dz / dist) * moveSpeed;

                    // Face movement direction
                    var angle = Math.atan2(dx, dz);
                    dino.mesh.rotation.y = angle;
                }
            }

            // Update mesh position with bob animation
            dino.bobPhase += dt * dino.currentSpeed * 3;
            dino.mesh.position.x = dino.x;
            dino.mesh.position.z = dino.z;
            dino.mesh.position.y = 0.1 + Math.abs(Math.sin(dino.bobPhase)) * 0.15 * (dino.currentSpeed > 0 ? 1 : 0);

            // Update health bar
            var hpRatio = dino.hp / dino.maxHp;
            dino.hpFill.scale.x = Math.max(0.01, hpRatio);
            dino.hpFill.position.x = -(1.15 * (1 - hpRatio)) / 2;
            if (hpRatio > 0.5) {
                dino.hpFill.material.color.setHex(0x44ff44);
            } else if (hpRatio > 0.25) {
                dino.hpFill.material.color.setHex(0xffaa00);
            } else {
                dino.hpFill.material.color.setHex(0xff3333);
            }
        }
    },

    damageDino: function(dino, amount, gameState, scene) {
        if (!dino.alive) return;
        dino.hp -= amount;
        DE.Audio.playSound('hit');

        if (dino.hp <= 0) {
            dino.alive = false;
            gameState.score += dino.type.points;
            gameState.cash += dino.type.cash;
            DE.HUD.updateScore(gameState.score);
            DE.HUD.updateCash(gameState.cash);
            DE.Audio.playSound('kill');

            // Death effect - flash and remove
            this.deathEffect(dino, scene);
            if (dino.mesh.parent) dino.mesh.parent.remove(dino.mesh);
        }
    },

    deathEffect: function(dino, scene) {
        // Burst of small particles
        for (var i = 0; i < 6; i++) {
            var particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 })
            );
            particle.position.set(
                dino.x + (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 1,
                dino.z + (Math.random() - 0.5) * 1.5
            );
            scene.add(particle);
            (function(p) {
                setTimeout(function() { scene.remove(p); }, 300);
            })(particle);
        }
    },

    escapeDino: function(dino, gameState, scene) {
        dino.alive = false;
        gameState.lives--;
        DE.HUD.updateLives(gameState.lives, DE.CONFIG.MAX_LIVES);
        DE.Audio.playSound('escape');

        // Escape flash
        var flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 })
        );
        flash.position.set(dino.x, 0.5, dino.z);
        scene.add(flash);
        setTimeout(function() { scene.remove(flash); }, 400);

        if (dino.mesh.parent) dino.mesh.parent.remove(dino.mesh);
    },

    applyEffect: function(dino, effectType, duration, value) {
        if (!dino.alive) return;
        if (effectType === 'stun') {
            dino.stunTimer = Math.max(dino.stunTimer, duration);
        } else if (effectType === 'dot') {
            dino.dotTimer = duration;
            dino.dotDamage = value || 1;
            dino.dotTickTimer = 0;
        }
    },

    getAliveDinos: function() {
        var alive = [];
        for (var i = 0; i < this.dinos.length; i++) {
            if (this.dinos[i].alive) alive.push(this.dinos[i]);
        }
        return alive;
    },

    clear: function(scene) {
        for (var i = 0; i < this.dinos.length; i++) {
            if (this.dinos[i].mesh && this.dinos[i].mesh.parent) {
                this.dinos[i].mesh.parent.remove(this.dinos[i].mesh);
            }
        }
        this.dinos = [];
    }
};
