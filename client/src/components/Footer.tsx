import { Link } from 'wouter';
import { Facebook, Instagram } from 'lucide-react';
import { SiTripadvisor } from 'react-icons/si';

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-[#DDEBDD]" role="contentinfo">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0 md:max-w-xs">
            <h3 className="font-montserrat font-bold text-lg mb-3">Cachoeira da Toca</h3>
            <p className="text-sm text-gray-600">
              Localizada em meio à Mata Atlântica, a Cachoeira da Toca é um lugar único para observação de aves e contato com a natureza.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-montserrat font-semibold mb-3">Navegação</h4>
              <nav aria-label="Navegação do rodapé">
                <ul className="text-sm space-y-2">
                  <li><Link href="/" className="text-gray-600 hover:text-[#4CAF50] transition-colors">Aves da Toca</Link></li>
                  <li><Link href="/memoria" className="text-gray-600 hover:text-[#4CAF50] transition-colors">Jogo da Memória</Link></li>
                </ul>
              </nav>
            </div>

            <div>
              <h4 className="font-montserrat font-semibold mb-3">Contato</h4>
              <ul className="text-sm space-y-2">
                <li className="text-gray-600">+55 12 997933354</li>
                <li className="text-gray-600">vitoria@cachoeiradatoca.com</li>
                <li className="text-gray-600">Estrada da Toca, 1000, Ilhabela-SP, Brasil</li>
              </ul>
            </div>

            <div>
              <h4 className="font-montserrat font-semibold mb-3">Redes Sociais</h4>
              <div className="flex space-x-3">
                <a href="https://www.facebook.com/CachoeiraDaToca/?rf=1284221224961983" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#4CAF50] transition-colors" aria-label="Facebook da Cachoeira da Toca">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/cachoeiradatoca/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#4CAF50] transition-colors" aria-label="Instagram da Cachoeira da Toca">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.tripadvisor.com/Attraction_Review-g609135-d2427343-Reviews-Cachoeira_Da_Toca-Ilhabela_State_of_Sao_Paulo.html" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#4CAF50] transition-colors" aria-label="TripAdvisor da Cachoeira da Toca">
                  <SiTripadvisor className="w-5 h-5" />
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
