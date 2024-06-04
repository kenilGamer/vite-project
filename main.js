import * as THREE from "three";
import "./style.css";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import { Volume } from "three/examples/jsm/Addons.js";
import gsap from "gsap";

class Site {
  constructor({ dom }) {
    this.time = 0;
    this.container = dom;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.images = [...document.querySelectorAll(".images img")];
    this.material = null;
    this.imageStore = [];
    this.uStartIndex = 0;
    this.uEndIndex = 1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      100,
      2000
    );
    this.camera.position.z = 200;
    this.camera.fov = 2 * Math.atan(this.height / 2 / 200) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.addImages();
    this.resize();
    this.setupResize();
    this.setPosition();
    this.setupInteractions();
    this.render();
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.setPosition();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  setPosition() {
    this.imageStore.forEach((img) => {
      const bounds = img.img.getBoundingClientRect();
      img.mesh.position.y = -bounds.top + this.height / 2 - bounds.height / 2;
      img.mesh.position.x = bounds.left - this.width / 2 + bounds.width / 2;
      img.mesh.scale.set(
        bounds.width / img.originalWidth,
        bounds.height / img.originalHeight,
        1
      );
    });
  }

  addImages() {
    const textureLoader = new THREE.TextureLoader();
    const textures = this.images.map((img) => textureLoader.load(img.src));
  
    const uniforms = {
      uTime: { value: 0 },
      uTimeline: { value: 0.0 },
      uStartIndex: { value: 0 },
      uEndIndex: { value: 1 },
      uImageArray: { value: textures },
      uScroll: { value: 0 },
    };
  
    this.material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
  
    this.images.forEach((img, i) => {
      const bounds = img.getBoundingClientRect();
      const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height);
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.position.x = bounds.left - this.width / 2 + bounds.width / 2;
      mesh.position.y = -bounds.top + this.height / 2 - bounds.height / 2;
      this.scene.add(mesh);
      this.imageStore.push({
        img: img,
        mesh: mesh,
        originalWidth: bounds.width,
        originalHeight: bounds.height,
        index: i,
      });
    });
  }
  

  setupInteractions() {
    const links = document.querySelectorAll(".links a");
    links.forEach((link, i) => {
      link.addEventListener("mouseover", () => {
        this.transitionToImage(i);
      });

      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.transitionToImage(i, true);
      });
    });
  }

  transitionToImage(index, isClick = false) {
    gsap.to(this.material.uniforms.uTimeline, {
      value: 4.0,
      duration: 2,
      onStart: () => {
        this.uEndIndex = index;
        this.material.uniforms.uStartIndex.value = this.uStartIndex;
        this.material.uniforms.uEndIndex.value = this.uEndIndex;
        this.uStartIndex = this.uEndIndex;
      },
      onComplete: () => {
        this.material.uniforms.uTimeline.value = 0.0;
      },
      onUpdate: () => {
        if (isClick) {
          this.scrollPage(index);
        }
      }
    });
  }

  scrollPage(index) {
    const targetImage = this.images[index];
    const targetPosition = targetImage.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  render() {
    this.time += 0.3;
    this.material.uniforms.uTime.value = this.time;
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Site({
  dom: document.querySelector(".canvas"),
});
