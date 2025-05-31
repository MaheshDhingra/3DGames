'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { Chess, Square } from 'chess.js';

const BOARD_THEMES = [
  {
    name: 'Classic',
    light: 0xffffff,
    dark: 0x222222,
    pieceW: 0xfafafa,
    pieceB: 0x222222,
    bg: 0xbfd1e5,
  },
  {
    name: 'Blue Ice',
    light: 0xcce6ff,
    dark: 0x336699,
    pieceW: 0xe0f7fa,
    pieceB: 0x01579b,
    bg: 0xe3f2fd,
  },
  {
    name: 'Green Forest',
    light: 0xe8f5e9,
    dark: 0x388e3c,
    pieceW: 0xc8e6c9,
    pieceB: 0x1b5e20,
    bg: 0xdcedc8,
  },
  {
    name: 'Brown Wood',
    light: 0xffe0b2,
    dark: 0x8d6e63,
    pieceW: 0xfff8e1,
    pieceB: 0x4e342e,
    bg: 0xfff3e0,
  },
];
const WEATHER = [
  { name: 'None' },
  { name: 'Rain' },
  { name: 'Snow' },
  { name: 'Heat' },
];

// Simple 3D models for chess pieces using basic shapes
function createPiece(type: string, color: number): THREE.Mesh {
  let mesh: THREE.Mesh;
  switch (type) {
    case 'pawn': {
      // Pawn: base + body + head
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 0.28, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.24;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.43;
      group.add(head);
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'rook': {
      // Rook: base + body + top
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.18, 0.32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.26;
      group.add(body);
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16),
        new THREE.MeshStandardMaterial({ color })
      );
      top.position.y = 0.44;
      group.add(top);
      // Add rook battlements
      for (let i = 0; i < 4; i++) {
        const battlement = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.07, 0.08),
          new THREE.MeshStandardMaterial({ color })
        );
        battlement.position.set(Math.cos((i * Math.PI) / 2) * 0.13, 0.51, Math.sin((i * Math.PI) / 2) * 0.13);
        group.add(battlement);
      }
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'knight': {
      // Knight: base + body + "head" (stylized)
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 0.22, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.21;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.22, 0.08),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.set(0, 0.38, 0.04);
      group.add(head);
      // Add a "mane"
      const mane = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      mane.position.set(0, 0.38, 0.09);
      mane.rotation.x = Math.PI / 2;
      group.add(mane);
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'bishop': {
      // Bishop: base + body + head + cut
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 0.28, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.24;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.41;
      group.add(head);
      // Add a "cut" (just a different color)
      const cut = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.18, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      cut.position.set(0, 0.41, 0.12);
      group.add(cut);
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'queen': {
      // Queen: base + body + crown
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.19, 0.32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.26;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.43;
      group.add(head);
      // Crown spikes
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.03, 0.09, 8),
          new THREE.MeshStandardMaterial({ color })
        );
        spike.position.set(Math.cos((i * 2 * Math.PI) / 5) * 0.09, 0.53, Math.sin((i * 2 * Math.PI) / 5) * 0.09);
        group.add(spike);
      }
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'king': {
      // King: base + body + head + cross
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.19, 0.32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.26;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.43;
      group.add(head);
      // Cross
      const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.16, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      crossV.position.y = 0.54;
      group.add(crossV);
      const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.04, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      crossH.position.y = 0.54;
      group.add(crossH);
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    default:
      mesh = new THREE.Mesh();
  }
  return mesh;
}

export default function ChessBoard3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [themeIdx, setThemeIdx] = useState(0);
  const [weatherIdx, setWeatherIdx] = useState(0);
  const theme = BOARD_THEMES[themeIdx];
  const weather = WEATHER[weatherIdx].name;
  // Helper: convert board index to chess.js square
  function toSquare(x: number, y: number): Square {
    return (String.fromCharCode(97 + x) + (8 - y)) as Square;
  }
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bg);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(theme.bg);
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2.1;
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    // --- Draw thick border under the board ---
    const borderThickness = 0.25;
    const borderGeometry = new THREE.BoxGeometry(8 + borderThickness * 2, 0.25, 8 + borderThickness * 2);
    const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(0, -0.13, 0);
    scene.add(border);
    // --- Draw board and pieces ---
    const board = chess.board();
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const color = (x + y) % 2 === 0 ? theme.light : theme.dark;
        const geometry = new THREE.BoxGeometry(1, 0.1, 1);
        let matColor = color;
        const sq = toSquare(x, y);
        // Highlight selected
        if (selected === sq) matColor = 0x00ff00;
        // Highlight possible moves
        if (possibleMoves.includes(sq)) matColor = 0x00bfff;
        const material = new THREE.MeshStandardMaterial({ color: matColor });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(x - 4 + 0.5, 0, y - 4 + 0.5);
        square.userData = { x, y, sq, isSquare: true };
        scene.add(square);
        // Piece
        const piece = board[y][x];
        if (piece) {
          const mesh = createPiece(piece.type, piece.color === 'w' ? theme.pieceW : theme.pieceB);
          mesh.position.set(x - 4 + 0.5, 0.05, y - 4 + 0.5);
          mesh.userData = { x, y, sq, isPiece: true };
          scene.add(mesh);
        }
      }
    }
    // --- Weather effects ---
    let weatherParticles: THREE.Points | null = null;
    if (weather === 'Rain' || weather === 'Snow') {
      const count = 400;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 1] = Math.random() * 10 + 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: weather === 'Rain' ? 0x66ccff : 0xffffff,
        size: weather === 'Rain' ? 0.08 : 0.15,
        transparent: true,
        opacity: 0.7,
      });
      weatherParticles = new THREE.Points(geometry, material);
      scene.add(weatherParticles);
    }
    // Heat shimmer: add a transparent plane above the board
    let heatPlane: THREE.Mesh | null = null;
    if (weather === 'Heat') {
      const geometry = new THREE.PlaneGeometry(8, 8, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffe082,
        transparent: true,
        opacity: 0.18,
      });
      heatPlane = new THREE.Mesh(geometry, material);
      heatPlane.position.y = 1.2;
      scene.add(heatPlane);
    }
    // --- Raycaster for picking ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    function onClick(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const { sq, isPiece, isSquare } = obj.userData || {};
        if (isPiece || isSquare) {
          if (selected && possibleMoves.includes(sq)) {
            chess.move({ from: selected, to: sq, promotion: 'q' });
            setFen(chess.fen());
            setSelected(null);
            setPossibleMoves([]);
          } else if (isPiece && chess.get(sq) && chess.get(sq)!.color === chess.turn()) {
            setSelected(sq);
            setPossibleMoves(chess.moves({ square: sq, verbose: true }).map((m: { to: Square }) => m.to));
          } else {
            setSelected(null);
            setPossibleMoves([]);
          }
        } else {
          setSelected(null);
          setPossibleMoves([]);
        }
      } else {
        setSelected(null);
        setPossibleMoves([]);
      }
    }
    renderer.domElement.addEventListener('pointerdown', onClick);
    // --- Render loop ---
    function animate() {
      controls?.update();
      // Animate weather
      if (weatherParticles) {
        const pos = weatherParticles.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          if (weather === 'Rain') {
            pos.array[i * 3 + 1] -= 0.25;
            if (pos.array[i * 3 + 1] < 0) pos.array[i * 3 + 1] = Math.random() * 10 + 2;
          } else if (weather === 'Snow') {
            pos.array[i * 3 + 1] -= 0.08;
            pos.array[i * 3] += (Math.random() - 0.5) * 0.04;
            pos.array[i * 3 + 2] += (Math.random() - 0.5) * 0.04;
            if (pos.array[i * 3 + 1] < 0) pos.array[i * 3 + 1] = Math.random() * 10 + 2;
          }
        }
        pos.needsUpdate = true;
      }
      // Animate heat shimmer
      if (heatPlane) {
        (heatPlane.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.08 * Math.sin(Date.now() * 0.002);
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    function cleanup() {
      renderer.dispose();
      renderer.domElement.removeEventListener('pointerdown', onClick);
      mountRef.current?.removeChild(renderer.domElement);
    }
    return cleanup;
  }, [fen, selected, possibleMoves, themeIdx, weatherIdx, chess, theme.bg, theme.dark, theme.light, theme.pieceB, theme.pieceW, weather]);

  // --- UI overlay for theme and weather ---
  return (
    <>
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 0 }} />
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 10, background: '#fff8', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px #0002', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontWeight: 600 }}>Board Theme:</label>
        <select value={themeIdx} onChange={e => setThemeIdx(Number(e.target.value))} style={{ fontSize: 16, borderRadius: 4, padding: 4 }}>
          {BOARD_THEMES.map((t, i) => (
            <option value={i} key={t.name}>{t.name}</option>
          ))}
        </select>
        <label style={{ fontWeight: 600, marginTop: 8 }}>Weather:</label>
        <select value={weatherIdx} onChange={e => setWeatherIdx(Number(e.target.value))} style={{ fontSize: 16, borderRadius: 4, padding: 4 }}>
          {WEATHER.map((w, i) => (
            <option value={i} key={w.name}>{w.name}</option>
          ))}
        </select>
      </div>
    </>
  );
}
