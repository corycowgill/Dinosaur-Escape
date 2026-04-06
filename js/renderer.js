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
        this.scene.background = new THREE.Color(0x1a3a1a);

        // Orthographic camera looking straight down
        var aspect = window.innerWidth / window.innerHeight;
        var gridW = DE.CONFIG.GRID_COLS * DE.CONFIG.CELL_SIZE;
        var gridH = DE.CONFIG.GRID_ROWS * DE.CONFIG.CELL_SIZE;
        var viewSize = Math.max(gridW, gridH) * 0.6;

        this.camera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 100
        );
        this.camera.position.set(gridW / 2 - DE.CONFIG.CELL_SIZE, DE.CONFIG.CAMERA_HEIGHT, gridH / 2 - DE.CONFIG.CELL_SIZE);
        this.camera.lookAt(gridW / 2 - DE.CONFIG.CELL_SIZE, 0, gridH / 2 - DE.CONFIG.CELL_SIZE);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        var ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        var sun = new THREE.DirectionalLight(0xfff5e0, 0.8);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 60;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        this.scene.add(sun);

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
        var viewSize = Math.max(gridW, gridH) * 0.6;

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
