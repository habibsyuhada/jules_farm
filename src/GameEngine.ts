import * as THREE from 'three';
import { GridManager, TileData } from './GridManager';
import { CROPS, CropMeshBuilder } from './CropManager';
import { DECORATIONS, DecorationMeshBuilder } from './DecorationManager';

export interface PlayerState {
  coins: number;
  xp: number;
  level: number;
  selectedSeed: string;
  selectedDecoration: string;
  inventory: Record<string, number>;
}

export class GameEngine {
  public gridManager: GridManager;
  public scene: THREE.Scene;

  // 3D Objects attached to grid keys
  public tileObjects: Map<string, THREE.Group> = new Map();

  public player: PlayerState = {
    coins: 200,
    xp: 0,
    level: 1,
    selectedSeed: 'wheat',
    selectedDecoration: 'fence',
    inventory: {}
  };

  public currentMode: 'farm' | 'decorate' | 'inspect' = 'farm';
  public farmSubTool: 'till' | 'sow' | 'water' | 'harvest' = 'till';
  public pendingRotation: number = 0; // 0, 1, 2, 3 (degrees = * 90)

  private onStateChangeCallbacks: Array<() => void> = [];

  constructor(scene: THREE.Scene, gridManager: GridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.scene.add(this.gridManager.gridGroup);

    this.loadSavedState();
  }

  public subscribeStateChange(cb: () => void): void {
    this.onStateChangeCallbacks.push(cb);
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(cb => cb());
    this.saveState();
  }

  public addCoins(amount: number): void {
    this.player.coins += amount;
    this.notifyStateChange();
  }

  public addXP(amount: number): void {
    this.player.xp += amount;
    const requiredXp = this.player.level * 100;
    if (this.player.xp >= requiredXp) {
      this.player.level += 1;
      this.player.xp -= requiredXp;
      this.player.coins += 50; // Level up reward
    }
    this.notifyStateChange();
  }

  // --- Farming Core Logic ---

  public handleTileClick(gridX: number, gridZ: number): void {
    const tileKey = this.gridManager.getTileKey(gridX, gridZ);
    const tile = this.gridManager.getTile(gridX, gridZ);
    if (!tile) return;

    if (this.currentMode === 'farm') {
      this.processFarmAction(tileKey, tile);
    } else if (this.currentMode === 'decorate') {
      this.processDecorateAction(tileKey, tile);
    } else if (this.currentMode === 'inspect') {
      this.gridManager.setHighlightPosition(gridX, gridZ);
      this.notifyStateChange();
    }
  }

  private processFarmAction(tileKey: string, tile: TileData): void {
    if (tile.type === 'decoration') {
      return; // Cannot farm on top of decoration
    }

    if (this.farmSubTool === 'till') {
      // Grass -> Tilled Soil
      if (tile.type === 'grass') {
        tile.type = 'soil';
        tile.soilState = 'tilled';
        this.updateTileVisual(tileKey, tile);
        this.addXP(2);
      }
    } else if (this.farmSubTool === 'sow') {
      // Sow seed on tilled/watered soil
      if (tile.type === 'soil' && !tile.cropId) {
        const cropDef = CROPS[this.player.selectedSeed];
        if (!cropDef) return;

        if (this.player.coins < cropDef.cost) {
          return; // Insufficient funds
        }

        this.player.coins -= cropDef.cost;
        tile.cropId = cropDef.id;
        tile.cropStage = 0;
        tile.plantedAt = Date.now();

        this.updateTileVisual(tileKey, tile);
        this.notifyStateChange();
      }
    } else if (this.farmSubTool === 'water') {
      // Water tilled soil
      if (tile.type === 'soil') {
        tile.soilState = 'watered';
        tile.wateredAt = Date.now();
        this.updateTileVisual(tileKey, tile);
        this.notifyStateChange();
      }
    } else if (this.farmSubTool === 'harvest') {
      // Harvest harvestable crop
      if (tile.cropId && tile.cropStage === 3) {
        const cropDef = CROPS[tile.cropId];
        if (cropDef) {
          this.addCoins(cropDef.sellPrice);
          this.addXP(cropDef.xpReward);

          // Add to inventory
          this.player.inventory[cropDef.id] = (this.player.inventory[cropDef.id] || 0) + 1;
        }

        // Reset tile back to tilled soil
        tile.cropId = undefined;
        tile.cropStage = undefined;
        tile.plantedAt = undefined;
        tile.soilState = 'tilled';

        this.updateTileVisual(tileKey, tile);
        this.notifyStateChange();
      }
    }
  }

  // --- Decoration Logic ---

  private processDecorateAction(tileKey: string, tile: TileData): void {
    const decorDef = DECORATIONS[this.player.selectedDecoration];
    if (!decorDef) return;

    // Check if space is occupied
    if (tile.type !== 'grass') return;

    if (this.player.coins < decorDef.cost) return;

    this.player.coins -= decorDef.cost;
    tile.type = 'decoration';
    tile.decorationId = decorDef.id;
    tile.decorationRotation = this.pendingRotation;

    this.updateTileVisual(tileKey, tile);
    this.addXP(5);
    this.notifyStateChange();
  }

  public rotatePendingDecoration(): void {
    this.pendingRotation = (this.pendingRotation + 1) % 4;
    this.notifyStateChange();
  }

  public removeDecoration(gridX: number, gridZ: number): void {
    const tileKey = this.gridManager.getTileKey(gridX, gridZ);
    const tile = this.gridManager.getTile(gridX, gridZ);

    if (tile && tile.type === 'decoration' && tile.decorationId) {
      const decorDef = DECORATIONS[tile.decorationId];
      if (decorDef) {
        // Refund 50%
        this.addCoins(Math.floor(decorDef.cost * 0.5));
      }

      tile.type = 'grass';
      tile.decorationId = undefined;
      tile.decorationRotation = undefined;

      this.updateTileVisual(tileKey, tile);
      this.notifyStateChange();
    }
  }

  // Real-time loop for crop growth
  public updateCrops(): void {
    const now = Date.now();
    let updated = false;

    this.gridManager.tiles.forEach((tile, key) => {
      if (tile.cropId && tile.plantedAt && tile.cropStage !== undefined && tile.cropStage < 3) {
        const cropDef = CROPS[tile.cropId];
        if (!cropDef) return;

        // Watered crops grow twice as fast
        const isWatered = tile.soilState === 'watered';
        const growthMult = isWatered ? 2.0 : 1.0;

        const elapsedSec = ((now - tile.plantedAt) / 1000) * growthMult;
        const totalGrowthTime = cropDef.growthTime;

        let newStage = 0;
        if (elapsedSec >= totalGrowthTime) {
          newStage = 3;
        } else if (elapsedSec >= totalGrowthTime * 0.6) {
          newStage = 2;
        } else if (elapsedSec >= totalGrowthTime * 0.25) {
          newStage = 1;
        }

        if (newStage !== tile.cropStage) {
          tile.cropStage = newStage;
          this.updateTileVisual(key, tile);
          updated = true;
        }
      }
    });

    if (updated) {
      this.notifyStateChange();
    }
  }

  public updateTileVisual(tileKey: string, tile: TileData): void {
    // Remove existing object mesh on tile if any
    const existingObj = this.tileObjects.get(tileKey);
    if (existingObj) {
      this.scene.remove(existingObj);
      this.tileObjects.delete(tileKey);
    }

    const group = new THREE.Group();
    group.position.set(tile.x + 0.5, 0, tile.z + 0.5);

    if (tile.type === 'soil' && tile.soilState) {
      const soilMesh = CropMeshBuilder.createSoilMesh(tile.soilState);
      group.add(soilMesh);

      if (tile.cropId && tile.cropStage !== undefined) {
        const cropMesh = CropMeshBuilder.createCropMesh(tile.cropId, tile.cropStage);
        group.add(cropMesh);
      }
      this.scene.add(group);
      this.tileObjects.set(tileKey, group);

    } else if (tile.type === 'decoration' && tile.decorationId) {
      const decorMesh = DecorationMeshBuilder.createDecorationMesh(tile.decorationId);
      if (tile.decorationRotation) {
        decorMesh.rotation.y = (tile.decorationRotation * Math.PI) / 2;
      }
      group.add(decorMesh);
      this.scene.add(group);
      this.tileObjects.set(tileKey, group);
    }
  }

  // --- Save / Load Persistence ---

  public saveState(): void {
    const tilesData: TileData[] = Array.from(this.gridManager.tiles.values());
    const data = {
      player: this.player,
      tiles: tilesData
    };
    try {
      localStorage.setItem('lowpoly_farm_save', JSON.stringify(data));
    } catch {
      // Storage unavailable or disabled
    }
  }

  public loadSavedState(): void {
    try {
      const raw = localStorage.getItem('lowpoly_farm_save');
      if (!raw) return;

      const data = JSON.parse(raw);
      if (data.player) {
        this.player = { ...this.player, ...data.player };
      }

      if (Array.isArray(data.tiles)) {
        data.tiles.forEach((savedTile: TileData) => {
          const key = this.gridManager.getTileKey(savedTile.x, savedTile.z);
          if (this.gridManager.tiles.has(key)) {
            this.gridManager.tiles.set(key, savedTile);
            this.updateTileVisual(key, savedTile);
          }
        });
      }
    } catch {
      console.warn('Failed to load save state');
    }
  }
}
