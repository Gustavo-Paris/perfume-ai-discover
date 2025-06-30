
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeaderLogo = () => {
  return (
    <Link to="/" className="flex items-center space-x-3 group">
      <motion.div 
        className="w-10 h-10 rounded-full bg-gold flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <span className="text-navy font-bold text-sm font-heading">P&Co</span>
      </motion.div>
      <div className="hidden sm:block">
        <motion.h1 
          className="font-heading font-bold text-xl text-gold group-hover:text-white transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          Paris & Co
        </motion.h1>
        <p className="text-xs text-white/70 -mt-1 font-body">Parfums</p>
      </div>
    </Link>
  );
};

export default HeaderLogo;
