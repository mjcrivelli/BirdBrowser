import { useState } from 'react';
import { Download, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import { queryClient } from '@/lib/queryClient';
import type { BirdWithSeenStatus } from '@shared/schema';

interface SyncResult {
  id: number;
  name: string;
  status: 'pending' | 'downloading' | 'done' | 'failed';
  error?: string;
}

interface AdminImageSyncProps {
  birds: BirdWithSeenStatus[];
}

const AdminImageSync: React.FC<AdminImageSyncProps> = ({ birds }) => {
  const { adminPassword } = useAdmin();
  const [results, setResults] = useState<SyncResult[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const alreadySynced = birds.filter(b => b.customImageUrl && !b.customImageUrl.includes('wikimedia')).length;
  const done = results.filter(r => r.status === 'done').length;
  const failed = results.filter(r => r.status === 'failed').length;

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    return url;
  };

  const downloadAndUpload = async (bird: BirdWithSeenStatus): Promise<void> => {
    const sourceUrl = normalizeUrl(bird.customImageUrl || bird.imageUrl);
    if (!sourceUrl) throw new Error('No image URL');

    const imgRes = await fetch(sourceUrl);
    if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status} fetching image`);

    const blob = await imgRes.blob();
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('gif') ? 'gif' : 'jpg';
    const fileName = `bird-${bird.id}-cached.${ext}`;
    const contentType = blob.type || 'image/jpeg';

    const uploadInfoRes = await fetch('/api/object-storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contentType, isPublic: true }),
    });
    if (!uploadInfoRes.ok) throw new Error('Failed to get upload URL');
    const { uploadUrl, publicUrl } = await uploadInfoRes.json();

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
    if (!putRes.ok) throw new Error(`Upload failed: HTTP ${putRes.status}`);

    const updateRes = await fetch(`/api/admin/birds/${bird.id}/image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, customImageUrl: publicUrl }),
    });
    if (!updateRes.ok) throw new Error('Failed to save image URL');
  };

  const startSync = async () => {
    setRunning(true);
    setExpanded(true);

    const initial: SyncResult[] = birds.map(b => ({ id: b.id, name: b.name, status: 'pending' }));
    setResults(initial);

    for (let i = 0; i < birds.length; i++) {
      const bird = birds[i];

      setResults(prev => prev.map(r => r.id === bird.id ? { ...r, status: 'downloading' } : r));

      try {
        await downloadAndUpload(bird);
        setResults(prev => prev.map(r => r.id === bird.id ? { ...r, status: 'done' } : r));
      } catch (err: any) {
        setResults(prev => prev.map(r =>
          r.id === bird.id ? { ...r, status: 'failed', error: err.message } : r
        ));
      }

      await new Promise(res => setTimeout(res, 300));
    }

    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ['/api/birds'] });
  };

  if (results.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold text-amber-900 text-sm">Backup de imagens no servidor</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {alreadySynced > 0
                ? `${alreadySynced}/70 imagens já salvas localmente.`
                : 'Baixar todas as imagens para o servidor evita quebras futuras.'}
            </p>
          </div>
          <Button
            onClick={startSync}
            disabled={running}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Baixar {alreadySynced > 0 ? 'restantes' : 'todas as'} imagens
          </Button>
        </div>
      </div>
    );
  }

  const total = results.length;
  const progress = Math.round(((done + failed) / total) * 100);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-amber-900 text-sm">
            {running ? 'Baixando imagens...' : 'Download concluído'}
          </p>
          <p className="text-amber-700 text-xs mt-0.5">
            {done} OK · {failed} falha · {total - done - failed} pendentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {running && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-amber-700 hover:text-amber-900"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="w-full bg-amber-200 rounded-full h-2 mb-3">
        <div
          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {expanded && (
        <div className="max-h-48 overflow-y-auto text-xs space-y-0.5 mt-2">
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-2 py-0.5">
              {r.status === 'done' && <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />}
              {r.status === 'failed' && <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
              {r.status === 'downloading' && <Loader2 className="h-3 w-3 animate-spin text-amber-600 shrink-0" />}
              {r.status === 'pending' && <div className="h-3 w-3 rounded-full bg-gray-300 shrink-0" />}
              <span className={r.status === 'failed' ? 'text-red-600' : 'text-gray-700'}>
                {r.id}. {r.name}
                {r.error && ` — ${r.error}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {!running && failed > 0 && (
        <Button onClick={startSync} size="sm" variant="outline" className="mt-3 text-xs">
          Tentar novamente
        </Button>
      )}
    </div>
  );
};

export default AdminImageSync;
