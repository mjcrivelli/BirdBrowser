import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Edit2 } from 'lucide-react';

interface CatalogAbout {
  id: number;
  title: string;
  content: string;
}

const SobreOCatalogo = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const { isAdminMode, adminPassword } = useAdmin();
  const { toast } = useToast();

  const { data: aboutData, isLoading } = useQuery<CatalogAbout>({
    queryKey: ['/api/catalog-about'],
    queryFn: () => fetch('/api/catalog-about').then(res => res.json()),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await fetch('/api/admin/catalog-about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['/api/catalog-about'], updated);
      setIsEditDialogOpen(false);
      toast({ title: 'Sucesso', description: 'Conteúdo atualizado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao atualizar conteúdo.', variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (aboutData) {
      setEditData({ title: aboutData.title, content: aboutData.content });
    }
  }, [aboutData]);

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="h-12 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-montserrat font-bold">{aboutData?.title}</h1>
            {isAdminMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="flex gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>

          <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-700 whitespace-pre-wrap">{aboutData?.content}</p>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Sobre o Catálogo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conteúdo</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  rows={10}
                  value={editData.content}
                  onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
};

export default SobreOCatalogo;
