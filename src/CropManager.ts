import * as THREE from 'three';

export interface CropDefinition {
  id: string;
  name: string;
  cost: number;
  sellPrice: number;
  xpReward: number;
  growthTime: number; // in seconds
  color: string;
  icon: string;
}

export const CROPS: Record<string, CropDefinition> = {
  wheat: {
    id: 'wheat',
    name: 'Gandum (Wheat)',
    cost: 10,
    sellPrice: 25,
    xpReward: 10,
    growthTime: 10, // 10s for snappy mobile play
    color: '#eab308',
    icon: '🌾'
  },
  carrot: {
    id: 'carrot',
    name: 'Wortel (Carrot)',
    cost: 20,
    sellPrice: 50,
    xpReward: 20,
    growthTime: 20,
    color: '#f97316',
    icon: '🥕'
  },
  corn: {
    id: 'corn',
    name: 'Jagung (Corn)',
    cost: 35,
    sellPrice: 90,
    xpReward: 35,
    growthTime: 35,
    color: '#facc15',
    icon: '🌽'
  },
  tomato: {
    id: 'tomato',
    name: 'Tomat (Tomato)',
    cost: 50,
    sellPrice: 130,
    xpReward: 50,
    growthTime: 50,
    color: '#ef4444',
    icon: '🍅'
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Labu (Pumpkin)',
    cost: 80,
    sellPrice: 220,
    xpReward: 80,
    growthTime: 80,
    color: '#ea580c',
    icon: '🎃'
  }
};

export class CropMeshBuilder {
  // Generate low-poly tilled/watered soil tile mesh
  public static createSoilMesh(state: 'tilled' | 'watered'): THREE.Group {
    const soilGroup = new THREE.Group();
    const isWatered = state === 'watered';

    const baseColor = isWatered ? '#3b2518' : '#5c3d2e';
    const furrowColor = isWatered ? '#29180e' : '#452b1e';

    const soilMat = new THREE.MeshLambertMaterial({ color: baseColor, flatShading: true });
    const furrowMat = new THREE.MeshLambertMaterial({ color: furrowColor, flatShading: true });

    // Main soil bed
    const bedGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
    const bedMesh = new THREE.Mesh(bedGeo, soilMat);
    bedMesh.position.y = 0.04;
    bedMesh.receiveShadow = true;
    soilGroup.add(bedMesh);

    // Soil furrows (low poly ridges)
    const ridgeGeo = new THREE.BoxGeometry(0.85, 0.04, 0.12);
    for (let z = -0.3; z <= 0.3; z += 0.2) {
      const ridge = new THREE.Mesh(ridgeGeo, furrowMat);
      ridge.position.set(0, 0.09, z);
      ridge.castShadow = true;
      ridge.receiveShadow = true;
      soilGroup.add(ridge);
    }

    return soilGroup;
  }

  // Generate Low-Poly 3D Crop Model based on crop ID and growth stage (0: Seed, 1: Sprout, 2: Growing, 3: Ready)
  public static createCropMesh(cropId: string, stage: number): THREE.Group {
    const group = new THREE.Group();

    if (stage === 0) {
      // Stage 0: Seed / Small mounds
      const moundMat = new THREE.MeshLambertMaterial({ color: '#854d0e', flatShading: true });
      for (let i = 0; i < 3; i++) {
        const seedGeo = new THREE.DodecahedronGeometry(0.06 + Math.random() * 0.02, 0);
        const seedMesh = new THREE.Mesh(seedGeo, moundMat);
        seedMesh.position.set((i - 1) * 0.2, 0.05, (Math.random() - 0.5) * 0.2);
        group.add(seedMesh);
      }
      return group;
    }

    const greenMat = new THREE.MeshLambertMaterial({ color: '#4ade80', flatShading: true });
    const stemMat = new THREE.MeshLambertMaterial({ color: '#15803d', flatShading: true });

    if (stage === 1) {
      // Stage 1: Sprout
      for (let i = -1; i <= 1; i += 2) {
        const sproutGroup = new THREE.Group();
        const leafGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
        const leaf1 = new THREE.Mesh(leafGeo, greenMat);
        leaf1.rotation.z = 0.3;
        leaf1.position.set(0.05, 0.12, 0);

        const leaf2 = new THREE.Mesh(leafGeo, greenMat);
        leaf2.rotation.z = -0.3;
        leaf2.position.set(-0.05, 0.12, 0);

        sproutGroup.add(leaf1, leaf2);
        sproutGroup.position.set(i * 0.2, 0, 0);
        group.add(sproutGroup);
      }
      return group;
    }

    // Stage 2 & 3: Growing & Harvestable
    const isReady = stage === 3;
    const scale = stage === 2 ? 0.65 : 1.0;

    switch (cropId) {
      case 'wheat': {
        const wheatColor = isReady ? '#eab308' : '#84cc16';
        const wheatMat = new THREE.MeshLambertMaterial({ color: wheatColor, flatShading: true });

        for (let x = -0.25; x <= 0.25; x += 0.25) {
          for (let z = -0.25; z <= 0.25; z += 0.25) {
            const stalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5 * scale, 4);
            const stalk = new THREE.Mesh(stalkGeo, stemMat);
            stalk.position.set(x, 0.25 * scale, z);

            const headGeo = new THREE.ConeGeometry(0.07 * scale, 0.3 * scale, 5);
            const head = new THREE.Mesh(headGeo, wheatMat);
            head.position.set(x, (0.5 + 0.15 * scale), z);
            head.castShadow = true;

            group.add(stalk, head);
          }
        }
        break;
      }

      case 'carrot': {
        const orangeMat = new THREE.MeshLambertMaterial({ color: '#f97316', flatShading: true });
        for (let i = 0; i < 3; i++) {
          const cGroup = new THREE.Group();
          const topGeo = new THREE.ConeGeometry(0.12 * scale, 0.35 * scale, 5);
          topGeo.rotateX(Math.PI);
          const topLeaves = new THREE.Mesh(topGeo, greenMat);
          topLeaves.position.y = 0.2 * scale;

          cGroup.add(topLeaves);

          if (isReady) {
            const carrotBody = new THREE.ConeGeometry(0.1 * scale, 0.3 * scale, 5);
            carrotBody.rotateX(Math.PI);
            const carrotMesh = new THREE.Mesh(carrotBody, orangeMat);
            carrotMesh.position.y = 0.08;
            cGroup.add(carrotMesh);
          }

          const angle = (i / 3) * Math.PI * 2;
          cGroup.position.set(Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2);
          group.add(cGroup);
        }
        break;
      }

      case 'corn': {
        const yellowMat = new THREE.MeshLambertMaterial({ color: '#facc15', flatShading: true });
        const stalkGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.9 * scale, 5);
        const stalk = new THREE.Mesh(stalkGeo, stemMat);
        stalk.position.y = 0.45 * scale;
        group.add(stalk);

        // Leaves
        for (let l = 0; l < 4; l++) {
          const leafGeo = new THREE.BoxGeometry(0.03, 0.3 * scale, 0.15 * scale);
          const leaf = new THREE.Mesh(leafGeo, greenMat);
          leaf.position.set(0, (0.3 + l * 0.1) * scale, 0);
          leaf.rotation.y = (l * Math.PI) / 2;
          leaf.rotation.z = 0.4;
          group.add(leaf);
        }

        if (isReady) {
          const cobGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6);
          const cob = new THREE.Mesh(cobGeo, yellowMat);
          cob.position.set(0.08, 0.5 * scale, 0);
          cob.rotation.z = -0.3;
          group.add(cob);
        }
        break;
      }

      case 'tomato': {
        const redMat = new THREE.MeshLambertMaterial({ color: isReady ? '#ef4444' : '#84cc16', flatShading: true });
        const bushGeo = new THREE.DodecahedronGeometry(0.35 * scale, 0);
        const bush = new THREE.Mesh(bushGeo, stemMat);
        bush.position.y = 0.35 * scale;
        bush.castShadow = true;
        group.add(bush);

        if (isReady) {
          const fruitGeo = new THREE.DodecahedronGeometry(0.1, 0);
          const positions = [
            [0.2, 0.35, 0.2],
            [-0.2, 0.4, -0.1],
            [0.1, 0.25, -0.25],
            [-0.15, 0.3, 0.2]
          ];
          positions.forEach(([x, y, z]) => {
            const fruit = new THREE.Mesh(fruitGeo, redMat);
            fruit.position.set(x * scale, y * scale, z * scale);
            fruit.castShadow = true;
            group.add(fruit);
          });
        }
        break;
      }

      case 'pumpkin': {
        const pumpkinMat = new THREE.MeshLambertMaterial({ color: isReady ? '#ea580c' : '#65a30d', flatShading: true });
        const vineGeo = new THREE.TorusGeometry(0.25 * scale, 0.03, 4, 8);
        vineGeo.rotateX(Math.PI / 2);
        const vine = new THREE.Mesh(vineGeo, stemMat);
        vine.position.y = 0.05;
        group.add(vine);

        const pumpkinGeo = new THREE.CylinderGeometry(0.32 * scale, 0.35 * scale, 0.28 * scale, 8);
        const pumpkin = new THREE.Mesh(pumpkinGeo, pumpkinMat);
        pumpkin.position.y = 0.18 * scale;
        pumpkin.castShadow = true;

        const stemTopGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.1, 4);
        const stemTop = new THREE.Mesh(stemTopGeo, stemMat);
        stemTop.position.y = (0.32 + 0.05) * scale;

        group.add(pumpkin, stemTop);
        break;
      }
    }

    return group;
  }
}
