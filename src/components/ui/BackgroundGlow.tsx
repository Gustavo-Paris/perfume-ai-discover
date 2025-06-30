
import { motion } from 'framer-motion';

const BackgroundGlow = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top-left glow */}
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl neon-glow opacity-20"
        style={{
          background: 'radial-gradient(circle, #7F5AF0 0%, #14B8FF 50%, transparent 70%)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Bottom-right glow */}
      <motion.div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl neon-glow opacity-15"
        style={{
          background: 'radial-gradient(circle, #EA4C89 0%, #7F5AF0 50%, transparent 70%)'
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      {/* Center subtle glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-5"
        style={{
          background: 'radial-gradient(ellipse, #14B8FF 0%, #7F5AF0 40%, transparent 70%)'
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Grid overlay */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-5" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <defs>
          <pattern 
            id="grid" 
            width="10" 
            height="10" 
            patternUnits="userSpaceOnUse"
          >
            <path 
              d="M 10 0 L 0 0 0 10" 
              fill="none" 
              stroke="#7F5AF0" 
              strokeWidth="0.5"
              opacity="0.12"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

export default BackgroundGlow;
