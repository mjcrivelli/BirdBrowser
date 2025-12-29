import { useState, useEffect, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Check, Camera, Loader2 } from 'lucide-react';
import type { BirdWithSeenStatus } from '@shared/schema';
import { announce } from '@/lib/utils';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface BirdCardProps {
  bird: BirdWithSeenStatus;
  onClick: (bird: BirdWithSeenStatus) => void;
  onToggleSeen?: (bird: BirdWithSeenStatus) => void;
  isExpanded?: boolean;
}

const BirdCard: React.FC<BirdCardProps> = ({
  bird,
  onClick,
  onToggleSeen,
  isExpanded = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAdminMode, adminPassword } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const url = bird.customImageUrl || bird.imageUrl;
    if (url && url.startsWith('//')) {
      setImageUrl(`https:${url}`);
    } else {
      setImageUrl(url);
    }
  }, [bird.imageUrl, bird.customImageUrl]);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Por favor, selecione uma imagem.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await fetch('/api/object-storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `bird-${bird.id}-${Date.now()}.${file.name.split('.').pop()}`,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!uploadRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await uploadRes.json();

      const uploadFileRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadFileRes.ok) throw new Error('Failed to upload file');

      const updateRes = await fetch(`/api/admin/birds/${bird.id}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, customImageUrl: publicUrl }),
      });

      if (!updateRes.ok) throw new Error('Failed to update bird image');

      queryClient.invalidateQueries({ queryKey: ['/api/birds'] });
      toast({ title: 'Sucesso', description: 'Imagem atualizada com sucesso!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Erro', description: 'Falha ao enviar imagem.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    console.log(`Failed to load image for ${bird.name}: ${imageUrl}`);

    // Only attempt one simple fallback - add https: if it's missing
    if (bird.imageUrl && bird.imageUrl.startsWith('//')) {
      const fixedUrl = `https:${bird.imageUrl}`;
      (e.target as HTMLImageElement).src = fixedUrl;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(bird);
    }
  };

  const handleSeenToggle = (e: React.MouseEvent) => {
    // Stop the click from propagating to the card click handler
    e.stopPropagation();
    if (onToggleSeen) {
      onToggleSeen(bird);
    }
    announce(bird.seen ? `${bird.name} marcada como não vista` : `${bird.name} marcada como vista`);
  };

  const descriptionId = `bird-${bird.id}-desc`;

  return (
    <div
      id={`bird-card-${bird.id}`}
      className={`${bird.seen ? 'bg-[#F5FFF5]' : 'bg-white'} rounded-lg p-2 sm:p-3 transition-all duration-300 flex flex-col h-full ${isExpanded ? 'bg-[#F9FBF9]' : 'cursor-pointer hover:shadow-md hover:-translate-y-1'}`}
      onClick={isExpanded ? undefined : () => onClick(bird)}
      role={isExpanded ? undefined : 'button'}
      tabIndex={isExpanded ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label={isExpanded ? undefined : `Ver detalhes da ave ${bird.name}`}
      aria-describedby={isExpanded ? undefined : descriptionId}
      aria-expanded={isExpanded}
      aria-controls={isExpanded ? undefined : `bird-${bird.id}-details`}
    >
      <div className="relative flex justify-center">
        {/* Placeholder shown until image loads */}
        {!imageLoaded && !imageError && (
          <div className="w-[7.5rem] h-[7.5rem] sm:w-[8.125rem] sm:h-[8.125rem] rounded-full bg-gray-200 animate-pulse"></div>
        )}

        <LazyLoadImage
          src={imageUrl}
          alt={`Foto da ave ${bird.name}`}
          effect="blur"
          className={`w-[7.5rem] h-[7.5rem] sm:w-[8.125rem] sm:h-[8.125rem] rounded-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />

        {/* Seen indicator */}
        {bird.seen && (
          <div className="absolute top-0 right-1/4 bg-[#4CAF50] text-white rounded-full p-1" aria-hidden="true">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
          </div>
        )}

        {/* Admin upload button */}
        {isAdminMode && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid={`input-upload-${bird.id}`}
            />
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="absolute bottom-0 right-1/4 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors shadow-lg"
              aria-label={`Enviar nova foto para ${bird.name}`}
              data-testid={`button-upload-${bird.id}`}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </>
        )}
      </div>

      <div className="text-center mt-2 sm:mt-3 flex flex-col items-center w-full px-1">
        <h3 className="font-montserrat font-semibold text-base sm:text-lg w-full break-words">{bird.name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 italic w-full break-words">{bird.scientificName}</p>
        <span id={descriptionId} className="visually-hidden">
          Nome científico {bird.scientificName}. {bird.seen ? 'Marcada como vista.' : 'Ainda não vista.'} Pressione Enter ou Espaço para abrir os detalhes.
        </span>
      </div>

      {onToggleSeen && (
        <div className="flex-1 flex flex-col items-center justify-end w-full px-1 mt-2 sm:mt-3">
          <button
            onClick={handleSeenToggle}
            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              bird.seen
                ? 'bg-[#DDEBDD] text-[#4CAF50] hover:bg-[#C8E6C9]'
                : 'bg-[#4CAF50] text-white hover:bg-[#388E3C]'
            }`}
            aria-pressed={bird.seen}
            aria-label={bird.seen ? `Marcar ${bird.name} como não vista` : `Marcar ${bird.name} como vista`}
          >
            {bird.seen ? 'Visto ✓' : 'Vi na Toca!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BirdCard;
