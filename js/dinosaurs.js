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
        var clawMat = new THREE.MeshStandardMaterial({ color: 0xccccbb, roughness: 0.3, metalness: 0.2 });
        var leftLeg = null, rightLeg = null, leftArm = null, rightArm = null, tail = null, jaw = null, bodyMesh = null;

        switch (typeData.bodyType) {
            case 'small': {
                // Compy - small, zippy, spotted
                bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(s * 0.7, 8, 6), mat);
                bodyMesh.scale.set(0.8, 0.7, 1.2);
                bodyMesh.position.y = s * 1.2;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                // Spots/markings on body
                var spotMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.6), roughness: 0.8 });
                for (var sp = 0; sp < 5; sp++) {
                    var spot = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 4, 3), spotMat);
                    spot.position.set((Math.random()-0.5)*s*0.5, s*1.1+Math.random()*s*0.3, (Math.random()-0.5)*s*0.6);
                    group.add(spot);
                }
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
                // Nostrils
                for (var side = -1; side <= 1; side += 2) {
                    var nostril = new THREE.Mesh(new THREE.SphereGeometry(s * 0.02, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x222222 }));
                    nostril.position.set(side * s * 0.06, s * 1.95, s * 1.2);
                    group.add(nostril);
                }
                // Eyes with pupils
                for (var side = -1; side <= 1; side += 2) {
                    var eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(s * 0.07, 5, 4),
                        new THREE.MeshBasicMaterial({ color: 0xeeeecc }));
                    eyeWhite.position.set(side * s * 0.2, s * 2.1, s * 0.9);
                    group.add(eyeWhite);
                    var pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.04, 4, 3),
                        new THREE.MeshBasicMaterial({ color: 0x111111 }));
                    pupil.position.set(side * s * 0.21, s * 2.1, s * 0.95);
                    group.add(pupil);
                }
                // Tiny teeth
                for (var t = -1; t <= 1; t += 2) {
                    var tooth = new THREE.Mesh(new THREE.ConeGeometry(s*0.015, s*0.06, 3),
                        new THREE.MeshStandardMaterial({ color: 0xffffff }));
                    tooth.rotation.x = Math.PI; tooth.position.set(t*s*0.06, s*1.83, s*1.1);
                    group.add(tooth);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.15, s * 1.4, 5), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.5;
                tail.add(tailMesh);
                // Tail tip
                var tailTip = new THREE.Mesh(new THREE.SphereGeometry(s * 0.05, 3, 3), spotMat);
                tailTip.position.z = -s * 1.2; tail.add(tailTip);
                tail.position.set(0, s * 1.1, -s * 0.5);
                group.add(tail);
                var legGeo = new THREE.BoxGeometry(s * 0.18, s * 0.8, s * 0.18);
                leftLeg = this.makeLimb(legGeo, darkMat, s * 0.4, -s * 0.25, s * 0.7, 0);
                rightLeg = this.makeLimb(legGeo, darkMat, s * 0.4, s * 0.25, s * 0.7, 0);
                // Toe claws on legs
                for (var sl = -1; sl <= 1; sl += 2) {
                    var limb = sl === -1 ? leftLeg : rightLeg;
                    for (var tc = -1; tc <= 1; tc++) {
                        var claw = new THREE.Mesh(new THREE.ConeGeometry(s*0.02, s*0.08, 3), clawMat);
                        claw.rotation.x = 0.4; claw.position.set(tc*s*0.05, -s*0.8, s*0.08);
                        limb.add(claw);
                    }
                }
                group.add(leftLeg);
                group.add(rightLeg);
                break;
            }
            case 'medium': {
                // Dilophosaurus - crested, frilled, venomous
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.0, s * 0.9, s * 1.8), mat);
                bodyMesh.position.y = s * 1.4;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                // Scale ridges along spine
                var ridgeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.8), roughness: 0.7 });
                for (var ri = 0; ri < 6; ri++) {
                    var ridge = new THREE.Mesh(new THREE.ConeGeometry(s * 0.05, s * 0.15, 3), ridgeMat);
                    ridge.position.set(0, s * 1.9, -s * 0.6 + ri * s * 0.3);
                    group.add(ridge);
                }
                var bellyStripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.3, s * 1.6), bellyMat);
                bellyStripe.position.set(0, s * 1.0, 0);
                group.add(bellyStripe);
                // Spotted pattern
                var spotMat2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.6), roughness: 0.9 });
                for (var sp = 0; sp < 6; sp++) {
                    var spot = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 4, 3), spotMat2);
                    spot.position.set((Math.random()-0.5)*s*0.7, s*1.4+Math.random()*s*0.4,
                        (Math.random()-0.5)*s*1.2);
                    group.add(spot);
                }
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.2, s * 0.35, s * 1.0, 6), mat);
                neck.position.set(0, s * 2.2, s * 0.6);
                neck.rotation.x = -0.3;
                group.add(neck);
                // Throat pouch (venom sac)
                var pouchMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, roughness: 0.6 });
                var pouch = new THREE.Mesh(new THREE.SphereGeometry(s * 0.15, 5, 4), pouchMat);
                pouch.scale.set(0.8, 1, 0.6);
                pouch.position.set(0, s * 1.9, s * 0.7);
                group.add(pouch);
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.5, s * 0.9), mat);
                head.position.set(0, s * 2.8, s * 0.9);
                group.add(head);
                jaw = new THREE.Group();
                var jawMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.45, s * 0.15, s * 0.7), darkMat);
                jawMesh.position.z = s * 0.05;
                jaw.add(jawMesh);
                // Jaw teeth
                var teethMat2 = new THREE.MeshStandardMaterial({ color: 0xffffee, roughness: 0.3 });
                for (var jt = -2; jt <= 2; jt++) {
                    var jtooth = new THREE.Mesh(new THREE.ConeGeometry(s*0.02, s*0.1, 3), teethMat2);
                    jtooth.position.set(jt*s*0.08, s*0.1, s*0.3);
                    jaw.add(jtooth);
                }
                jaw.position.set(0, s * 2.5, s * 1.0);
                group.add(jaw);
                // Upper teeth
                for (var ut = -2; ut <= 2; ut++) {
                    var utooth = new THREE.Mesh(new THREE.ConeGeometry(s*0.02, s*0.1, 3), teethMat2);
                    utooth.rotation.x = Math.PI;
                    utooth.position.set(ut*s*0.08, s*2.55, s*1.3);
                    group.add(utooth);
                }
                // Crests - more detailed
                var crestMat = new THREE.MeshStandardMaterial({ color: 0xff4422, roughness: 0.5 });
                var crestEdge = new THREE.MeshStandardMaterial({ color: 0xcc2211, roughness: 0.5 });
                for (var side = -1; side <= 1; side += 2) {
                    var crest = new THREE.Mesh(new THREE.ConeGeometry(s * 0.2, s * 0.65, 4), crestMat);
                    crest.position.set(side * s * 0.2, s * 3.2, s * 0.7);
                    crest.rotation.z = side * 0.3;
                    group.add(crest);
                    // Crest edge detail
                    var cEdge = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.4, 3), crestEdge);
                    cEdge.position.set(side * s * 0.25, s * 3.0, s * 0.8);
                    cEdge.rotation.z = side * 0.5;
                    group.add(cEdge);
                }
                // Frills with edge detail
                var frillMat = new THREE.MeshStandardMaterial({ color: 0xff6633, roughness: 0.5, side: THREE.DoubleSide });
                var frillEdgeMat = new THREE.MeshStandardMaterial({ color: 0xffaa22, roughness: 0.5 });
                for (var side = -1; side <= 1; side += 2) {
                    var frill = new THREE.Mesh(new THREE.CircleGeometry(s * 0.55, 10), frillMat);
                    frill.position.set(side * s * 0.4, s * 2.7, s * 0.7);
                    frill.rotation.y = side * 0.8;
                    group.add(frill);
                    // Frill edge bumps
                    for (var fe = 0; fe < 5; fe++) {
                        var bump = new THREE.Mesh(new THREE.SphereGeometry(s * 0.04, 3, 3), frillEdgeMat);
                        var angle = (fe / 5) * Math.PI - Math.PI * 0.5;
                        bump.position.set(side * s * 0.4 + side * Math.cos(angle) * s * 0.5,
                            s * 2.7 + Math.sin(angle) * s * 0.5, s * 0.7);
                        group.add(bump);
                    }
                }
                // Eyes with slit pupils
                for (var side = -1; side <= 1; side += 2) {
                    var eyeW = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 5, 4),
                        new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
                    eyeW.position.set(side * s * 0.22, s * 2.9, s * 1.25);
                    group.add(eyeW);
                    var pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.04, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x111111 }));
                    pupil.position.set(side * s * 0.24, s * 2.9, s * 1.3);
                    pupil.scale.set(0.4, 1, 0.5);
                    group.add(pupil);
                }
                // Nostrils
                for (var side = -1; side <= 1; side += 2) {
                    var nos = new THREE.Mesh(new THREE.SphereGeometry(s * 0.025, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x222222 }));
                    nos.position.set(side * s * 0.1, s * 2.75, s * 1.35);
                    group.add(nos);
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
                // Leg claws
                for (var sl = -1; sl <= 1; sl += 2) {
                    var limb = sl === -1 ? leftLeg : rightLeg;
                    for (var tc = -1; tc <= 1; tc++) {
                        var claw = new THREE.Mesh(new THREE.ConeGeometry(s*0.025, s*0.1, 3), clawMat);
                        claw.rotation.x = 0.4; claw.position.set(tc*s*0.07, -s*1.15, s*0.12);
                        limb.add(claw);
                    }
                }
                group.add(leftLeg);
                group.add(rightLeg);
                var armGeo = new THREE.BoxGeometry(s * 0.12, s * 0.5, s * 0.12);
                leftArm = this.makeLimb(armGeo, mat, s * 0.25, -s * 0.5, s * 1.8, s * 0.3);
                rightArm = this.makeLimb(armGeo, mat, s * 0.25, s * 0.5, s * 1.8, s * 0.3);
                // Arm claws
                for (var sa = -1; sa <= 1; sa += 2) {
                    var arm = sa === -1 ? leftArm : rightArm;
                    var aclaw = new THREE.Mesh(new THREE.ConeGeometry(s*0.02, s*0.08, 3), clawMat);
                    aclaw.rotation.x = 0.5; aclaw.position.set(0, -s*0.5, s*0.05);
                    arm.add(aclaw);
                }
                group.add(leftArm);
                group.add(rightArm);
                break;
            }
            case 'fast': {
                // Velociraptor - sleek, feathered, deadly claws
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.7, s * 0.6, s * 1.8), mat);
                bodyMesh.position.y = s * 1.3;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                // Back stripe
                var stripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.1, s * 1.6),
                    new THREE.MeshStandardMaterial({ color: 0x661111, roughness: 0.6 }));
                stripe.position.set(0, s * 1.65, 0);
                group.add(stripe);
                // Muscle definition bumps on sides
                var muscleMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.85), roughness: 0.75 });
                for (var side = -1; side <= 1; side += 2) {
                    var hip = new THREE.Mesh(new THREE.SphereGeometry(s * 0.18, 5, 4), muscleMat);
                    hip.position.set(side * s * 0.3, s * 1.2, -s * 0.3);
                    hip.scale.set(0.6, 0.8, 1.0);
                    group.add(hip);
                    var shoulder = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 4, 3), muscleMat);
                    shoulder.position.set(side * s * 0.3, s * 1.5, s * 0.5);
                    group.add(shoulder);
                }
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
                // Teeth along jaw line
                var teethMat3 = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
                for (var t = -2; t <= 2; t++) {
                    var tooth = new THREE.Mesh(new THREE.ConeGeometry(s*0.015, s*0.08, 3), teethMat3);
                    tooth.rotation.x = Math.PI;
                    tooth.position.set(t*s*0.07, s*2.05, s*1.4);
                    group.add(tooth);
                }
                // Nostrils
                for (var side = -1; side <= 1; side += 2) {
                    var nos = new THREE.Mesh(new THREE.SphereGeometry(s * 0.02, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x222222 }));
                    nos.position.set(side * s * 0.05, s * 2.2, s * 1.85);
                    group.add(nos);
                }
                // Eyes with slit pupils
                for (var side = -1; side <= 1; side += 2) {
                    var eyeW = new THREE.Mesh(new THREE.SphereGeometry(s * 0.07, 5, 4),
                        new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
                    eyeW.position.set(side * s * 0.17, s * 2.3, s * 1.35);
                    group.add(eyeW);
                    var pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.035, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x111111 }));
                    pupil.position.set(side * s * 0.19, s * 2.3, s * 1.38);
                    pupil.scale.set(0.3, 1.0, 0.5);
                    group.add(pupil);
                }
                // Feather tufts on head
                var featherMat = new THREE.MeshStandardMaterial({ color: 0x993322, roughness: 0.7, side: THREE.DoubleSide });
                for (var f = 0; f < 3; f++) {
                    var feather = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.06, s * 0.2), featherMat);
                    feather.position.set(0, s * 2.4, s * 1.0 - f * s * 0.12);
                    feather.rotation.x = -0.3;
                    group.add(feather);
                }
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 2.2, 5), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.9;
                tail.add(tailMesh);
                // Feather fan at tail end
                for (var tf = 0; tf < 3; tf++) {
                    var tFeather = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.08, s * 0.25), featherMat);
                    tFeather.position.set((tf-1)*s*0.06, 0, -s * 2.0);
                    tFeather.rotation.x = 0.2;
                    tail.add(tFeather);
                }
                tail.position.set(0, s * 1.3, -s * 0.7);
                group.add(tail);
                var thighGeo = new THREE.BoxGeometry(s * 0.2, s * 0.7, s * 0.25);
                leftLeg = this.makeLimb(thighGeo, darkMat, s * 0.35, -s * 0.3, s * 0.9, -s * 0.1);
                rightLeg = this.makeLimb(thighGeo, darkMat, s * 0.35, s * 0.3, s * 0.9, -s * 0.1);
                // Sickle claws - the iconic raptor weapon
                for (var sl = -1; sl <= 1; sl += 2) {
                    var limb = sl === -1 ? leftLeg : rightLeg;
                    var sickle = new THREE.Mesh(new THREE.ConeGeometry(s*0.03, s * 0.35, 3), clawMat);
                    sickle.rotation.x = 0.6;
                    sickle.position.set(0, -s * 0.68, s * 0.12);
                    limb.add(sickle);
                    // Regular toe claws
                    for (var tc = -1; tc <= 1; tc += 2) {
                        var tClaw = new THREE.Mesh(new THREE.ConeGeometry(s*0.015, s*0.1, 3), clawMat);
                        tClaw.rotation.x = 0.4; tClaw.position.set(tc*s*0.06, -s*0.7, s*0.08);
                        limb.add(tClaw);
                    }
                }
                group.add(leftLeg);
                group.add(rightLeg);
                var armGeo = new THREE.BoxGeometry(s * 0.1, s * 0.45, s * 0.1);
                leftArm = this.makeLimb(armGeo, mat, s * 0.22, -s * 0.35, s * 1.6, s * 0.5);
                rightArm = this.makeLimb(armGeo, mat, s * 0.22, s * 0.35, s * 1.6, s * 0.5);
                // Arm feathers and claws
                for (var sa = -1; sa <= 1; sa += 2) {
                    var arm = sa === -1 ? leftArm : rightArm;
                    // Feathers along forearm
                    for (var af = 0; af < 2; af++) {
                        var aFeather = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.08, s * 0.15), featherMat);
                        aFeather.position.set(sa * s * 0.03, -s * 0.15 - af * s * 0.12, 0);
                        arm.add(aFeather);
                    }
                    // Finger claws
                    for (var fc = 0; fc < 2; fc++) {
                        var fClaw = new THREE.Mesh(new THREE.ConeGeometry(s*0.015, s*0.1, 3), clawMat);
                        fClaw.rotation.x = 0.5; fClaw.position.set(fc*s*0.04-s*0.02, -s*0.45, s*0.04);
                        arm.add(fClaw);
                    }
                }
                group.add(leftArm);
                group.add(rightArm);
                break;
            }
            case 'tank': {
                // Triceratops - armored, massive, horned
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.8, s * 1.4, s * 2.4), mat);
                bodyMesh.position.y = s * 1.3;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                // Armor plates along back
                var plateMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.8), roughness: 0.6 });
                for (var pl = 0; pl < 5; pl++) {
                    var plate = new THREE.Mesh(new THREE.BoxGeometry(s * 1.4, s * 0.12, s * 0.3), plateMat);
                    plate.position.set(0, s * 2.05, -s * 0.8 + pl * s * 0.45);
                    group.add(plate);
                }
                // Skin wrinkle bumps on sides
                var wrinkleMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.9), roughness: 0.9 });
                for (var side = -1; side <= 1; side += 2) {
                    for (var wr = 0; wr < 4; wr++) {
                        var wrinkle = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 4, 3), wrinkleMat);
                        wrinkle.position.set(side * s * 0.85, s * 1.1 + Math.random()*s*0.3,
                            -s * 0.5 + wr * s * 0.4);
                        wrinkle.scale.set(0.4, 0.6, 0.8);
                        group.add(wrinkle);
                    }
                }
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
                // Frill with scalloped edge spikes
                var frillMat = new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.6, side: THREE.DoubleSide });
                var frill = new THREE.Mesh(new THREE.CircleGeometry(s * 1.2, 12), frillMat);
                frill.position.set(0, s * 2.2, s * 1.0);
                frill.rotation.x = -0.3;
                group.add(frill);
                // Frill border detail
                var frillBorder = new THREE.MeshStandardMaterial({ color: 0x776655, roughness: 0.7 });
                var frillRing = new THREE.Mesh(new THREE.RingGeometry(s * 1.0, s * 1.2, 12),
                    new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 0.7, side: THREE.DoubleSide }));
                frillRing.position.set(0, s * 2.22, s * 1.0);
                frillRing.rotation.x = -0.3;
                group.add(frillRing);
                // Frill edge spikes (pointed bumps)
                var spikeMat = new THREE.MeshStandardMaterial({ color: 0xccbb99, roughness: 0.4 });
                for (var fs = 0; fs < 8; fs++) {
                    var angle = (fs / 8) * Math.PI - Math.PI * 0.5;
                    var spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.06, s * 0.25, 4), spikeMat);
                    spike.position.set(Math.sin(angle) * s * 1.15, s * 2.2 + Math.cos(angle) * s * 1.1, s * 1.0);
                    spike.rotation.z = -angle;
                    group.add(spike);
                }
                // Horns
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
                // Eyes with small bead pupils
                for (var side = -1; side <= 1; side += 2) {
                    var eyeW = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 5, 4),
                        new THREE.MeshBasicMaterial({ color: 0x554433 }));
                    eyeW.position.set(side * s * 0.55, s * 1.7, s * 1.7);
                    group.add(eyeW);
                    var pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.05, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x111111 }));
                    pupil.position.set(side * s * 0.58, s * 1.7, s * 1.75);
                    group.add(pupil);
                }
                // Nostrils on beak
                for (var side = -1; side <= 1; side += 2) {
                    var nos = new THREE.Mesh(new THREE.SphereGeometry(s * 0.03, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x333322 }));
                    nos.position.set(side * s * 0.12, s * 1.5, s * 2.3);
                    group.add(nos);
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
                // Toenails on all legs
                var allLegs = [leftLeg, rightLeg, backLeftLeg, backRightLeg];
                for (var li = 0; li < allLegs.length; li++) {
                    for (var tn = -1; tn <= 1; tn++) {
                        var nail = new THREE.Mesh(new THREE.ConeGeometry(s*0.03, s*0.1, 3), clawMat);
                        nail.rotation.x = 0.4; nail.position.set(tn*s*0.1, -s*0.95, s*0.1);
                        allLegs[li].add(nail);
                    }
                }
                group.add(leftLeg); group.add(rightLeg);
                group.add(backLeftLeg); group.add(backRightLeg);
                leftArm = backLeftLeg;
                rightArm = backRightLeg;
                break;
            }
            case 'boss': {
                // T-Rex - massive, terrifying, king of dinosaurs
                bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.8, s * 1.8, s * 2.8), mat);
                bodyMesh.position.y = s * 2.0;
                bodyMesh.castShadow = true;
                group.add(bodyMesh);
                // Rib cage / muscle definition
                var ribMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.9), roughness: 0.8 });
                for (var side = -1; side <= 1; side += 2) {
                    for (var rb = 0; rb < 4; rb++) {
                        var rib = new THREE.Mesh(new THREE.BoxGeometry(s * 0.08, s * 0.6, s * 0.12), ribMat);
                        rib.position.set(side * s * 0.88, s * 1.6 + Math.sin(rb)*s*0.15, -s * 0.5 + rb * s * 0.5);
                        rib.rotation.z = side * 0.15;
                        group.add(rib);
                    }
                }
                var belly = new THREE.Mesh(new THREE.BoxGeometry(s * 1.4, s * 0.8, s * 2.2), bellyMat);
                belly.position.set(0, s * 1.2, 0);
                group.add(belly);
                // Skin texture bumps (scales)
                var scaleMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.75), roughness: 0.9 });
                for (var sc = 0; sc < 10; sc++) {
                    var scale = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 3, 3), scaleMat);
                    scale.position.set((Math.random()-0.5)*s*1.5, s*1.5+Math.random()*s*1.0,
                        (Math.random()-0.5)*s*2.2);
                    scale.scale.y = 0.4;
                    group.add(scale);
                }
                // Back ridges - larger and more prominent
                var ridgeMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.7 });
                for (var i = 0; i < 7; i++) {
                    var ridgeH = s * 0.25 + (i > 1 && i < 5 ? s * 0.15 : 0);
                    var ridge = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, ridgeH, 4), ridgeMat);
                    ridge.position.set(0, s * 2.95, -s * 1.0 + i * s * 0.4);
                    group.add(ridge);
                }
                // Thick muscular neck
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.5, s * 0.7, s * 1.0, 6), mat);
                neck.position.set(0, s * 3.0, s * 1.0);
                neck.rotation.x = -0.2;
                group.add(neck);
                // Neck muscles
                for (var side = -1; side <= 1; side += 2) {
                    var nMuscle = new THREE.Mesh(new THREE.SphereGeometry(s * 0.2, 4, 3), ribMat);
                    nMuscle.position.set(side * s * 0.4, s * 2.8, s * 0.8);
                    nMuscle.scale.set(0.6, 1.0, 0.8);
                    group.add(nMuscle);
                }
                var head = new THREE.Mesh(new THREE.BoxGeometry(s * 1.2, s * 0.9, s * 1.5), mat);
                head.position.set(0, s * 3.5, s * 1.5);
                group.add(head);
                // Brow ridge - more prominent
                var brow = new THREE.Mesh(new THREE.BoxGeometry(s * 1.3, s * 0.3, s * 0.8), ridgeMat);
                brow.position.set(0, s * 4.0, s * 1.5);
                group.add(brow);
                // Snout bump
                var snoutBump = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.15, s * 0.4), ridgeMat);
                snoutBump.position.set(0, s * 3.65, s * 2.1);
                group.add(snoutBump);
                // Nostrils
                for (var side = -1; side <= 1; side += 2) {
                    var nos = new THREE.Mesh(new THREE.SphereGeometry(s * 0.04, 4, 3),
                        new THREE.MeshBasicMaterial({ color: 0x221111 }));
                    nos.position.set(side * s * 0.2, s * 3.5, s * 2.25);
                    group.add(nos);
                }
                // Animated jaw
                jaw = new THREE.Group();
                var jawMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 1.0, s * 0.3, s * 1.3), darkMat);
                jawMesh.position.z = s * 0.1;
                jaw.add(jawMesh);
                // Tongue
                var tongueMat = new THREE.MeshStandardMaterial({ color: 0xcc4455, roughness: 0.8 });
                var tongue = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.05, s * 0.6), tongueMat);
                tongue.position.set(0, s * 0.15, s * 0.3);
                jaw.add(tongue);
                jaw.position.set(0, s * 3.1, s * 1.5);
                group.add(jaw);
                // Teeth - bigger, meaner
                var teethMat = new THREE.MeshStandardMaterial({ color: 0xffffee, roughness: 0.2 });
                for (var t = -3; t <= 3; t++) {
                    var tSize = Math.abs(t) < 2 ? s * 0.3 : s * 0.2;
                    var tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, tSize, 4), teethMat);
                    tooth.rotation.x = Math.PI;
                    tooth.position.set(t * s * 0.15, s * 3.55, s * 2.15);
                    group.add(tooth);
                    var btSize = Math.abs(t) < 2 ? s * 0.22 : s * 0.15;
                    var btooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, btSize, 4), teethMat);
                    btooth.position.set(t * s * 0.14, s * 0.17, s * 0.6);
                    jaw.add(btooth);
                }
                // Eyes - glowing red with slit pupils
                for (var side = -1; side <= 1; side += 2) {
                    var eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(s * 0.14, 5, 4),
                        new THREE.MeshBasicMaterial({ color: 0x111111 }));
                    eyeSocket.position.set(side * s * 0.5, s * 3.7, s * 2.0);
                    group.add(eyeSocket);
                    var eyeIris = new THREE.Mesh(new THREE.SphereGeometry(s * 0.11, 5, 4),
                        new THREE.MeshBasicMaterial({ color: 0xff2200 }));
                    eyeIris.position.set(side * s * 0.52, s * 3.7, s * 2.04);
                    group.add(eyeIris);
                    var pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 3, 3),
                        new THREE.MeshBasicMaterial({ color: 0x000000 }));
                    pupil.position.set(side * s * 0.54, s * 3.7, s * 2.08);
                    pupil.scale.set(0.3, 1.0, 0.5);
                    group.add(pupil);
                }
                // Scars on face (battle damage)
                var scarMat = new THREE.MeshStandardMaterial({ color: 0x553333, roughness: 1 });
                var scar1 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.04, s * 0.3, s * 0.02), scarMat);
                scar1.position.set(s * 0.4, s * 3.6, s * 2.1); scar1.rotation.z = 0.3;
                group.add(scar1);
                var scar2 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.04, s * 0.25, s * 0.02), scarMat);
                scar2.position.set(s * 0.5, s * 3.5, s * 2.1); scar2.rotation.z = 0.2;
                group.add(scar2);
                // Massive tail
                tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.5, s * 3.5, 6), darkMat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 1.5;
                tail.add(tailMesh);
                // Tail ridges
                for (var tr = 0; tr < 4; tr++) {
                    var tRidge = new THREE.Mesh(new THREE.ConeGeometry(s * 0.06, s * 0.15, 3), ridgeMat);
                    tRidge.position.set(0, s * 0.45 - tr * 0.05, -s * 0.3 - tr * s * 0.6);
                    tail.add(tRidge);
                }
                tail.position.set(0, s * 1.8, -s * 1.2);
                group.add(tail);
                // Massive pillar legs
                var legGeo = new THREE.BoxGeometry(s * 0.5, s * 1.6, s * 0.55);
                leftLeg = this.makeLimb(legGeo, darkMat, s * 0.8, -s * 0.7, s * 1.2, -s * 0.3);
                rightLeg = this.makeLimb(legGeo, darkMat, s * 0.8, s * 0.7, s * 1.2, -s * 0.3);
                // Feet with toe claws
                for (var sl = -1; sl <= 1; sl += 2) {
                    var limb = sl === -1 ? leftLeg : rightLeg;
                    // Foot pad
                    var foot = new THREE.Mesh(new THREE.BoxGeometry(s * 0.55, s * 0.12, s * 0.65), darkMat);
                    foot.position.set(0, -s * 1.55, s * 0.1);
                    limb.add(foot);
                    // Three massive claws
                    for (var tc = -1; tc <= 1; tc++) {
                        var tClaw = new THREE.Mesh(new THREE.ConeGeometry(s*0.04, s*0.2, 4), clawMat);
                        tClaw.rotation.x = 0.5; tClaw.position.set(tc*s*0.15, -s*1.6, s*0.35);
                        limb.add(tClaw);
                    }
                }
                group.add(leftLeg); group.add(rightLeg);
                // Tiny arms with 2-finger claws
                var armGeo = new THREE.BoxGeometry(s * 0.12, s * 0.4, s * 0.1);
                leftArm = this.makeLimb(armGeo, mat, s * 0.2, -s * 0.9, s * 2.6, s * 0.8);
                rightArm = this.makeLimb(armGeo, mat, s * 0.2, s * 0.9, s * 2.6, s * 0.8);
                for (var sa = -1; sa <= 1; sa += 2) {
                    var arm = sa === -1 ? leftArm : rightArm;
                    for (var fc = 0; fc < 2; fc++) {
                        var fClaw = new THREE.Mesh(new THREE.ConeGeometry(s*0.015, s*0.08, 3), clawMat);
                        fClaw.rotation.x = 0.5; fClaw.position.set(fc*s*0.04-s*0.02, -s*0.38, s*0.04);
                        arm.add(fClaw);
                    }
                }
                group.add(leftArm); group.add(rightArm);
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
