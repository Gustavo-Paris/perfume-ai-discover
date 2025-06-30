
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  animationDelay: number;
  size: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

const FloatingParticles = ({ count = 20, className = "" }: FloatingParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 8,
      size: Math.random() * 3 + 1,
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`particle-container ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
