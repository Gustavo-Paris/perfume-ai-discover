
import { motion } from 'framer-motion';

const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top-left floating shape */}
      <motion.div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[160px] opacity-15"
        style={{
          background: 'rgba(127, 90, 240, 0.15)'
        }}
        animate={{
          y: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Bottom-right floating shape */}
      <motion.div
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-[160px] opacity-12"
        style={{
          background: 'rgba(20, 184, 255, 0.12)'
        }}
        animate={{
          y: [0, -25, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      {/* Bottom-left floating shape */}
      <motion.div
        className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-[160px] opacity-12"
        style={{
          background: 'rgba(234, 76, 137, 0.12)'
        }}
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />
    </div>
  );
};

export default FloatingShapes;
