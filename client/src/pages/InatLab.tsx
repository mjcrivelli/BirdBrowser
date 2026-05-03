import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Bird } from '@shared/schema';

const INAT_URL = '/api/lab/inat';
const INAT_SPECIES_URL = '/api/lab/inat-species';
const INAT_CATALOG_TAXA_URL = '/api/lab/inat-catalog-taxa';
const GBIF_URL = '/api/lab/gbif';
const TOCA_RECORDS_URL = '/api/sighting-records';
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

// species_counts endpoint — one entry per unique taxon, full coverage
type InatSpeciesItem = {
  count: number;
  taxon: { id: number; name: string; preferred_common_name?: string; default_photo?: { square_url: string } };
};
type InatSpeciesResponse = { total_results: number; results: InatSpeciesItem[] };

// Tocabirds own sighting records (from the app database)
type TocaSighting = {
  id: number;
  birdId: number;
  birdName: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  season: string;
};

// Per-species scientific-name lookup — map of normSci(name) → taxon info
type InatCatalogTaxon = {
  id: number;
  name: string;
  preferred_common_name?: string;
  default_photo?: { square_url: string };
  observations_count?: number;
};
type InatCatalogTaxaMap = Record<string, InatCatalogTaxon>;

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
  inatId?: number;          // iNat taxon ID from catalog-taxa lookup
  inatGlobalObs?: number;   // global observation count from iNat
};

// Southern Hemisphere seasons
type SeasonKey = 'all' | 'verao' | 'outono' | 'inverno' | 'primavera' | number;

const SEASONS: {
  key: SeasonKey; label: string; months: number[];
  color: string; onColor: string;
  lightBg: string; lightText: string; lightBorder: string;
}[] = [
  { key: 'verao',     label: 'Verão',     months: [12, 1, 2],  color: '#fef200', onColor: '#78350f', lightBg: '#fefce8', lightText: '#713f12', lightBorder: '#fef08a' },
  { key: 'outono',    label: 'Outono',    months: [3, 4, 5],   color: '#5042E0', onColor: '#ffffff', lightBg: '#ede9fe', lightText: '#4c1d95', lightBorder: '#c4b5fd' },
  { key: 'inverno',   label: 'Inverno',   months: [6, 7, 8],   color: '#62c1ed', onColor: '#0c2d4a', lightBg: '#e0f7ff', lightText: '#0c4a6e', lightBorder: '#bae6fd' },
  { key: 'primavera', label: 'Primavera', months: [9, 10, 11], color: '#159d51', onColor: '#ffffff', lightBg: '#dcfce7', lightText: '#14532d', lightBorder: '#86efac' },
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

type ViewKey = 'all' | 'inat-only' | 'ebird-only' | 'catalog-only' | 'multi' | 'nas3' | 'raw-inat' | 'raw-ebird' | 'mapa';

export default function InatLab() {
  const [view, setView] = useState<ViewKey>('all');
  const [season, setSeason] = useState<SeasonKey>('all');
  const [mapYear, setMapYear] = useState<number | null>(null);
  const [mapPlaying, setMapPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: catalogBirds = [], isLoading: catalogLoading } = useQuery<Bird[]>({
    queryKey: ['/api/birds'],
  });

  const { data: inatData, isLoading: inatLoading, isError: inatError } = useQuery<InatResponse>({
    queryKey: ['inat-ilhabela'],
    queryFn: () => fetch(INAT_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  // Full unique-species list — matches what the iNat website species tab shows
  const { data: inatSpeciesData } = useQuery<InatSpeciesResponse>({
    queryKey: ['inat-species-ilhabela'],
    queryFn: () => fetch(INAT_SPECIES_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  // Per-species lookup by scientific name — enriches catalog birds even if not found locally
  const { data: inatCatalogTaxa = {} } = useQuery<InatCatalogTaxaMap>({
    queryKey: ['inat-catalog-taxa'],
    queryFn: () => fetch(INAT_CATALOG_TAXA_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 30,
  });

  const { data: gbifData, isLoading: gbifLoading, isError: gbifError } = useQuery<GbifResponse>({
    queryKey: ['gbif-ebird-ilhabela'],
    queryFn: () => fetch(GBIF_URL).then(r => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  const { data: tocaRecords = [] } = useQuery<TocaSighting[]>({
    queryKey: [TOCA_RECORDS_URL],
    staleTime: 1000 * 60 * 5,
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
  // When no season/month filter: use the authoritative species_counts endpoint (full coverage,
  // matches what the iNat website species tab shows). When filtered: fall back to observations.
  const inatSpecies = new Map<string, SourceInfo & { taxonName?: string }>();
  if (!filterMonths && inatSpeciesData?.results) {
    for (const item of inatSpeciesData.results) {
      const key = normSci(item.taxon.name);
      if (!key) continue;
      inatSpecies.set(key, {
        count: item.count,
        vernacular: item.taxon.preferred_common_name,
        photo: item.taxon.default_photo?.square_url,
        taxonName: item.taxon.name,
      });
    }
  } else {
    for (const obs of filteredInat) {
      const key = normSci(obs.taxon?.name ?? '');
      if (!key) continue;
      const ex = inatSpecies.get(key);
      if (ex) ex.count++;
      else inatSpecies.set(key, {
        count: 1,
        vernacular: obs.taxon?.preferred_common_name,
        photo: obs.taxon?.default_photo?.square_url,
        taxonName: obs.taxon?.name,
      });
    }
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

  // Merge — pick best photo: iNat square > catalog customImage > catalog local image > catalog-taxa photo
  const allKeys = new Set([...inatSpecies.keys(), ...ebirdSpecies.keys(), ...catalogMap.keys()]);
  const merged: MergedSpecies[] = [];
  for (const key of allKeys) {
    const catBird = catalogMap.get(key);
    const inatInfo = inatSpecies.get(key);
    const catalogTaxon = inatCatalogTaxa[key];
    const photo = inatInfo?.photo
      ?? (catBird ? (catBird.customImageUrl || catBird.imageUrl || undefined) : undefined)
      ?? catalogTaxon?.default_photo?.square_url;

    // For catalog birds not matched locally, synthesise an inat entry from the name-based lookup
    let inatEntry = inatInfo;
    if (!inatEntry && catalogTaxon) {
      inatEntry = {
        count: 0,                                        // 0 = not found in the local radius
        vernacular: catalogTaxon.preferred_common_name,
        photo: catalogTaxon.default_photo?.square_url,
        taxonName: catalogTaxon.name,
      } as SourceInfo & { taxonName?: string };
    }

    merged.push({
      scientificName: catBird?.scientificName ?? inatInfo?.taxonName ?? catalogTaxon?.name ?? key,
      localName: catBird?.name,
      photo,
      inat: inatEntry,
      ebird: ebirdSpecies.get(key),
      catalog: catBird ? { count: 0, family: catBird.family } : undefined,
      inatId: catalogTaxon?.id ?? (inatSpeciesData?.results?.find(r => normSci(r.taxon.name) === key)?.taxon.id),
      inatGlobalObs: catalogTaxon?.observations_count,
    });
  }
  merged.sort((a, b) => {
    // Catalog birds always first
    if (a.catalog && !b.catalog) return -1;
    if (!a.catalog && b.catalog) return 1;
    // Within same group: more external sources → higher
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
    { key: 'all',       label: `Todas (${merged.length})` },
    { key: 'multi',     label: `2+ fontes (${inMulti.length})` },
    { key: 'raw-inat',  label: 'Obs. brutas iNat' },
    { key: 'raw-ebird', label: 'Obs. brutas eBird' },
    { key: 'mapa',      label: 'Mapa' },
  ];

  const displayList: MergedSpecies[] =
    view === 'all'          ? merged :
    view === 'multi'        ? inMulti :
    view === 'nas3'         ? inAll3 :
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
    const year = o.observed_on ? parseInt(o.observed_on.slice(0, 4), 10) : null;
    return [{
      lat, lng,
      name: o.taxon?.preferred_common_name ?? o.taxon?.name ?? '—',
      sci: o.taxon?.name ?? '',
      date: o.observed_on,
      year,
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
    year: r.year ?? null,
  }));

  // Tocabirds own sighting points (records with coordinates)
  const tocaPoints = tocaRecords
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      lat: r.latitude as number,
      lng: r.longitude as number,
      birdName: r.birdName,
      timestamp: r.timestamp,
      season: r.season,
      year: new Date(r.timestamp).getFullYear(),
    }));

  // Year range across all three sources
  const allYears = [
    ...inatPoints.map(p => p.year).filter((y): y is number => y !== null),
    ...gbifPoints.map(p => p.year).filter((y): y is number => y !== null),
    ...tocaPoints.map(p => p.year),
  ];
  const minYear = allYears.length ? Math.min(...allYears) : 2010;
  const maxYear = allYears.length ? Math.max(...allYears) : new Date().getFullYear();

  // Play-through-years interval — placed here so minYear/maxYear are already initialised
  useEffect(() => {
    if (!mapPlaying) {
      if (playRef.current) { clearInterval(playRef.current); playRef.current = null; }
      return;
    }
    playRef.current = setInterval(() => {
      setMapYear(prev => {
        if (prev === null) return minYear;
        if (prev >= maxYear) { setMapPlaying(false); return prev; }
        return prev + 1;
      });
    }, 900);
    return () => { if (playRef.current) clearInterval(playRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPlaying, minYear, maxYear]);

  // Year-filtered points for the map slider
  const yearInatPoints = mapYear === null ? inatPoints : inatPoints.filter(p => p.year === mapYear);
  const yearGbifPoints = mapYear === null ? gbifPoints : gbifPoints.filter(p => p.year === mapYear);
  const yearTocaPoints = mapYear === null ? tocaPoints : tocaPoints.filter(p => p.year === mapYear);

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
              style={season === 'all' ? { backgroundColor: '#62c1ed', color: '#0c2d4a', borderColor: '#62c1ed' } : {}}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                season === 'all' ? '' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              Ano todo
            </button>
            {SEASONS.map(s => {
              const active = season === s.key;
              return (
                <button key={s.key as string} onClick={() => setSeason(s.key)}
                  style={active ? { backgroundColor: s.color, color: s.onColor, borderColor: s.color } : {}}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    active ? '' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(() => {
              const activeSeason = typeof season !== 'number' && season !== 'all'
                ? SEASONS.find(s => s.key === season) : undefined;
              return MONTHS.map(m => {
                const isActive = season === m.n;
                const inSeason = activeSeason?.months.includes(m.n) ?? false;
                return (
                  <button key={m.n} onClick={() => setSeason(season === m.n ? 'all' : m.n)}
                    style={
                      isActive
                        ? { backgroundColor: '#159d51', color: '#ffffff', borderColor: '#159d51' }
                        : inSeason && activeSeason
                          ? { backgroundColor: activeSeason.lightBg, color: activeSeason.lightText, borderColor: activeSeason.lightBorder }
                          : {}
                    }
                    className={`w-10 py-1 rounded text-xs font-medium border transition-colors ${
                      isActive || inSeason ? '' : 'bg-white text-gray-500 border-gray-200 hover:border-[#159d51]'
                    }`}>
                    {m.label}
                  </button>
                );
              });
            })()}
          </div>
          {isFiltered && (() => {
            const activeSeason = typeof season !== 'number' && season !== 'all'
              ? SEASONS.find(s => s.key === season) : undefined;
            return (
              <p className="text-xs mt-2" style={{ color: activeSeason?.lightText ?? '#374151' }}>
                Mostrando avistamentos de <strong>{seasonLabel}</strong> — iNat: {filteredInat.length} obs, eBird: {filteredGbif.length} registros (amostra).
                {filterMonths && gbifData && filteredGbif.length < 10 && (
                  <span className="ml-1 text-gray-400">(amostra de 300 registros pode ter poucos dados para este período)</span>
                )}
              </p>
            );
          })()}
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
              {/* iNaturalist — clickable, iNat brand green */}
              <button
                onClick={() => setView(view === 'inat-only' ? 'all' : 'inat-only')}
                className="rounded-xl border p-4 text-left transition-all hover:brightness-95 active:scale-95"
                style={{
                  backgroundColor: view === 'inat-only' ? '#74ac00' : '#f3f9e8',
                  borderColor: '#74ac00',
                  color: view === 'inat-only' ? '#ffffff' : '#3d5c00',
                  boxShadow: view === 'inat-only' ? '0 0 0 3px #74ac0033' : undefined,
                }}>
                <div className="text-lg font-bold">iNaturalist</div>
                {inatLoading
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Carregando…</div>
                  : <div className="text-xs mt-1" style={{ opacity: 0.85 }}>
                      {isFiltered
                        ? <>{filteredInat.length} obs. · {inatSpecies.size} sp.<span className="opacity-60"> / {inatSpeciesData?.total_results ?? '…'} total</span></>
                        : <>{inatData?.total_results ?? filteredInat.length} obs. · {inatSpecies.size} sp.</>
                      }
                      {view !== 'inat-only' && <span className="block text-xs opacity-60">só iNat</span>}
                    </div>}
              </button>
              {/* eBird / GBIF — clickable, palette blue */}
              <button
                onClick={() => setView(view === 'ebird-only' ? 'all' : 'ebird-only')}
                className="rounded-xl border p-4 text-left transition-all hover:brightness-95 active:scale-95"
                style={{
                  backgroundColor: view === 'ebird-only' ? '#62c1ed' : '#e0f7ff',
                  borderColor: '#62c1ed',
                  color: view === 'ebird-only' ? '#0c2d4a' : '#0c4a6e',
                  boxShadow: view === 'ebird-only' ? '0 0 0 3px #62c1ed33' : undefined,
                }}>
                <div className="text-lg font-bold">eBird / GBIF</div>
                {gbifLoading
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Carregando…</div>
                  : <div className="text-xs mt-1" style={{ opacity: 0.85 }}>
                      {filteredGbif.length} registros · {ebirdSpecies.size} sp.
                      {isFiltered && gbifData && <span className="opacity-60"> / {gbifData.results.length} amostra</span>}
                      {view !== 'ebird-only' && <span className="block text-xs opacity-60">só eBird</span>}
                    </div>}
              </button>
              {/* Catálogo Toca — clickable, catalog green */}
              <button
                onClick={() => setView(view === 'catalog-only' ? 'all' : 'catalog-only')}
                className="rounded-xl border-2 p-4 text-left transition-all hover:brightness-95 active:scale-95"
                style={{
                  backgroundColor: view === 'catalog-only' ? '#0d7a3e' : '#159d51',
                  borderColor: '#0d7a3e',
                  color: '#ffffff',
                  boxShadow: view === 'catalog-only' ? '0 0 0 3px #0d7a3e33' : undefined,
                }}>
                <div className="text-lg font-bold">Catálogo Toca</div>
                <div className="text-xs mt-1" style={{ opacity: 0.85 }}>
                  {catalogBirds.length} espécies
                  {view !== 'catalog-only' && <span className="block text-xs opacity-60">só catálogo</span>}
                </div>
              </button>
              {/* Nas 3 fontes — clickable, Avistamentos purple */}
              <button
                onClick={() => setView(view === 'nas3' ? 'all' : 'nas3')}
                className="rounded-xl border p-4 text-left transition-all hover:brightness-95 active:scale-95"
                style={{
                  backgroundColor: view === 'nas3' ? '#5042E0' : '#ede9fe',
                  borderColor: '#5042E0',
                  color: view === 'nas3' ? '#ffffff' : '#3730a3',
                  boxShadow: view === 'nas3' ? '0 0 0 3px #5042E033' : undefined,
                }}>
                <div className="text-lg font-bold">Nas 3 fontes</div>
                {(inatLoading || gbifLoading)
                  ? <div className="text-xs mt-1 opacity-60 animate-pulse">Calculando…</div>
                  : <div className="text-xs mt-1" style={{ opacity: 0.85 }}>
                      {inAll3.length} espécies
                      {view !== 'nas3' && <span className="block text-xs opacity-60">clique para filtrar</span>}
                    </div>}
              </button>
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
                  const localCount = s.inat?.count ?? 0;
                  const inatLabel = localCount > 0
                    ? `iNat: ${localCount}`
                    : s.inat /* exists but 0 = found by name, not locally */
                      ? 'iNat: fora da área'
                      : null;

                  const sources = [
                    inatLabel  && { label: inatLabel,               color: localCount > 0 ? 'text-[#74ac00]' : 'text-gray-400' },
                    s.ebird    && { label: `eBird: ${s.ebird.count}`, color: 'text-blue-600' },
                    s.catalog  && { label: 'Catálogo ✓',              color: 'text-[#159d51]' },
                  ].filter(Boolean) as { label: string; color: string }[];

                  const inatLink = s.inatId
                    ? `https://www.inaturalist.org/taxa/${s.inatId}`
                    : null;

                  const thumbnail = s.photo
                    ? <img src={s.photo} alt={s.scientificName}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                    : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">🐦</div>;

                  return (
                    <div key={s.scientificName}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                      {inatLink
                        ? <a href={inatLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 hover:opacity-80 transition-opacity">{thumbnail}</a>
                        : thumbnail}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {s.localName ?? s.inat?.vernacular ?? s.ebird?.vernacular ?? '—'}
                        </div>
                        <div className="text-xs italic truncate">
                          {inatLink
                            ? <a href={inatLink} target="_blank" rel="noopener noreferrer"
                                className="text-[#74ac00] hover:underline">{s.scientificName}</a>
                            : <span className="text-gray-400">{s.scientificName}</span>}
                        </div>
                        {s.catalog?.family && <div className="text-xs text-gray-400">{s.catalog.family}</div>}
                        <div className="flex gap-2 mt-1 flex-wrap items-center">
                          {sources.map(src => (
                            <span key={src.label} className={`text-xs font-medium ${src.color}`}>{src.label}</span>
                          ))}
                          {s.inatGlobalObs != null && s.inatGlobalObs > 0 && (
                            <span className="text-xs text-gray-300 ml-auto">
                              {s.inatGlobalObs.toLocaleString('pt-BR')} obs. global
                            </span>
                          )}
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
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#74ac00', borderColor: '#3d5c00', borderWidth: 1 }}></span>
                    <span style={{ color: '#3d5c00' }}>iNaturalist ({yearInatPoints.length} obs)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#62c1ed', borderColor: '#0c4a6e', borderWidth: 1 }}></span>
                    <span style={{ color: '#0c4a6e' }}>eBird / GBIF ({yearGbifPoints.length} registros)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#159d51', borderColor: '#0a5e30', borderWidth: 1 }}></span>
                    <span style={{ color: '#0a5e30' }}>Toca — avistamentos ({yearTocaPoints.length})</span>
                  </span>
                  {isFiltered && <span className="text-gray-500 font-medium">· {seasonLabel}</span>}
                </div>

                {/* Year slider */}
                {!inatLoading && !gbifLoading && allYears.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {/* Play / Pause */}
                      <button
                        onClick={() => {
                          if (mapPlaying) {
                            setMapPlaying(false);
                          } else {
                            if (mapYear === null || mapYear >= maxYear) setMapYear(minYear);
                            setMapPlaying(true);
                          }
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-colors"
                        style={{ backgroundColor: mapPlaying ? '#5042E0' : '#62c1ed' }}
                        title={mapPlaying ? 'Pausar' : 'Reproduzir anos'}>
                        {mapPlaying ? '⏸' : '▶'}
                      </button>

                      {/* Slider */}
                      <div className="flex-1 flex flex-col gap-0.5">
                        <input
                          type="range"
                          min={minYear}
                          max={maxYear}
                          value={mapYear ?? minYear}
                          onChange={e => { setMapPlaying(false); setMapYear(Number(e.target.value)); }}
                          className="w-full accent-[#62c1ed] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
                          <span>{minYear}</span>
                          <span>{maxYear}</span>
                        </div>
                      </div>

                      {/* Year badge + reset */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold tabular-nums" style={{ color: '#0c4a6e', minWidth: 36 }}>
                          {mapYear ?? '—'}
                        </span>
                        {mapYear !== null && (
                          <button onClick={() => { setMapPlaying(false); setMapYear(null); }}
                            className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                            todos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(inatLoading || gbifLoading) && (
                  <div className="text-center py-6 text-gray-400 text-sm animate-pulse">Carregando coordenadas…</div>
                )}
                {!inatLoading && !gbifLoading && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 460 }}>
                    <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        subdomains="abcd"
                        maxZoom={19}
                      />
                      {yearInatPoints.map((p, i) => (
                        <CircleMarker key={`inat-${mapYear}-${i}`} center={[p.lat, p.lng]}
                          radius={7} pathOptions={{ color: '#3d5c00', fillColor: '#74ac00', fillOpacity: 0.85, weight: 1.5 }}>
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
                              <div className="mt-1 text-xs font-medium" style={{ color: '#3d5c00' }}>iNaturalist</div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                      {yearGbifPoints.map((p, i) => (
                        <CircleMarker key={`gbif-${mapYear}-${i}`} center={[p.lat, p.lng]}
                          radius={6} pathOptions={{ color: '#0c4a6e', fillColor: '#62c1ed', fillOpacity: 0.8, weight: 1.5 }}>
                          <Popup>
                            <div className="text-sm min-w-[140px]">
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-gray-500 italic text-xs">{p.sci}</div>
                              {(p.month || p.year) && (
                                <div className="text-gray-500 text-xs mt-1">
                                  {p.month ? `${String(p.month).padStart(2, '0')}/` : ''}{p.year}
                                </div>
                              )}
                              <div className="mt-1 text-xs font-medium" style={{ color: '#0c4a6e' }}>eBird / GBIF</div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                      {yearTocaPoints.map((p, i) => (
                        <CircleMarker key={`toca-${mapYear}-${i}`} center={[p.lat, p.lng]}
                          radius={7} pathOptions={{ color: '#0a5e30', fillColor: '#159d51', fillOpacity: 0.9, weight: 1.5 }}>
                          <Popup>
                            <div className="text-sm min-w-[150px]">
                              <div className="font-semibold">{p.birdName}</div>
                              <div className="text-gray-500 text-xs mt-1">
                                {new Date(p.timestamp).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-gray-400 text-xs capitalize">{p.season}</div>
                              <div className="mt-1 text-xs font-medium" style={{ color: '#0a5e30' }}>🌿 Cachoeira da Toca</div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                    </MapContainer>
                  </div>
                )}
                {!inatLoading && !gbifLoading && yearInatPoints.length === 0 && yearGbifPoints.length === 0 && yearTocaPoints.length === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-4">
                    Nenhum ponto com coordenadas disponíveis{mapYear ? ` em ${mapYear}` : ''}
                    {isFiltered ? ` para ${seasonLabel}` : ''}.
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
