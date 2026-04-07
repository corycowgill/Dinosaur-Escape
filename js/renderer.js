window.DE = window.DE || {};

DE.Renderer = {
    scene: null, camera: null, renderer: null, clock: null, groundPlane: null,
    zoomLevel: 1.0, minZoom: 0.4, maxZoom: 2.5, baseViewSize: 0,

    init: function(canvas) {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

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

        this.scene.fog = new THREE.Fog(0x87CEEB, 80, 150);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        var sun = new THREE.DirectionalLight(0xfff5e0, 0.9);
        sun.position.set(15, 30, 20); sun.castShadow = true;
        sun.shadow.mapSize.width = 2048; sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
        sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
        sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
        this.scene.add(sun);
        this.scene.add(new THREE.HemisphereLight(0x88bbff, 0x445522, 0.3));

        this.groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ visible: false }));
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.scene.add(this.groundPlane);

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
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

    render: function() { this.renderer.render(this.scene, this.camera); },

    screenToWorld: function(screenX, screenY) {
        var rc = new THREE.Raycaster();
        var m = new THREE.Vector2((screenX / window.innerWidth) * 2 - 1, -(screenY / window.innerHeight) * 2 + 1);
        rc.setFromCamera(m, this.camera);
        var hits = rc.intersectObject(this.groundPlane);
        return hits.length > 0 ? { x: hits[0].point.x, z: hits[0].point.z } : null;
    }
};
