import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import gsap from 'gsap';
import LocomotiveScroll from 'locomotive-scroll';

const locoScroll = new LocomotiveScroll();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Post processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0030;
composer.addPass(rgbShiftPass);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let model;

// Load HDRI environment map
new RGBELoader()
  .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    texture.dispose();
    pmremGenerator.dispose();

    // Load model after environment is ready
    const loader = new GLTFLoader();
    loader.load('./DamagedHelmet.gltf', function (gltf) {
      model = gltf.scene
      scene.add(model);
    }, undefined, (error) => {
      console.error("an error has occurred while loading gltf model: ", error);
    });
  });

window.addEventListener('mousemove', (e) => {
  if (model) {
    const rotationX = (e.clientX / window.innerWidth - .5) * (Math.PI * .2);
    const rotationY = (e.clientY / window.innerHeight -.5) * (Math.PI * .2);
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.9,
      ease: "power2.out"
    });
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});


function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
animate();