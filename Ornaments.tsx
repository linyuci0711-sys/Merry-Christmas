import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, PALETTE } from '../types';
import { getConePoint, getSpherePoint, TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS } from '../utils';

// Configuration for distinct ornament types
const CONFIG = {
  GIFTS: { count: 40, weight: 0.3, scaleBase: 0.5 },    // Heavy, big
  BAUBLES: { count: 250, weight: 1.0, scaleBase: 0.25 }, // Medium, increased count for density
  LIGHTS: { count: 150, weight: 2.5, scaleBase: 0.12 }   // Very light, small
};

const DUMMY = new THREE.Object3D();

interface OrnamentItem {
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  scale: number;
  color: THREE.Color;
  weight: number; // 0 to infinity, higher = lighter/more floaty
  randomOffset: number; // For animation timing
}

interface OrnamentsProps {
  treeState: TreeMorphState;
}

const Ornaments: React.FC<OrnamentsProps> = ({ treeState }) => {
  const giftsRef = useRef<THREE.InstancedMesh>(null);
  const baublesRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  
  const morphRef = useRef(0);

  // Generate Data for all types
  const { gifts, baubles, lights } = useMemo(() => {
    const generateItems = (count: number, config: { weight: number, scaleBase: number }, colors: THREE.Color[]) => {
      const items: OrnamentItem[] = [];
      for (let i = 0; i < count; i++) {
        // Tree placement
        const tPtRaw = getConePoint(TREE_RADIUS, TREE_HEIGHT);
        const distXZ = Math.sqrt(tPtRaw.x * tPtRaw.x + tPtRaw.z * tPtRaw.z);
        // Push heavy items slightly more into the tree, light items on tips
        const pushScalar = 1.0 + (Math.random() * 0.2 * config.weight); 
        if (distXZ > 0.1) {
           tPtRaw.x *= pushScalar;
           tPtRaw.z *= pushScalar;
        }

        items.push({
          scatterPos: getSpherePoint(SCATTER_RADIUS * (0.8 + config.weight * 0.1)), 
          treePos: tPtRaw,
          rotationSpeed: new THREE.Vector3(
            Math.random() - 0.5, 
            Math.random() - 0.5, 
            Math.random() - 0.5
          ).multiplyScalar(config.weight),
          scale: config.scaleBase * (0.8 + Math.random() * 0.4),
          color: colors[Math.floor(Math.random() * colors.length)],
          weight: config.weight,
          randomOffset: Math.random() * 100
        });
      }
      return items;
    };

    // 1. Gift Colors
    const giftColors = [new THREE.Color(PALETTE.ruby), new THREE.Color(PALETTE.gold)];

    // 2. Bauble Colors: Expanded Gradient Palette (Opaque & Rich)
    const baubleColors = [
        // --- Reds (Ruby to Deep Maroon) ---
        new THREE.Color(PALETTE.ruby),
        new THREE.Color("#720e1e"), // Darker Wine Red
        new THREE.Color("#b91c1c"), // Vibrant Red
        
        // --- Golds (Champagne to Bronze) ---
        new THREE.Color(PALETTE.gold),
        new THREE.Color("#DAA520"), // Goldenrod
        new THREE.Color("#B8860B"), // Dark Goldenrod
        new THREE.Color("#F0E68C"), // Khaki/Champagne
        new THREE.Color("#CD7F32"), // Bronze

        // --- Greens (Emerald to Forest) ---
        new THREE.Color(PALETTE.emerald),
        new THREE.Color("#1a472a"), // Hunter Green
        new THREE.Color("#2d5a27"), // Forest Green

        // --- Accents (Silver/Pearl) ---
        new THREE.Color("#E0E0E0"), // Platinum
    ];

    // 3. Light Colors
    const lightColors = [new THREE.Color(PALETTE.warmWhite), new THREE.Color(PALETTE.gold)];

    return {
      gifts: generateItems(CONFIG.GIFTS.count, CONFIG.GIFTS, giftColors),
      baubles: generateItems(CONFIG.BAUBLES.count, CONFIG.BAUBLES, baubleColors),
      lights: generateItems(CONFIG.LIGHTS.count, CONFIG.LIGHTS, lightColors)
    };
  }, []);

  useLayoutEffect(() => {
    // Apply colors initially
    const applyColors = (ref: React.RefObject<THREE.InstancedMesh>, items: OrnamentItem[]) => {
      if (ref.current) {
        items.forEach((item, i) => ref.current!.setColorAt(i, item.color));
        ref.current.instanceColor!.needsUpdate = true;
      }
    };
    applyColors(giftsRef, gifts);
    applyColors(baublesRef, baubles);
    applyColors(lightsRef, lights);
  }, [gifts, baubles, lights]);

  useFrame((state, delta) => {
    const targetMorph = treeState === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
    morphRef.current = THREE.MathUtils.lerp(morphRef.current, targetMorph, delta * 2.0);
    const m = morphRef.current;
    const time = state.clock.elapsedTime;

    const animateMesh = (ref: React.RefObject<THREE.InstancedMesh>, items: OrnamentItem[]) => {
      if (!ref.current) return;
      
      items.forEach((item, i) => {
        // Weighted Morph
        const itemM = THREE.MathUtils.clamp(m * (1.2 - item.weight * 0.1), 0, 1);

        // Interpolate position
        const pos = new THREE.Vector3().lerpVectors(item.scatterPos, item.treePos, itemM);
        
        // Float effect
        if (itemM < 0.95) {
          const floatAmp = (1 - itemM) * item.weight * 0.5; 
          const floatFreq = 1.0 + item.weight;
          pos.y += Math.sin(time * floatFreq + item.scatterPos.x) * floatAmp;
          pos.x += Math.cos(time * floatFreq * 0.5 + item.scatterPos.y) * floatAmp * 0.5;
        }

        DUMMY.position.copy(pos);
        
        // Rotation
        DUMMY.rotation.x += item.rotationSpeed.x * delta * (1 - itemM * 0.95); 
        DUMMY.rotation.y += item.rotationSpeed.y * delta;
        DUMMY.rotation.z += item.rotationSpeed.z * delta * (1 - itemM * 0.95);

        // Scale Logic
        let currentScale = item.scale;
        
        // Twinkle effect for Lights (high weight items)
        if (item.weight > 2.0) {
            const twinkle = Math.sin(time * 3.0 + item.randomOffset) * 0.5 + 0.5;
            currentScale *= (0.8 + twinkle * 0.4);
        }

        DUMMY.scale.setScalar(currentScale);
        
        // Pop effect
        if (itemM > 0.9 && itemM < 0.98) {
             DUMMY.scale.multiplyScalar(1.1);
        }

        DUMMY.updateMatrix();
        ref.current!.setMatrixAt(i, DUMMY.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    };

    animateMesh(giftsRef, gifts);
    animateMesh(baublesRef, baubles);
    animateMesh(lightsRef, lights);
  });

  return (
    <group>
      {/* Heavy Gifts (Boxes) */}
      <instancedMesh ref={giftsRef} args={[undefined, undefined, CONFIG.GIFTS.count]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.3} metalness={0.4} envMapIntensity={0.8} />
      </instancedMesh>

      {/* Medium Baubles (Spheres) - Opaque Satin Metal Look */}
      {/* roughness 0.25 makes it feel like painted metal/ceramic, metalness 0.6 gives shine without being a mirror */}
      <instancedMesh ref={baublesRef} args={[undefined, undefined, CONFIG.BAUBLES.count]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
            roughness={0.25} 
            metalness={0.6} 
            envMapIntensity={1.0}
            color="#ffffff" /* White base is critical for instance colors to show correctly */
        />
      </instancedMesh>

      {/* Very Light Lights/Stars - Emissive */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, CONFIG.LIGHTS.count]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={0.8} 
            emissive={PALETTE.gold}
            emissiveIntensity={1.5}
            toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};

export default Ornaments;