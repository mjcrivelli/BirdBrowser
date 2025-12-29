import logoImage from '@assets/logo_atualizado_1767007291716.png';

interface LogoProps {
  size?: number;
}

const Logo = ({ size = 56 }: LogoProps) => {
  return (
    <img
      src={logoImage}
      width={size}
      height={size}
      alt="Logo Aves da Toca"
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
