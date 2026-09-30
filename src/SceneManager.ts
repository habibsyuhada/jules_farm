import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  public sunLight!: THREE.DirectionalLight;
  public ambientLight!: THREE.AmbientLight;

  private aspect: number;
  private cameraDistance = 20;
  private targetZoom = 15;
  public currentZoom = 15;

  // Camera movement and rotation state
  public cameraTarget = new THREE.Vector3(0, 0, 0);
  public cameraRotationAngle = Math.PI / 4; // 45 degrees isometric angle
  private elevationAngle = Math.PI / 6; // 30 degrees elevation angle

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#87CEEB'); // Sky blue low poly theme
    this.scene.fog = new THREE.FogExp2('#87CEEB', 0.015);

    this.aspect = window.innerWidth / window.innerHeight;

    // Setup Orthographic Camera for Isometric View
    this.camera = new THREE.OrthographicCamera(
      -this.currentZoom * this.aspect,
      this.currentZoom * this.aspect,
      this.currentZoom,
      -this.currentZoom,
      0.1,
      1000
    );

    // Setup WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.setupLighting();
    this.updateCameraPosition();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting(): void {
    // Soft warm ambient light
    this.ambientLight = new THREE.AmbientLight('#fff3e0', 0.85);
    this.scene.add(this.ambientLight);

    // Hemispheric light for subtle ground reflection
    const hemiLight = new THREE.HemisphereLight('#87ceeb', '#4d7c0f', 0.5);
    this.scene.add(hemiLight);

    // Warm Sun Directional Light with soft shadows
    this.sunLight = new THREE.DirectionalLight('#fffbda', 1.3);
    this.sunLight.position.set(25, 35, 20);
    this.sunLight.castShadow = true;

    // Shadow camera bounds
    const d = 25;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 80;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);
  }

  public updateCameraPosition(): void {
    const x = this.cameraTarget.x + this.cameraDistance * Math.cos(this.elevationAngle) * Math.sin(this.cameraRotationAngle);
    const y = this.cameraTarget.y + this.cameraDistance * Math.sin(this.elevationAngle);
    const z = this.cameraTarget.z + this.cameraDistance * Math.cos(this.elevationAngle) * Math.cos(this.cameraRotationAngle);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);

    this.camera.left = -this.currentZoom * this.aspect;
    this.camera.right = this.currentZoom * this.aspect;
    this.camera.top = this.currentZoom;
    this.camera.bottom = -this.currentZoom;
    this.camera.updateProjectionMatrix();
  }

  public setZoom(zoom: number): void {
    this.targetZoom = THREE.MathUtils.clamp(zoom, 6, 35);
  }

  public rotateCamera(angleDelta: number): void {
    this.cameraRotationAngle += angleDelta;
    this.updateCameraPosition();
  }

  public panCamera(deltaX: number, deltaZ: number): void {
    // Pan relative to camera orientation
    const cos = Math.cos(this.cameraRotationAngle);
    const sin = Math.sin(this.cameraRotationAngle);

    const worldDx = (deltaX * cos - deltaZ * sin);
    const worldDz = (deltaX * sin + deltaZ * cos);

    this.cameraTarget.x += worldDx;
    this.cameraTarget.z += worldDz;

    // Keep camera within reasonable farm bounds
    this.cameraTarget.x = THREE.MathUtils.clamp(this.cameraTarget.x, -25, 25);
    this.cameraTarget.z = THREE.MathUtils.clamp(this.cameraTarget.z, -25, 25);

    this.updateCameraPosition();
  }

  public update(): void {
    // Smooth zoom interpolation
    if (Math.abs(this.currentZoom - this.targetZoom) > 0.01) {
      this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
      this.updateCameraPosition();
    }
  }

  private onWindowResize(): void {
    this.aspect = window.innerWidth / window.innerHeight;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updateCameraPosition();
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
