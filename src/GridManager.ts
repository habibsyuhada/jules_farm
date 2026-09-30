import * as THREE from 'three';

export interface TileData {
  x: number;
  z: number;
  type: 'grass' | 'soil' | 'decoration';
  soilState?: 'tilled' | 'watered';
  cropId?: string;
  cropStage?: number; // 0: seed, 1: sprout, 2: growing, 3: ready
  plantedAt?: number;
  wateredAt?: number;
  decorationId?: string;
  decorationRotation?: number; // 0, 1, 2, 3 (units of 90 deg)
}

export class GridManager {
  public gridSize: number;
  public tileSize: number;
  public tiles: Map<string, TileData> = new Map();

  public gridGroup: THREE.Group;
  public tileMeshes: Map<string, THREE.Mesh> = new Map();
  public cursorMesh: THREE.Mesh;
  public highlightMesh: THREE.Mesh;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(gridSize: number = 16, tileSize: number = 1) {
    this.gridSize = gridSize;
    this.tileSize = tileSize;
    this.gridGroup = new THREE.Group();

    // Hover/Selection cursor mesh
    const cursorGeo = new THREE.PlaneGeometry(tileSize * 0.95, tileSize * 0.95);
    cursorGeo.rotateX(-Math.PI / 2);

    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      side: THREE.DoubleSide
    });
    this.cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    this.cursorMesh.position.y = 0.02;
    this.cursorMesh.visible = false;
    this.gridGroup.add(this.cursorMesh);

    // Selected tile highlight mesh
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.5,
      depthTest: true,
      side: THREE.DoubleSide
    });
    this.highlightMesh = new THREE.Mesh(cursorGeo, highlightMat);
    this.highlightMesh.position.y = 0.025;
    this.highlightMesh.visible = false;
    this.gridGroup.add(this.highlightMesh);

    this.createGroundGrid();
  }

  private createGroundGrid(): void {
    const half = this.gridSize / 2;
    const grassGeo = new THREE.BoxGeometry(this.tileSize * 0.98, 0.2, this.tileSize * 0.98);

    const grassMat1 = new THREE.MeshLambertMaterial({ color: '#7ec850', flatShading: true });
    const grassMat2 = new THREE.MeshLambertMaterial({ color: '#6fb940', flatShading: true });

    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const gridX = x - half;
        const gridZ = z - half;
        const key = `${gridX},${gridZ}`;

        const isAlt = (x + z) % 2 === 0;
        const mesh = new THREE.Mesh(grassGeo, isAlt ? grassMat1 : grassMat2);
        mesh.position.set(gridX + 0.5, -0.1, gridZ + 0.5);
        mesh.receiveShadow = true;
        mesh.userData = { gridX, gridZ, key };

        this.gridGroup.add(mesh);
        this.tileMeshes.set(key, mesh);

        // Initial Tile State
        this.tiles.set(key, {
          x: gridX,
          z: gridZ,
          type: 'grass'
        });
      }
    }

    // Base Bedrock / Earth layer below grid
    const earthGeo = new THREE.BoxGeometry(this.gridSize + 0.4, 1.0, this.gridSize + 0.4);
    const earthMat = new THREE.MeshLambertMaterial({ color: '#8d5b4c', flatShading: true });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, -0.7, 0);
    earthMesh.receiveShadow = true;
    this.gridGroup.add(earthMesh);
  }

  public getTileKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  public getTile(x: number, z: number): TileData | undefined {
    return this.tiles.get(this.getTileKey(x, z));
  }

  public raycastTile(
    screenX: number,
    screenY: number,
    camera: THREE.Camera
  ): { gridX: number; gridZ: number; key: string } | null {
    this.mouse.x = (screenX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(screenY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.tileMeshes.values()));

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const { gridX, gridZ, key } = hit.userData;
      return { gridX, gridZ, key };
    }
    return null;
  }

  public setCursorPosition(gridX: number, gridZ: number, valid: boolean = true): void {
    this.cursorMesh.position.set(gridX + 0.5, 0.02, gridZ + 0.5);
    (this.cursorMesh.material as THREE.MeshBasicMaterial).color.setHex(valid ? 0xffffff : 0xef4444);
    this.cursorMesh.visible = true;
  }

  public hideCursor(): void {
    this.cursorMesh.visible = false;
  }

  public setHighlightPosition(gridX: number | null, gridZ: number | null): void {
    if (gridX === null || gridZ === null) {
      this.highlightMesh.visible = false;
      return;
    }
    this.highlightMesh.position.set(gridX + 0.5, 0.025, gridZ + 0.5);
    this.highlightMesh.visible = true;
  }
}
