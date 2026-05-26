// @ts-nocheck
"use client";
import { useEffect, useRef } from "react";
import ThreeGlobe from "three-globe";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import countries from "@/data/globe.json";

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function World({ globeConfig, data }: WorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const cfg = {
      pointSize: 1,
      atmosphereColor: "#9945FF",
      showAtmosphere: true,
      atmosphereAltitude: 0.2,
      polygonColor: "rgba(255,255,255,0.10)",
      globeColor: "#0a0a1a",
      emissive: "#050510",
      emissiveIntensity: 0.4,
      shininess: 0.3,
      arcTime: 1800,
      arcLength: 0.85,
      rings: 1,
      maxRings: 3,
      autoRotate: true,
      autoRotateSpeed: 0.5,
      ambientLight: "#ffffff",
      directionalLeftLight: "#ffffff",
      directionalTopLight: "#ffffff",
      pointLight: "#ffffff",
      ...globeConfig,
    };

    // Renderer
    const w = el.clientWidth;
    const h = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 180, 1800);
    camera.position.z = 300;

    // Lights
    scene.add(new THREE.AmbientLight(cfg.ambientLight, 0.6));
    const dl1 = new THREE.DirectionalLight(cfg.directionalLeftLight, 0.8);
    dl1.position.set(-400, 100, 400);
    scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(cfg.directionalTopLight, 0.5);
    dl2.position.set(-200, 500, 200);
    scene.add(dl2);

    // Globe
    const globe = new ThreeGlobe()
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(cfg.showAtmosphere)
      .atmosphereColor(cfg.atmosphereColor)
      .atmosphereAltitude(cfg.atmosphereAltitude)
      .hexPolygonColor(() => cfg.polygonColor);

    const mat = globe.globeMaterial() as THREE.MeshPhongMaterial;
    mat.color = new THREE.Color(cfg.globeColor);
    mat.emissive = new THREE.Color(cfg.emissive);
    mat.emissiveIntensity = cfg.emissiveIntensity;
    mat.shininess = cfg.shininess * 100; // MeshPhongMaterial shininess is 0-100+

    // Arcs
    globe
      .arcsData(data)
      .arcStartLat((d) => d.startLat)
      .arcStartLng((d) => d.startLng)
      .arcEndLat((d) => d.endLat)
      .arcEndLng((d) => d.endLng)
      .arcColor((d) => d.color)
      .arcAltitude((d) => d.arcAlt)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
      .arcDashLength(cfg.arcLength)
      .arcDashInitialGap((d) => d.order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => cfg.arcTime);

    // Points
    const points = data.flatMap((d) => [
      { lat: d.startLat, lng: d.startLng, color: d.color },
      { lat: d.endLat, lng: d.endLng, color: d.color },
    ]);
    globe
      .pointsData(points)
      .pointColor((d) => d.color)
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(2);

    scene.add(globe);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 300;
    controls.maxDistance = 300;
    controls.autoRotate = cfg.autoRotate;
    controls.autoRotateSpeed = cfg.autoRotateSpeed;
    controls.minPolarAngle = Math.PI / 3.5;
    controls.maxPolarAngle = Math.PI - Math.PI / 3;

    // Resize
    const onResize = () => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    // Animate
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}

// Keep Globe/World exports compatible
export { World as Globe };
