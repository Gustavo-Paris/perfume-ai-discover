
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  animationDelay: number;
  size: number;
  color: string;
  type: 'luxury' | 'cyber';
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
  cyberpunkRatio?: number; // 0 to 1, percentage of cyberpunk particles
}

const FloatingParticles = ({ 
  count = 20, 
  className = "", 
  cyberpunkRatio = 0.3 
}: FloatingParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const luxuryColors = [
    '#D4AF37', // Gold
    '#B8860B', // Dark gold
    '#FFD700', // Bright gold
    '#FFFFFF'  // White
  ];

  const cyberpunkColors = [
    '#00F5FF', // Cyber blue
    '#BF00FF', // Cyber purple
    '#FF1493', // Cyber pink
    '#00FF41', // Cyber green
  ];

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => {
      const isCyber = Math.random() < cyberpunkRatio;
      const colors = isCyber ? cyberpunkColors : luxuryColors;
      
      return {
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 12,
        size: isCyber ? Math.random() * 1.5 + 0.5 : Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: isCyber ? 'cyber' : 'luxury'
      } as Particle;
    });
    setParticles(newParticles);
  }, [count, cyberpunkRatio]);

  return (
    <div className={`particle-container-luxury ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle-luxury ${particle.type === 'cyber' ? 'animate-cyber-pulse' : ''}`}
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDelay: `${particle.animationDelay}s`,
            boxShadow: particle.type === 'cyber' 
              ? `0 0 8px ${particle.color}, 0 0 12px ${particle.color}` 
              : 'none',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
