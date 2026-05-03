import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const INAT_URL =
  'https://api.inaturalist.org/v1/observations' +
  '?taxon_name=Aves&lat=-23.862969&lng=-45.321893&radius=17' +
  '&quality_grade=research&per_page=200&order_by=observed_on';

type InatObs = {
  id: number;
  species_guess: string;
  taxon?: { name: string; preferred_common_name?: string; default_photo?: { square_url: string } };
  observed_on: string;
  place_guess: string;
  user: { login: string };
};

type InatResponse = { results: InatObs[]; total_results: number };
type LocalBird = { birdId: number; birdName: string; count: number };

function normalize(name: string) {
  return name.toLowerCase().trim();
}

export default function InatLab() {
  const [view, setView] = useState<'overlap' | 'inat-only' | 'local-only' | 'raw'>('overlap');

  const { data: inatData, isLoading: inatLoading, isError: inatError } = useQuery<InatResponse>({
    queryKey: ['inat-ilhabela'],
    queryFn: () => fetch(INAT_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  const { data: localData = [], isLoading: localLoading } = useQuery<LocalBird[]>({
    queryKey: ['/api/sightings/by-bird'],
  });

  const isLoading = inatLoading || localLoading;

  const inatSpecies: Map<string, { commonName: string; count: number; photo: string | null; example: InatObs }> = new Map();
  if (inatData?.results) {
    for (const obs of inatData.results) {
      const key = normalize(obs.taxon?.name ?? obs.species_guess ?? '');
      if (!key) continue;
      const existing = inatSpecies.get(key);
      if (existing) {
        existing.count++;
      } else {
        inatSpecies.set(key, {
          commonName: obs.taxon?.preferred_common_name ?? obs.species_guess ?? obs.taxon?.name ?? '',
          count: 1,
          photo: obs.taxon?.default_photo?.square_url ?? null,
          example: obs,
        });
      }
    }
  }

  const localByName = new Map<string, LocalBird>();
  for (const b of localData) {
    localByName.set(normalize(b.birdName), b);
  }

  const inatKeys = Array.from(inatSpecies.keys());
  const localKeys = Array.from(localByName.keys());

  const overlap = inatKeys.filter(k => localKeys.some(lk => lk.includes(k) || k.includes(lk)));
  const inatOnly = inatKeys.filter(k => !localKeys.some(lk => lk.includes(k) || k.includes(lk)));
  const localOnly = localData.filter(b => !inatKeys.some(ik => ik.includes(normalize(b.birdName)) || normalize(b.birdName).includes(ik)));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            🔬 Página de laboratório — não indexada
          </div>
          <h1 className="text-2xl font-bold font-montserrat text-gray-900">
            Comparativo: Toca × iNaturalist Ilhabela
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comparando os avistamentos do catálogo com observações da comunidade iNaturalist num raio de 17km ao redor da Cachoeira da Toca.
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-16 text-gray-400">Carregando dados…</div>
        )}

        {inatError && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6 text-sm">
            Erro ao carregar dados do iNaturalist. Verifique a conexão.
          </div>
        )}

        {!isLoading && inatData && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Obs. iNaturalist', value: inatData.total_results, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Espécies iNat (amostra)', value: inatSpecies.size, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Espécies no catálogo', value: localData.length, color: 'bg-[#159d51]/10 text-[#159d51] border-[#159d51]/20' },
                { label: 'Em comum (aprox.)', value: overlap.length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
              {[
                { key: 'overlap', label: `Em comum (${overlap.length})` },
                { key: 'inat-only', label: `Só no iNat (${inatOnly.length})` },
                { key: 'local-only', label: `Só no catálogo (${localOnly.length})` },
                { key: 'raw', label: 'Obs. brutas iNat' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key as typeof view)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    view === tab.key
                      ? 'bg-[#159d51] text-white border-[#159d51]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#159d51]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {view === 'overlap' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Espécies presentes tanto no catálogo quanto nas observações iNaturalist da região.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {overlap.map(k => {
                    const inat = inatSpecies.get(k)!;
                    const local = localData.find(b => normalize(b.birdName).includes(k) || k.includes(normalize(b.birdName)));
                    return (
                      <div key={k} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                        {inat.photo && <img src={inat.photo} alt={inat.commonName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        {!inat.photo && <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">{local?.birdName ?? inat.commonName}</div>
                          <div className="text-xs text-gray-400 italic truncate">{k}</div>
                          <div className="flex gap-3 mt-1 text-xs">
                            <span className="text-[#159d51]">🏕 {local?.count ?? 0} na Toca</span>
                            <span className="text-green-600">🌿 {inat.count} no iNat</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'inat-only' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Espécies observadas na região pelo iNaturalist mas ainda não no catálogo da Toca. Possíveis candidatas para adição!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inatOnly.sort((a, b) => (inatSpecies.get(b)?.count ?? 0) - (inatSpecies.get(a)?.count ?? 0)).map(k => {
                    const inat = inatSpecies.get(k)!;
                    return (
                      <div key={k} className="flex items-center gap-3 bg-white rounded-xl border border-orange-100 p-3 shadow-sm">
                        {inat.photo && <img src={inat.photo} alt={inat.commonName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                        {!inat.photo && <div className="w-12 h-12 rounded-lg bg-orange-50 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">{inat.commonName || k}</div>
                          <div className="text-xs text-gray-400 italic truncate">{k}</div>
                          <div className="text-xs text-green-600 mt-1">🌿 {inat.count} obs. no iNat</div>
                        </div>
                        <a
                          href={`https://www.inaturalist.org/taxa/${inat.example.taxon?.name?.replace(/ /g, '-')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex-shrink-0"
                        >
                          ver →
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'local-only' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Espécies no catálogo da Toca sem registros correspondentes no iNaturalist da região — exclusividades locais ou espécies subregistradas.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localOnly.sort((a, b) => b.count - a.count).map(b => (
                    <div key={b.birdName} className="flex items-center gap-3 bg-white rounded-xl border border-blue-100 p-3 shadow-sm">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">🐦</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">{b.birdName}</div>
                        <div className="text-xs text-[#159d51] mt-1">🏕 {b.count} na Toca</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'raw' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Últimas {inatData.results.length} observações de aves no iNaturalist dentro do raio de 17km da Cachoeira da Toca.</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Espécie</th>
                        <th className="px-4 py-3 text-left">Nome científico</th>
                        <th className="px-4 py-3 text-left">Data</th>
                        <th className="px-4 py-3 text-left">Local</th>
                        <th className="px-4 py-3 text-left">Observador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {inatData.results.map(obs => (
                        <tr key={obs.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 flex items-center gap-2">
                            {obs.taxon?.default_photo?.square_url && (
                              <img src={obs.taxon.default_photo.square_url} className="w-8 h-8 rounded object-cover" alt="" />
                            )}
                            <span className="font-medium text-gray-800">{obs.taxon?.preferred_common_name ?? obs.species_guess}</span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 italic text-xs">{obs.taxon?.name}</td>
                          <td className="px-4 py-2 text-gray-600">{obs.observed_on}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs max-w-[160px] truncate">{obs.place_guess}</td>
                          <td className="px-4 py-2">
                            <a href={`https://www.inaturalist.org/people/${obs.user.login}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">
                              {obs.user.login}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
