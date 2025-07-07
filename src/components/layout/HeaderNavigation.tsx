
import { Link } from 'react-router-dom';

const navigation = [
  { name: 'Curadoria', href: '/curadoria' },
  { name: 'Catálogo', href: '/catalogo' },
  { name: 'Fidelidade', href: '/fidelidade' },
  { name: 'Afiliados', href: '/afiliados' },
];

const HeaderNavigation = () => {
  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className="navbar-link"
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default HeaderNavigation;
