/*
 * heroTreeScene.js
 *
 * This module exports a helper function that mounts an animated Three.js scene
 * into a specified DOM element. The scene depicts a stylised fractal tree
 * surrounded by glowing particles. The tree slowly grows over time and
 * responds to mouse movement by rotating on its axes. The overall colour
 * palette (neon greens on a deep, dark background) is inspired by the
 * existing Lovable sprint creation platform hero section.
 *
 * To use this component on your page:
 *   1. Import this module into your JavaScript bundle.
 *   2. Call `initHeroScene(element)` once, passing in a DOM node (e.g.
 *      document.getElementById('hero-canvas')). The function will
 *      automatically create a canvas, attach it to the provided element
 *      and start the animation loop.
 *   3. To clean up when the component is removed, call the return value
 *      of `initHeroScene()` which removes event listeners and stops the
 *      animation.
 */

import * as THREE from 'three';

/**
 * Recursively build a branching tree structure. Each branch is a tapered
 * cylinder. Child branches emanate from the top of the parent at opposing
 * angles. The geometry is built using meshes and nested groups so that
 * rotations and positioning are propagated down the hierarchy automatically.
 *
 * @param {THREE.Group} parent - the parent group to attach the new branch to
 * @param {number} depth - how many generations of branches remain
 * @param {number} length - the length of this branch
 * @param {number} radius - the starting radius of this branch (tapering down)
 * @param {THREE.Material} material - the material used for each branch
 */
function addBranch(parent, depth, length, radius, material) {
  if (depth <= 0) return;

  // Create the cylinder geometry for this segment. The base is slightly
  // thicker than the top to give a natural taper.
  const geometry = new THREE.CylinderGeometry(radius * 0.4, radius, length, 8);
  const branchMesh = new THREE.Mesh(geometry, material);

  // Position the mesh so that its base sits at the parent's origin and
  // its top extends upward along the y-axis.
  branchMesh.position.y = length / 2;
  parent.add(branchMesh);

  // Determine child parameters. Each subsequent generation shrinks in
  // length and radius to give the impression of tapering limbs.
  const childLength = length * 0.7;
  const childRadius = radius * 0.65;

  // Left child branch
  const left = new THREE.Group();
  left.position.y = length;
  // Rotate slightly forward/back and left
  left.rotation.set(THREE.MathUtils.degToRad(-15), 0, THREE.MathUtils.degToRad(30));
  branchMesh.add(left);
  addBranch(left, depth - 1, childLength, childRadius, material);

  // Right child branch
  const right = new THREE.Group();
  right.position.y = length;
  // Rotate slightly forward/back and right
  right.rotation.set(THREE.MathUtils.degToRad(-15), 0, THREE.MathUtils.degToRad(-30));
  branchMesh.add(right);
  addBranch(right, depth - 1, childLength, childRadius, material);
}

/**
 * Initialise the Three.js hero scene within a given container. This function
 * encapsulates all the setup, animation, and event handling required to
 * render the animated tree. It returns a clean‑up function that should
 * be invoked if the scene is ever torn down (e.g. when navigating away
 * from the page) to avoid memory leaks.
 *
 * @param {HTMLElement} container - the DOM node to mount the scene to
 * @returns {() => void} a function that, when called, cleans up the scene
 */
export function initHeroScene(container) {
  // Determine the dimensions of the container. Use the container's size so
  // the canvas fills the available space. If the container resizes after
  // initialisation, you may need to handle that externally.
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create the scene and set a dark background. The deep green/black tone
  // echoes the existing design of the Lovable platform.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x031a13);

  // Set up a camera. A perspective camera with a medium field of view
  // gives depth to the composition. Position it so that the entire tree
  // fits within view.
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 2.5, 5);

  // Add a gentle ambient light so the tree is visible without harsh shadows.
  const ambient = new THREE.AmbientLight(0x406e5c, 1.2);
  scene.add(ambient);

  // Create the fractal tree as a group. We'll animate this group's scale
  // over time to simulate growth and respond to mouse movement by altering
  // its rotation.
  const treeGroup = new THREE.Group();
  scene.add(treeGroup);

  // Define a material with emissive properties to make the tree glow. The
  // emissive term makes the branches appear luminous against the dark
  // background, tying into the concept of life and transformation.
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x34e7a8),
    emissive: new THREE.Color(0x1fae6b),
    metalness: 0.1,
    roughness: 0.5,
  });
  // Build the tree recursively. Adjust depth to control complexity (5–6 is
  // plenty for performance and aesthetics).
  addBranch(treeGroup, 5, 1, 0.1, branchMaterial);

  // Create a field of floating particles around the tree. These points
  // evoke stars or motes of knowledge and will slowly rotate, providing
  // a sense of dynamism and depth. Their random distribution ensures a
  // natural, organic look.
  const starCount = 700;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 10;
    const y = Math.random() * 6;
    const z = (Math.random() - 0.5) * 10;
    starPositions.set([x, y, z], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(0x29c991),
    size: 0.05,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Set up the renderer. Use a high pixel ratio for crisp rendering on
  // high‑DPI displays. Append the renderer's canvas to the container.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Track mouse movement for interactive rotation. We'll map mouse
  // coordinates to small rotations on the x and z axes of the treeGroup.
  let mouseX = 0;
  let mouseY = 0;
  function handleMouseMove(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    mouseX = (x / width) * 2 - 1;
    mouseY = (y / height) * 2 - 1;
  }
  window.addEventListener('mousemove', handleMouseMove);

  // Handle window resize
  function handleResize() {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }
  window.addEventListener('resize', handleResize);

  // Animate growth by gradually scaling the tree group up to its full size.
  let growth = 0.0;
  const maxGrowth = 1.0;
  // Store the start time to create smooth motion
  const startTime = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = (Date.now() - startTime) / 1000;
    // Ease out growth: start quickly then slow as it approaches full size
    growth = Math.min(maxGrowth, 1 - Math.exp(-2 * elapsed));
    treeGroup.scale.set(growth, growth, growth);

    // Use mouse movement to gently tilt the tree. Multipliers control
    // sensitivity. Limit the rotation so it remains subtle.
    treeGroup.rotation.x = THREE.MathUtils.clamp(mouseY * 0.3, -0.5, 0.5);
    treeGroup.rotation.z = THREE.MathUtils.clamp(-mouseX * 0.3, -0.5, 0.5);

    // Slowly rotate the entire tree about its vertical axis for added
    // motion independent of the cursor.
    treeGroup.rotation.y += 0.003;

    // Spin the star field slowly to create parallax and depth
    stars.rotation.y += 0.0005;

    renderer.render(scene, camera);
  }
  animate();

  // Return a clean‑up function to remove event listeners and dispose of
  // resources when the component is unmounted.
  return function cleanup() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
    // Dispose geometries and materials to free GPU memory
    starGeometry.dispose();
    starMaterial.dispose();
    branchMaterial.dispose();
    renderer.dispose();
    // Remove the canvas from the container
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}