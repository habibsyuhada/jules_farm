import './style.css';
import { SceneManager } from './SceneManager';
import { GridManager } from './GridManager';
import { GameEngine } from './GameEngine';
import { UIManager } from './UIManager';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiContainer = document.getElementById('ui-container') as HTMLElement;

  if (!canvas || !uiContainer) return;

  // Initialize Core Systems
  const sceneManager = new SceneManager(canvas);
  const gridManager = new GridManager(16, 1);
  const gameEngine = new GameEngine(sceneManager.scene, gridManager);
  const uiManager = new UIManager(uiContainer, gameEngine, sceneManager);

  // Input Handling (Pointer & Touch support)
  let isPointerDown = false;
  let pointerDownTime = 0;
  let startX = 0;
  let startY = 0;

  window.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;

    isPointerDown = true;
    pointerDownTime = Date.now();
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;

    // Raycast hover effect
    const hitTile = gridManager.raycastTile(e.clientX, e.clientY, sceneManager.camera);
    if (hitTile) {
      gridManager.setCursorPosition(hitTile.gridX, hitTile.gridZ);
    } else {
      gridManager.hideCursor();
    }

    // Pan camera on drag
    if (isPointerDown) {
      const dx = (e.clientX - startX) * 0.03;
      const dy = (e.clientY - startY) * 0.03;
      sceneManager.panCamera(-dx, dy);
      startX = e.clientX;
      startY = e.clientY;
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (isPointerDown) {
      const duration = Date.now() - pointerDownTime;
      isPointerDown = false;

      // If brief tap without large drag, trigger tile click
      if (duration < 300) {
        if ((e.target as HTMLElement).closest('.pointer-events-auto')) return;

        const hitTile = gridManager.raycastTile(e.clientX, e.clientY, sceneManager.camera);
        if (hitTile) {
          uiManager.setSelectedInspectTile(hitTile.key);
          gameEngine.handleTileClick(hitTile.gridX, hitTile.gridZ);
        }
      }
    }
  });

  // Touch pinch to zoom support
  let touchStartDist = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && touchStartDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (touchStartDist - dist) * 0.05;
      sceneManager.setZoom(sceneManager.currentZoom + delta);
      touchStartDist = dist;
    }
  });

  // Game Loop
  let lastTime = performance.now();
  function animate(now: number) {
    requestAnimationFrame(animate);

    sceneManager.update();

    // Check crop growth timers every second
    if (now - lastTime >= 1000) {
      gameEngine.updateCrops();
      lastTime = now;
    }

    sceneManager.render();
  }

  requestAnimationFrame(animate);
});
