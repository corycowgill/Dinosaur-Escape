window.DE = window.DE || {};

DE.Renderer = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    groundPlane: null,

    init: function(canvas) {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

        // 2.5D isometric-style camera (angled, not straight down)
        var aspect = window.innerWidth / window.innerHeight;
        var gridW = DE.CONFIG.GRID_COLS * DE.CONFIG.CELL_SIZE;
        var gridH = DE.CONFIG.GRID_ROWS * DE.CONFIG.CELL_SIZE;
        var viewSize = Math.max(gridW, gridH) * 0.55;

        this.camera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 200
        );

        // Position camera at an angle for 2.5D look
        var centerX = gridW / 2 - DE.CONFIG.CELL_SIZE;
        var centerZ = gridH / 2 - DE.CONFIG.CELL_SIZE;
        // Camera offset: angled from south, looking north-ish, ~45 degree elevation
        var camDist = DE.CONFIG.CAMERA_HEIGHT;
        var camAngle = Math.PI * 0.28; // ~50 degrees from horizontal
        this.camera.position.set(
            centerX,
            camDist * Math.sin(camAngle),
            centerZ + camDist * Math.cos(camAngle)
        );
        this.camera.lookAt(centerX, 0, centerZ);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Fog for depth feel
        this.scene.fog = new THREE.Fog(0x87CEEB, 60, 120);

        // Lighting - adjusted for angled view
        var ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        var sun = new THREE.DirectionalLight(0xfff5e0, 0.9);
        sun.position.set(15, 30, 20);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 80;
        sun.shadow.camera.left = -40;
        sun.shadow.camera.right = 40;
        sun.shadow.camera.top = 40;
        sun.shadow.camera.bottom = -40;
        this.scene.add(sun);

        // Hemisphere light for sky/ground color bleed
        var hemi = new THREE.HemisphereLight(0x88bbff, 0x445522, 0.3);
        this.scene.add(hemi);

        // Invisible ground plane for raycasting
        var planeGeo = new THREE.PlaneGeometry(200, 200);
        var planeMat = new THREE.MeshBasicMaterial({ visible: false });
        this.groundPlane = new THREE.Mesh(planeGeo, planeMat);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.position.y = 0;
        this.scene.add(this.groundPlane);

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    },

    resize: function() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var aspect = w / h;
        var gridW = DE.CONFIG.GRID_COLS * DE.CONFIG.CELL_SIZE;
        var gridH = DE.CONFIG.GRID_ROWS * DE.CONFIG.CELL_SIZE;
        var viewSize = Math.max(gridW, gridH) * 0.55;

        this.camera.left = -viewSize * aspect;
        this.camera.right = viewSize * aspect;
        this.camera.top = viewSize;
        this.camera.bottom = -viewSize;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(w, h);
    },

    render: function() {
        this.renderer.render(this.scene, this.camera);
    },

    screenToWorld: function(screenX, screenY) {
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        mouse.x = (screenX / window.innerWidth) * 2 - 1;
        mouse.y = -(screenY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);

        var intersects = raycaster.intersectObject(this.groundPlane);
        if (intersects.length > 0) {
            return { x: intersects[0].point.x, z: intersects[0].point.z };
        }
        return null;
    }
};
