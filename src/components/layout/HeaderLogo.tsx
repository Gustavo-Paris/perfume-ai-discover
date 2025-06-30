
import { Link } from 'react-router-dom';

const HeaderLogo = () => {
  return (
    <Link to="/" className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
        <span className="text-white font-bold text-sm">P&C</span>
      </div>
      <div className="hidden sm:block">
        <h1 className="font-playfair font-bold text-xl gradient-text">
          Paris & Co
        </h1>
        <p className="text-xs text-muted-foreground -mt-1">Parfums</p>
      </div>
    </Link>
  );
};

export default HeaderLogo;
