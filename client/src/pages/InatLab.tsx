import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Bird } from '@shared/schema';

const INAT_URL = '/api/lab/inat';
const GBIF_URL = '/api/lab/gbif';
const WIKIAVES_URL = 'https://www.wikiaves.com.br/especies.php?t=c&c=3520400&o=1&ef=0';

// Centre and approximate bounds of Ilhabela
const MAP_CENTER: [number, number] = [-23.78, -45.36];
const MAP_ZOOM = 10;

type InatObs = {
  id: number;
  taxon?: { name: string; preferred_common_name?: string; default_photo?: { square_url: string } };
  observed_on: string;
  place_guess: string;
  user: { login: string };
  location?: string | null;   // "lat,lng" string from iNat API
};
type InatResponse = { results: InatObs[]; total_results: number };

type GbifResult = {
  species?: string;
  vernacularName?: string;
  year?: number;
  month?: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
};
type GbifResponse = { count: number; results: GbifResult[] };

type SourceInfo = { count: number; vernacular?: string; photo?: string };

type MergedSpecies = {
  scientificName: string;
  localName?: string;
  photo?: string;           // best available photo (iNat or catalog)
  inat?: SourceInfo;
  ebird?: SourceInfo;
  catalog?: { count: number; family?: string | null };
};

// Southern Hemisphere seasons
type SeasonKey = 'all' | 'verao' | 'outono' | 'inverno' | 'primavera' | number;

const SEASONS: { key: SeasonKey; label: string; emoji: string; months: number[] }[] = [
  { key: 'verao',     label: 'Verão',     emoji: '☀️',  months: [12, 1, 2]  },
  { key: 'outono',    label: 'Outono',    emoji: '🍂',  months: [3, 4, 5]   },
  { key: 'inverno',   label: 'Inverno',   emoji: '🌧️', months: [6, 7, 8]   },
  { key: 'primavera', label: 'Primavera', emoji: '🌸',  months: [9, 10, 11] },
];

const MONTHS = [
  { n: 1, label: 'Jan' }, { n: 2,  label: 'Fev' }, { n: 3,  label: 'Mar' },
  { n: 4, label: 'Abr' }, { n: 5,  label: 'Mai' }, { n: 6,  label: 'Jun' },
  { n: 7, label: 'Jul' }, { n: 8,  label: 'Ago' }, { n: 9,  label: 'Set' },
  { n: 10, label: 'Out' }, { n: 11, label: 'Nov' }, { n: 12, label: 'Dez' },
];

function activeMonths(season: SeasonKey): number[] | null {
  if (season === 'all') return null;
  if (typeof season === 'number') return [season];
  return SEASONS.find(s => s.key === season)?.months ?? null;
}

function inatMonth(obs: InatObs): number | null {
  if (!obs.observed_on) return null;
  const m = parseInt(obs.observed_on.split('-')[1], 10);
  return isNaN(m) ? null : m;
}

function normSci(name: string) {
  return name?.toLowerCase().trim() ?? '';
}

type ViewKey = 'all' | 'inat-only' | 'ebird-only' | 'catalog-only' | 'multi' | 'raw-inat' | 'raw-ebird' | 'mapa';

export default function InatLab() {
  const [view, setView] = useState<ViewKey>('all');
  const [season, setSeason] = useState<SeasonKey>('all');

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

  const filterMonths = activeMonths(season);

  // Apply season/month filter
  const filteredInat = (inatData?.results ?? []).filter(obs => {
    if (!filterMonths) return true;
    const m = inatMonth(obs);
    return m !== null && filterMonths.includes(m);
  });

  const filteredGbif = (gbifData?.results ?? []).filter(r => {
    if (!filterMonths) return true;
    return r.month != null && filterMonths.includes(r.month);
  });

  // Build iNat species map
  const inatSpecies = new Map<string, SourceInfo & { obs: InatObs[] }>();
  for (const obs of filteredInat) {
    const key = normSci(obs.taxon?.name ?? '');
    if (!key) continue;
    const ex = inatSpecies.get(key);
    if (ex) { ex.count++; ex.obs.push(obs); }
    else inatSpecies.set(key, {
      count: 1,
      vernacular: obs.taxon?.preferred_common_name,
      photo: obs.taxon?.default_photo?.square_url,
      obs: [obs],
    });
  }

  // Build eBird/GBIF species map
  const ebirdSpecies = new Map<string, SourceInfo>();
  for (const r of filteredGbif) {
    const key = normSci(r.species ?? '');
    if (!key) continue;
    const ex = ebirdSpecies.get(key);
    if (ex) ex.count++;
    else ebirdSpecies.set(key, { count: 1, vernacular: r.vernacularName });
  }

  // Build catalog map
  const catalogMap = new Map<string, Bird>();
  for (const b of catalogBirds) catalogMap.set(normSci(b.scientificName), b);

  // Merge — pick best photo: iNat square > catalog customImage > catalog local image
  const allKeys = new Set([...inatSpecies.keys(), ...ebirdSpecies.keys(), ...catalogMap.keys()]);
  const merged: MergedSpecies[] = [];
  for (const key of allKeys) {
    const catBird = catalogMap.get(key);
    const inatInfo = inatSpecies.get(key);
    const photo = inatInfo?.photo
      ?? (catBird ? (catBird.customImageUrl || catBird.imageUrl || undefined) : undefined);
    merged.push({
      scientificName: catBird?.scientificName ?? inatInfo?.obs[0]?.taxon?.name ?? key,
      localName: catBird?.name,
      photo,
      inat: inatInfo,
      ebird: ebirdSpecies.get(key),
      catalog: catBird ? { count: 0, family: catBird.family } : undefined,
    });
  }
  merged.sort((a, b) => {
    const sA = (a.inat ? 2 : 0) + (a.ebird ? 1 : 0);
    const sB = (b.inat ? 2 : 0) + (b.ebird ? 1 : 0);
    return sB - sA || (b.inat?.count ?? 0) - (a.inat?.count ?? 0);
  });

  const inAll3    = merged.filter(s => s.inat && s.ebird && s.catalog);
  const inMulti   = merged.filter(s => [s.inat, s.ebird, s.catalog].filter(Boolean).length >= 2);
  const inatOnly  = merged.filter(s => s.inat && !s.ebird && !s.catalog);
  const ebirdOnly = merged.filter(s => !s.inat && s.ebird && !s.catalog);
  const catOnly   = merged.filter(s => !s.inat && !s.ebird && s.catalog);

  const tabs: { key: ViewKey; label: string }[] = [
    { key: 'all',          label: `Todas (${merged.length})` },
    { key: 'multi',        label: `2+ fontes (${inMulti.length})` },
    { key: 'inat-only',    label: `Só iNat (${inatOnly.length})` },
    { key: 'ebird-only',   label: `Só eBird (${ebirdOnly.length})` },
    { key: 'catalog-only', label: `Só catálogo (${catOnly.length})` },
    { key: 'raw-inat',     label: 'Obs. brutas iNat' },
    { key: 'raw-ebird',    label: 'Obs. brutas eBird' },
    { key: 'mapa',         label: '🗺 Mapa' },
  ];

  const displayList: MergedSpecies[] =
    view === 'all'          ? merged :
    view === 'multi'        ? inMulti :
    view === 'inat-only'    ? inatOnly :
    view === 'ebird-only'   ? ebirdOnly :
    view === 'catalog-only' ? catOnly :
    [];

  const isFiltered = season !== 'all';
  const seasonLabel =
    typeof season === 'number' ? MONTHS.find(m => m.n === season)?.label :
    SEASONS.find(s => s.key === season)?.label ?? '';

  // Map point data — iNat uses "lat,lng" in the location field
  const inatPoints = filteredInat.flatMap(o => {
    if (!o.location) return [];
    const parts = o.location.split(',');
    if (parts.length !== 2) return [];
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return [];
    return [{
      lat, lng,
      name: o.taxon?.preferred_common_name ?? o.taxon?.name ?? '—',
      sci: o.taxon?.name ?? '',
      date: o.observed_on,
      user: o.user?.login,
      photo: o.taxon?.default_photo?.square_url,
    }];
  });

  const gbifPoints = filteredGbif.filter(r => r.decimalLatitude && r.decimalLongitude).map(r => ({
    lat: r.decimalLatitude!,
    lng: r.decimalLongitude!,
    name: r.vernacularName ?? r.species ?? '—',
    sci: r.species ?? '',
    month: r.month,
    year: r.year,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">

        {/* Page header */}
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

        {/* Season / Month filter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por período</span>
            {isFiltered && (
              <button onClick={() => setSeason('all')}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline">
                Limpar filtro
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            <button onClick={() => setSeason('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                season === 'all'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              Ano todo
            </button>
            {SEASONS.map(s => (
              <button key={s.key as string} onClick={() => setSeason(s.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  season === s.key
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
                }`}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {MONTHS.map(m => {
              const inCurrentSeason = typeof season !== 'number' && season !== 'all'
                ? SEASONS.find(s => s.key === season)?.months.includes(m.n)
                : false;
              return (
                <button key={m.n} onClick={() => setSeason(season === m.n ? 'all' : m.n)}
                  className={`w-10 py-1 rounded text-xs font-medium border transition-colors ${
                    season === m.n
                      ? 'bg-[#159d51] text-white border-[#159d51]'
                      : inCurrentSeason
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#159d51]'
                  }`}>
                  {m.label}
                </button>
              );
            })}
          </div>
          {isFiltered && (
            <p className="text-xs text-amber-700 mt-2">
              Mostrando avistamentos de <strong>{seasonLabel}</strong> — iNat: {filteredInat.length} obs, eBird: {filteredGbif.length} registros (amostra).
              {filterMonths && gbifData && filteredGbif.length < 10 && (
                <span className="ml-1 text-gray-400">(amostra de 300 registros pode ter poucos dados para este período)</span>
              )}
            </p>
          )}
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
                  : <div className="text-xs mt-1 opacity-80">
                      {filteredInat.length} obs. · {inatSpecies.size} sp.
                      {isFiltered && inatData && <span className="opacity-60"> / {inatData.total_results} total</span>}
                    </div>}
              </div>
              <div className="rounded-xl border p-4 bg-blue-50 border-blue-200 text-blue-700">
                <div className="text-lg font-bold">🔵 eBird / GBIF</div>
                {gbifLoading
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Carregando…</div>
                  : <div className="text-xs mt-1 opacity-80">
                      {filteredGbif.length} registros · {ebirdSpecies.size} sp.
                      {isFiltered && gbifData && <span className="opacity-60"> / {gbifData.results.length} amostra</span>}
                    </div>}
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

            {/* View tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setView(tab.key)}
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
            {(view !== 'raw-inat' && view !== 'raw-ebird' && view !== 'mapa') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayList.map(s => {
                  const sources = [
                    s.inat    && { label: `iNat: ${s.inat.count}`,  color: 'text-green-600' },
                    s.ebird   && { label: `eBird: ${s.ebird.count}`, color: 'text-blue-600' },
                    s.catalog && { label: 'Catálogo ✓',              color: 'text-[#159d51]' },
                  ].filter(Boolean) as { label: string; color: string }[];
                  return (
                    <div key={s.scientificName}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                      {s.photo
                        ? <img src={s.photo} alt={s.scientificName}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">🐦</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {s.localName ?? s.inat?.vernacular ?? s.ebird?.vernacular ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400 italic truncate">{s.scientificName}</div>
                        {s.catalog?.family && <div className="text-xs text-gray-400">{s.catalog.family}</div>}
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
                  <div className="col-span-2 text-center py-10 text-gray-400 text-sm">
                    {isFiltered
                      ? `Nenhuma espécie registrada em ${seasonLabel} nas fontes externas.`
                      : 'Nenhuma espécie nesta categoria.'}
                  </div>
                )}
              </div>
            )}

            {/* Map tab */}
            {view === 'mapa' && (
              <div>
                <div className="flex items-center gap-4 mb-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-green-700"></span>
                    iNaturalist ({inatPoints.length} obs{inatPoints.length < filteredInat.length ? `, ${filteredInat.length - inatPoints.length} sem coord.` : ''})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border border-blue-700"></span>
                    eBird / GBIF ({gbifPoints.length} registros{gbifPoints.length < filteredGbif.length ? `, ${filteredGbif.length - gbifPoints.length} sem coord.` : ''})
                  </span>
                  {isFiltered && <span className="text-amber-600 font-medium">· Filtrado: {seasonLabel}</span>}
                </div>
                {(inatLoading || gbifLoading) && (
                  <div className="text-center py-6 text-gray-400 text-sm animate-pulse">Carregando coordenadas…</div>
                )}
                {!inatLoading && !gbifLoading && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 480 }}>
                    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {inatPoints.map((p, i) => (
                        <CircleMarker key={`inat-${i}`} center={[p.lat, p.lng]}
                          radius={7} pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.8, weight: 1.5 }}>
                          <Popup>
                            <div className="text-sm min-w-[160px]">
                              {p.photo && <img src={p.photo} alt="" className="w-full h-20 object-cover rounded mb-2" />}
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-gray-500 italic text-xs">{p.sci}</div>
                              <div className="text-gray-500 text-xs mt-1">{p.date}</div>
                              {p.user && (
                                <a href={`https://www.inaturalist.org/people/${p.user}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-blue-500 text-xs hover:underline">
                                  @{p.user}
                                </a>
                              )}
                              <div className="mt-1 text-xs font-medium text-green-700">iNaturalist</div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                      {gbifPoints.map((p, i) => (
                        <CircleMarker key={`gbif-${i}`} center={[p.lat, p.lng]}
                          radius={6} pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.7, weight: 1.5 }}>
                          <Popup>
                            <div className="text-sm min-w-[140px]">
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-gray-500 italic text-xs">{p.sci}</div>
                              {(p.month || p.year) && (
                                <div className="text-gray-500 text-xs mt-1">
                                  {p.month ? `${String(p.month).padStart(2, '0')}/` : ''}{p.year}
                                </div>
                              )}
                              <div className="mt-1 text-xs font-medium text-blue-700">eBird / GBIF</div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                    </MapContainer>
                  </div>
                )}
                {!inatLoading && !gbifLoading && inatPoints.length === 0 && gbifPoints.length === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-4">
                    Nenhum ponto com coordenadas disponíveis{isFiltered ? ` para ${seasonLabel}` : ''}.
                  </p>
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
                    {filteredInat.map(obs => (
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
                          <a href={`https://www.inaturalist.org/people/${obs.user?.login}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-xs">{obs.user?.login}</a>
                        </td>
                      </tr>
                    ))}
                    {filteredInat.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                        Nenhuma observação{isFiltered ? ` em ${seasonLabel}` : ''}.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Raw eBird table */}
            {view === 'raw-ebird' && (
              <div>
                <p className="text-xs text-gray-400 mb-3">
                  {isFiltered
                    ? `${filteredGbif.length} registros de ${gbifData?.results.length} na amostra correspondem a ${seasonLabel}.`
                    : `Amostra de ${gbifData?.results.length} registros do eBird via GBIF (${gbifData?.count?.toLocaleString('pt-BR')} no total).`}
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome científico</th>
                        <th className="px-4 py-3 text-left">Nome comum (EN)</th>
                        <th className="px-4 py-3 text-left">Mês / Ano</th>
                        <th className="px-4 py-3 text-left">Coordenadas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredGbif.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800 italic text-xs">{r.species}</td>
                          <td className="px-4 py-2 text-gray-600 text-sm">{r.vernacularName ?? '—'}</td>
                          <td className="px-4 py-2 text-gray-500">
                            {r.month ? `${String(r.month).padStart(2, '0')}/${r.year}` : r.year}
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-xs">
                            {r.decimalLatitude?.toFixed(4)}, {r.decimalLongitude?.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                      {filteredGbif.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                          Nenhum registro{isFiltered ? ` em ${seasonLabel}` : ''} na amostra.
                        </td></tr>
                      )}
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
