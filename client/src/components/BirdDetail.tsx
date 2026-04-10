import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import type { BirdWithSeenStatus } from '@shared/schema';

interface BirdDetailProps {
  bird: BirdWithSeenStatus;
  onClose: () => void;
  onToggleSeen?: (bird: BirdWithSeenStatus) => void;
}

const BirdDetail: React.FC<BirdDetailProps> = ({ bird, onClose, onToggleSeen }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(() => {
    const url = bird.customImageUrl || bird.imageUrl;
    return url?.startsWith('//') ? `https:${url}` : (url || '');
  });
  const retriedRef = useRef(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editData, setEditData] = useState({
    name: bird.name,
    scientificName: bird.scientificName,
    description: bird.description,
    habitat: bird.habitat,
    diet: bird.diet,
    wikipediaUrl: bird.wikipediaUrl,
  });
  const { isAdminMode, adminPassword } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    retriedRef.current = false;
    setImageLoaded(false);
    const url = bird.customImageUrl || bird.imageUrl;
    if (url && url.startsWith('//')) {
      setImageUrl(`https:${url}`);
    } else {
      setImageUrl(url);
    }
  }, [bird.imageUrl, bird.customImageUrl]);

  const handleOpenWikipedia = () => {
    if (bird?.wikipediaUrl) {
      window.open(bird.wikipediaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditSave = async () => {
    setIsEditingInfo(true);
    try {
      const updateRes = await fetch(`/api/admin/birds/${bird.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, ...editData }),
      });

      if (!updateRes.ok) throw new Error('Failed to update bird info');

      const updatedBird = await updateRes.json();
      const DEFAULT_USER_ID = 1;
      const queryKey = ['/api/birds', { userId: DEFAULT_USER_ID }];
      
      const currentData = queryClient.getQueryData<any[]>(queryKey);
      if (currentData) {
        const updatedData = currentData.map(b => 
          b.id === bird.id ? { ...b, ...updatedBird, seen: b.seen } : b
        );
        queryClient.setQueryData(queryKey, updatedData);
      }
      
      setIsEditDialogOpen(false);
      toast({ title: 'Sucesso', description: 'Informações atualizadas com sucesso!' });
    } catch (error) {
      console.error('Edit error:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar informações.', variant: 'destructive' });
    } finally {
      setIsEditingInfo(false);
    }
  };

  const handleSeenToggle = () => {
    if (onToggleSeen) {
      onToggleSeen(bird);
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    // Don't close if clicking on buttons or links
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLAnchorElement ||
      (e.target instanceof Element &&
       (e.target.closest('button') || e.target.closest('a')))
    ) {
      return;
    }
    onClose();
  };

  const headingId = `bird-${bird.id}-title`;
  const regionId = `bird-${bird.id}-details`;
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    // Move focus to the heading when the detail opens
    headingRef.current?.focus();
  }, []);

  return (
    <div
      id={regionId}
      className={`w-full border ${bird.seen ? 'border-[#4CAF50]' : 'border-[#DDEBDD]'} rounded-lg p-6 bg-[#F9FBF9] shadow-md cursor-pointer`}
      onClick={handleContentClick}
      role="region"
      aria-labelledby={headingId}
    >
      <div className="flex justify-between items-start gap-2">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-montserrat font-bold flex-1"
        >
          {bird.name}
        </h2>
        <div className="flex gap-2">
          {isAdminMode && (
            <Button
              variant="ghost"
              size="icon"
              className="text-orange-500 hover:text-orange-600"
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsEditDialogOpen(true); 
              }}
              aria-label={`Editar informações de ${bird.name}`}
            >
              <Edit2 className="h-6 w-6" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
            aria-label="Fechar detalhes da ave"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <p className="text-md text-gray-600 italic">{bird.scientificName}</p>

      <div className="flex flex-col md:flex-row gap-6 mt-4">
        <div className="md:w-1/3 mb-6 md:mb-0">
          {!imageLoaded && (
            <div className="w-full h-[15.625rem] rounded-lg bg-gray-200 animate-pulse"></div>
          )}

          <img
            src={imageUrl}
            alt={`Foto da ave ${bird.name}`}
            className={`w-full h-auto max-h-[15.625rem] rounded-lg object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              if (retriedRef.current) return;
              retriedRef.current = true;
              const url = bird.customImageUrl || bird.imageUrl;
              if (url && url.startsWith('//')) {
                (e.target as HTMLImageElement).src = `https:${url}`;
              }
            }}
          />

          {onToggleSeen && (
            <Button
              className={`mt-4 w-full ${
                bird.seen
                  ? 'bg-[#DDEBDD] text-[#4CAF50] hover:bg-[#C8E6C9]'
                  : 'bg-[#4CAF50] hover:bg-[#388E3C] text-white'
              }`}
              onClick={handleSeenToggle}
              aria-pressed={bird.seen}
              aria-label={bird.seen ? `Marcar ${bird.name} como não vista` : `Marcar ${bird.name} como vista`}
            >
              {bird.seen ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Visto
                </>
              ) : (
                'Vi na Toca!'
              )}
            </Button>
          )}
        </div>

        <div className="md:w-2/3">
          <div className="mb-4">
            <h3 className="font-montserrat font-semibold text-lg mb-2">Descrição</h3>
            <p>{bird.description}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-montserrat font-semibold text-lg mb-2">Habitat</h3>
            <p>{bird.habitat}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-montserrat font-semibold text-lg mb-2">Dieta</h3>
            <p>{bird.diet}</p>
          </div>

          <div className="mt-6">
            <Button
              className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-montserrat"
              onClick={handleOpenWikipedia}
              aria-label={`Abrir página da Wikipedia sobre ${bird.name} em nova aba`}
            >
              Ver na Wikipedia
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Editar informações de {bird.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Nome Científico</label>
              <Input value={editData.scientificName} onChange={(e) => setEditData({...editData, scientificName: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black" rows={3} value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Habitat</label>
              <textarea className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black" rows={2} value={editData.habitat} onChange={(e) => setEditData({...editData, habitat: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Dieta</label>
              <textarea className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black" rows={2} value={editData.diet} onChange={(e) => setEditData({...editData, diet: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">URL Wikipedia</label>
              <Input value={editData.wikipediaUrl} onChange={(e) => setEditData({...editData, wikipediaUrl: e.target.value})} />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditSave} disabled={isEditingInfo}>{isEditingInfo ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BirdDetail;
