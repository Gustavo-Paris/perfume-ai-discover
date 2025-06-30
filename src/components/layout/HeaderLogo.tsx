
import { Link } from 'react-router-dom';

const HeaderLogo = () => {
  return (
    <Link to="/" className="flex items-center">
      <h1 className="font-display font-bold text-xl text-gold">
        Paris & Co
      </h1>
    </Link>
  );
};

export default HeaderLogo;
