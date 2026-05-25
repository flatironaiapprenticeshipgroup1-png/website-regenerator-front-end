"use client";

import { useEffect, useRef } from "react";
import styles from "./CircuitBackground.module.css";

interface CircuitNode {
  x: number;
  y: number;
}

interface Pulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

function startCircuitAnimation(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;

  let nodes: CircuitNode[] = [];
  let connections: [number, number][] = [];
  let pulses: Pulse[] = [];

  function buildGraph() {
    nodes = [];
    connections = [];
    pulses = [];

    for (let i = 0; i < 70; i++) {
      nodes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 220) {
          connections.push([i, j]);
        }
      }
    }

    for (let i = 0; i < 20; i++) {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      pulses.push({
        fromNode: conn[0],
        toNode: conn[1],
        progress: Math.random(),
        speed: 0.0015 + Math.random() * 0.003,
      });
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(buildGraph, 150);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildGraph();
  window.addEventListener("resize", resize);

  let animId: number;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    for (const [a, b] of connections) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[a].y);
      ctx.lineTo(nodes[b].x, nodes[b].y);
      ctx.stroke();
    }

    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();
    }

    for (const pulse of pulses) {
      pulse.progress += pulse.speed;
      if (pulse.progress >= 1) {
        pulse.progress = 0;
        const conn = connections[Math.floor(Math.random() * connections.length)];
        pulse.fromNode = conn[0];
        pulse.toNode = conn[1];
      }

      const from = nodes[pulse.fromNode];
      const to = nodes[pulse.toNode];
      const t = pulse.progress;

      let px: number, py: number;
      if (t < 0.5) {
        px = from.x + (to.x - from.x) * (t * 2);
        py = from.y;
      } else {
        px = to.x;
        py = from.y + (to.y - from.y) * ((t - 0.5) * 2);
      }

      const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
      grad.addColorStop(0, "rgba(255,255,255,0.95)");
      grad.addColorStop(0.4, "rgba(200,200,200,0.4)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", resize);
    if (debounceTimer !== null) clearTimeout(debounceTimer);
  };
}

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startCircuitAnimation(canvas);
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
