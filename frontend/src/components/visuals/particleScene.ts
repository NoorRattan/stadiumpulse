interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface ParticleScene {
  active: boolean;
  canvas: HTMLCanvasElement;
  connectionColor: string;
  context: CanvasRenderingContext2D;
  frame: number;
  height: number;
  mouse: { x: number; y: number };
  mouseRepel: boolean;
  particles: Particle[];
  width: number;
}

function readSceneColors() {
  const styles = window.getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  const connectionColor = read("--brand-cyan");
  const colors = [
    connectionColor,
    read("--brand-magenta"),
    read("--brand-amber"),
    read("--foreground"),
  ].filter(Boolean);
  return { colors, connectionColor };
}

function createParticle(scene: ParticleScene, colors: string[]): Particle {
  return {
    x: Math.random() * scene.width,
    y: Math.random() * scene.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    size: Math.random() * 1.6 + 0.4,
    opacity: Math.random() * 0.5 + 0.1,
    color:
      colors[Math.floor(Math.random() * colors.length)] ??
      scene.connectionColor,
  };
}

function resizeScene(scene: ParticleScene, count: number, colors: string[]) {
  scene.width = scene.canvas.offsetWidth;
  scene.height = scene.canvas.offsetHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  scene.canvas.width = Math.max(1, Math.floor(scene.width * pixelRatio));
  scene.canvas.height = Math.max(1, Math.floor(scene.height * pixelRatio));
  scene.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  scene.particles = Array.from({ length: count }, () =>
    createParticle(scene, colors),
  );
}

function repelParticle(scene: ParticleScene, particle: Particle) {
  if (!scene.mouseRepel) return;
  const dx = particle.x - scene.mouse.x;
  const dy = particle.y - scene.mouse.y;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared <= 0 || distanceSquared >= 10_000) return;
  const distance = Math.sqrt(distanceSquared);
  const force = (100 - distance) / 100;
  particle.vx += (dx / distance) * force * 0.3;
  particle.vy += (dy / distance) * force * 0.3;
}

function moveParticle(scene: ParticleScene, particle: Particle) {
  repelParticle(scene, particle);
  particle.vx *= 0.99;
  particle.vy *= 0.99;
  particle.x += particle.vx;
  particle.y += particle.vy;
  if (particle.x < 0) particle.x = scene.width;
  if (particle.x > scene.width) particle.x = 0;
  if (particle.y < 0) particle.y = scene.height;
  if (particle.y > scene.height) particle.y = 0;
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle) {
  context.beginPath();
  context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  context.fillStyle = particle.color;
  context.globalAlpha = particle.opacity;
  context.fill();
  context.globalAlpha = 1;
}

function connectParticles(
  scene: ParticleScene,
  particle: Particle,
  index: number,
) {
  for (
    let otherIndex = index + 1;
    otherIndex < scene.particles.length;
    otherIndex += 1
  ) {
    const other = scene.particles[otherIndex];
    const dx = particle.x - other.x;
    const dy = particle.y - other.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= 6_400) continue;
    const alpha = (1 - Math.sqrt(distanceSquared) / 80) * 0.12;
    scene.context.beginPath();
    scene.context.moveTo(particle.x, particle.y);
    scene.context.lineTo(other.x, other.y);
    scene.context.strokeStyle = scene.connectionColor;
    scene.context.globalAlpha = alpha;
    scene.context.lineWidth = 0.5;
    scene.context.stroke();
    scene.context.globalAlpha = 1;
  }
}

function drawScene(scene: ParticleScene) {
  if (!scene.active) return;
  scene.context.clearRect(0, 0, scene.width, scene.height);
  scene.particles.forEach((particle, index) => {
    moveParticle(scene, particle);
    drawParticle(scene.context, particle);
    connectParticles(scene, particle, index);
  });
  scene.frame = requestAnimationFrame(() => drawScene(scene));
}

function createScene(canvas: HTMLCanvasElement, mouseRepel: boolean) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const { colors, connectionColor } = readSceneColors();
  const scene: ParticleScene = {
    active: !document.hidden,
    canvas,
    connectionColor,
    context,
    frame: 0,
    height: 0,
    mouse: { x: -9999, y: -9999 },
    mouseRepel,
    particles: [],
    width: 0,
  };
  return { colors, scene };
}

export function startParticleScene(
  canvas: HTMLCanvasElement,
  count: number,
  mouseRepel: boolean,
) {
  const created = createScene(canvas, mouseRepel);
  if (!created) return () => undefined;
  const { colors, scene } = created;
  const resize = () => resizeScene(scene, count, colors);
  const onMouseMove = (event: MouseEvent) => {
    const bounds = canvas.getBoundingClientRect();
    scene.mouse = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };
  const onMouseLeave = () => {
    scene.mouse = { x: -9999, y: -9999 };
  };
  const onVisibilityChange = () => {
    scene.active = !document.hidden;
    if (scene.active) {
      cancelAnimationFrame(scene.frame);
      scene.frame = requestAnimationFrame(() => drawScene(scene));
    }
  };
  const observer = new ResizeObserver(resize);
  resize();
  drawScene(scene);
  observer.observe(canvas);
  if (mouseRepel) {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", onMouseLeave);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    cancelAnimationFrame(scene.frame);
    observer.disconnect();
    if (mouseRepel) {
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
