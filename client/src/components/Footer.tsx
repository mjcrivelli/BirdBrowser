import React from 'react';
import { Link } from 'wouter';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-[#DDEBDD]" role="contentinfo">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="font-montserrat font-bold text-lg mb-3">Cachoeira da Toca</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Localizada em meio à Mata Atlântica, a Cachoeira da Toca é um lugar único para observação de aves e contato com a natureza.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-montserrat font-semibold mb-3">Navegação</h4>
              <nav aria-label="Navegação do rodapé">
                <ul className="text-sm space-y-2">
                  <li><Link href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors">Início</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors">Nossa História</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors">Clube Toca</Link></li>
                  <li><Link href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors">Aves da Toca</Link></li>
                </ul>
              </nav>
            </div>

            <div>
              <h4 className="font-montserrat font-semibold mb-3">Contato</h4>
              <ul className="text-sm space-y-2">
                <li className="text-gray-600">(XX) XXXX-XXXX</li>
                <li className="text-gray-600">contato@cachoeiradatoca.com.br</li>
                <li className="text-gray-600">Rod. XXX, Km XX - SP</li>
              </ul>
            </div>

            <div>
              <h4 className="font-montserrat font-semibold mb-3">Redes Sociais</h4>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors" aria-label="Facebook da Cachoeira da Toca">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors" aria-label="Instagram da Cachoeira da Toca">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-[#4CAF50] transition-colors" aria-label="Twitter da Cachoeira da Toca">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#DDEBDD] text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Cachoeira da Toca. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
