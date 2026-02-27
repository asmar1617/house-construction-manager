import { useRef, useEffect } from 'react';
import './DarkVeil.css';

/**
 * DarkVeil-style full-viewport background: dark gradient with subtle animated
 * grain and soft color shift. Sits behind app content (z-index 0).
 * No WebGL deps; pure CSS + optional canvas noise.
 */
function DarkVeil({ className = '', animated = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !animated) return;

    const ctx = canvas.getContext('2d');
    let frameId;

    const w = 256;
    const h = 256;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'cover';

    const drawNoise = () => {
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) * 0.04;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 32;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const tick = () => {
      drawNoise();
      frameId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [animated]);

  return (
    <div className={`dark-veil ${className}`} aria-hidden="true">
      <div className="dark-veil__gradient" />
      {animated && <canvas ref={canvasRef} className="dark-veil__noise" />}
    </div>
  );
}

export default DarkVeil;
