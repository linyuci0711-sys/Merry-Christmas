import * as THREE from 'three';

// Configuration
export const TREE_HEIGHT = 12;
export const TREE_RADIUS = 5;
export const SCATTER_RADIUS = 25;

/**
 * Generates a random point inside a cone (The Tree)
 */
export const getConePoint = (radius: number, height: number): THREE.Vector3 => {
  const y = Math.random() * height; // Height from bottom (0 to height)
  // The radius at this height decreases as we go up
  const rAtHeight = radius * (1 - y / height);
  
  // Random angle
  const theta = Math.random() * Math.PI * 2;
  // Random distance from center (using sqrt for uniform distribution)
  const r = Math.sqrt(Math.random()) * rAtHeight;

  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  // Center the tree vertically around 0 roughly, shifting down
  return new THREE.Vector3(x, y - height / 2, z);
};

/**
 * Generates a random point on/in a sphere (The Scatter)
 */
export const getSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius; // Cubic root for uniform volume

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};
