import { GameEngine } from './GameEngine';
import { SceneManager } from './SceneManager';
import { CROPS } from './CropManager';
import { DECORATIONS } from './DecorationManager';

export class UIManager {
  private container: HTMLElement;
  private gameEngine: GameEngine;
  private sceneManager: SceneManager;

  private isShopOpen = false;
  private isInventoryOpen = false;
  private activeShopTab: 'seeds' | 'decorations' = 'seeds';

  constructor(container: HTMLElement, gameEngine: GameEngine, sceneManager: SceneManager) {
    this.container = container;
    this.gameEngine = gameEngine;
    this.sceneManager = sceneManager;

    this.gameEngine.subscribeStateChange(() => this.render());
    this.render();
  }

  public render(): void {
    const player = this.gameEngine.player;
    const requiredXp = player.level * 100;
    const xpPercent = Math.min(100, Math.floor((player.xp / requiredXp) * 100));

    this.container.innerHTML = `
      <!-- Header HUD -->
      <div class="hud-header pointer-events-auto">
        <div class="stat-badge level-badge">
          <span class="badge-icon">⭐</span>
          <div class="level-info">
            <span class="level-text">Lvl ${player.level}</span>
            <div class="xp-bar-bg">
              <div class="xp-bar-fill" style="width: ${xpPercent}%"></div>
            </div>
          </div>
        </div>

        <div class="stat-badge coin-badge">
          <span class="badge-icon">🪙</span>
          <span class="stat-value">${player.coins}</span>
        </div>

        <button class="icon-btn inv-btn" id="btn-inventory">
          🎒 <span class="btn-label">Tas</span>
        </button>
      </div>

      <!-- Mode Switcher Floating Bar -->
      <div class="mode-bar pointer-events-auto">
        <button class="mode-tab ${this.gameEngine.currentMode === 'farm' ? 'active' : ''}" id="mode-farm">
          🌾 Kebun
        </button>
        <button class="mode-tab ${this.gameEngine.currentMode === 'decorate' ? 'active' : ''}" id="mode-decorate">
          🏕️ Dekorasi
        </button>
        <button class="mode-tab ${this.gameEngine.currentMode === 'inspect' ? 'active' : ''}" id="mode-inspect">
          🔍 Inspeksi
        </button>
      </div>

      <!-- Action Sub-Toolbar -->
      <div class="sub-toolbar pointer-events-auto">
        ${this.renderSubToolbar()}
      </div>

      <!-- Camera Control Quick Action Floating Overlay -->
      <div class="camera-controls pointer-events-auto">
        <button class="cam-btn" id="cam-rotate-left">↺</button>
        <button class="cam-btn" id="cam-rotate-right">↻</button>
        <button class="cam-btn" id="cam-zoom-in">＋</button>
        <button class="cam-btn" id="cam-zoom-out">－</button>
      </div>

      <!-- Shop Modal -->
      ${this.isShopOpen ? this.renderShopModal() : ''}

      <!-- Inventory Modal -->
      ${this.isInventoryOpen ? this.renderInventoryModal() : ''}
    `;

    this.attachEventListeners();
  }

  private renderSubToolbar(): string {
    const mode = this.gameEngine.currentMode;

    if (mode === 'inspect') {
      const selectedTile = this.getSelectedTileInfo();
      if (selectedTile && selectedTile.type === 'decoration') {
        return `
          <div class="decor-info-bar">
            <span>Dekorasi: ${selectedTile.decorationId}</span>
            <button class="action-btn remove-btn" id="btn-remove-decor" data-x="${selectedTile.x}" data-z="${selectedTile.z}">
              🗑️ Hapus Dekorasi
            </button>
          </div>
        `;
      }
      return `<div class="inspect-hint">Ketuk petak untuk melihat info atau hapus dekorasi.</div>`;
    }

    if (mode === 'farm') {
      const tool = this.gameEngine.farmSubTool;
      const crop = CROPS[this.gameEngine.player.selectedSeed];

      return `
        <div class="tool-group">
          <button class="tool-btn ${tool === 'till' ? 'active' : ''}" id="tool-till">
            🔨 Cangkul
          </button>
          <button class="tool-btn ${tool === 'sow' ? 'active' : ''}" id="tool-sow">
            🌱 Tanam (${crop ? crop.icon : ''})
          </button>
          <button class="tool-btn ${tool === 'water' ? 'active' : ''}" id="tool-water">
            💧 Siram
          </button>
          <button class="tool-btn ${tool === 'harvest' ? 'active' : ''}" id="tool-harvest">
            🧺 Panen
          </button>
        </div>
        <button class="shop-trigger-btn" id="open-shop">
          🛒 Toko Bibit
        </button>
      `;
    }

    if (mode === 'decorate') {
      const decor = DECORATIONS[this.gameEngine.player.selectedDecoration];
      return `
        <div class="decor-info-bar">
          <span class="decor-name">${decor ? decor.icon + ' ' + decor.name : ''}</span>
          <button class="action-btn" id="decor-rotate">🔄 Putar (90°)</button>
        </div>
        <button class="shop-trigger-btn" id="open-shop">
          🛒 Toko Dekorasi
        </button>
      `;
    }

    return `<div class="inspect-hint">Ketuk petak untuk melihat info atau hapus dekorasi.</div>`;
  }

  private renderShopModal(): string {
    const isSeeds = this.activeShopTab === 'seeds';

    return `
      <div class="modal-backdrop pointer-events-auto">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🛒 Toko Pertanian & Dekorasi</h3>
            <button class="close-btn" id="close-shop">✕</button>
          </div>

          <div class="modal-tabs">
            <button class="tab-btn ${isSeeds ? 'active' : ''}" id="shop-tab-seeds">🌾 Bibit Tanaman</button>
            <button class="tab-btn ${!isSeeds ? 'active' : ''}" id="shop-tab-decor">🏕️ Barang Dekorasi</button>
          </div>

          <div class="shop-grid">
            ${isSeeds ? this.renderSeedItems() : this.renderDecorItems()}
          </div>
        </div>
      </div>
    `;
  }

  private renderSeedItems(): string {
    return Object.values(CROPS).map(crop => {
      const isSelected = this.gameEngine.player.selectedSeed === crop.id;
      return `
        <div class="shop-item ${isSelected ? 'selected' : ''}">
          <div class="item-icon">${crop.icon}</div>
          <div class="item-details">
            <div class="item-title">${crop.name}</div>
            <div class="item-sub">⏱️ ${crop.growthTime}s | 📈 +${crop.xpReward} XP</div>
            <div class="item-price">🪙 ${crop.cost} | Jual: 🪙 ${crop.sellPrice}</div>
          </div>
          <button class="buy-btn" data-seed="${crop.id}">
            ${isSelected ? 'Dipakai' : 'Pilih'}
          </button>
        </div>
      `;
    }).join('');
  }

  private renderDecorItems(): string {
    return Object.values(DECORATIONS).map(decor => {
      const isSelected = this.gameEngine.player.selectedDecoration === decor.id;
      return `
        <div class="shop-item ${isSelected ? 'selected' : ''}">
          <div class="item-icon">${decor.icon}</div>
          <div class="item-details">
            <div class="item-title">${decor.name}</div>
            <div class="item-sub">Kategori: ${decor.category}</div>
            <div class="item-price">🪙 ${decor.cost}</div>
          </div>
          <button class="buy-decor-btn" data-decor="${decor.id}">
            ${isSelected ? 'Dipakai' : 'Pilih'}
          </button>
        </div>
      `;
    }).join('');
  }

  private renderInventoryModal(): string {
    const inv = this.gameEngine.player.inventory;
    const keys = Object.keys(inv);

    return `
      <div class="modal-backdrop pointer-events-auto">
        <div class="modal-card">
          <div class="modal-header">
            <h3>🎒 Tas / Hasil Panen</h3>
            <button class="close-btn" id="close-inv">✕</button>
          </div>
          <div class="inv-list">
            ${keys.length === 0 ? '<div class="empty-msg">Belum ada hasil panen di dalam tas.</div>' : ''}
            ${keys.map(cropId => {
              const crop = CROPS[cropId];
              const qty = inv[cropId];
              if (!crop || qty <= 0) return '';
              return `
                <div class="inv-item">
                  <span class="inv-icon">${crop.icon}</span>
                  <div class="inv-info">
                    <span class="inv-name">${crop.name}</span>
                    <span class="inv-qty">Jumlah: ${qty}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private selectedInspectTileKey: string | null = null;

  private getSelectedTileInfo() {
    if (!this.selectedInspectTileKey) return null;
    return this.gameEngine.gridManager.tiles.get(this.selectedInspectTileKey);
  }

  public setSelectedInspectTile(key: string | null): void {
    this.selectedInspectTileKey = key;
    this.render();
  }

  private attachEventListeners(): void {
    document.getElementById('btn-remove-decor')?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      const x = parseInt(btn.getAttribute('data-x') || '0', 10);
      const z = parseInt(btn.getAttribute('data-z') || '0', 10);
      this.gameEngine.removeDecoration(x, z);
      this.selectedInspectTileKey = null;
      this.render();
    });
    // Mode Switcher
    document.getElementById('mode-farm')?.addEventListener('click', () => {
      this.gameEngine.currentMode = 'farm';
      this.render();
    });
    document.getElementById('mode-decorate')?.addEventListener('click', () => {
      this.gameEngine.currentMode = 'decorate';
      this.render();
    });
    document.getElementById('mode-inspect')?.addEventListener('click', () => {
      this.gameEngine.currentMode = 'inspect';
      this.render();
    });

    // Farm Tools
    document.getElementById('tool-till')?.addEventListener('click', () => {
      this.gameEngine.farmSubTool = 'till';
      this.render();
    });
    document.getElementById('tool-sow')?.addEventListener('click', () => {
      this.gameEngine.farmSubTool = 'sow';
      this.render();
    });
    document.getElementById('tool-water')?.addEventListener('click', () => {
      this.gameEngine.farmSubTool = 'water';
      this.render();
    });
    document.getElementById('tool-harvest')?.addEventListener('click', () => {
      this.gameEngine.farmSubTool = 'harvest';
      this.render();
    });

    // Shop Modals
    document.getElementById('open-shop')?.addEventListener('click', () => {
      this.activeShopTab = this.gameEngine.currentMode === 'decorate' ? 'decorations' : 'seeds';
      this.isShopOpen = true;
      this.render();
    });
    document.getElementById('close-shop')?.addEventListener('click', () => {
      this.isShopOpen = false;
      this.render();
    });

    document.getElementById('shop-tab-seeds')?.addEventListener('click', () => {
      this.activeShopTab = 'seeds';
      this.render();
    });
    document.getElementById('shop-tab-decor')?.addEventListener('click', () => {
      this.activeShopTab = 'decorations';
      this.render();
    });

    // Seed Selection
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seed = (e.currentTarget as HTMLElement).getAttribute('data-seed');
        if (seed) {
          this.gameEngine.player.selectedSeed = seed;
          this.gameEngine.farmSubTool = 'sow';
          this.isShopOpen = false;
          this.render();
        }
      });
    });

    // Decor Selection
    document.querySelectorAll('.buy-decor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const decor = (e.currentTarget as HTMLElement).getAttribute('data-decor');
        if (decor) {
          this.gameEngine.player.selectedDecoration = decor;
          this.isShopOpen = false;
          this.render();
        }
      });
    });

    // Rotate Decor Button
    document.getElementById('decor-rotate')?.addEventListener('click', () => {
      this.gameEngine.rotatePendingDecoration();
    });

    // Inventory Modal
    document.getElementById('btn-inventory')?.addEventListener('click', () => {
      this.isInventoryOpen = true;
      this.render();
    });
    document.getElementById('close-inv')?.addEventListener('click', () => {
      this.isInventoryOpen = false;
      this.render();
    });

    // Camera Controls
    document.getElementById('cam-rotate-left')?.addEventListener('click', () => {
      this.sceneManager.rotateCamera(-Math.PI / 6);
    });
    document.getElementById('cam-rotate-right')?.addEventListener('click', () => {
      this.sceneManager.rotateCamera(Math.PI / 6);
    });
    document.getElementById('cam-zoom-in')?.addEventListener('click', () => {
      this.sceneManager.setZoom(this.sceneManager.currentZoom - 3);
    });
    document.getElementById('cam-zoom-out')?.addEventListener('click', () => {
      this.sceneManager.setZoom(this.sceneManager.currentZoom + 3);
    });
  }
}
