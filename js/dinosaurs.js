window.DE = window.DE || {};

DE.DinoManager = {
    dinos: [],

    spawnDino: function(typeName, scene) {
        var typeData = DE.DINO_TYPES[typeName];
        if (!typeData) return null;

        var waypoints = DE.Map.getPathWaypoints();
        if (!waypoints || waypoints.length === 0) return null;
        var startPos = waypoints[0];

        var result = this.createDinoMesh(typeName, typeData);
        var mesh = result.group;
        mesh.position.set(startPos.x, 0.1, startPos.z);
        scene.add(mesh);

        // Health bar
        var hpBarGroup = new THREE.Group();
        var hpBg = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.12, 0.04),
            new THREE.MeshBasicMaterial({ color: 0x222222 })
        );
        hpBarGroup.add(hpBg);
        var hpFill = new THREE.Mesh(
            new THREE.BoxGeometry(0.96, 0.08, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x44ff44 })
        );
        hpFill.position.z = 0.01;
        hpBarGroup.add(hpFill);
        hpBarGroup.position.y = typeData.scale * 2.5 + 0.8;
        mesh.add(hpBarGroup);

        var dino = {
            type: typeData, typeName: typeName,
            hp: typeData.hp, maxHp: typeData.hp,
            speed: typeData.speed, currentSpeed: typeData.speed,
            waypointIndex: 0, x: startPos.x, z: startPos.z,
            mesh: mesh, hpFill: hpFill, alive: true,
            stunTimer: 0, dotTimer: 0, dotDamage: 0, dotTickTimer: 0,
            animPhase: Math.random() * Math.PI * 2,
            leftLeg: result.leftLeg, rightLeg: result.rightLeg,
            leftArm: result.leftArm, rightArm: result.rightArm,
            tail: result.tail, jaw: result.jaw, bodyMesh: result.bodyMesh
        };

        this.dinos.push(dino);
        return dino;
    },

    makeLimb: function(geo, mat, pivotY, px, py, pz) {
        var pivot = new THREE.Group();
        var limb = new THREE.Mesh(geo, mat);
        limb.position.y = -pivotY;
        limb.castShadow = true;
        pivot.add(limb);
        pivot.position.set(px, py, pz);
        return pivot;
    },

    createDinoMesh: function(typeName, typeData) {
        var group = new THREE.Group();
        var s = typeData.scale;
        var mat = new THREE.MeshStandardMaterial({ color: typeData.color, roughness: 0.7, metalness: 0.1 });
        var darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.7), roughness: 0.8 });
        var bellyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).lerp(new THREE.Color(0xeeddcc), 0.5), roughness: 0.8 });
        var leftLeg = null, rightLeg = null, leftArm = null, rightArm = null, tail = null, jaw = null, bodyMesh = null;

        switch (typeData.bodyType) {
            case 'small': {
                bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.7, 8, 6), mat);
                bodyMesh.scale.set(0.8, 0.7, 1.2);
                bodyMesh.position.y = s * 1.2;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                var belly = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 6, 4), bellyMat);
                belly.scale.set(0.7, 0.6, 1.0);
                belly.position.set(0, s * 1.0, 0);
                group.add(belly);
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.15, s * 0.25, s * 0.6, 5), mat);
                neck.position.set(0, s * 1.6, s * 0.4);
                neck.rotation.x = -0.4;
                group.add(neck);
                var head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.35, 6, 5), mat);
                head.scale.set(0.9, 0.8, 1.2);
                head.position.set(0, s * 2.0, s * 0.7);
                group.add(head);
                var snout = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.15, s * 0.4), darkMat);
                snout.position.set(0, s * 1.9, s * 1.0);
                group.add(snout);
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 4, 4), eyeMat);
                    eye.position.set(side * s * 0.2, s * 2.1, s * 0.9);
                    group.add(eye);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.15, s * 1.4, 4), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.5;
                tail.add(tailMesh);
                tail.position.set(0, s * 1.1, -s * 0.5);
                group.add(tail);
                var legGeo = new THREE.BoxGeometry(s * 0.18, s * 0.8, s * 0.18);
                leftLeg = this.makeLimb(legGeo, darkMat, s * 0.4, -s * 0.25, s * 0.7, 0);
                rightLeg = this.makeLimb(legGeo, darkMat, s * 0.4, s * 0.25, s * 0.7, 0);
                group.add(leftLeg);
                group.add(rightLeg);
                break;
            }
            case 'medium': {
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.0, s * 0.9, s * 1.8), mat);
                bodyMesh.position.y = s * 1.4;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                var bellyStripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.3, s * 1.6), bellyMat);
                bellyStripe.position.set(0, s * 1.0, 0);
                group.add(bellyStripe);
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.2, s * 0.35, s * 1.0, 6), mat);
                neck.position.set(0, s * 2.2, s * 0.6);
                neck.rotation.x = -0.3;
                group.add(neck);
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.5, s * 0.9), mat);
                head.position.set(0, s * 2.8, s * 0.9);
                group.add(head);
                jaw = new THREE.Group();
                var jawMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.45, s * 0.15, s * 0.7), darkMat);
                jawMesh.position.z = s * 0.05;
                jaw.add(jawMesh);
                jaw.position.set(0, s * 2.5, s * 1.0);
                group.add(jaw);
                var crestMat = new THREE.MeshStandardMaterial({ color: 0xff4422, roughness: 0.5 });
                for (var side = -1; side <= 1; side += 2) {
                    var crest = new THREE.Mesh(new THREE.ConeGeometry(s * 0.2, s * 0.6, 4), crestMat);
                    crest.position.set(side * s * 0.2, s * 3.2, s * 0.7);
                    crest.rotation.z = side * 0.3;
                    group.add(crest);
                }
                var frillMat = new THREE.MeshStandardMaterial({ color: 0xff6633, roughness: 0.5, side: THREE.DoubleSide });
                for (var side = -1; side <= 1; side += 2) {
                    var frill = new THREE.Mesh(new THREE.CircleGeometry(s * 0.55, 8), frillMat);
                    frill.position.set(side * s * 0.4, s * 2.7, s * 0.7);
                    frill.rotation.y = side * 0.8;
                    group.add(frill);
                }
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 4, 4), eyeMat);
                    eye.position.set(side * s * 0.22, s * 2.9, s * 1.25);
                    group.add(eye);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.25, s * 2.0, 5), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.8;
                tail.add(tailMesh);
                tail.position.set(0, s * 1.3, -s * 0.7);
                group.add(tail);
                var legGeo = new THREE.BoxGeometry(s * 0.25, s * 1.2, s * 0.3);
                leftLeg = this.makeLimb(legGeo, darkMat, s * 0.6, -s * 0.35, s * 0.9, -s * 0.1);
                rightLeg = this.makeLimb(legGeo, darkMat, s * 0.6, s * 0.35, s * 0.9, -s * 0.1);
                group.add(leftLeg);
                group.add(rightLeg);
                var armGeo = new THREE.BoxGeometry(s * 0.12, s * 0.5, s * 0.12);
                leftArm = this.makeLimb(armGeo, mat, s * 0.25, -s * 0.5, s * 1.8, s * 0.3);
                rightArm = this.makeLimb(armGeo, mat, s * 0.25, s * 0.5, s * 1.8, s * 0.3);
                group.add(leftArm);
                group.add(rightArm);
                break;
            }
            case 'fast': {
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.7, s * 0.6, s * 1.8), mat);
                bodyMesh.position.y = s * 1.3;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                var stripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.1, s * 1.6),
                    new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 0.6 }));
                stripe.position.set(0, s * 1.65, 0);
                group.add(stripe);
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.12, s * 0.2, s * 0.8, 5), mat);
                neck.position.set(0, s * 1.8, s * 0.7);
                neck.rotation.x = -0.6;
                group.add(neck);
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.35, s * 0.3, s * 0.8), mat);
                head.position.set(0, s * 2.2, s * 1.2);
                group.add(head);
                var snout = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.4, 4), mat);
                snout.rotation.x = -Math.PI / 2;
                snout.position.set(0, s * 2.15, s * 1.65);
                group.add(snout);
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 4, 4), eyeMat);
                    eye.position.set(side * s * 0.17, s * 2.3, s * 1.35);
                    group.add(eye);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 2.2, 4), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.9;
                tail.add(tailMesh);
                tail.position.set(0, s * 1.3, -s * 0.7);
                group.add(tail);
                var thighGeo = new THREE.BoxGeometry(s * 0.2, s * 0.7, s * 0.25);
                leftLeg = this.makeLimb(thighGeo, darkMat, s * 0.35, -s * 0.3, s * 0.9, -s * 0.1);
                rightLeg = this.makeLimb(thighGeo, darkMat, s * 0.35, s * 0.3, s * 0.9, -s * 0.1);
                group.add(leftLeg);
                group.add(rightLeg);
                var armGeo = new THREE.BoxGeometry(s * 0.1, s * 0.45, s * 0.1);
                leftArm = this.makeLimb(armGeo, mat, s * 0.22, -s * 0.35, s * 1.6, s * 0.5);
                rightArm = this.makeLimb(armGeo, mat, s * 0.22, s * 0.35, s * 1.6, s * 0.5);
                group.add(leftArm);
                group.add(rightArm);
                var clawMat = new THREE.MeshStandardMaterial({ color: 0xccccbb, roughness: 0.3 });
                for (var side = -1; side <= 1; side += 2) {
                    var claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, s * 0.35, 3), clawMat);
                    claw.rotation.x = 0.5;
                    claw.position.set(side * s * 0.3, s * 0.15, s * 0.15);
                    group.add(claw);
                }
                break;
            }
            case 'tank': {
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.8, s * 1.4, s * 2.4), mat);
                bodyMesh.position.y = s * 1.3;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                var belly = new THREE.Mesh(new THREE.BoxGeometry(s * 1.4, s * 0.5, s * 2.0), bellyMat);
                belly.position.set(0, s * 0.7, 0);
                group.add(belly);
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 1.0, s * 1.0), mat);
                head.position.set(0, s * 1.6, s * 1.5);
                group.add(head);
                var beak = new THREE.Mesh(new THREE.ConeGeometry(s * 0.3, s * 0.5, 4), darkMat);
                beak.rotation.x = -Math.PI / 2;
                beak.position.set(0, s * 1.4, s * 2.1);
                group.add(beak);
                var frillMat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.6, side: THREE.DoubleSide });
                var frill = new THREE.Mesh(new THREE.CircleGeometry(s * 1.2, 10), frillMat);
                frill.position.set(0, s * 2.2, s * 1.0);
                frill.rotation.x = -0.3;
                group.add(frill);
                var hornMat = new THREE.MeshStandardMaterial({ color: 0xeeddbb, roughness: 0.3 });
                var noseHorn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.5, 5), hornMat);
                noseHorn.rotation.x = -0.5;
                noseHorn.position.set(0, s * 1.8, s * 2.0);
                group.add(noseHorn);
                for (var side = -1; side <= 1; side += 2) {
                    var horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 1.2, 5), hornMat);
                    horn.rotation.x = -0.6;
                    horn.rotation.z = side * 0.15;
                    horn.position.set(side * s * 0.45, s * 2.1, s * 1.6);
                    group.add(horn);
                }
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 4, 4), new THREE.MeshBasicMaterial({ color: 0x332211 }));
                    eye.position.set(side * s * 0.55, s * 1.7, s * 1.7);
                    group.add(eye);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.35, s * 1.5, 5), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.5;
                tail.add(tailMesh);
                tail.position.set(0, s * 1.2, -s * 1.0);
                group.add(tail);
                var legGeo = new THREE.CylinderGeometry(s * 0.25, s * 0.3, s * 1.0, 6);
                leftLeg = this.makeLimb(legGeo, darkMat, s * 0.5, -s * 0.65, s * 0.8, s * 0.6);
                rightLeg = this.makeLimb(legGeo, darkMat, s * 0.5, s * 0.65, s * 0.8, s * 0.6);
                var backLeftLeg = this.makeLimb(legGeo, darkMat, s * 0.5, -s * 0.65, s * 0.8, -s * 0.6);
                var backRightLeg = this.makeLimb(legGeo, darkMat, s * 0.5, s * 0.65, s * 0.8, -s * 0.6);
                group.add(leftLeg); group.add(rightLeg);
                group.add(backLeftLeg); group.add(backRightLeg);
                leftArm = backLeftLeg;
                rightArm = backRightLeg;
                break;
            }
            case 'boss': {
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.8, s * 1.8, s * 2.8), mat);
                bodyMesh.position.y = s * 2.0;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                var belly = new THREE.Mesh(new THREE.BoxGeometry(s * 1.4, s * 0.8, s * 2.2), bellyMat);
                belly.position.set(0, s * 1.2, 0);
                group.add(belly);
                var ridgeMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.7 });
                for (var i = 0; i < 5; i++) {
                    var ridge = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.3, 3), ridgeMat);
                    ridge.position.set(0, s * 2.95, -s * 0.8 + i * s * 0.5);
                    group.add(ridge);
                }
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.5, s * 0.7, s * 1.0, 6), mat);
                neck.position.set(0, s * 3.0, s * 1.0);
                neck.rotation.x = -0.2;
                group.add(neck);
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 0.9, s * 1.5), mat);
                head.position.set(0, s * 3.5, s * 1.5);
                group.add(head);
                var brow = new THREE.Mesh(new THREE.BoxGeometry(s * 1.25, s * 0.25, s * 0.8), ridgeMat);
                brow.position.set(0, s * 4.0, s * 1.5);
                group.add(brow);
                jaw = new THREE.Group();
                var jawMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.0, s * 0.3, s * 1.3), darkMat);
                jawMesh.position.z = s * 0.1;
                jaw.add(jawMesh);
                jaw.position.set(0, s * 3.1, s * 1.5);
                group.add(jaw);
                var teethMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
                for (var t = -3; t <= 3; t++) {
                    var tooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, s * 0.25, 3), teethMat);
                    tooth.rotation.x = Math.PI;
                    tooth.position.set(t * s * 0.15, s * 3.55, s * 2.15);
                    group.add(tooth);
                    var btooth = new THREE.Mesh(new THREE.ConeGeometry(0.03, s * 0.18, 3), teethMat);
                    btooth.position.set(t * s * 0.14, s * 0.15, s * 0.6);
                    jaw.add(btooth);
                }
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
                for (var side = -1; side <= 1; side += 2) {
                    var eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 4, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
                    eyeSocket.position.set(side * s * 0.5, s * 3.7, s * 2.0);
                    group.add(eyeSocket);
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.1, 4, 4), eyeMat);
                    eye.position.set(side * s * 0.52, s * 3.7, s * 2.05);
                    group.add(eye);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.5, s * 3.5, 6), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 1.5;
                tail.add(tailMesh);
                tail.position.set(0, s * 1.8, -s * 1.2);
                group.add(tail);
                var legGeo = new THREE.BoxGeometry(s * 0.5, s * 1.6, s * 0.55);
                leftLeg = this.makeLimb(legGeo, darkMat, s * 0.8, -s * 0.7, s * 1.2, -s * 0.3);
                rightLeg = this.makeLimb(legGeo, darkMat, s * 0.8, s * 0.7, s * 1.2, -s * 0.3);
                group.add(leftLeg); group.add(rightLeg);
                var armGeo = new THREE.BoxGeometry(s * 0.12, s * 0.4, s * 0.1);
                leftArm = this.makeLimb(armGeo, mat, s * 0.2, -s * 0.9, s * 2.6, s * 0.8);
                rightArm = this.makeLimb(armGeo, mat, s * 0.2, s * 0.9, s * 2.6, s * 0.8);
                group.add(leftArm); group.add(rightArm);
                for (var side = -1; side <= 1; side += 2) {
                    var foot = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.15, s * 0.7), darkMat);
                    foot.position.set(side * s * 0.7, s * 0.08, -s * 0.1);
                    group.add(foot);
                }
                break;
            }
        }
        return { group: group, leftLeg: leftLeg, rightLeg: rightLeg, leftArm: leftArm, rightArm: rightArm, tail: tail, jaw: jaw, bodyMesh: bodyMesh };
    },

    update: function(dt, waypoints, gameState, scene) {
        for (var i = this.dinos.length - 1; i >= 0; i--) {
            var dino = this.dinos[i];
            if (!dino.alive) continue;

            if (dino.stunTimer > 0) {
                dino.stunTimer -= dt;
                dino.currentSpeed = 0;
                if (dino.bodyMesh && dino.bodyMesh.material) {
                    dino.bodyMesh.material.emissive = Math.sin(Date.now() * 0.02) > 0 ?
                        new THREE.Color(0xffff00) : new THREE.Color(0x000000);
                }
            } else {
                dino.currentSpeed = dino.speed;
                if (dino.bodyMesh && dino.bodyMesh.material) dino.bodyMesh.material.emissive = new THREE.Color(0x000000);
            }

            if (dino.dotTimer > 0) {
                dino.dotTimer -= dt;
                dino.dotTickTimer -= dt;
                if (dino.dotTickTimer <= 0) { dino.dotTickTimer = 1.0; this.damageDino(dino, dino.dotDamage, gameState, scene); }
                if (dino.bodyMesh && dino.bodyMesh.material) dino.bodyMesh.material.emissive = new THREE.Color(0x003300);
            }
            if (!dino.alive) continue;

            if (dino.currentSpeed > 0 && dino.waypointIndex < waypoints.length) {
                var target = waypoints[dino.waypointIndex];
                var dx = target.x - dino.x, dz = target.z - dino.z;
                var dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 0.2) {
                    dino.waypointIndex++;
                    if (dino.waypointIndex >= waypoints.length) { this.escapeDino(dino, gameState, scene); continue; }
                } else {
                    var moveSpeed = dino.currentSpeed * dt;
                    dino.x += (dx / dist) * moveSpeed;
                    dino.z += (dz / dist) * moveSpeed;
                    dino.mesh.rotation.y = Math.atan2(dx, dz);
                }
            }

            // Animate limbs
            var animSpeed = dino.currentSpeed > 0 ? dino.currentSpeed * 4 : 0;
            dino.animPhase += dt * animSpeed;
            var legSwing = Math.sin(dino.animPhase) * 0.5;
            var armSwing = Math.sin(dino.animPhase + Math.PI) * 0.35;
            if (dino.leftLeg) dino.leftLeg.rotation.x = dino.currentSpeed > 0 ? legSwing : 0;
            if (dino.rightLeg) dino.rightLeg.rotation.x = dino.currentSpeed > 0 ? -legSwing : 0;
            if (dino.leftArm) dino.leftArm.rotation.x = dino.currentSpeed > 0 ? armSwing : 0;
            if (dino.rightArm) dino.rightArm.rotation.x = dino.currentSpeed > 0 ? -armSwing : 0;
            if (dino.tail) dino.tail.rotation.y = Math.sin(dino.animPhase * 0.7) * 0.2;
            if (dino.jaw && dino.typeName === 'trex') dino.jaw.rotation.x = Math.sin(dino.animPhase * 0.5) * 0.12;

            dino.mesh.position.x = dino.x;
            dino.mesh.position.z = dino.z;
            dino.mesh.position.y = 0.1 + (dino.currentSpeed > 0 ? Math.abs(Math.sin(dino.animPhase)) * 0.08 : 0);
            if (dino.bodyMesh && dino.currentSpeed > 0) dino.bodyMesh.rotation.z = Math.sin(dino.animPhase * 0.8) * 0.03;

            var hpRatio = dino.hp / dino.maxHp;
            dino.hpFill.scale.x = Math.max(0.01, hpRatio);
            dino.hpFill.position.x = -(0.96 * (1 - hpRatio)) / 2;
            dino.hpFill.material.color.setHex(hpRatio > 0.5 ? 0x44ff44 : hpRatio > 0.25 ? 0xffaa00 : 0xff3333);
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
            this.deathEffect(dino, scene);
            if (dino.mesh.parent) dino.mesh.parent.remove(dino.mesh);
        }
    },

    deathEffect: function(dino, scene) {
        var colors = [0xffff00, 0xff8800, 0xffffff];
        for (var i = 0; i < 8; i++) {
            var p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4),
                new THREE.MeshBasicMaterial({ color: colors[i % 3], transparent: true, opacity: 0.9 }));
            p.position.set(dino.x + (Math.random() - 0.5) * 1.5, 0.5 + Math.random() * 1.5, dino.z + (Math.random() - 0.5) * 1.5);
            scene.add(p);
            (function(m) { setTimeout(function() { scene.remove(m); }, 400); })(p);
        }
    },

    escapeDino: function(dino, gameState, scene) {
        dino.alive = false;
        gameState.lives--;
        DE.HUD.updateLives(gameState.lives, DE.CONFIG.MAX_LIVES);
        DE.Audio.playSound('escape');
        var flash = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 }));
        flash.position.set(dino.x, 0.5, dino.z);
        scene.add(flash);
        setTimeout(function() { scene.remove(flash); }, 400);
        if (dino.mesh.parent) dino.mesh.parent.remove(dino.mesh);
    },

    applyEffect: function(dino, effectType, duration, value) {
        if (!dino.alive) return;
        if (effectType === 'stun') dino.stunTimer = Math.max(dino.stunTimer, duration);
        else if (effectType === 'dot') { dino.dotTimer = duration; dino.dotDamage = value || 1; dino.dotTickTimer = 0; }
    },

    getAliveDinos: function() {
        var alive = [];
        for (var i = 0; i < this.dinos.length; i++) if (this.dinos[i].alive) alive.push(this.dinos[i]);
        return alive;
    },

    clear: function(scene) {
        for (var i = 0; i < this.dinos.length; i++) {
            if (this.dinos[i].mesh && this.dinos[i].mesh.parent) this.dinos[i].mesh.parent.remove(this.dinos[i].mesh);
        }
        this.dinos = [];
    }
};
