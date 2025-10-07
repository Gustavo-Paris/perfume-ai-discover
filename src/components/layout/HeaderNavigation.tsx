
import { Link } from 'react-router-dom';
import { useRecovery } from '@/contexts/RecoveryContext';
import { useAuth } from '@/contexts/AuthContext';

const HeaderNavigation = () => {
  const { isRecoveryMode } = useRecovery();
  const { user } = useAuth();

  if (isRecoveryMode) {
    return null;
  }

  // Navigation items based on authentication status
  const navigation = [
    { name: 'Curadoria', href: '/curadoria' },
    { name: 'Catálogo', href: '/catalogo' },
    { name: 'Assinaturas', href: '/assinaturas' },
    ...(user ? [{ name: 'Fidelidade', href: '/fidelidade' }] : []), // Only show if logged in
  ];

  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors duration-200"
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default HeaderNavigation;
