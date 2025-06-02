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

  // --- Render board and pieces on FEN change ---
  useEffect(() => {
    if (!sceneRef.current || !boardGroupRef.current) return;
    // Remove old children
    while (boardGroupRef.current.children.length > 0) {
      boardGroupRef.current.remove(boardGroupRef.current.children[0]);
    }
    // Draw board
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let z = 0; z < BOARD_SIZE; z++) {
        const color = (x + z) % 2 === 0 ? 0xffffff : 0x222222;
        const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
        const material = new THREE.MeshStandardMaterial({ color });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(x - BOARD_SIZE / 2 + SQUARE_SIZE / 2, 0, z - BOARD_SIZE / 2 + SQUARE_SIZE / 2);
        square.userData = { sq: String.fromCharCode(97 + x) + (8 - z), isSquare: true };
        boardGroupRef.current.add(square);
      }
    }
    // Draw pieces
    const chess = chessRef.current;
    chess.board().forEach((row, z) => {
      row.forEach((piece, x) => {
        if (!piece) return;
        // --- 3D piece geometry: more visually distinct shapes ---
        let mesh: THREE.Mesh;
        let color = piece.color === 'w' ? 0xf0f0f0 : 0x222222;
        let material = new THREE.MeshStandardMaterial({ color });
        // Use tuple for position
        const pos: [number, number, number] = [x - BOARD_SIZE / 2 + SQUARE_SIZE / 2, 0.3, z - BOARD_SIZE / 2 + SQUARE_SIZE / 2];
        switch (piece.type) {
          case 'p': // Pawn
            mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.22, 0.45, 16),
              material
            );
            mesh.position.set(pos[0], pos[1], pos[2]);
            break;
          case 'n': // Knight
            mesh = new THREE.Mesh(
              new THREE.ConeGeometry(0.22, 0.5, 16),
              material
            );
            mesh.position.set(pos[0], pos[1] + 0.1, pos[2]);
            break;
          case 'b': // Bishop
            mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.15, 0.25, 0.6, 16),
              material
            );
            mesh.position.set(pos[0], pos[1] + 0.1, pos[2]);
            break;
          case 'r': // Rook
            mesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.32, 0.45, 0.32),
              material
            );
            mesh.position.set(pos[0], pos[1], pos[2]);
            break;
          case 'q': // Queen
            mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.28, 0.7, 16),
              material
            );
            mesh.position.set(pos[0], pos[1] + 0.15, pos[2]);
            break;
          case 'k': // King
            mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.3, 0.8, 16),
              material
            );
            mesh.position.set(pos[0], pos[1] + 0.18, pos[2]);
            break;
          default:
            mesh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16),
              material
            );
            mesh.position.set(pos[0], pos[1], pos[2]);
        }
        mesh.userData = { sq: String.fromCharCode(97 + x) + (8 - z), isPiece: true };
        if (boardGroupRef.current) {
          boardGroupRef.current.add(mesh);
        }
      });
    });

    // --- Highlight selected square and possible moves ---
    if (selected) {
      // Highlight selected square
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
  }, [fen]);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 0 }} />
  );
}
