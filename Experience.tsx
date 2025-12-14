import React from 'react';
import { PerspectiveCamera, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeMorphState } from '../types';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import TopStar from './TopStar';

interface ExperienceProps {
  treeState: TreeMorphState;
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 22]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={40}
        autoRotate={treeState === TreeMorphState.TREE_SHAPE}
        autoRotateSpeed={0.5}
      />

      {/* Lighting - Dramatic & Cinematic (Toned down) */}
      <ambientLight intensity={0.05} color="#001a0f" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={1.0} 
        color="#fff5e6" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={0.8} color="#8B0000" />
      <pointLight position={[10, 5, -10]} intensity={0.8} color="#FFD700" />

      {/* Environment for Reflections */}
      {/* Keeping city for nice reflections, but materials will handle intensity */}
      <Environment preset="city" blur={0.8} background={false} />

      {/* 3D Components - Lowered position to align tree bottom with UI text */}
      <group position={[0, 1.0, 0]}>
        <Foliage treeState={treeState} />
        <Ornaments treeState={treeState} />
        <TopStar treeState={treeState} />
        
        {/* Floor Reflections/Shadows */}
        <ContactShadows 
            position={[0, -7.5, 0]}
            opacity={0.5} 
            scale={40} 
            blur={3.0} 
            far={20} 
            resolution={256} 
            color="#000000" 
        />
      </group>

      {/* Post Processing - Reduced Bloom Intensity */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={1.5} 
            mipmapBlur 
            intensity={0.5} 
            radius={0.4} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

export default Experience;