window.DE = window.DE || {};

DE.DinoManager = {
    dinos: [],

    makeLeg: function(s, color, upperH, lowerH, thick) {
        var leg = new THREE.Group();
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var upper = new THREE.Mesh(new THREE.BoxGeometry(thick, upperH, thick), mat);
        upper.position.y = -upperH / 2;
        leg.add(upper);
        var lower = new THREE.Mesh(new THREE.BoxGeometry(thick * 0.8, lowerH, thick * 0.8), mat);
        lower.position.y = -upperH - lowerH / 2;
        leg.add(lower);
        var foot = new THREE.Mesh(new THREE.BoxGeometry(thick * 1.4, 0.06, thick * 1.8),
            new THREE.MeshLambertMaterial({ color: 0x444444 }));
        foot.position.set(0, -upperH - lowerH, thick * 0.3);
        leg.add(foot);
        return leg;
    },

    makeArm: function(s, color, len, thick) {
        var arm = new THREE.Group();
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, len, thick), mat);
        mesh.position.y = -len / 2;
        arm.add(mesh);
        // Hand/claw
        var claw = new THREE.Mesh(new THREE.ConeGeometry(thick * 0.6, thick * 1.5, 3),
            new THREE.MeshLambertMaterial({ color: 0xddddcc }));
        claw.position.y = -len;
        arm.add(claw);
        return arm;
    },

    spawnDino: function(typeName, scene) {
        var typeData = DE.DINO_TYPES[typeName];
        if (!typeData) return null;
        var waypoints = DE.Map.getPathWaypoints();
        var startPos = waypoints[0];
        var result = this.createDinoMesh(typeName, typeData);
        var mesh = result.group;
        mesh.position.set(startPos.x, 0.3, startPos.z);
        scene.add(mesh);

        // Health bar
        var hpBarGroup = new THREE.Group();
        var hpBg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x333333 }));
        hpBarGroup.add(hpBg);
        var hpFill = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.06),
            new THREE.MeshBasicMaterial({ color: 0x44ff44 }));
        hpFill.position.z = 0.01;
        hpBarGroup.add(hpFill);
        hpBarGroup.position.y = result.hpBarY;
        hpBarGroup.rotation.x = -Math.PI / 4;
        mesh.add(hpBarGroup);

        var dino = {
            type: typeData, typeName: typeName,
            hp: typeData.hp, maxHp: typeData.hp,
            speed: typeData.speed, currentSpeed: typeData.speed,
            waypointIndex: 0, x: startPos.x, z: startPos.z,
            mesh: mesh, hpFill: hpFill, bodyMesh: result.bodyMesh,
            alive: true, stunTimer: 0, dotTimer: 0, dotDamage: 0, dotTickTimer: 0,
            bobPhase: Math.random() * Math.PI * 2,
            leftLeg: result.leftLeg, rightLeg: result.rightLeg,
            leftArm: result.leftArm, rightArm: result.rightArm,
            tail: result.tail, head: result.head, jaw: result.jaw,
            // Quadruped legs
            frontLeftLeg: result.frontLeftLeg, frontRightLeg: result.frontRightLeg,
            backLeftLeg: result.backLeftLeg, backRightLeg: result.backRightLeg,
            isQuadruped: typeData.bodyType === 'tank',
            legAmplitude: result.legAmplitude || 0.4
        };
        this.dinos.push(dino);
        return dino;
    },

    createDinoMesh: function(typeName, typeData) {
        var group = new THREE.Group();
        var s = typeData.scale;
        var mat = new THREE.MeshLambertMaterial({ color: typeData.color });
        var darkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.7) });
        var bellyMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(typeData.color).lerp(new THREE.Color(0xffffff), 0.3) });
        var refs = { group: group, bodyMesh: null, leftLeg: null, rightLeg: null,
            leftArm: null, rightArm: null, tail: null, head: null, jaw: null,
            frontLeftLeg: null, frontRightLeg: null, backLeftLeg: null, backRightLeg: null,
            hpBarY: s * 3, legAmplitude: 0.4 };

        switch (typeData.bodyType) {
            case 'small': // Compy - tiny bipedal
                var body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.7, 8, 6), mat);
                body.scale.set(0.8, 0.7, 1.2);
                body.position.y = s * 1.2;
                body.castShadow = true;
                group.add(body);
                refs.bodyMesh = body;
                // Stripe on back
                var stripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, 0.04, s * 1.2), darkMat);
                stripe.position.set(0, s * 1.55, 0);
                group.add(stripe);
                // Neck
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.15, s * 0.2, s * 0.5, 6), mat);
                neck.position.set(0, s * 1.7, s * 0.5);
                neck.rotation.x = -0.3;
                group.add(neck);
                // Head
                var head = new THREE.Group();
                var skull = new THREE.Mesh(new THREE.SphereGeometry(s * 0.35, 6, 6), mat);
                skull.scale.set(0.8, 0.8, 1.1);
                head.add(skull);
                // Eyes
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.07, 4, 4), eyeMat);
                    eye.position.set(side * s * 0.2, s * 0.1, s * 0.25);
                    head.add(eye);
                }
                // Snout
                var snout = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.15, s * 0.3), mat);
                snout.position.set(0, -s * 0.1, s * 0.3);
                head.add(snout);
                head.position.set(0, s * 2.0, s * 0.8);
                group.add(head);
                refs.head = head;
                // Tail
                var tail = new THREE.Group();
                var tailMesh = new THREE.Mesh(new THREE.ConeGeometry(s * 0.18, s * 1.4, 4), mat);
                tailMesh.rotation.x = Math.PI / 2;
                tailMesh.position.z = -s * 0.5;
                tail.add(tailMesh);
                tail.position.set(0, s * 1.1, -s * 0.5);
                group.add(tail);
                refs.tail = tail;
                // Legs
                var ll = this.makeLeg(s, typeData.color, s * 0.5, s * 0.4, s * 0.15);
                ll.position.set(-s * 0.25, s * 0.9, 0);
                group.add(ll);
                refs.leftLeg = ll;
                var rl = this.makeLeg(s, typeData.color, s * 0.5, s * 0.4, s * 0.15);
                rl.position.set(s * 0.25, s * 0.9, 0);
                group.add(rl);
                refs.rightLeg = rl;
                refs.hpBarY = s * 2.8;
                refs.legAmplitude = 0.5;
                break;

            case 'medium': // Dilophosaurus
                var body = new THREE.Mesh(new THREE.BoxGeometry(s * 1.0, s * 0.9, s * 2.0), mat);
                body.position.y = s * 1.5;
                body.castShadow = true;
                group.add(body);
                refs.bodyMesh = body;
                // Belly
                var belly = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.3, s * 1.5), bellyMat);
                belly.position.set(0, s * 1.0, 0);
                group.add(belly);
                // Neck
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.2, s * 0.3, s * 0.8, 6), mat);
                neck.position.set(0, s * 2.2, s * 0.7);
                neck.rotation.x = -0.4;
                group.add(neck);
                // Head
                var head = new THREE.Group();
                var skull = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.4, s * 0.7), mat);
                head.add(skull);
                // Double crests (iconic!)
                var crestMat = new THREE.MeshLambertMaterial({ color: 0xff4422 });
                for (var side = -1; side <= 1; side += 2) {
                    var crest = new THREE.Mesh(new THREE.BoxGeometry(0.04, s * 0.5, s * 0.6), crestMat);
                    crest.position.set(side * s * 0.15, s * 0.4, 0);
                    head.add(crest);
                }
                // Eyes
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 4, 4),
                        new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
                    eye.position.set(side * s * 0.25, 0, s * 0.25);
                    head.add(eye);
                }
                // Frill (retracted, hints at it)
                var frillMat = new THREE.MeshLambertMaterial({ color: 0xff6633, side: THREE.DoubleSide });
                for (var side = -1; side <= 1; side += 2) {
                    var frill = new THREE.Mesh(new THREE.CircleGeometry(s * 0.4, 8), frillMat);
                    frill.position.set(side * s * 0.35, -s * 0.1, -s * 0.1);
                    frill.rotation.y = side * 0.5;
                    head.add(frill);
                }
                head.position.set(0, s * 2.8, s * 1.2);
                group.add(head);
                refs.head = head;
                // Tail
                var tail = new THREE.Group();
                var t1 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.3, s * 1.0), mat);
                t1.position.z = -s * 0.3;
                tail.add(t1);
                var t2 = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.8, 4), mat);
                t2.rotation.x = Math.PI / 2;
                t2.position.z = -s * 1.1;
                tail.add(t2);
                tail.position.set(0, s * 1.5, -s * 0.9);
                group.add(tail);
                refs.tail = tail;
                // Legs
                var ll = this.makeLeg(s, typeData.color, s * 0.7, s * 0.5, s * 0.22);
                ll.position.set(-s * 0.35, s * 1.1, -s * 0.3);
                group.add(ll); refs.leftLeg = ll;
                var rl = this.makeLeg(s, typeData.color, s * 0.7, s * 0.5, s * 0.22);
                rl.position.set(s * 0.35, s * 1.1, -s * 0.3);
                group.add(rl); refs.rightLeg = rl;
                // Arms
                var la = this.makeArm(s, typeData.color, s * 0.4, s * 0.1);
                la.position.set(-s * 0.5, s * 1.8, s * 0.5);
                group.add(la); refs.leftArm = la;
                var ra = this.makeArm(s, typeData.color, s * 0.4, s * 0.1);
                ra.position.set(s * 0.5, s * 1.8, s * 0.5);
                group.add(ra); refs.rightArm = ra;
                refs.hpBarY = s * 3.6;
                refs.legAmplitude = 0.35;
                break;

            case 'fast': // Velociraptor
                var body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.7, s * 0.6, s * 2.0), mat);
                body.position.y = s * 1.3;
                body.castShadow = true;
                group.add(body);
                refs.bodyMesh = body;
                // Feather ridge along back
                var featherMat = new THREE.MeshLambertMaterial({ color: 0xaa2200 });
                for (var f = 0; f < 5; f++) {
                    var feather = new THREE.Mesh(new THREE.BoxGeometry(0.03, s * 0.2, s * 0.15), featherMat);
                    feather.position.set(0, s * 1.75, s * 0.6 - f * s * 0.3);
                    feather.rotation.z = 0.2;
                    group.add(feather);
                }
                // Neck
                var neck = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.12, s * 0.18, s * 0.6, 6), mat);
                neck.position.set(0, s * 1.8, s * 0.8);
                neck.rotation.x = -0.5;
                group.add(neck);
                // Head - pointed snout
                var head = new THREE.Group();
                var skull = new THREE.Mesh(new THREE.BoxGeometry(s * 0.35, s * 0.25, s * 0.6), mat);
                head.add(skull);
                var snout = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.4, 4), mat);
                snout.rotation.x = -Math.PI / 2;
                snout.position.set(0, 0, s * 0.4);
                head.add(snout);
                // Eyes
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.06, 4, 4),
                        new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
                    eye.position.set(side * s * 0.17, s * 0.05, s * 0.2);
                    head.add(eye);
                }
                head.position.set(0, s * 2.2, s * 1.2);
                group.add(head);
                refs.head = head;
                // Tail - long and stiff
                var tail = new THREE.Group();
                var t1 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.15, s * 0.15, s * 1.5), mat);
                t1.position.z = -s * 0.5;
                tail.add(t1);
                tail.position.set(0, s * 1.3, -s * 0.8);
                group.add(tail);
                refs.tail = tail;
                // Legs with sickle claws
                var clawMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
                for (var side = -1; side <= 1; side += 2) {
                    var leg = this.makeLeg(s, typeData.color, s * 0.5, s * 0.45, s * 0.14);
                    // Add sickle claw
                    var sickle = new THREE.Mesh(new THREE.ConeGeometry(0.04, s * 0.3, 3), clawMat);
                    sickle.rotation.x = -0.4;
                    sickle.position.set(0, -s * 0.95, s * 0.2);
                    leg.add(sickle);
                    leg.position.set(side * s * 0.25, s * 1.0, -s * 0.2);
                    group.add(leg);
                    if (side === -1) refs.leftLeg = leg; else refs.rightLeg = leg;
                }
                // Small grasping arms
                var la = this.makeArm(s, typeData.color, s * 0.3, s * 0.06);
                la.position.set(-s * 0.35, s * 1.5, s * 0.5);
                group.add(la); refs.leftArm = la;
                var ra = this.makeArm(s, typeData.color, s * 0.3, s * 0.06);
                ra.position.set(s * 0.35, s * 1.5, s * 0.5);
                group.add(ra); refs.rightArm = ra;
                refs.hpBarY = s * 3.0;
                refs.legAmplitude = 0.6;
                break;

            case 'tank': // Triceratops - quadruped
                var body = new THREE.Mesh(new THREE.BoxGeometry(s * 2.0, s * 1.4, s * 2.8), mat);
                body.position.y = s * 1.5;
                body.castShadow = true;
                group.add(body);
                refs.bodyMesh = body;
                // Belly
                var belly = new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * 0.4, s * 2.2), bellyMat);
                belly.position.set(0, s * 0.7, 0);
                group.add(belly);
                // Head shield (frill)
                var shieldMat = new THREE.MeshLambertMaterial({ color: 0x7777aa, side: THREE.DoubleSide });
                var shield = new THREE.Mesh(new THREE.CircleGeometry(s * 1.2, 10), shieldMat);
                shield.position.set(0, s * 2.3, s * 1.3);
                shield.rotation.x = 0.2;
                group.add(shield);
                // Shield edge bumps
                var bumpMat = new THREE.MeshLambertMaterial({ color: 0x9999bb });
                for (var i = 0; i < 8; i++) {
                    var ang = (i / 8) * Math.PI + 0.2;
                    var bump = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 4, 4), bumpMat);
                    bump.position.set(Math.cos(ang) * s * 1.15, s * 2.3 + Math.sin(ang) * s * 1.15, s * 1.25);
                    group.add(bump);
                }
                // Head
                var head = new THREE.Group();
                var skull = new THREE.Mesh(new THREE.BoxGeometry(s * 0.9, s * 0.7, s * 1.0), mat);
                head.add(skull);
                // Beak
                var beak = new THREE.Mesh(new THREE.ConeGeometry(s * 0.2, s * 0.4, 4),
                    new THREE.MeshLambertMaterial({ color: 0xaaaa88 }));
                beak.rotation.x = -Math.PI / 2;
                beak.position.set(0, -s * 0.1, s * 0.6);
                head.add(beak);
                // Three horns
                var hornMat = new THREE.MeshLambertMaterial({ color: 0xeeeecc });
                // Nose horn (short)
                var noseHorn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.4, 5), hornMat);
                noseHorn.rotation.x = -0.5;
                noseHorn.position.set(0, s * 0.15, s * 0.5);
                head.add(noseHorn);
                // Brow horns (long)
                for (var side = -1; side <= 1; side += 2) {
                    var horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.07, s * 1.0, 5), hornMat);
                    horn.rotation.x = -0.6;
                    horn.position.set(side * s * 0.35, s * 0.3, s * 0.3);
                    head.add(horn);
                }
                // Eyes
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 4, 4),
                        new THREE.MeshBasicMaterial({ color: 0x222222 }));
                    eye.position.set(side * s * 0.4, s * 0.1, s * 0.3);
                    head.add(eye);
                }
                head.position.set(0, s * 1.8, s * 1.5);
                group.add(head);
                refs.head = head;
                // Tail
                var tail = new THREE.Group();
                var t1 = new THREE.Mesh(new THREE.ConeGeometry(s * 0.3, s * 1.5, 5), mat);
                t1.rotation.x = Math.PI / 2;
                t1.position.z = -s * 0.5;
                tail.add(t1);
                tail.position.set(0, s * 1.4, -s * 1.3);
                group.add(tail);
                refs.tail = tail;
                // Four legs
                var legH = s * 0.6;
                var legLH = s * 0.5;
                var legT = s * 0.25;
                var fl = this.makeLeg(s, typeData.color, legH, legLH, legT);
                fl.position.set(-s * 0.7, s * 1.0, s * 0.8);
                group.add(fl); refs.frontLeftLeg = fl;
                var fr = this.makeLeg(s, typeData.color, legH, legLH, legT);
                fr.position.set(s * 0.7, s * 1.0, s * 0.8);
                group.add(fr); refs.frontRightLeg = fr;
                var bl = this.makeLeg(s, typeData.color, legH, legLH, legT);
                bl.position.set(-s * 0.7, s * 1.0, -s * 0.8);
                group.add(bl); refs.backLeftLeg = bl;
                var br = this.makeLeg(s, typeData.color, legH, legLH, legT);
                br.position.set(s * 0.7, s * 1.0, -s * 0.8);
                group.add(br); refs.backRightLeg = br;
                refs.hpBarY = s * 3.8;
                refs.legAmplitude = 0.25;
                break;

            case 'boss': // T-Rex - BIG and scary
                var body = new THREE.Mesh(new THREE.BoxGeometry(s * 1.8, s * 1.8, s * 3.0), mat);
                body.position.y = s * 2.2;
                body.castShadow = true;
                group.add(body);
                refs.bodyMesh = body;
                // Belly
                var belly = new THREE.Mesh(new THREE.BoxGeometry(s * 1.4, s * 0.6, s * 2.0), bellyMat);
                belly.position.set(0, s * 1.2, 0);
                group.add(belly);
                // Spine ridges
                for (var r = 0; r < 6; r++) {
                    var ridge = new THREE.Mesh(new THREE.BoxGeometry(s * 0.1, s * 0.2, s * 0.3), darkMat);
                    ridge.position.set(0, s * 3.2, s * 1.0 - r * s * 0.4);
                    group.add(ridge);
                }
                // Neck
                var neck = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.8, s * 0.8), mat);
                neck.position.set(0, s * 3.2, s * 1.3);
                group.add(neck);
                // Head
                var head = new THREE.Group();
                var skull = new THREE.Mesh(new THREE.BoxGeometry(s * 1.1, s * 0.9, s * 1.5), mat);
                head.add(skull);
                // Snout ridges
                var ridgeMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(typeData.color).multiplyScalar(0.8) });
                var ridge1 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.15, s * 1.0), ridgeMat);
                ridge1.position.set(0, s * 0.5, 0);
                head.add(ridge1);
                // Jaw (animated)
                var jaw = new THREE.Group();
                var jawMesh = new THREE.Mesh(new THREE.BoxGeometry(s * 0.9, s * 0.25, s * 1.2),
                    new THREE.MeshLambertMaterial({ color: 0x553322 }));
                jaw.add(jawMesh);
                // Teeth
                var teethMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
                for (var t = -3; t <= 3; t++) {
                    var tooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 3), teethMat);
                    tooth.rotation.x = Math.PI;
                    tooth.position.set(t * s * 0.13, s * 0.15, s * 0.5);
                    jaw.add(tooth);
                    // Top teeth
                    var topTooth = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 3), teethMat);
                    topTooth.position.set(t * s * 0.13, s * 0.35, s * 0.5);
                    head.add(topTooth);
                }
                jaw.position.set(0, -s * 0.35, 0);
                head.add(jaw);
                refs.jaw = jaw;
                // Eyes - red and glowing
                var eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                for (var side = -1; side <= 1; side += 2) {
                    var eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 6, 6), eyeMat);
                    eye.position.set(side * s * 0.45, s * 0.25, s * 0.5);
                    head.add(eye);
                    // Brow ridge
                    var brow = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.1, s * 0.3), darkMat);
                    brow.position.set(side * s * 0.4, s * 0.4, s * 0.4);
                    head.add(brow);
                }
                // Nostrils
                for (var side = -1; side <= 1; side += 2) {
                    var nostril = new THREE.Mesh(new THREE.SphereGeometry(s * 0.05, 4, 4),
                        new THREE.MeshBasicMaterial({ color: 0x222222 }));
                    nostril.position.set(side * s * 0.15, 0, s * 0.7);
                    head.add(nostril);
                }
                head.position.set(0, s * 3.5, s * 2.0);
                group.add(head);
                refs.head = head;
                // Tail - thick and powerful
                var tail = new THREE.Group();
                var t1 = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.7, s * 1.5), mat);
                t1.position.z = -s * 0.5;
                tail.add(t1);
                var t2 = new THREE.Mesh(new THREE.ConeGeometry(s * 0.25, s * 1.5, 5), mat);
                t2.rotation.x = Math.PI / 2;
                t2.position.z = -s * 1.8;
                tail.add(t2);
                tail.position.set(0, s * 2.0, -s * 1.3);
                group.add(tail);
                refs.tail = tail;
                // Massive legs
                var ll = this.makeLeg(s, typeData.color, s * 1.0, s * 0.8, s * 0.35);
                ll.position.set(-s * 0.6, s * 1.5, -s * 0.3);
                group.add(ll); refs.leftLeg = ll;
                var rl = this.makeLeg(s, typeData.color, s * 1.0, s * 0.8, s * 0.35);
                rl.position.set(s * 0.6, s * 1.5, -s * 0.3);
                group.add(rl); refs.rightLeg = rl;
                // Tiny arms (iconic!)
                var la = this.makeArm(s, typeData.color, s * 0.35, s * 0.1);
                la.position.set(-s * 0.9, s * 2.8, s * 0.8);
                group.add(la); refs.leftArm = la;
                var ra = this.makeArm(s, typeData.color, s * 0.35, s * 0.1);
                ra.position.set(s * 0.9, s * 2.8, s * 0.8);
                group.add(ra); refs.rightArm = ra;
                refs.hpBarY = s * 4.5;
                refs.legAmplitude = 0.3;
                break;
        }
        group.castShadow = true;
        return refs;
    },

    update: function(dt, waypoints, gameState, scene) {
        for (var i = this.dinos.length - 1; i >= 0; i--) {
            var dino = this.dinos[i];
            if (!dino.alive) continue;

            // Process stun
            if (dino.stunTimer > 0) {
                dino.stunTimer -= dt;
                dino.currentSpeed = 0;
                if (dino.bodyMesh && dino.bodyMesh.material) {
                    var flash = Math.sin(Date.now() * 0.02) > 0;
                    dino.bodyMesh.material.emissive = flash ?
                        new THREE.Color(0xffff00) : new THREE.Color(0x000000);
                }
            } else {
                dino.currentSpeed = dino.speed;
                if (dino.bodyMesh && dino.bodyMesh.material) {
                    dino.bodyMesh.material.emissive = new THREE.Color(0x000000);
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
                if (dino.bodyMesh && dino.bodyMesh.material) {
                    dino.bodyMesh.material.emissive = new THREE.Color(0x004400);
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
                        this.escapeDino(dino, gameState, scene);
                        continue;
                    }
                } else {
                    var moveSpeed = dino.currentSpeed * dt;
                    dino.x += (dx / dist) * moveSpeed;
                    dino.z += (dz / dist) * moveSpeed;
                    var angle = Math.atan2(dx, dz);
                    dino.mesh.rotation.y = angle;
                }
            }

            // Animation
            dino.bobPhase += dt * dino.currentSpeed * 4;
            var moving = dino.currentSpeed > 0;
            var amp = moving ? dino.legAmplitude : 0;
            var phase = dino.bobPhase;

            // Leg animation
            if (dino.isQuadruped) {
                if (dino.frontLeftLeg) dino.frontLeftLeg.rotation.x = Math.sin(phase) * amp;
                if (dino.backRightLeg) dino.backRightLeg.rotation.x = Math.sin(phase) * amp;
                if (dino.frontRightLeg) dino.frontRightLeg.rotation.x = Math.sin(phase + Math.PI) * amp;
                if (dino.backLeftLeg) dino.backLeftLeg.rotation.x = Math.sin(phase + Math.PI) * amp;
            } else {
                if (dino.leftLeg) dino.leftLeg.rotation.x = Math.sin(phase) * amp;
                if (dino.rightLeg) dino.rightLeg.rotation.x = Math.sin(phase + Math.PI) * amp;
                if (dino.leftArm) dino.leftArm.rotation.x = Math.sin(phase + Math.PI) * amp * 0.4;
                if (dino.rightArm) dino.rightArm.rotation.x = Math.sin(phase) * amp * 0.4;
            }

            // Tail sway
            if (dino.tail) {
                dino.tail.rotation.y = Math.sin(phase * 0.6) * 0.2 * (moving ? 1 : 0.3);
            }

            // Head bob
            if (dino.head) {
                dino.head.rotation.x = Math.sin(phase * 2) * 0.05 * (moving ? 1 : 0);
            }

            // T-Rex jaw snap
            if (dino.jaw && moving) {
                dino.jaw.rotation.x = Math.max(0, Math.sin(phase * 0.8)) * 0.15;
            }

            // Body bob
            dino.mesh.position.x = dino.x;
            dino.mesh.position.z = dino.z;
            dino.mesh.position.y = 0.1 + Math.abs(Math.sin(phase)) * 0.1 * (moving ? 1 : 0);

            // Health bar
            var hpRatio = dino.hp / dino.maxHp;
            dino.hpFill.scale.x = Math.max(0.01, hpRatio);
            dino.hpFill.position.x = -(1.15 * (1 - hpRatio)) / 2;
            if (hpRatio > 0.5) dino.hpFill.material.color.setHex(0x44ff44);
            else if (hpRatio > 0.25) dino.hpFill.material.color.setHex(0xffaa00);
            else dino.hpFill.material.color.setHex(0xff3333);
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
        for (var i = 0; i < 8; i++) {
            var particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 4, 4),
                new THREE.MeshBasicMaterial({ color: i < 4 ? 0xffff00 : 0xff8800, transparent: true, opacity: 0.8 }));
            particle.position.set(
                dino.x + (Math.random() - 0.5) * 1.5,
                0.5 + Math.random() * 1.5,
                dino.z + (Math.random() - 0.5) * 1.5);
            scene.add(particle);
            (function(p) { setTimeout(function() { scene.remove(p); }, 400); })(particle);
        }
    },

    escapeDino: function(dino, gameState, scene) {
        dino.alive = false;
        gameState.lives--;
        DE.HUD.updateLives(gameState.lives, DE.CONFIG.MAX_LIVES);
        DE.Audio.playSound('escape');
        var flash = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 }));
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
