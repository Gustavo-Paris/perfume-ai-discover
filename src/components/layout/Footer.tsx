
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
                <span className="text-white font-bold text-sm">P&C</span>
              </div>
              <div>
                <h3 className="font-playfair font-bold text-xl gradient-text">
                  Paris & Co
                </h3>
                <p className="text-xs text-gray-400 -mt-1">Parfums</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Descubra o perfume ideal com nossa curadoria personalizada. 
              A mais sofisticada seleção de fragrâncias francesas no Brasil.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gold-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Navegação</h4>
            <ul className="space-y-2">
              <li><Link to="/curadoria" className="text-gray-300 hover:text-gold-400 transition-colors">Curadoria</Link></li>
              <li><Link to="/catalogo" className="text-gray-300 hover:text-gold-400 transition-colors">Catálogo</Link></li>
              <li><Link to="/sobre" className="text-gray-300 hover:text-gold-400 transition-colors">Sobre Nós</Link></li>
              <li><Link to="/contato" className="text-gray-300 hover:text-gold-400 transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Atendimento</h4>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-gray-300 hover:text-gold-400 transition-colors">FAQ</Link></li>
              <li><Link to="/politica-troca" className="text-gray-300 hover:text-gold-400 transition-colors">Política de Troca</Link></li>
              <li><Link to="/fidelidade" className="text-gray-300 hover:text-gold-400 transition-colors">Programa Fidelidade</Link></li>
              <li><Link to="/rastreamento" className="text-gray-300 hover:text-gold-400 transition-colors">Rastreamento</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gold-400" />
                <span className="text-gray-300 text-sm">(11) 3456-7890</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gold-400" />
                <span className="text-gray-300 text-sm">contato@pariscoparfums.com.br</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gold-400 mt-1" />
                <span className="text-gray-300 text-sm">
                  Rua Augusta, 123<br />
                  São Paulo - SP, 01234-567
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Paris & Co Parfums. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacidade" className="text-gray-400 hover:text-gold-400 transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="text-gray-400 hover:text-gold-400 transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
