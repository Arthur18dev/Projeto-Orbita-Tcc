import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Universe({ paused, onReady }) {
  const host = useRef(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      onReady(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x06110d, 0);
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 12);
    const system = new THREE.Group();
    scene.add(system);
    const uniforms = {
      lightDirection: { value: new THREE.Vector3(-1, 0.8, 1).normalize() },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vNormal; varying vec3 vPosition; uniform vec3 lightDirection;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.04+3.1;a*=.5;}return v;}
      void main(){vec3 p=vPosition;float n=fbm(p*3.);float continents=smoothstep(.42,.61,n);float detail=fbm(p*34.);vec3 ocean=vec3(.035,.13,.115);vec3 land=mix(vec3(.19,.27,.15),vec3(.65,.70,.41),detail);vec3 base=mix(ocean,land,continents);float clouds=smoothstep(.60,.78,fbm(p*5.+vec3(12.)));base=mix(base,vec3(.83,.86,.67),clouds*.65);float light=max(dot(normalize(vNormal),lightDirection),0.);float rim=pow(1.-max(dot(normalize(vNormal),vec3(0,0,1)),0.),3.5);vec3 col=base*(.08+light*1.5)+vec3(.48,.73,.48)*rim*.42;gl_FragColor=vec4(col,1.);}`,
    });
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 72, 48),
      material,
    );
    planet.rotation.z = 0.25;
    system.add(planet);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 48, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 n;void main(){float a=pow(1.-max(dot(normalize(n),vec3(0,0,1)),0.),4.);gl_FragColor=vec4(.45,.8,.55,a*.25);}`,
      }),
    );
    system.add(glow);
    const tracks = new THREE.Group();
    tracks.rotation.set(0.95, 0.15, -0.38);
    system.add(tracks);
    const satellites = [];
    scene.add(new THREE.AmbientLight(0xd9eaca, 2));
    const sun = new THREE.DirectionalLight(0xf5f4c8, 4);
    sun.position.set(-4, 5, 6);
    scene.add(sun);
    [2.65, 3.35, 4.05].forEach((radius, i) => {
      const points = [];
      for (let j = 0; j <= 180; j++) {
        const a = (j / 180) * Math.PI * 2;
        points.push(
          new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0),
        );
      }
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 0x9fae7b,
          transparent: true,
          opacity: i === 0 ? 0.5 : 0.22,
        }),
      );
      tracks.add(ring);
      const sat = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.18, 0.18),
        new THREE.MeshStandardMaterial({
          color: 0xe6e3b0,
          metalness: 0.65,
          roughness: 0.4,
        }),
      );
      sat.add(core);
      [-1, 1].forEach((side) => {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.31, 0.17, 0.025),
          new THREE.MeshStandardMaterial({
            color: 0x497b89,
            metalness: 0.55,
            roughness: 0.4,
          }),
        );
        panel.position.x = side * 0.25;
        sat.add(panel);
        const grid = new THREE.LineSegments(
          new THREE.EdgesGeometry(panel.geometry),
          new THREE.LineBasicMaterial({ color: 0xb9d5c6 }),
        );
        panel.add(grid);
      });
      tracks.add(sat);
      satellites.push({
        sat,
        radius,
        speed: 0.08 + i * 0.025,
        offset: i * 2.1,
      });
    });
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 24, 20),
      new THREE.MeshStandardMaterial({ color: 0x969d80, roughness: 1 }),
    );
    moon.position.set(-3.3, 1.9, -0.8);
    system.add(moon);
    let seed = 17;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const positions = new Float32Array(420 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (random() - 0.5) * 35;
      positions[i + 1] = (random() - 0.5) * 22;
      positions[i + 2] = -random() * 15 - 2;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    scene.add(
      new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          color: 0xd6e8c8,
          size: 0.025,
          transparent: true,
          opacity: 0.65,
        }),
      ),
    );
    let target = 0,
      scroll = 0,
      pointer = { x: 0, y: 0 },
      elapsed = 0,
      last = 0,
      dirty = true,
      wasStill = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const onScroll = () => {
      target = window.scrollY / window.innerHeight;
      dirty = true;
    };
    const onPointer = (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    const contextLost = (e) => {
      e.preventDefault();
      renderer.setAnimationLoop(null);
      onReady(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const frame = (ms) => {
      const dt = Math.min((ms - last) / 1000, 0.05);
      last = ms;
      if (document.hidden) return;
      const still = pausedRef.current || reduced.matches;
      if (still !== wasStill) {
        dirty = true;
        wasStill = still;
      }
      if (!still) elapsed += dt;
      if (still && !dirty) return;
      dirty = false;
      
      scroll = still ? target : THREE.MathUtils.damp(scroll, target, 3, dt);
      const mobile = window.innerWidth < 760;
      const raw = Math.min(Math.max(scroll - 0.1, 0) / 0.9, 1);
      const journey = raw * raw * (3 - 2 * raw);
      system.position.set(
        mobile ? 0 : 2.9 - journey * 5.2,
        mobile ? -1.15 : 0,
        0,
      );
      const scale = mobile ? 0.44 : 1;
      system.scale.setScalar(scale * (1 - journey * 0.1));
      system.rotation.y = still ? 0.12 : elapsed * 0.018 + scroll * 0.18;
      system.rotation.z = still ? 0 : scroll * 0.045;
      planet.rotation.y = elapsed * 0.035;
      tracks.rotation.x =
        0.95 + (still ? 0 : Math.sin(elapsed * 0.1) * 0.08 + scroll * 0.08);
      satellites.forEach(({ sat, radius, speed, offset }) => {
        const angle = elapsed * speed + offset;
        sat.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
        sat.rotation.z = angle;
      });
      camera.position.x = still
        ? 0
        : THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.25, 0.03);
      camera.position.y = still
        ? 0
        : THREE.MathUtils.lerp(camera.position.y, -pointer.y * 0.18, 0.03);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    const visibility = () => {
      last = performance.now();
      dirty = true;
    };
    document.addEventListener("visibilitychange", visibility);
    const motion = () => {
      dirty = true;
    };
    reduced.addEventListener("change", motion);
    resize();
    onScroll();
    renderer.setAnimationLoop(frame);
    onReady(true);
    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", motion);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      scene.traverse((obj) => {
        obj.geometry?.dispose();
        if (obj.material) {
          for (const m of Array.isArray(obj.material)
            ? obj.material
            : [obj.material])
            m.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);
  return <div className="universe" ref={host} aria-hidden="true" />;
}
