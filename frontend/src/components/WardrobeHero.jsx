import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * WardrobeHero — a small rotating ring of "fabric swatch" planes.
 * Colours are passed in from the latest styling result so the hero
 * literally reflects the palette just recommended, instead of being
 * a generic decorative animation.
 */
export default function WardrobeHero({ colors = ["#C97B84", "#B8924F", "#7E8F6E"] }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const radius = 2.4;
    colors.forEach((hex, i) => {
      const geo = new THREE.PlaneGeometry(1.3, 1.7);
      const mat = new THREE.MeshStandardMaterial({ color: hex, side: THREE.DoubleSide, roughness: 0.6 });
      const swatch = new THREE.Mesh(geo, mat);
      const angle = (i / colors.length) * Math.PI * 2;
      swatch.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      swatch.lookAt(0, 0, 0);
      group.add(swatch);
    });
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const point = new THREE.PointLight(0xffffff, 1.2);
    point.position.set(2, 3, 4);
    scene.add(point);

    let frameId;
    const animate = () => {
      group.rotation.y += 0.006;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [colors]);

  return <div ref={mountRef} className="wardrobe-hero" />;
}
