
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  animationDelay: number;
  size: number;
  color: string;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

const FloatingParticles = ({ count = 20, className = "" }: FloatingParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const colors = [
    '#D4AF37', // Gold
    '#00D4FF', // Tech Cyan
    '#8B5CF6', // Tech Purple
    '#10B981', // Tech Green
    '#FFFFFF'  // White
  ];

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 12,
      size: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`particle-container-luxury ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle-luxury"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDelay: `${particle.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
