import { Link } from 'react-router-dom';
const HeaderLogo = () => {
  return <Link to="/" className="flex items-center">
      <h1 className="font-display font-bold text-xl text-brand-gradient text-[#081049]">
        Paris & Co
      </h1>
    </Link>;
};
export default HeaderLogo;