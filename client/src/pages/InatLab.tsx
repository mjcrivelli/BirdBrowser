import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Bird } from '@shared/schema';

const INAT_URL = '/api/lab/inat';
const GBIF_URL = '/api/lab/gbif';

const WIKIAVES_URL = 'https://www.wikiaves.com.br/especies.php?t=c&c=3520400&o=1&ef=0';

type InatObs = {
  id: number;
  taxon?: { name: string; preferred_common_name?: string; default_photo?: { square_url: string } };
  observed_on: string;
  place_guess: string;
  user: { login: string };
};
type InatResponse = { results: InatObs[]; total_results: number };

type GbifResponse = {
  count: number;
  results: { species?: string; vernacularName?: string; year?: number; decimalLatitude?: number; decimalLongitude?: number }[];
};

type SourceInfo = { count: number; vernacular?: string; photo?: string };

type MergedSpecies = {
  scientificName: string;
  localName?: string;
  inat?: SourceInfo;
  ebird?: SourceInfo;
  catalog?: { count: number; family?: string | null };
};

function normSci(name: string) {
  return name?.toLowerCase().trim() ?? '';
}

export default function InatLab() {
  const [view, setView] = useState<'all' | 'inat-only' | 'ebird-only' | 'catalog-only' | 'multi' | 'raw-inat' | 'raw-ebird'>('all');

  const { data: catalogBirds = [], isLoading: catalogLoading } = useQuery<Bird[]>({
    queryKey: ['/api/birds'],
  });

  const { data: inatData, isLoading: inatLoading, isError: inatError } = useQuery<InatResponse>({
    queryKey: ['inat-ilhabela'],
    queryFn: () => fetch(INAT_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  const { data: gbifData, isLoading: gbifLoading, isError: gbifError } = useQuery<GbifResponse>({
    queryKey: ['gbif-ebird-ilhabela'],
    queryFn: () => fetch(GBIF_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  // Build iNat species map (scientific name → info)
  const inatSpecies = new Map<string, SourceInfo & { obs: InatObs[] }>();
  for (const obs of inatData?.results ?? []) {
    const key = normSci(obs.taxon?.name ?? '');
    if (!key) continue;
    const ex = inatSpecies.get(key);
    if (ex) { ex.count++; ex.obs.push(obs); }
    else inatSpecies.set(key, { count: 1, vernacular: obs.taxon?.preferred_common_name, photo: obs.taxon?.default_photo?.square_url, obs: [obs] });
  }

  // Build eBird/GBIF species map (scientific name → info)
  const ebirdSpecies = new Map<string, SourceInfo>();
  for (const r of gbifData?.results ?? []) {
    const key = normSci(r.species ?? '');
    if (!key) continue;
    const ex = ebirdSpecies.get(key);
    if (ex) ex.count++;
    else ebirdSpecies.set(key, { count: 1, vernacular: r.vernacularName });
  }

  // Build catalog map (scientific name → bird)
  const catalogMap = new Map<string, Bird>();
  for (const b of catalogBirds) {
    catalogMap.set(normSci(b.scientificName), b);
  }

  // Merge all sources
  const allKeys = new Set([...inatSpecies.keys(), ...ebirdSpecies.keys(), ...catalogMap.keys()]);
  const merged: MergedSpecies[] = [];
  for (const key of allKeys) {
    const catBird = catalogMap.get(key);
    merged.push({
      scientificName: catBird?.scientificName ?? inatSpecies.get(key)?.obs[0]?.taxon?.name ?? ebirdSpecies.get(key)?.vernacular ?? key,
      localName: catBird?.name,
      inat: inatSpecies.get(key),
      ebird: ebirdSpecies.get(key),
      catalog: catBird ? { count: 0, family: catBird.family } : undefined,
    });
  }
  merged.sort((a, b) => {
    const scoreA = (a.inat ? 2 : 0) + (a.ebird ? 1 : 0);
    const scoreB = (b.inat ? 2 : 0) + (b.ebird ? 1 : 0);
    return scoreB - scoreA || (b.inat?.count ?? 0) - (a.inat?.count ?? 0);
  });

  const inAll3   = merged.filter(s => s.inat && s.ebird && s.catalog);
  const inMulti  = merged.filter(s => [s.inat, s.ebird, s.catalog].filter(Boolean).length >= 2);
  const inatOnly = merged.filter(s => s.inat && !s.ebird && !s.catalog);
  const ebirdOnly= merged.filter(s => !s.inat && s.ebird && !s.catalog);
  const catOnly  = merged.filter(s => !s.inat && !s.ebird && s.catalog);

  const tabs = [
    { key: 'all',         label: `Todas (${merged.length})` },
    { key: 'multi',       label: `2+ fontes (${inMulti.length})` },
    { key: 'inat-only',   label: `Só iNat (${inatOnly.length})` },
    { key: 'ebird-only',  label: `Só eBird (${ebirdOnly.length})` },
    { key: 'catalog-only',label: `Só catálogo (${catOnly.length})` },
    { key: 'raw-inat',    label: 'Obs. brutas iNat' },
    { key: 'raw-ebird',   label: 'Obs. brutas eBird' },
  ] as const;

  const displayList =
    view === 'all'          ? merged :
    view === 'multi'        ? inMulti :
    view === 'inat-only'    ? inatOnly :
    view === 'ebird-only'   ? ebirdOnly :
    view === 'catalog-only' ? catOnly :
    [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            🔬 Laboratório — não indexado
          </div>
          <h1 className="text-2xl font-bold font-montserrat text-gray-900">
            Comparativo de fontes — Ilhabela / Cachoeira da Toca
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cruzamento do catálogo com iNaturalist (raio 17km) e eBird via GBIF (bbox Ilhabela). Correspondência por nome científico.
          </p>
          <a href={WIKIAVES_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
            🐦 Ver também: WikiAves — Ilhabela (acesso externo) →
          </a>
        </div>

        {catalogLoading && <div className="text-center py-16 text-gray-400">Carregando catálogo…</div>}

        {(inatError || gbifError) && (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {inatError && 'Erro ao carregar iNaturalist. '}
            {gbifError && 'Erro ao carregar eBird/GBIF.'}
          </div>
        )}

        {!catalogLoading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border p-4 bg-green-50 border-green-200 text-green-700">
                <div className="text-lg font-bold">🟢 iNaturalist</div>
                {inatLoading
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Carregando…</div>
                  : <div className="text-xs mt-1 opacity-80">{inatData?.total_results ?? 0} obs. · {inatSpecies.size} sp.</div>}
              </div>
              <div className="rounded-xl border p-4 bg-blue-50 border-blue-200 text-blue-700">
                <div className="text-lg font-bold">🔵 eBird / GBIF</div>
                {gbifLoading
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Carregando…</div>
                  : <div className="text-xs mt-1 opacity-80">{gbifData?.count?.toLocaleString('pt-BR') ?? 0} obs. (amostra: {ebirdSpecies.size} sp.)</div>}
              </div>
              <div className="rounded-xl border p-4 bg-[#159d51]/10 border-[#159d51]/20 text-[#159d51]">
                <div className="text-lg font-bold">🏕 Catálogo Toca</div>
                <div className="text-xs mt-1 opacity-80">{catalogBirds.length} espécies</div>
              </div>
              <div className="rounded-xl border p-4 bg-purple-50 border-purple-200 text-purple-700">
                <div className="text-lg font-bold">⭐ Nas 3 fontes</div>
                {(inatLoading || gbifLoading)
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Calculando…</div>
                  : <div className="text-xs mt-1 opacity-80">{inAll3.length} espécies</div>}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setView(tab.key as typeof view)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    view === tab.key
                      ? 'bg-[#159d51] text-white border-[#159d51]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#159d51]'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Species grid */}
            {(view !== 'raw-inat' && view !== 'raw-ebird') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayList.map(s => {
                  const photo = s.inat?.photo;
                  const sources = [
                    s.inat   && { label: `iNat: ${s.inat.count}`, color: 'text-green-600' },
                    s.ebird  && { label: `eBird: ${s.ebird.count}`, color: 'text-blue-600' },
                    s.catalog && { label: `Catálogo ✓`, color: 'text-[#159d51]' },
                  ].filter(Boolean) as { label: string; color: string }[];
                  return (
                    <div key={s.scientificName}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                      {photo
                        ? <img src={photo} alt={s.scientificName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">🐦</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {s.localName ?? s.inat?.vernacular ?? s.ebird?.vernacular ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400 italic truncate">{s.scientificName}</div>
                        {s.catalog?.family && (
                          <div className="text-xs text-gray-400">{s.catalog.family}</div>
                        )}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {sources.map(src => (
                            <span key={src.label} className={`text-xs font-medium ${src.color}`}>{src.label}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {displayList.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400 text-sm">Nenhuma espécie nesta categoria.</div>
                )}
              </div>
            )}

            {/* Raw iNat table */}
            {view === 'raw-inat' && (
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
                    {inatData?.results.map(obs => (
                      <tr key={obs.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {obs.taxon?.default_photo?.square_url && (
                              <img src={obs.taxon.default_photo.square_url} className="w-8 h-8 rounded object-cover" alt="" />
                            )}
                            <span className="font-medium text-gray-800">{obs.taxon?.preferred_common_name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-400 italic text-xs">{obs.taxon?.name}</td>
                        <td className="px-4 py-2 text-gray-600">{obs.observed_on}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs max-w-[150px] truncate">{obs.place_guess}</td>
                        <td className="px-4 py-2">
                          <a href={`https://www.inaturalist.org/people/${obs.user?.login}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-xs">{obs.user?.login}</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Raw eBird table */}
            {view === 'raw-ebird' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">Amostra de {gbifData?.results.length} registros do eBird via GBIF ({gbifData?.count?.toLocaleString('pt-BR')} registros no total para a região).</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome científico</th>
                        <th className="px-4 py-3 text-left">Nome comum (EN)</th>
                        <th className="px-4 py-3 text-left">Ano</th>
                        <th className="px-4 py-3 text-left">Coordenadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {gbifData?.results.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800 italic text-xs">{r.species}</td>
                          <td className="px-4 py-2 text-gray-600 text-sm">{r.vernacularName ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-500">{r.year}</td>
                          <td className="px-4 py-2 text-gray-400 text-xs">{r.decimalLatitude?.toFixed(4)}, {r.decimalLongitude?.toFixed(4)}</td>
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
