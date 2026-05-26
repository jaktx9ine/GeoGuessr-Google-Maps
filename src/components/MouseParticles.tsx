import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function MouseParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      
      // Add 2 particles per mouse move for a dense trail
      for (let i = 0; i < 2; i++) {
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: (Math.random() - 0.5) * 1.5 - 0.5, // Slight upward drift
          life: 0,
          maxLife: Math.random() * 50 + 50, // frames
          color: randomColor
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // We use a slight trail effect by not fully clearing, but since it's transparent, clearRect is cleaner.
      
      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;
        
        const progress = p.life / p.maxLife;
        const opacity = 1 - progress;
        
        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1);
          i--;
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * opacity, 0, Math.PI * 2);
        
        // Add glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ opacity: 0.6 }} // Adjust opacity as needed
    />
  );
}
