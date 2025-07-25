
import { Link } from 'react-router-dom';
import { useRecovery } from '@/contexts/RecoveryContext';

const navigation = [
  { name: 'Curadoria', href: '/curadoria' },
  { name: 'Catálogo', href: '/catalogo' },
  { name: 'Fidelidade', href: '/fidelidade' },
];

const HeaderNavigation = () => {
  const { isRecoveryMode } = useRecovery();

  if (isRecoveryMode) {
    return null;
  }

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
