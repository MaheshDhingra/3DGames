'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { Chess, Square, PieceSymbol } from 'chess.js';

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

function createPiece(type: PieceSymbol, color: number): THREE.Mesh {
  let mesh: THREE.Mesh;
  switch (type) {
    case 'p': {
      // Pawn
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12), // reduced segments
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 0.28, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.24;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 12, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.43;
      group.add(head);
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'r': {
      // Rook
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.18, 0.32, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.26;
      group.add(body);
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8),
        new THREE.MeshStandardMaterial({ color })
      );
      top.position.y = 0.44;
      group.add(top);
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
    case 'n': {
      // Knight
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 0.22, 12),
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
      const mane = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      mane.position.set(0, 0.38, 0.09);
      mane.rotation.x = Math.PI / 2;
      group.add(mane);
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'b': {
      // Bishop
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.18, 0.28, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.24;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.41;
      group.add(head);
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
    case 'q': {
      // Queen
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.19, 0.32, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.26;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.43;
      group.add(head);
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.03, 0.09, 6),
          new THREE.MeshStandardMaterial({ color })
        );
        spike.position.set(Math.cos((i * 2 * Math.PI) / 5) * 0.09, 0.53, Math.sin((i * 2 * Math.PI) / 5) * 0.09);
        group.add(spike);
      }
      group.position.y = 0.05;
      mesh = group as unknown as THREE.Mesh;
      break;
    }
    case 'k': {
      // King
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.25, 0.1, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      base.position.y = 0.05;
      group.add(base);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.19, 0.32, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.y = 0.26;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color })
      );
      head.position.y = 0.43;
      group.add(head);
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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boardGroupRef = useRef<THREE.Group | null>(null);
  const weatherGroupRef = useRef<THREE.Group | null>(null);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  // --- Add refs for latest selected and possibleMoves ---
  const selectedRef = useRef<Square | null>(null);
  const possibleMovesRef = useRef<Square[]>([]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { possibleMovesRef.current = possibleMoves; }, [possibleMoves]);
  const [themeIdx, setThemeIdx] = useState(0);
  const [weatherIdx, setWeatherIdx] = useState(0);
  const theme = BOARD_THEMES[themeIdx];
  const weather = WEATHER[weatherIdx].name;

  // Helper: convert board index to chess.js square
  function toSquare(x: number, y: number): Square {
    return (String.fromCharCode(97 + x) + (8 - y)) as Square;
  }

  // --- Initialize Three.js scene ONCE ---
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bg);
    sceneRef.current = scene;
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(theme.bg);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    // Board group
    const boardGroup = new THREE.Group();
    boardGroupRef.current = boardGroup;
    scene.add(boardGroup);
    // Weather group
    const weatherGroup = new THREE.Group();
    weatherGroupRef.current = weatherGroup;
    scene.add(weatherGroup);
    // Raycaster for picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    function onClick(event: MouseEvent) {
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(boardGroupRef.current?.children || [], true);
      if (intersects.length > 0) {
        // Traverse up to find userData with sq
        let obj = intersects[0].object;
        let found = false;
        while (obj) {
          const { sq, isPiece, isSquare } = obj.userData || {};
          if (sq && (isPiece || isSquare)) {
            found = true;
            // --- Use refs for latest selected and possibleMoves ---
            const selected = selectedRef.current;
            const possibleMoves = possibleMovesRef.current;
            if (selected && possibleMoves.includes(sq)) {
              const move = chess.move({ from: selected, to: sq, promotion: 'q' });
              if (move) {
                setFen(chess.fen());
                setSelected(null);
                setPossibleMoves([]);
              }
            } else if (isPiece && chess.get(sq) && chess.get(sq)!.color === chess.turn()) {
              setSelected(sq);
              setPossibleMoves(chess.moves({ square: sq, verbose: true }).map((m: { to: Square }) => m.to));
            } else {
              setSelected(null);
              setPossibleMoves([]);
            }
            break;
          }
          obj = obj.parent as THREE.Object3D;
        }
        if (!found) {
          setSelected(null);
          setPossibleMoves([]);
        }
      } else {
        setSelected(null);
        setPossibleMoves([]);
      }
    }
    renderer.domElement.addEventListener('pointerdown', onClick);
    // Render loop
    let animId: number;
    function animate() {
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }
    animate();
    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      renderer.domElement.removeEventListener('pointerdown', onClick);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Update board and weather on state change ---
  useEffect(() => {
    const boardGroup = boardGroupRef.current;
    if (!boardGroup) return;
    // Remove previous children
    while (boardGroup.children.length) boardGroup.remove(boardGroup.children[0]);
    // --- Draw thick border under the board ---
    const borderThickness = 0.25;
    const borderGeometry = new THREE.BoxGeometry(8 + borderThickness * 2, 0.25, 8 + borderThickness * 2);
    const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.set(0, -0.13, 0);
    boardGroup.add(border);
    // --- Draw board and pieces ---
    const board = chess.board();
    let selectedPiecePos: [number, number] | null = null;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const color = (x + y) % 2 === 0 ? theme.light : theme.dark;
        const geometry = new THREE.BoxGeometry(1, 0.1, 1);
        let matColor = color;
        const sq = toSquare(x, y);
        if (selected === sq) {
          matColor = 0x00ff00;
          selectedPiecePos = [x, y];
        }
        if (possibleMoves.includes(sq)) matColor = 0x00bfff;
        const material = new THREE.MeshStandardMaterial({ color: matColor });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(x - 3.5, 0, y - 3.5);
        square.userData = { x, y, sq, isSquare: true };
        boardGroup.add(square);
        // Piece
        const piece = board[y][x];
        if (piece) {
          const mesh = createPiece(piece.type as PieceSymbol, piece.color === 'w' ? theme.pieceW : theme.pieceB);
          mesh.position.set(x - 3.5, 0.05, y - 3.5);
          mesh.userData = { x, y, sq, isPiece: true };
          boardGroup.add(mesh);
        }
      }
    }
    // --- Draw path lines from selected piece to possible moves ---
    if (selected && selectedPiecePos) {
      for (const moveSq of possibleMoves) {
        const file = moveSq.charCodeAt(0) - 97;
        const rank = 8 - parseInt(moveSq[1]);
        const from = new THREE.Vector3(selectedPiecePos[0] - 3.5, 0.18, selectedPiecePos[1] - 3.5);
        const to = new THREE.Vector3(file - 3.5, 0.18, rank - 3.5);
        const points = [from, to];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffa500, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        boardGroup.add(line);
      }
    }
  }, [fen, selected, possibleMoves, themeIdx]);

  // --- Update weather effects on state change ---
  useEffect(() => {
    const weatherGroup = weatherGroupRef.current;
    if (!weatherGroup) return;
    // Remove previous children
    while (weatherGroup.children.length) weatherGroup.remove(weatherGroup.children[0]);
    // Weather effects
    if (weather === 'Rain' || weather === 'Snow') {
      const count = 200; // reduced for performance
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
        size: weather === 'Rain' ? 0.07 : 0.12,
        transparent: true,
        opacity: 0.7,
      });
      const weatherParticles = new THREE.Points(geometry, material);
      weatherParticles.userData = { weatherType: weather };
      weatherGroup.add(weatherParticles);
    }
    if (weather === 'Heat') {
      const geometry = new THREE.PlaneGeometry(8, 8, 16, 16); // reduced segments
      const material = new THREE.MeshBasicMaterial({
        color: 0xffe082,
        transparent: true,
        opacity: 0.18,
      });
      const heatPlane = new THREE.Mesh(geometry, material);
      heatPlane.position.y = 1.2;
      heatPlane.userData = { weatherType: 'Heat' };
      weatherGroup.add(heatPlane);
    }
  }, [weatherIdx, themeIdx, weather]);

  // --- Animate weather and heat shimmer ---
  useEffect(() => {
    let animId: number;
    function animateWeather() {
      const weatherGroup = weatherGroupRef.current;
      if (weatherGroup) {
        for (const obj of weatherGroup.children) {
          if (obj instanceof THREE.Points && obj.userData.weatherType) {
            const pos = (obj.geometry as THREE.BufferGeometry).attributes.position;
            for (let i = 0; i < pos.count; i++) {
              if (obj.userData.weatherType === 'Rain') {
                pos.array[i * 3 + 1] -= 0.25;
                if (pos.array[i * 3 + 1] < 0) pos.array[i * 3 + 1] = Math.random() * 10 + 2;
              } else if (obj.userData.weatherType === 'Snow') {
                pos.array[i * 3 + 1] -= 0.08;
                pos.array[i * 3] += (Math.random() - 0.5) * 0.04;
                pos.array[i * 3 + 2] += (Math.random() - 0.5) * 0.04;
                if (pos.array[i * 3 + 1] < 0) pos.array[i * 3 + 1] = Math.random() * 10 + 2;
              }
            }
            pos.needsUpdate = true;
          } else if (obj instanceof THREE.Mesh && obj.userData.weatherType === 'Heat') {
            (obj.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.08 * Math.sin(Date.now() * 0.002);
          }
        }
      }
      animId = requestAnimationFrame(animateWeather);
    }
    animateWeather();
    return () => cancelAnimationFrame(animId);
  }, [weatherIdx, themeIdx]);

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
