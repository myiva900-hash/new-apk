import React, { useEffect, useRef } from 'react';

interface MatrixHackingBackgroundProps {
  accentColor?: 'blue' | 'red' | 'green' | 'yellow' | 'black';
}

export const MatrixHackingBackground: React.FC<MatrixHackingBackgroundProps> = ({
  accentColor = 'blue',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const fontSize = 15;
    let columns = Math.max(1, Math.floor(width / fontSize));
    const maxRows = Math.max(20, Math.ceil(height / fontSize));

    // Start drops already distributed across the viewport so hacking code is visible immediately
    let drops: number[] = Array.from({ length: columns }, () =>
      Math.floor(Math.random() * maxRows)
    );
    let colColors: boolean[] = Array.from({ length: columns }, (_, i) => i % 2 === 0);

    // Falling numbers, letters, and cyber/hacking symbols
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*+=<>/{}[]?!~';

    const drawStep = () => {
      // Fade existing trails transparently so #050B1A, aurora orbs, and grid stay crisp underneath
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const isGreen = colColors[i];

        // Strictly Green & Red hacking code (neon emerald green & cyber red)
        if (isGreen) {
          ctx.fillStyle = Math.random() > 0.8 ? '#6EE7B7' : '#10B981';
        } else {
          ctx.fillStyle = Math.random() > 0.8 ? '#FCA5A5' : '#EF4444';
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.96) {
          drops[i] = 0;
          colColors[i] = Math.random() > 0.45;
        }
        drops[i] += 1;
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.max(1, Math.floor(width / fontSize));
      const rows = Math.max(20, Math.ceil(height / fontSize));
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * rows));
      colColors = Array.from({ length: columns }, (_, i) => i % 2 === 0);
      // Pre-populate a few frames so resize looks full immediately
      for (let k = 0; k < 6; k++) drawStep();
    };

    window.addEventListener('resize', handleResize);

    // Pre-draw initial trails so screen is never blank on load
    for (let k = 0; k < 10; k++) {
      drawStep();
    }

    let lastTime = 0;
    const fpsInterval = 52;

    const render = (timestamp: number) => {
      if (prefersReducedMotion) return;

      if (timestamp - lastTime >= fpsInterval) {
        lastTime = timestamp;
        drawStep();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getOrbGradient = () => {
    switch (accentColor) {
      case 'red':
        return 'from-rose-600/35 via-red-700/20 to-transparent';
      case 'green':
        return 'from-emerald-500/35 via-teal-600/20 to-transparent';
      case 'yellow':
        return 'from-amber-500/35 via-yellow-600/20 to-transparent';
      case 'black':
        return 'from-slate-600/30 via-slate-800/20 to-transparent';
      case 'blue':
      default:
        return 'from-blue-600/35 via-cyan-500/25 to-transparent';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Luxury Deep Navy Base (#050B1A) in dark mode, crisp slate-100 in light mode */}
      <div className="absolute inset-0 bg-slate-200/75 dark:bg-[#050B1A] transition-colors" />

      {/* Drifting Aurora Glow Orbs */}
      <div
        className={`absolute -top-28 -left-28 w-96 h-96 rounded-full bg-gradient-to-br ${getOrbGradient()} blur-3xl live-wallpaper-orb1`}
      />
      <div className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-cyan-500/25 via-blue-700/25 to-transparent blur-3xl live-wallpaper-orb2" />
      <div className="absolute -bottom-28 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/25 via-amber-500/20 to-transparent blur-3xl live-wallpaper-orb3" />

      {/* Subtle Cyber-Grid Lines */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(6,182,212,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,78,216,0.28) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      {/* Red & Green Falling Hacking Matrix Canvas (transparent trails over aurora + grid) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70 dark:opacity-90 transition-opacity"
      />

      {/* Floating Constellation Nodes */}
      <svg
        className="absolute inset-0 w-full h-full opacity-45 dark:opacity-65"
        aria-hidden="true"
      >
        <line x1="10%" y1="16%" x2="36%" y2="28%" stroke="#06B6D4" strokeWidth="0.9" strokeDasharray="3 4" />
        <line x1="36%" y1="28%" x2="74%" y2="20%" stroke="#10B981" strokeWidth="0.9" strokeDasharray="3 4" />
        <line x1="74%" y1="20%" x2="88%" y2="60%" stroke="#F59E0B" strokeWidth="0.9" strokeDasharray="3 4" />
        <line x1="18%" y1="74%" x2="66%" y2="84%" stroke="#06B6D4" strokeWidth="0.9" strokeDasharray="3 4" />
        <circle cx="10%" cy="16%" r="3" fill="#06B6D4" className="constellation-node" />
        <circle cx="36%" cy="28%" r="2.5" fill="#10B981" className="constellation-node" />
        <circle cx="74%" cy="20%" r="3" fill="#FBBF24" className="constellation-node" />
        <circle cx="88%" cy="60%" r="2.5" fill="#EF4444" className="constellation-node" />
        <circle cx="18%" cy="74%" r="3" fill="#10B981" className="constellation-node" />
        <circle cx="66%" cy="84%" r="2.5" fill="#06B6D4" className="constellation-node" />
      </svg>
    </div>
  );
};
