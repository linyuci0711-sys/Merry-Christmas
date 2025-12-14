import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, PALETTE } from '../types';
import { getConePoint, getSpherePoint, TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS } from '../utils';

const COUNT = 15000; // Number of particles

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMorph: { value: 0 }, // 0 = Scattered, 1 = Tree
    uColorBase: { value: new THREE.Color(PALETTE.emerald) },
    uColorTip: { value: new THREE.Color(PALETTE.gold) },
    uMouse: { value: new THREE.Vector3(9999, 9999, 9999) }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorph;
    uniform vec3 uMouse;
    
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    
    varying float vAlpha;
    varying float vRandom;
    
    float cubicInOut(float t) {
      return t < 0.5
        ? 4.0 * t * t * t
        : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
    }

    void main() {
      vRandom = aRandom;
      float easeMorph = cubicInOut(uMorph);
      
      // Mix positions
      vec3 pos = mix(aScatterPos, aTreePos, easeMorph);
      
      // Interaction: Mouse Hover Effect
      float dist = distance(pos, uMouse);
      float interactRadius = 4.0;
      float interactStrength = 1.0 - smoothstep(0.0, interactRadius, dist);
      
      if (interactStrength > 0.0) {
        vec3 pushDir = normalize(pos - uMouse);
        pos += pushDir * interactStrength * 1.5;
      }
      
      // Add breathing/wind effect
      float breath = sin(uTime * 2.0 + pos.y * 0.5 + aRandom * 5.0) * 0.1;
      pos.x += breath * (1.0 - easeMorph * 0.8);
      pos.z += breath * (1.0 - easeMorph * 0.8);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation - Reduced base size to look less like "dots"
      float size = (3.0 * aRandom + 1.0); 
      size += interactStrength * 12.0; 
      gl_PointSize = size * (30.0 / -mvPosition.z);
      
      // Alpha - Higher base alpha for solid look
      vAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom * 10.0);
      vAlpha += interactStrength * 2.0;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    uniform float uTime;
    
    varying float vAlpha;
    varying float vRandom;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distFromCenter = length(coord) * 2.0; 
      
      // Hard cutoff to avoid blurry transparent edges
      if(distFromCenter > 0.8) discard;
      
      // Base color is Emerald
      vec3 col = uColorBase;
      
      // Dynamic Sparkle
      float sparkleSpeed = 4.0;
      float sparkleOffset = vRandom * 100.0;
      float sparkle = 0.5 + 0.5 * sin(uTime * sparkleSpeed + sparkleOffset);
      sparkle = pow(sparkle, 3.0); 

      // Edge detection for Gold Tip
      float edgeFactor = smoothstep(0.4, 0.8, distFromCenter);
      
      // Mix: Inner Green -> Outer Gold
      vec3 tipColor = uColorTip * (1.0 + sparkle * 1.2); 
      
      col = mix(col, tipColor, edgeFactor);
      
      // Center highlight
      col += vec3(0.1) * (1.0 - distFromCenter);

      gl_FragColor = vec4(col, vAlpha);
    }
  `
};

interface FoliageProps {
  treeState: TreeMorphState;
}

const Foliage: React.FC<FoliageProps> = ({ treeState }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef(new THREE.Vector3(9999, 9999, 9999));
  
  const [positions, scatterPositions, treePositions, randoms] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const scat = new Float32Array(COUNT * 3);
    const tree = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const sPt = getSpherePoint(SCATTER_RADIUS);
      const tPt = getConePoint(TREE_RADIUS, TREE_HEIGHT);

      scat[i * 3] = sPt.x;
      scat[i * 3 + 1] = sPt.y;
      scat[i * 3 + 2] = sPt.z;

      tree[i * 3] = tPt.x;
      tree[i * 3 + 1] = tPt.y;
      tree[i * 3 + 2] = tPt.z;

      pos[i * 3] = sPt.x;
      pos[i * 3 + 1] = sPt.y;
      pos[i * 3 + 2] = sPt.z;

      rand[i] = Math.random();
    }
    return [pos, scat, tree, rand];
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      const targetMorph = treeState === TreeMorphState.TREE_SHAPE ? 1.0 : 0.0;
      const currentMorph = materialRef.current.uniforms.uMorph.value;
      const speed = 2.0 * delta;
      
      if (Math.abs(currentMorph - targetMorph) > 0.001) {
          materialRef.current.uniforms.uMorph.value = THREE.MathUtils.lerp(currentMorph, targetMorph, speed);
      } else {
        materialRef.current.uniforms.uMorph.value = targetMorph;
      }
      
      materialRef.current.uniforms.uMouse.value.lerp(mouseRef.current, delta * 10);
    }
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    mouseRef.current.copy(e.point);
  };

  const handlePointerOut = () => {
    mouseRef.current.set(9999, 9999, 9999);
  };

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-aScatterPos" count={COUNT} array={scatterPositions} itemSize={3} />
          <bufferAttribute attach="attributes-aTreePos" count={COUNT} array={treePositions} itemSize={3} />
          <bufferAttribute attach="attributes-aRandom" count={COUNT} array={randoms} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          args={[FoliageShaderMaterial]}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh 
        onPointerMove={handlePointerMove} 
        onPointerOut={handlePointerOut}
        scale={[1.2, 1.2, 1.2]}
      >
        {treeState === TreeMorphState.TREE_SHAPE ? (
           <coneGeometry args={[TREE_RADIUS, TREE_HEIGHT, 16]} />
        ) : (
           <sphereGeometry args={[SCATTER_RADIUS]} />
        )}
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
};

export default Foliage;