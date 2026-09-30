import * as THREE from 'three';

export interface DecorationDefinition {
  id: string;
  name: string;
  category: 'nature' | 'structure' | 'furniture' | 'path';
  cost: number;
  icon: string;
  sizeX: number;
  sizeZ: number;
}

export const DECORATIONS: Record<string, DecorationDefinition> = {
  fence: {
    id: 'fence',
    name: 'Pagar Kayu (Wooden Fence)',
    category: 'structure',
    cost: 15,
    icon: '🪵',
    sizeX: 1,
    sizeZ: 1
  },
  stone_path: {
    id: 'stone_path',
    name: 'Jalan Batu (Stone Path)',
    category: 'path',
    cost: 5,
    icon: '🪨',
    sizeX: 1,
    sizeZ: 1
  },
  oak_tree: {
    id: 'oak_tree',
    name: 'Pohon Oak (Oak Tree)',
    category: 'nature',
    cost: 40,
    icon: '🌳',
    sizeX: 1,
    sizeZ: 1
  },
  pine_tree: {
    id: 'pine_tree',
    name: 'Pohon Pinus (Pine Tree)',
    category: 'nature',
    cost: 35,
    icon: '🌲',
    sizeX: 1,
    sizeZ: 1
  },
  flower_bed: {
    id: 'flower_bed',
    name: 'Taman Bunga (Flower Bed)',
    category: 'nature',
    cost: 25,
    icon: '🌸',
    sizeX: 1,
    sizeZ: 1
  },
  street_lamp: {
    id: 'street_lamp',
    name: 'Lampu Taman (Street Lamp)',
    category: 'furniture',
    cost: 60,
    icon: '💡',
    sizeX: 1,
    sizeZ: 1
  },
  bench: {
    id: 'bench',
    name: 'Bangku Kayu (Wooden Bench)',
    category: 'furniture',
    cost: 50,
    icon: '🪑',
    sizeX: 1,
    sizeZ: 1
  },
  water_well: {
    id: 'water_well',
    name: 'Sumur Air (Water Well)',
    category: 'structure',
    cost: 120,
    icon: '🛢️',
    sizeX: 1,
    sizeZ: 1
  },
  hay_bale: {
    id: 'hay_bale',
    name: 'Jerami (Hay Bale)',
    category: 'furniture',
    cost: 30,
    icon: '🌾',
    sizeX: 1,
    sizeZ: 1
  },
  scarecrow: {
    id: 'scarecrow',
    name: 'Orang-orangan Sawah (Scarecrow)',
    category: 'structure',
    cost: 75,
    icon: '🧑‍🌾',
    sizeX: 1,
    sizeZ: 1
  },
  cottage: {
    id: 'cottage',
    name: 'Pondok / Cottage',
    category: 'structure',
    cost: 300,
    icon: '🏡',
    sizeX: 2,
    sizeZ: 2
  },
  barn: {
    id: 'barn',
    name: 'Lumbung Padi (Barn)',
    category: 'structure',
    cost: 500,
    icon: '🏚️',
    sizeX: 2,
    sizeZ: 2
  }
};

export class DecorationMeshBuilder {
  public static createDecorationMesh(decorationId: string): THREE.Group {
    const group = new THREE.Group();

    // Materials
    const woodMat = new THREE.MeshLambertMaterial({ color: '#8d5b4c', flatShading: true });
    const darkWoodMat = new THREE.MeshLambertMaterial({ color: '#5c3d2e', flatShading: true });
    const leafMat = new THREE.MeshLambertMaterial({ color: '#22c55e', flatShading: true });
    const darkLeafMat = new THREE.MeshLambertMaterial({ color: '#15803d', flatShading: true });
    const stoneMat = new THREE.MeshLambertMaterial({ color: '#94a3b8', flatShading: true });
    const darkStoneMat = new THREE.MeshLambertMaterial({ color: '#64748b', flatShading: true });
    const yellowMat = new THREE.MeshLambertMaterial({ color: '#eab308', flatShading: true });
    const redMat = new THREE.MeshLambertMaterial({ color: '#dc2626', flatShading: true });
    const roofMat = new THREE.MeshLambertMaterial({ color: '#b91c1c', flatShading: true });
    const whiteMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', flatShading: true });
    const glowMat = new THREE.MeshBasicMaterial({ color: '#fde047' });

    switch (decorationId) {
      case 'fence': {
        // Wooden fence post & rails
        const postGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
        const post1 = new THREE.Mesh(postGeo, darkWoodMat);
        post1.position.set(-0.4, 0.3, 0);
        post1.castShadow = true;

        const post2 = new THREE.Mesh(postGeo, darkWoodMat);
        post2.position.set(0.4, 0.3, 0);
        post2.castShadow = true;

        const railGeo = new THREE.BoxGeometry(0.9, 0.08, 0.06);
        const rail1 = new THREE.Mesh(railGeo, woodMat);
        rail1.position.set(0, 0.2, 0);
        rail1.castShadow = true;

        const rail2 = new THREE.Mesh(railGeo, woodMat);
        rail2.position.set(0, 0.45, 0);
        rail2.castShadow = true;

        group.add(post1, post2, rail1, rail2);
        break;
      }

      case 'stone_path': {
        // Neat low-poly 2x2 grid of square flagstone pavers with subtle bevels and gap spacing
        const borderGeo = new THREE.BoxGeometry(0.92, 0.02, 0.92);
        const borderMat = new THREE.MeshLambertMaterial({ color: '#475569', flatShading: true });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.y = 0.01;
        borderMesh.receiveShadow = true;
        group.add(borderMesh);

        const offsets = [-0.22, 0.22];
        const stoneMat1 = new THREE.MeshLambertMaterial({ color: '#cbd5e1', flatShading: true });
        const stoneMat2 = new THREE.MeshLambertMaterial({ color: '#94a3b8', flatShading: true });

        let idx = 0;
        for (const x of offsets) {
          for (const z of offsets) {
            const tileGeo = new THREE.BoxGeometry(0.4, 0.05, 0.4);
            const tileMesh = new THREE.Mesh(tileGeo, idx % 2 === 0 ? stoneMat1 : stoneMat2);
            tileMesh.position.set(x, 0.035, z);
            tileMesh.castShadow = true;
            tileMesh.receiveShadow = true;
            group.add(tileMesh);
            idx++;
          }
        }
        break;
      }

      case 'oak_tree': {
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.8, 6);
        const trunk = new THREE.Mesh(trunkGeo, darkWoodMat);
        trunk.position.y = 0.4;
        trunk.castShadow = true;

        // Foliage (low poly spheres)
        const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), leafMat);
        crown1.position.set(0, 1.1, 0);
        crown1.castShadow = true;

        const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), darkLeafMat);
        crown2.position.set(0.2, 1.3, -0.1);
        crown2.castShadow = true;

        group.add(trunk, crown1, crown2);
        break;
      }

      case 'pine_tree': {
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 5);
        const trunk = new THREE.Mesh(trunkGeo, darkWoodMat);
        trunk.position.y = 0.3;
        trunk.castShadow = true;

        // Pine layers (cones)
        for (let i = 0; i < 3; i++) {
          const coneGeo = new THREE.ConeGeometry(0.55 - i * 0.12, 0.5, 5);
          const cone = new THREE.Mesh(coneGeo, i % 2 === 0 ? darkLeafMat : leafMat);
          cone.position.y = 0.6 + i * 0.35;
          cone.castShadow = true;
          group.add(cone);
        }
        group.add(trunk);
        break;
      }

      case 'flower_bed': {
        // Soil box
        const boxGeo = new THREE.BoxGeometry(0.85, 0.12, 0.85);
        const box = new THREE.Mesh(boxGeo, darkWoodMat);
        box.position.y = 0.06;
        box.castShadow = true;
        group.add(box);

        const flowerColors = ['#f43f5e', '#a855f7', '#3b82f6', '#facc15', '#ec4899'];
        for (let i = 0; i < 8; i++) {
          const fMat = new THREE.MeshLambertMaterial({
            color: flowerColors[i % flowerColors.length],
            flatShading: true
          });
          const flowerGeo = new THREE.DodecahedronGeometry(0.08, 0);
          const flower = new THREE.Mesh(flowerGeo, fMat);
          flower.position.set(
            (Math.random() - 0.5) * 0.6,
            0.18,
            (Math.random() - 0.5) * 0.6
          );
          flower.castShadow = true;
          group.add(flower);
        }
        break;
      }

      case 'street_lamp': {
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.2, 6);
        const pole = new THREE.Mesh(poleGeo, darkStoneMat);
        pole.position.y = 0.6;
        pole.castShadow = true;

        const lampHeadGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const lampHead = new THREE.Mesh(lampHeadGeo, glowMat);
        lampHead.position.y = 1.2;

        const topCapGeo = new THREE.ConeGeometry(0.2, 0.1, 4);
        const topCap = new THREE.Mesh(topCapGeo, darkStoneMat);
        topCap.position.y = 1.35;

        group.add(pole, lampHead, topCap);
        break;
      }

      case 'bench': {
        // Bench slats & legs
        const legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.4);
        const leg1 = new THREE.Mesh(legGeo, darkStoneMat);
        leg1.position.set(-0.3, 0.175, 0);

        const leg2 = new THREE.Mesh(legGeo, darkStoneMat);
        leg2.position.set(0.3, 0.175, 0);

        const seatGeo = new THREE.BoxGeometry(0.8, 0.05, 0.35);
        const seat = new THREE.Mesh(seatGeo, woodMat);
        seat.position.set(0, 0.35, 0);
        seat.castShadow = true;

        const backGeo = new THREE.BoxGeometry(0.8, 0.3, 0.05);
        const back = new THREE.Mesh(backGeo, woodMat);
        back.position.set(0, 0.55, -0.15);
        back.castShadow = true;

        group.add(leg1, leg2, seat, back);
        break;
      }

      case 'water_well': {
        // Base rim
        const rimGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.4, 8);
        const rim = new THREE.Mesh(rimGeo, stoneMat);
        rim.position.y = 0.2;
        rim.castShadow = true;

        // Inside water surface
        const waterGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 8);
        const waterMat = new THREE.MeshLambertMaterial({ color: '#38bdf8' });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 0.32;

        // Wooden posts and roof
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), darkWoodMat);
        p1.position.set(-0.32, 0.55, 0);
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), darkWoodMat);
        p2.position.set(0.32, 0.55, 0);

        const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), roofMat);
        wellRoof.position.y = 1.0;
        wellRoof.rotation.y = Math.PI / 4;
        wellRoof.castShadow = true;

        group.add(rim, water, p1, p2, wellRoof);
        break;
      }

      case 'hay_bale': {
        const baleGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
        const bale = new THREE.Mesh(baleGeo, yellowMat);
        bale.position.y = 0.2;
        bale.castShadow = true;

        const stringGeo = new THREE.BoxGeometry(0.62, 0.42, 0.04);
        const str1 = new THREE.Mesh(stringGeo, redMat);
        str1.position.set(0, 0.2, 0.1);
        const str2 = new THREE.Mesh(stringGeo, redMat);
        str2.position.set(0, 0.2, -0.1);

        group.add(bale, str1, str2);
        break;
      }

      case 'scarecrow': {
        // Wooden cross
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 5), darkWoodMat);
        pole.position.y = 0.55;

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), darkWoodMat);
        arm.position.y = 0.75;
        arm.rotation.z = Math.PI / 2;

        // Shirt
        const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.2), redMat);
        shirt.position.y = 0.7;
        shirt.castShadow = true;

        // Pumpkin head
        const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), yellowMat);
        head.position.y = 0.98;
        head.castShadow = true;

        group.add(pole, arm, shirt, head);
        break;
      }

      case 'cottage': {
        // 2x2 Cottage
        const houseGeo = new THREE.BoxGeometry(1.6, 1.1, 1.5);
        const house = new THREE.Mesh(houseGeo, whiteMat);
        house.position.set(0.5, 0.55, 0.5);
        house.castShadow = true;

        const roofG = new THREE.ConeGeometry(1.4, 0.8, 4);
        roofG.rotateY(Math.PI / 4);
        const roof = new THREE.Mesh(roofG, roofMat);
        roof.position.set(0.5, 1.5, 0.5);
        roof.castShadow = true;

        const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.05), darkWoodMat);
        door.position.set(0.5, 0.3, 1.26);

        group.add(house, roof, door);
        break;
      }

      case 'barn': {
        // 2x2 Barn
        const barnGeo = new THREE.BoxGeometry(1.7, 1.3, 1.6);
        const barnMesh = new THREE.Mesh(barnGeo, redMat);
        barnMesh.position.set(0.5, 0.65, 0.5);
        barnMesh.castShadow = true;

        const roofBarn = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.7), darkWoodMat);
        roofBarn.position.set(0.5, 1.4, 0.5);
        roofBarn.castShadow = true;

        const bDoor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.05), whiteMat);
        bDoor.position.set(0.5, 0.4, 1.31);

        group.add(barnMesh, roofBarn, bDoor);
        break;
      }
    }

    return group;
  }
}
