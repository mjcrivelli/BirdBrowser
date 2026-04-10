import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Settings, X, LogOut } from 'lucide-react';
import Logo from './ui/logo';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location] = useLocation();
  const { isAdminMode, setAdminMode, exitAdminMode } = useAdmin();
  const { toast } = useToast();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    const success = await setAdminMode(password);
    setIsLoading(false);
    
    if (success) {
      setAdminDialogOpen(false);
      setPassword('');
      toast({ title: 'Modo Admin', description: 'Modo administrador ativado!' });
    } else {
      toast({ title: 'Erro', description: 'Senha incorreta.', variant: 'destructive' });
    }
  };

  const handleExitAdmin = () => {
    exitAdminMode();
    toast({ title: 'Modo Admin', description: 'Modo administrador desativado.' });
  };

  const navLinks = [
    { label: 'Aves da Toca', href: '/' },
    { label: 'Jogo da Memória', href: '/memoria' },
    { label: 'Avistamentos', href: '/avistamentos' },
    { label: 'Sobre o catálogo', href: '/sobre-o-catalogo' },
  ];

  return (
    <header className="sticky top-0 bg-white shadow-sm z-10" role="banner">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="flex items-center" aria-label="Ir para a página inicial Aves da Toca">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex space-x-6 text-sm font-montserrat" role="navigation" aria-label="Navegação principal">
            {navLinks.map((link, index) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={index}
                  href={link.href}
                  className={`transition-colors uppercase ${
                    isActive
                      ? "text-[#4CAF50] hover:text-[#388E3C] font-bold"
                      : "text-gray-500 hover:text-[#4CAF50]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {isAdminMode ? (
            <button
              onClick={handleExitAdmin}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
              data-testid="button-exit-admin"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair Admin</span>
            </button>
          ) : (
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Modo administrador"
                  data-testid="button-admin"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Modo Administrador</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Input
                    type="password"
                    placeholder="Senha do administrador"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    data-testid="input-admin-password"
                  />
                  <Button onClick={handleAdminLogin} disabled={isLoading} data-testid="button-admin-login">
                    {isLoading ? 'Verificando...' : 'Entrar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {isAdminMode && (
            <button
              onClick={handleExitAdmin}
              className="text-red-500 hover:text-red-700"
              aria-label="Sair do modo administrador"
              data-testid="button-exit-admin-mobile"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
          <button
            className="text-[#333333]"
            onClick={toggleMobileMenu}
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md px-4 py-2">
          <nav id="mobile-navigation" className="flex flex-col space-y-3 font-montserrat text-sm" role="navigation" aria-label="Navegação móvel">
            {navLinks.map((link, index) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={index}
                  href={link.href}
                  className={`py-2 transition-colors uppercase ${
                    isActive
                      ? "text-[#4CAF50] hover:text-[#388E3C] font-bold"
                      : "text-gray-500 hover:text-[#4CAF50]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
