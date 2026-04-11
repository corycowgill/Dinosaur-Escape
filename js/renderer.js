window.DE = window.DE || {};

DE.Renderer = {
    scene: null, camera: null, renderer: null, clock: null, groundPlane: null,
    zoomLevel: 1.0, minZoom: 0.4, maxZoom: 2.5, baseViewSize: 0,

    init: function(canvas) {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();

        // Gradient sky using vertex colors on a large sphere
        var skyGeo = new THREE.SphereGeometry(90, 16, 12);
        var skyColors = [];
        var posAttr = skyGeo.attributes.position;
        for (var i = 0; i < posAttr.count; i++) {
            var y = posAttr.getY(i);
            var t = (y / 90 + 1) * 0.5; // 0 at bottom, 1 at top
            // Blend from horizon haze to deep blue sky
            var r = 0.55 + (1 - t) * 0.35; // warm at horizon
            var g = 0.72 + (1 - t) * 0.15;
            var b = 0.88 + t * 0.12;
            if (t < 0.3) { r = 0.62; g = 0.78; b = 0.72; } // ground-level haze
            skyColors.push(r, g, b);
        }
        skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
        var skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
        var skyMesh = new THREE.Mesh(skyGeo, skyMat);
        skyMesh.position.y = -10;
        this.scene.add(skyMesh);
        this.scene.background = null; // Use sky sphere

        // Volumetric clouds
        var cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
        for (var ci = 0; ci < 12; ci++) {
            var cloud = new THREE.Group();
            var puffs = 3 + Math.floor(Math.random() * 4);
            for (var p = 0; p < puffs; p++) {
                var puff = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5 + Math.random() * 2.5, 6, 5), cloudMat);
                puff.scale.y = 0.35 + Math.random() * 0.2;
                puff.position.set((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 3);
                cloud.add(puff);
            }
            cloud.position.set(
                (Math.random() - 0.5) * 120,
                30 + Math.random() * 15,
                (Math.random() - 0.5) * 80
            );
            this.scene.add(cloud);
        }

        var aspect = window.innerWidth / window.innerHeight;
        var gridW = DE.CONFIG.GRID_COLS * DE.CONFIG.CELL_SIZE;
        var gridH = DE.CONFIG.GRID_ROWS * DE.CONFIG.CELL_SIZE;
        this.baseViewSize = Math.max(gridW, gridH) * 0.55;

        this.camera = new THREE.OrthographicCamera(
            -this.baseViewSize * aspect, this.baseViewSize * aspect,
            this.baseViewSize, -this.baseViewSize, 0.1, 200);

        // 2.5D camera - ~45 degrees from horizontal for isometric-style view
        var centerX = gridW / 2 - DE.CONFIG.CELL_SIZE;
        var centerZ = gridH / 2 - DE.CONFIG.CELL_SIZE;
        var camDist = DE.CONFIG.CAMERA_HEIGHT;
        var camAngle = Math.PI * 0.25;
        this.camera.position.set(centerX, camDist * Math.sin(camAngle), centerZ + camDist * Math.cos(camAngle));
        this.camera.lookAt(centerX, 0, centerZ);

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Atmospheric fog - layered depth
        this.scene.fog = new THREE.FogExp2(0x9ac8e8, 0.008);

        // Ambient fill - slightly warm
        this.scene.add(new THREE.AmbientLight(0xffeedd, 0.35));

        // Main sun light - warm golden hour tone
        var sun = new THREE.DirectionalLight(0xfff0c8, 1.1);
        sun.position.set(20, 35, 15); sun.castShadow = true;
        sun.shadow.mapSize.width = 4096; sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 100;
        sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
        sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
        sun.shadow.bias = -0.0005;
        sun.shadow.normalBias = 0.02;
        this.scene.add(sun);

        // Hemisphere light - blue sky above, warm green ground bounce
        this.scene.add(new THREE.HemisphereLight(0x88bbff, 0x446622, 0.4));

        // Secondary fill light from opposite side (cool blue)
        var fill = new THREE.DirectionalLight(0xaabbdd, 0.3);
        fill.position.set(-15, 10, -10);
        this.scene.add(fill);

        // Rim/back light for silhouette separation
        var rim = new THREE.DirectionalLight(0xffd4a0, 0.2);
        rim.position.set(-10, 25, -20);
        this.scene.add(rim);

        // Ambient dust/pollen particles
        this.dustParticles = this.createDustParticles(centerX, centerZ);
        this.scene.add(this.dustParticles);

        this.groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ visible: false }));
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.scene.add(this.groundPlane);

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    },

    createDustParticles: function(cx, cz) {
        var count = 200;
        var positions = new Float32Array(count * 3);
        var spread = 30;
        for (var i = 0; i < count; i++) {
            positions[i * 3] = cx + (Math.random() - 0.5) * spread * 2;
            positions[i * 3 + 1] = 0.5 + Math.random() * 6;
            positions[i * 3 + 2] = cz + (Math.random() - 0.5) * spread * 2;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var mat = new THREE.PointsMaterial({
            color: 0xffffcc, size: 0.06, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        return new THREE.Points(geo, mat);
    },

    setZoom: function(level) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.applyZoom();
    },

    applyZoom: function() {
        var aspect = window.innerWidth / window.innerHeight;
        var vs = this.baseViewSize / this.zoomLevel;
        this.camera.left = -vs * aspect; this.camera.right = vs * aspect;
        this.camera.top = vs; this.camera.bottom = -vs;
        this.camera.updateProjectionMatrix();
    },

    resize: function() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.applyZoom();
    },

    render: function() {
        // Animate dust particles
        if (this.dustParticles) {
            var pos = this.dustParticles.geometry.attributes.position;
            var time = this.clock.elapsedTime;
            for (var i = 0; i < pos.count; i++) {
                pos.array[i * 3] += Math.sin(time * 0.3 + i * 0.7) * 0.003;
                pos.array[i * 3 + 1] += Math.sin(time * 0.5 + i * 1.3) * 0.002;
                pos.array[i * 3 + 2] += Math.cos(time * 0.2 + i * 0.9) * 0.003;
                // Wrap around if too high
                if (pos.array[i * 3 + 1] > 7) pos.array[i * 3 + 1] = 0.5;
                if (pos.array[i * 3 + 1] < 0.3) pos.array[i * 3 + 1] = 6;
            }
            pos.needsUpdate = true;
        }
        this.renderer.render(this.scene, this.camera);
    },

    screenToWorld: function(screenX, screenY) {
        var rc = new THREE.Raycaster();
        var m = new THREE.Vector2((screenX / window.innerWidth) * 2 - 1, -(screenY / window.innerHeight) * 2 + 1);
        rc.setFromCamera(m, this.camera);
        var hits = rc.intersectObject(this.groundPlane);
        return hits.length > 0 ? { x: hits[0].point.x, z: hits[0].point.z } : null;
    }
};
