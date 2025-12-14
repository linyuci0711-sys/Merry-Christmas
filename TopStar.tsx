import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, PALETTE } from '../types';
import { TREE_HEIGHT } from '../utils';

interface TopStarProps {
  treeState: TreeMorphState;
}

const TopStar: React.FC<TopStarProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Generate 5-pointed star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.35;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      // Rotate by -PI/2 to point upwards
      const x = Math.cos(angle - Math.PI / 2) * radius;
      const y = Math.sin(angle - Math.PI / 2) * radius;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
  }), []);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotation
      groupRef.current.rotation.y += delta * 0.5;

      // Position logic
      const targetY = treeState === TreeMorphState.TREE_SHAPE ? (TREE_HEIGHT / 2) + 0.5 : 15;
      const targetScale = treeState === TreeMorphState.TREE_SHAPE ? 1 : 0.01;

      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 2);
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);
    }
    
    const time = state.clock.elapsedTime;
    
    // Twinkle Animation - Reduced Range
    const pulse = (Math.sin(time * 2.0) + Math.sin(time * 5.0) * 0.5) * 0.2; 
    
    if (materialRef.current) {
        materialRef.current.emissiveIntensity = 1.5 + pulse;
    }
    
    if (lightRef.current) {
        lightRef.current.intensity = 3.0 + pulse * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      <mesh>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial 
            ref={materialRef}
            color={PALETTE.gold} 
            emissive={PALETTE.gold} 
            emissiveIntensity={1.5}
            roughness={0.1}
            metalness={1}
        />
      </mesh>
      {/* Point Light source - Reduced Intensity */}
      <pointLight 
        ref={lightRef}
        color={PALETTE.warmWhite} 
        intensity={3} 
        distance={10} 
        decay={2} 
      />
    </group>
  );
};

export default TopStar;