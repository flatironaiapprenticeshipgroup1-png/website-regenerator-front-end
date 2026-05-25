"use client";

import { useEffect, useRef } from "react";
import styles from "./CircuitBackground.module.css";

const TAGS = [
  '<html lang="en">',
  "<head>",
  '  <meta charset="UTF-8" />',
  "  <title>Regenerated</title>",
  '  <link rel="stylesheet" href="style.css" />',
  "</head>",
  "<body>",
  "  <header>",
  '    <nav class="navbar">',
  '      <a href="/">Home</a>',
  "    </nav>",
  "  </header>",
  "  <main>",
  '    <section class="hero">',
  "      <h1>Welcome</h1>",
  "      <p>AI-generated</p>",
  '      <button type="button">',
  "    </section>",
  '    <div class="container">',
  "      <article>",
  "        <h2>Section</h2>",
  "        <p>Content here</p>",
  "      </article>",
  "    </div>",
  "  </main>",
  "  <footer>",
  "    <p>&copy; 2024</p>",
  "  </footer>",
  "</body>",
  "</html>",
  '  <div id="app">',
  '  <span class="highlight">',
  '  <input type="text" />',
  '  <form method="post">',
  '  <img src="" alt="" />',
  "  </div>",
  "  </section>",
  "  </form>",
  "  <script defer>",
  "  <style>",
];

// VS Code Dark+ colors
const C = {
  bracket:  "#608b4e", // < > </ />  — muted green like VS Code punctuation
  tagName:  "#569cd6", // blue
  attrName: "#9cdcfe", // light blue
  attrVal:  "#ce9178", // orange
  text:     "#d4d4d4", // light gray
};

interface Segment { text: string; color: string }

interface TagInstance {
  tag: string;
  segments: Segment[];
  x: number;
  y: number;
  vx: number;
  charCount: number;
  state: "typing" | "holding" | "fading";
  alpha: number;
  holdTimer: number;
  typeDelay: number;
  typeTimer: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

function tokenize(raw: string): Segment[] {
  const tokens: Segment[] = [];
  let s = raw;

  while (s.length > 0) {
    const ws = s.match(/^(\s+)/);
    if (ws) {
      tokens.push({ text: ws[1], color: C.text });
      s = s.slice(ws[1].length);
      continue;
    }

    if (s.startsWith("<")) {
      if (s.startsWith("</")) {
        tokens.push({ text: "</", color: C.bracket });
        s = s.slice(2);
      } else {
        tokens.push({ text: "<", color: C.bracket });
        s = s.slice(1);
      }

      const name = s.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
      if (name) {
        tokens.push({ text: name[1], color: C.tagName });
        s = s.slice(name[1].length);
      }

      while (s.length > 0 && !s.startsWith(">") && !s.startsWith("/>")) {
        const space = s.match(/^(\s+)/);
        if (space) {
          tokens.push({ text: space[1], color: C.text });
          s = s.slice(space[1].length);
          continue;
        }
        const attr = s.match(/^([a-zA-Z_:][a-zA-Z0-9_:.-]*)/);
        if (attr) {
          tokens.push({ text: attr[1], color: C.attrName });
          s = s.slice(attr[1].length);
          if (s.startsWith("=")) {
            tokens.push({ text: "=", color: C.text });
            s = s.slice(1);
            if (s.startsWith('"')) {
              const end = s.indexOf('"', 1);
              const val = end !== -1 ? s.slice(0, end + 1) : s;
              tokens.push({ text: val, color: C.attrVal });
              s = s.slice(val.length);
            }
          }
          continue;
        }
        tokens.push({ text: s[0], color: C.text });
        s = s.slice(1);
      }

      if (s.startsWith("/>")) {
        tokens.push({ text: "/>", color: C.bracket });
        s = s.slice(2);
      } else if (s.startsWith(">")) {
        tokens.push({ text: ">", color: C.bracket });
        s = s.slice(1);
      }
      continue;
    }

    const next = s.indexOf("<");
    const chunk = next === -1 ? s : s.slice(0, next);
    tokens.push({ text: chunk, color: C.text });
    s = s.slice(chunk.length);
  }

  return tokens;
}

function makeTag(canvas: HTMLCanvasElement): TagInstance {
  const tag = TAGS[Math.floor(Math.random() * TAGS.length)];
  return {
    tag,
    segments: tokenize(tag),
    x: 20 + Math.random() * (canvas.width - 250),
    y: 20 + Math.random() * (canvas.height - 40),
    vx: 0.3 + Math.random() * 0.5,
    charCount: 0,
    state: "typing",
    alpha: 0.45,
    holdTimer: 0,
    typeDelay: 2 + Math.floor(Math.random() * 4),
    typeTimer: 0,
  };
}

function startAnimation(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  let instances: TagInstance[] = [];
  let frame = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function init() {
    instances = Array.from({ length: 20 }, () => {
      const inst = makeTag(canvas);
      const p = Math.random();
      if (p > 0.4) inst.charCount = Math.floor(p * inst.tag.length);
      if (p > 0.85) {
        inst.charCount = inst.tag.length;
        inst.state = "holding";
        inst.holdTimer = Math.random() * 60;
      }
      return inst;
    });
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(init, 150);
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  init();
  window.addEventListener("resize", resize);

  let animId: number;

  function draw() {
    frame++;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dot texture
    const spacing = 28;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let x = spacing; x < canvas.width; x += spacing) {
      for (let y = spacing; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.font = "12px monospace";
    ctx.textBaseline = "top";

    for (const inst of instances) {
      if (inst.state === "typing") {
        if (++inst.typeTimer >= inst.typeDelay) {
          inst.typeTimer = 0;
          inst.charCount = Math.min(inst.tag.length, inst.charCount + 1);
        }
        if (inst.charCount >= inst.tag.length) {
          inst.state = "holding";
          inst.holdTimer = 50 + Math.floor(Math.random() * 100);
        }
      } else if (inst.state === "holding") {
        if (--inst.holdTimer <= 0) inst.state = "fading";
      } else {
        inst.alpha -= 0.004;
        if (inst.alpha <= 0) Object.assign(inst, makeTag(canvas));
      }

      inst.x += inst.vx;
      if (inst.x > canvas.width + 20) Object.assign(inst, makeTag(canvas));

      // Draw each colored segment up to charCount
      let charsLeft = inst.charCount;
      let curX = inst.x;

      for (const seg of inst.segments) {
        if (charsLeft <= 0) break;
        const visible = charsLeft >= seg.text.length ? seg.text : seg.text.slice(0, charsLeft);
        charsLeft -= seg.text.length;
        ctx.fillStyle = hexToRgba(seg.color, inst.alpha);
        ctx.fillText(visible, curX, inst.y);
        curX += ctx.measureText(visible).width;
      }

      // Blinking cursor while typing
      if (inst.state === "typing" && Math.floor(frame / 30) % 2 === 0) {
        ctx.fillStyle = hexToRgba(C.text, inst.alpha);
        ctx.fillRect(curX, inst.y + 1, 1, 11);
      }
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
    return startAnimation(canvas);
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
