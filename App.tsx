import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { TreeMorphState, PALETTE } from './types';
import Experience from './components/Experience';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeMorphState.SCATTERED 
        ? TreeMorphState.TREE_SHAPE 
        : TreeMorphState.SCATTERED
    );
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-black via-[#00100a] to-[#022b1c] overflow-hidden relative font-serif">
      
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
            <Experience treeState={treeState} />
        </Suspense>
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center py-10 z-10">
        
        {/* Header / Brand */}
        <div className="text-center opacity-80 mt-4">
            <h3 className="text-[#FFD700] text-xs tracking-[0.5em] uppercase mb-2">Arix Signature</h3>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-[#FFD700] to-transparent mx-auto"></div>
        </div>

        {/* Footer / Controls */}
        <div className="flex flex-col items-center gap-6 mb-8 pointer-events-auto">
             {/* Calligraphy Text */}
             <h1 
                className="text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-br from-[#FFF8DC] via-[#FFD700] to-[#B8860B] drop-shadow-lg"
                style={{ fontFamily: '"Great Vibes", cursive' }}
             >
                Merry Christmas
            </h1>

            {/* Interaction Button */}
            <button
                onClick={toggleState}
                className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-full border border-[#FFD700]/30 transition-all duration-500 hover:border-[#FFD700]"
            >
                <div className="absolute inset-0 w-0 bg-[#FFD700]/10 transition-all duration-[250ms] ease-out group-hover:w-full opacity-0 group-hover:opacity-100" />
                <span className="relative text-[#FFD700] text-sm tracking-widest uppercase font-light">
                    {treeState === TreeMorphState.SCATTERED ? 'Assemble Tree' : 'Scatter Magic'}
                </span>
            </button>
        </div>
      </div>
      
      {/* Decorative Vignette Overlay (CSS based) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};

export default App;
