
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAffiliates } from '@/hooks/useAffiliates';

const navigation = [
  { name: 'Curadoria', href: '/curadoria' },
  { name: 'Catálogo', href: '/catalogo' },
  { name: 'Fidelidade', href: '/fidelidade' },
];

const HeaderNavigation = () => {
  const { user } = useAuth();
  const { affiliate } = useAffiliates();

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
      {user && affiliate && affiliate.status === 'active' && (
        <Link
          to="/afiliados"
          className="navbar-link"
        >
          Afiliados
        </Link>
      )}
    </nav>
  );
};

export default HeaderNavigation;
