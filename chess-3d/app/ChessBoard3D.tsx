'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { Chess, Square, Move } from 'chess.js';

const BOARD_SIZE = 8;
const SQUARE_SIZE = 1;

function createChessBoard(scene: THREE.Scene) {
  const white = 0xffffff;
  const black = 0x222222;
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let z = 0; z < BOARD_SIZE; z++) {
      const color = (x + z) % 2 === 0 ? white : black;
      const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
      const material = new THREE.MeshStandardMaterial({ color });
      const square = new THREE.Mesh(geometry, material);
      square.position.set(
        x - BOARD_SIZE / 2 + SQUARE_SIZE / 2,
        0,
        z - BOARD_SIZE / 2 + SQUARE_SIZE / 2
      );
      square.userData = { sq: String.fromCharCode(97 + x) + (8 - z), isSquare: true };
      scene.add(square);
    }
  }
}

export default function ChessBoard3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const boardGroupRef = useRef<THREE.Group | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Chess state
  const [fen, setFen] = React.useState('start');
  const [selected, setSelected] = React.useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = React.useState<Square[]>([]);
  const selectedRef = useRef<Square | null>(null);
  const possibleMovesRef = useRef<Square[]>([]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { possibleMovesRef.current = possibleMoves; }, [possibleMoves]);

  // Chess.js instance
  const chessRef = useRef(new Chess());
  useEffect(() => {
    if (fen === 'start') chessRef.current.reset();
    else chessRef.current.load(fen);
  }, [fen]);

  // --- Setup Three.js scene ---
  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xbfd1e5);
    mountRef.current?.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    cameraRef.current = camera;
    sceneRef.current = scene;

    // Orbit Controls
    let controls: OrbitControls | undefined;
    if (mountRef.current) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 8;
      controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI / 2.1;
    }

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

    // Render loop
    function animate() {
      controls?.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Responsive resize
    function handleResize() {
      const newWidth = mountRef.current?.clientWidth || window.innerWidth;
      const newHeight = mountRef.current?.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }
    window.addEventListener('resize', handleResize);

    // Mouse click handler
    function handleClick(event: MouseEvent) {
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycaster.current.intersectObjects(boardGroupRef.current?.children || [], true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        let found = false;
        while (obj) {
          const { sq, isPiece, isSquare } = obj.userData || {};
          if (sq && (isPiece || isSquare)) {
            found = true;
            const selected = selectedRef.current;
            const possibleMoves = possibleMovesRef.current;
            const chess = chessRef.current;
            if (selected && possibleMoves.includes(sq)) {
              const move = chess.move({ from: selected, to: sq, promotion: 'q' });
              if (move) {
                setFen(chess.fen());
                setSelected(null);
                setPossibleMoves([]);
              }
            } else if (isPiece && chess.get(sq) && chess.get(sq)!.color === chess.turn()) {
              setSelected(sq);
              setPossibleMoves(chess.moves({ square: sq, verbose: true }).map((m: Move) => m.to));
            } else if (isSquare && chess.get(sq) && chess.get(sq)!.color === chess.turn()) {
              setSelected(sq);
              setPossibleMoves(chess.moves({ square: sq, verbose: true }).map((m: Move) => m.to));
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
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
    };
  }, []);

  // --- Theme and weather state ---
  const BOARD_THEMES = [
    { name: 'Brown Wood', light: 0xe0c097, dark: 0x7c5e3c },
    { name: 'Marble', light: 0xf0f0f0, dark: 0x888888 },
    { name: 'Classic', light: 0xffffff, dark: 0x222222 },
    { name: 'Blue', light: 0xadd8e6, dark: 0x4682b4 },
  ];
  const PIECE_THEMES = [
    { name: 'Classic', white: 0xf0f0f0, black: 0x222222 },
    { name: 'Wood', white: 0xe0c097, black: 0x7c5e3c },
    { name: 'Glass', white: 0xcce6ff, black: 0x336699 },
  ];
  const WEATHER = [
    { name: 'None' },
    { name: 'Snow' },
    { name: 'Rain' },
    { name: 'Heat' },
  ];
  const [boardTheme, setBoardTheme] = React.useState(0);
  const [pieceTheme, setPieceTheme] = React.useState(0);
  const [weather, setWeather] = React.useState(0);

  // --- Stats ---
  const [moveCount, setMoveCount] = React.useState(0);
  const [turn, setTurn] = React.useState<'w' | 'b'>('w');
  const [status, setStatus] = React.useState('White to move');

  // --- Update stats on FEN change ---
  useEffect(() => {
    const chess = chessRef.current;
    setMoveCount(chess.history().length);
    setTurn(chess.turn());
    if (chess.isCheckmate()) setStatus('Checkmate!');
    else if (chess.isDraw()) setStatus('Draw!');
    else if (chess.isCheck()) setStatus((chess.turn() === 'w' ? 'White' : 'Black') + ' in check');
    else setStatus((chess.turn() === 'w' ? 'White' : 'Black') + ' to move');
  }, [fen]);

  // --- Render board and pieces on FEN change ---
  useEffect(() => {
    if (!sceneRef.current || !boardGroupRef.current) return;
    // Remove old children
    while (boardGroupRef.current.children.length > 0) {
      boardGroupRef.current.remove(boardGroupRef.current.children[0]);
    }
    // --- Draw thick border ---
    const borderGeom = new THREE.BoxGeometry(BOARD_SIZE + 0.6, 0.3, BOARD_SIZE + 0.6);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const border = new THREE.Mesh(borderGeom, borderMat);
    border.position.set(0, -0.11, 0);
    boardGroupRef.current.add(border);
    // --- Draw board squares ---
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let z = 0; z < BOARD_SIZE; z++) {
        const color = (x + z) % 2 === 0 ? BOARD_THEMES[boardTheme].light : BOARD_THEMES[boardTheme].dark;
        const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
        const material = new THREE.MeshStandardMaterial({ color });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(x - BOARD_SIZE / 2 + SQUARE_SIZE / 2, 0, z - BOARD_SIZE / 2 + SQUARE_SIZE / 2);
        square.userData = { sq: String.fromCharCode(97 + x) + (8 - z), isSquare: true };
        boardGroupRef.current.add(square);
      }
    }
    // --- Draw pieces with theme ---
    const chess = chessRef.current;
    chess.board().forEach((row, z) => {
      row.forEach((piece, x) => {
        if (!piece) return;
        let mesh: THREE.Mesh;
        let color = piece.color === 'w' ? PIECE_THEMES[pieceTheme].white : PIECE_THEMES[pieceTheme].black;
        let material = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 });
        const pos: [number, number, number] = [x - BOARD_SIZE / 2 + SQUARE_SIZE / 2, 0.3, z - BOARD_SIZE / 2 + SQUARE_SIZE / 2];
        switch (piece.type) {
          case 'p':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.45, 16), material);
            mesh.position.set(pos[0], pos[1], pos[2]);
            break;
          case 'n':
            mesh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 16), material);
            mesh.position.set(pos[0], pos[1] + 0.1, pos[2]);
            break;
          case 'b':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.6, 16), material);
            mesh.position.set(pos[0], pos[1] + 0.1, pos[2]);
            break;
          case 'r':
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.32), material);
            mesh.position.set(pos[0], pos[1], pos[2]);
            break;
          case 'q':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.7, 16), material);
            mesh.position.set(pos[0], pos[1] + 0.15, pos[2]);
            break;
          case 'k':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.8, 16), material);
            mesh.position.set(pos[0], pos[1] + 0.18, pos[2]);
            break;
          default:
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16), material);
            mesh.position.set(pos[0], pos[1], pos[2]);
        }
        mesh.userData = { sq: String.fromCharCode(97 + x) + (8 - z), isPiece: true };
        if (boardGroupRef.current) boardGroupRef.current.add(mesh);
      });
    });
    // --- Highlight selected square and possible moves ---
    if (selected) {
      const selX = selected.charCodeAt(0) - 97;
      const selZ = 8 - parseInt(selected[1]);
      const highlight = new THREE.Mesh(
        new THREE.BoxGeometry(SQUARE_SIZE * 0.98, 0.11, SQUARE_SIZE * 0.98),
        new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4 })
      );
      highlight.position.set(selX - BOARD_SIZE / 2 + SQUARE_SIZE / 2, 0.06, selZ - BOARD_SIZE / 2 + SQUARE_SIZE / 2);
      if (boardGroupRef.current) boardGroupRef.current.add(highlight);
    }
    possibleMoves.forEach((sq) => {
      const x = sq.charCodeAt(0) - 97;
      const z = 8 - parseInt(sq[1]);
      const highlight = new THREE.Mesh(
        new THREE.BoxGeometry(SQUARE_SIZE * 0.98, 0.11, SQUARE_SIZE * 0.98),
        new THREE.MeshStandardMaterial({ color: 0x00bfff, transparent: true, opacity: 0.35 })
      );
      highlight.position.set(x - BOARD_SIZE / 2 + SQUARE_SIZE / 2, 0.06, z - BOARD_SIZE / 2 + SQUARE_SIZE / 2);
      if (boardGroupRef.current) boardGroupRef.current.add(highlight);
    });
    // --- Weather effects ---
    if (WEATHER[weather].name === 'Snow') {
      for (let i = 0; i < 80; i++) {
        const flake = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
        );
        flake.position.set(
          Math.random() * BOARD_SIZE - BOARD_SIZE / 2,
          Math.random() * 4 + 2,
          Math.random() * BOARD_SIZE - BOARD_SIZE / 2
        );
        if (boardGroupRef.current) boardGroupRef.current.add(flake);
      }
    } else if (WEATHER[weather].name === 'Rain') {
      for (let i = 0; i < 60; i++) {
        const drop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6),
          new THREE.MeshStandardMaterial({ color: 0x66aaff, transparent: true, opacity: 0.7 })
        );
        drop.position.set(
          Math.random() * BOARD_SIZE - BOARD_SIZE / 2,
          Math.random() * 4 + 2,
          Math.random() * BOARD_SIZE - BOARD_SIZE / 2
        );
        if (boardGroupRef.current) boardGroupRef.current.add(drop);
      }
    } else if (WEATHER[weather].name === 'Heat') {
      for (let i = 0; i < 30; i++) {
        const shimmer = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 4, 4),
          new THREE.MeshStandardMaterial({ color: 0xffe066, transparent: true, opacity: 0.18 })
        );
        shimmer.position.set(
          Math.random() * BOARD_SIZE - BOARD_SIZE / 2,
          Math.random() * 2 + 1,
          Math.random() * BOARD_SIZE - BOARD_SIZE / 2
        );
        if (boardGroupRef.current) boardGroupRef.current.add(shimmer);
      }
    }
  }, [fen, boardTheme, pieceTheme, weather, selected, possibleMoves]);

  // --- UI for themes, weather, and stats ---
  return (
    <>
      <div style={{ position: 'absolute', left: 24, top: 24, zIndex: 10, background: 'rgba(255,255,255,0.85)', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 16, minWidth: 160 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Board Theme</div>
        <select value={boardTheme} onChange={e => setBoardTheme(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }}>
          {BOARD_THEMES.map((t, i) => <option value={i} key={t.name}>{t.name}</option>)}
        </select>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Piece Theme</div>
        <select value={pieceTheme} onChange={e => setPieceTheme(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }}>
          {PIECE_THEMES.map((t, i) => <option value={i} key={t.name}>{t.name}</option>)}
        </select>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Weather</div>
        <select value={weather} onChange={e => setWeather(Number(e.target.value))} style={{ width: '100%' }}>
          {WEATHER.map((t, i) => <option value={i} key={t.name}>{t.name}</option>)}
        </select>
        <hr style={{ margin: '16px 0' }} />
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Stats</div>
        <div>Moves: {moveCount}</div>
        <div>Turn: {turn === 'w' ? 'White' : 'Black'}</div>
        <div>Status: {status}</div>
      </div>
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 0 }} />
    </>
  );
}
