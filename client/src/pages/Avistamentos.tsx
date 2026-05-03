import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PERIODS = [
  { value: 'alltime',     label: 'Todo o período' },
  { value: 'last1month',  label: 'Último mês' },
  { value: 'last3months', label: 'Últimos 3 meses' },
  { value: 'last6months', label: 'Últimos 6 meses' },
  { value: 'last1year',   label: 'Último ano' },
];

const SEASONS = [
  { value: '',        label: 'Todas' },
  { value: 'summer',  label: 'Verão' },
  { value: 'autumn',  label: 'Outono' },
  { value: 'winter',  label: 'Inverno' },
  { value: 'spring',  label: 'Primavera' },
];

interface BirdCount {
  birdId: number;
  birdName: string;
  count: number;
}

interface FamilyBird {
  birdId: number;
  birdName: string;
  count: number;
  scientificName: string;
  imageUrl: string | null;
}

interface FamilyCount {
  family: string;
  count: number;
  birds: FamilyBird[];
}

const MAX_BAR_H = 260;
const COL_W_BIRD   = 76;
const COL_W_FAMILY = 110;
const PHOTO_SIZE   = 44;

function barColor(rank: number): string {
  if (rank === 1) return '#fef200';
  if (rank === 2) return '#94A3B8';
  if (rank === 3) return '#B87333';
  if (rank <= 10) return '#159d51';
  return '#7AC898';
}

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

interface BirdTooltipInfo {
  kind: 'bird';
  birdName: string;
  scientificName: string;
  count: number;
  imgUrl: string | null;
  x: number;
  y: number;
}

interface FamilyTooltipInfo {
  kind: 'family';
  family: string;
  count: number;
  birds: FamilyBird[];
  x: number;
  y: number;
}

type TooltipInfo = BirdTooltipInfo | FamilyTooltipInfo;

interface SelectedBird {
  kind: 'bird';
  birdId: number;
  birdName: string;
  scientificName: string;
  imgUrl: string | null;
}
interface SelectedFamily {
  kind: 'family';
  family: string;
}
type SelectedItem = SelectedBird | SelectedFamily;

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Avistamentos() {
  const [year, setYear]         = useState<string>('all');
  const [period, setPeriod]     = useState<string>('alltime');
  const [season, setSeason]     = useState<string>('');
  const [geoOnly, setGeoOnly]   = useState<boolean>(false);
  const [viewMode, setViewMode]       = useState<'bird' | 'family'>('bird');
  const [tooltip, setTooltip]         = useState<TooltipInfo | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [showAll, setShowAll]         = useState<boolean>(false);

  const { data: years = [] } = useQuery<number[]>({
    queryKey: ['/api/sightings/years'],
  });

  const params = new URLSearchParams();
  if (year !== 'all') params.set('year', year);
  if (period !== 'alltime') params.set('period', period);
  if (season) params.set('season', season);
  if (geoOnly) params.set('geoOnly', 'true');
  const qs = params.toString() ? '?' + params.toString() : '';

  const birdQueryUrl   = `/api/sightings/by-bird${qs}`;
  const familyQueryUrl = `/api/sightings/by-family${qs}`;

  const { data: birdData = [], isLoading: birdLoading, isError: birdError } = useQuery<BirdCount[]>({
    queryKey: [birdQueryUrl],
    enabled: viewMode === 'bird',
  });

  const { data: familyData = [], isLoading: familyLoading, isError: familyError } = useQuery<FamilyCount[]>({
    queryKey: [familyQueryUrl],
    enabled: viewMode === 'family',
  });

  // For photo lookup — always use allBirds (in-memory, local /birds/ paths)
  const { data: allBirds = [] } = useQuery<any[]>({
    queryKey: ['/api/birds'],
  });

  // Map birdId → resolved image URL (customImageUrl preferred)
  const birdImgById = new Map<number, string>();
  for (const b of allBirds) {
    const url = b.customImageUrl || b.imageUrl;
    if (url) birdImgById.set(b.id, url);
  }

  // Monthly query for the selected bird/family
  const monthlyQs = new URLSearchParams();
  if (selectedItem) {
    if (selectedItem.kind === 'bird') monthlyQs.set('birdId', String(selectedItem.birdId));
    else monthlyQs.set('family', selectedItem.family);
  }
  if (year !== 'all') monthlyQs.set('year', year);
  if (season) monthlyQs.set('season', season);
  if (geoOnly) monthlyQs.set('geoOnly', 'true');
  const monthlyQueryUrl = `/api/sightings/monthly?${monthlyQs.toString()}`;
  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery<{ month: number; count: number }[]>({
    queryKey: [monthlyQueryUrl],
    enabled: !!selectedItem,
  });
  const monthlyTotal = monthlyData.reduce((s, d) => s + d.count, 0);
  const monthlyMax   = Math.max(...monthlyData.map(d => d.count), 1);

  const isLoading = viewMode === 'bird' ? birdLoading : familyLoading;
  const isError   = viewMode === 'bird' ? birdError   : familyError;

  const activeBirdData   = viewMode === 'bird'   ? birdData   : [];
  const activeFamilyData = viewMode === 'family' ? familyData : [];

  const maxBirdCount   = activeBirdData.length   > 0 ? activeBirdData[0].count   : 1;
  const maxFamilyCount = activeFamilyData.length > 0 ? activeFamilyData[0].count : 1;

  const totalSightings = viewMode === 'bird'
    ? activeBirdData.reduce((s, b) => s + b.count, 0)
    : activeFamilyData.reduce((s, f) => s + f.count, 0);

  const speciesCount = viewMode === 'bird'
    ? activeBirdData.length
    : activeFamilyData.reduce((s, f) => s + f.birds.length, 0);

  const familiesCount = activeFamilyData.length;

  const TOP_N = 10;
  const displayBirdData   = showAll ? activeBirdData   : activeBirdData.slice(0, TOP_N);
  const displayFamilyData = showAll ? activeFamilyData : activeFamilyData.slice(0, TOP_N);
  const hasMore = viewMode === 'bird'
    ? activeBirdData.length   > TOP_N
    : activeFamilyData.length > TOP_N;

  const totalWidth = viewMode === 'bird'
    ? displayBirdData.length   * (COL_W_BIRD   + 4)
    : displayFamilyData.length * (COL_W_FAMILY + 4);

  return (
    <div className="min-h-screen bg-[#F9FBF9] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold font-montserrat text-[#333333] mb-2">
            Avistamentos
          </h1>
          <p className="text-gray-400 text-sm">
            Aves mais avistadas pelos visitantes da Cachoeira da Toca
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          {/* Mobile: 2-col grid | Desktop: horizontal flex row */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:flex sm:flex-wrap sm:items-start sm:gap-x-5 sm:gap-y-3">

            {/* Year dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ano</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-52 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Divider — desktop only */}
            <div className="hidden sm:block w-px bg-gray-100 mt-[22px] h-9" />

            {/* Season tabs — full width on mobile */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estação</label>
              <div className="flex flex-wrap gap-1.5">
                {SEASONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSeason(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      season === s.value
                        ? 'bg-[#159d51] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider — desktop only */}
            <div className="hidden sm:block w-px bg-gray-100 mt-[22px] h-9" />

            {/* Geo toggle */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Localização</label>
              <div>
                <button
                  onClick={() => setGeoOnly(v => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    geoOnly
                      ? 'bg-[#62c1ed] text-gray-800 border-[#62c1ed] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                  title="Exibe apenas avistamentos registrados com localização próxima à Cachoeira da Toca (10 km)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Apenas da Toca
                </button>
              </div>
            </div>

          </div>
        </div>

        {geoOnly && (
          <p className="text-xs text-gray-400 italic -mt-4 mb-4 px-1">
            Mostrando somente avistamentos com localização registrada dentro de 10 km da Cachoeira da Toca.
          </p>
        )}

        {/* Error */}
        {isError && (
          <div className="flex items-center justify-center h-72 text-gray-400">
            <p>Não foi possível carregar os dados.</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && totalSightings === 0 && (
          <div className="flex flex-col items-center justify-center h-72 text-center gap-3">
            <svg className="w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-400 font-medium">Nenhum avistamento encontrado para este filtro.</p>
          </div>
        )}

        {/* Stats + view toggle */}
        {!isError && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {viewMode === 'family' && !isLoading && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#5042E0]" />
                  {familiesCount} famíli{familiesCount !== 1 ? 'as' : 'a'}
                </span>
              )}
              {!isLoading && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#159d51]" />
                    {speciesCount} espécie{speciesCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#62c1ed]" />
                    {totalSightings} avistamento{totalSightings !== 1 ? 's' : ''} no total
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-0 rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => { setViewMode('bird'); setTooltip(null); setSelectedItem(null); setShowAll(false); }}
                className={`px-3 py-1.5 transition-colors ${viewMode === 'bird' ? 'bg-[#159d51] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >Por espécie</button>
              <button
                onClick={() => { setViewMode('family'); setTooltip(null); setSelectedItem(null); setShowAll(false); }}
                className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${viewMode === 'family' ? 'bg-[#5042E0] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >Por família</button>
            </div>
          </div>
        )}

        {/* ── EXPLORE section (bar chart) ── */}
        {!isLoading && !isError && totalSightings > 0 && (
          <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Scrollable bar chart */}
            <div className="overflow-x-auto">
              <div
                className="flex items-end gap-1 pb-2 pt-2"
                style={{ minWidth: totalWidth, height: MAX_BAR_H + PHOTO_SIZE + 120 }}
              >
                {/* ── BIRD MODE ── */}
                {viewMode === 'bird' && displayBirdData.map((bird, idx) => {
                  const rank    = idx + 1;
                  const barH    = Math.max(6, Math.round((bird.count / maxBirdCount) * MAX_BAR_H));
                  const color   = barColor(rank);
                  const bInfo   = allBirds.find((b: any) => b.name === bird.birdName);
                  const imgUrl  = bInfo ? (bInfo.customImageUrl || bInfo.imageUrl) : null;
                  const isSel   = selectedItem?.kind === 'bird' && selectedItem.birdId === bird.birdId;
                  const isDimmed = !!selectedItem && !isSel;

                  return (
                    <div
                      key={bird.birdName}
                      className={`flex flex-col items-center flex-shrink-0 cursor-pointer rounded-lg transition-all duration-150 py-1 px-0.5 ${
                        isSel ? 'ring-2 ring-[#159d51] ring-offset-1 bg-green-50' : ''
                      } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                      style={{ width: COL_W_BIRD }}
                      onClick={() => {
                        const item: SelectedBird = { kind: 'bird', birdId: bird.birdId, birdName: bird.birdName, scientificName: bInfo?.scientificName ?? '', imgUrl };
                        setSelectedItem(prev => prev?.kind === 'bird' && prev.birdId === bird.birdId ? null : item);
                      }}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        setTooltip({
                          kind: 'bird',
                          birdName: bird.birdName,
                          scientificName: bInfo?.scientificName ?? '',
                          count: bird.count,
                          imgUrl,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {rank <= 3 ? (
                        <div className="mb-1 flex items-center justify-center">
                          <div className="flex flex-col items-center justify-center rounded-lg shadow-sm"
                            style={{ width: COL_W_BIRD - 10, height: rank === 1 ? 54 : 44, border: `2px solid ${rank === 1 ? '#C8A800' : color}`, background: rank === 1 ? '#fef20018' : `${color}18` }}>
                            <span style={{ fontSize: rank === 1 ? 18 : 14 }} className="leading-none">{rankLabel(rank)}</span>
                            <span className="font-bold mt-1" style={{ color: rank === 1 ? '#7A6000' : color, fontSize: rank === 1 ? 13 : 11 }}>{bird.count}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">{rankLabel(rank)}</span>
                          <span className="text-xs font-bold text-gray-700 mb-1 leading-none">{bird.count}</span>
                        </>
                      )}
                      <div className="w-11 rounded-t-lg transition-all duration-300" style={{ height: barH, backgroundColor: color }} />
                      <div className="mt-2">
                        {imgUrl ? (
                          <img src={imgUrl} alt={bird.birdName}
                            className={`rounded-full object-cover shadow-sm transition-all ${isSel ? 'border-2 border-[#159d51]' : 'border-2 border-white'}`}
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`rounded-full bg-gray-100 shadow-sm flex items-center justify-center ${isSel ? 'border-2 border-[#159d51]' : 'border-2 border-white'}`}
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className={`text-center text-[9px] leading-tight mt-1 ${isSel ? 'text-[#159d51] font-semibold' : 'text-gray-500'}`}
                        style={{ width: COL_W_BIRD - 6, height: 28, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                        {bird.birdName}
                      </p>
                    </div>
                  );
                })}

                {/* ── FAMILY MODE ── */}
                {viewMode === 'family' && displayFamilyData.map((fam, idx) => {
                  const rank     = idx + 1;
                  const barH     = Math.max(6, Math.round((fam.count / maxFamilyCount) * MAX_BAR_H));
                  const color    = barColor(rank);
                  const isSel    = selectedItem?.kind === 'family' && selectedItem.family === fam.family;
                  const isDimmed = !!selectedItem && !isSel;

                  return (
                    <div
                      key={fam.family}
                      className={`flex flex-col items-center flex-shrink-0 cursor-pointer rounded-lg transition-all duration-150 py-1 px-0.5 ${
                        isSel ? 'ring-2 ring-[#5042E0] ring-offset-1 bg-[#5042E0]/10' : ''
                      } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                      style={{ width: COL_W_FAMILY }}
                      onClick={() => {
                        const item: SelectedFamily = { kind: 'family', family: fam.family };
                        setSelectedItem(prev => prev?.kind === 'family' && prev.family === fam.family ? null : item);
                      }}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        setTooltip({
                          kind: 'family',
                          family: fam.family,
                          count: fam.count,
                          birds: fam.birds,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {rank <= 3 ? (
                        <div className="mb-1 flex items-center justify-center">
                          <div className="flex flex-col items-center justify-center rounded-lg shadow-sm"
                            style={{ width: COL_W_FAMILY - 10, height: rank === 1 ? 54 : 44, border: `2px solid ${rank === 1 ? '#C8A800' : color}`, background: rank === 1 ? '#fef20018' : `${color}18` }}>
                            <span style={{ fontSize: rank === 1 ? 18 : 14 }} className="leading-none">{rankLabel(rank)}</span>
                            <span className="font-bold mt-1" style={{ color: rank === 1 ? '#7A6000' : color, fontSize: rank === 1 ? 13 : 11 }}>{fam.count}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">{rankLabel(rank)}</span>
                          <span className="text-xs font-bold text-gray-700 mb-1 leading-none">{fam.count}</span>
                        </>
                      )}
                      <div className="w-14 rounded-t-lg transition-all duration-300" style={{ height: barH, backgroundColor: color }} />
                      {/* Row of up to 3 bird thumbnails */}
                      <div className="mt-2 flex gap-0.5 justify-center">
                        {fam.birds.slice(0, 3).map((b, i) => {
                          const img = birdImgById.get(b.birdId) ?? null;
                          return img ? (
                            <img key={i} src={img} alt={b.birdName}
                              className="rounded-full object-cover border-2 border-white shadow-sm"
                              style={{ width: 28, height: 28 }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div key={i} className="rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center"
                              style={{ width: 28, height: 28 }}>
                              <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          );
                        })}
                        {fam.birds.length > 3 && (
                          <div className="rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center"
                            style={{ width: 28, height: 28 }}>
                            <span className="text-[8px] font-bold text-gray-500">+{fam.birds.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-[9px] leading-tight text-[#5042E0] font-semibold mt-1.5"
                        style={{ width: COL_W_FAMILY - 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                        {fam.family}
                      </p>
                      <p className="text-center text-[8px] leading-tight text-gray-400 mt-0.5">
                        {fam.birds.length} sp.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 gap-3">
              <p className="text-xs text-gray-300">
                {showAll
                  ? `Mostrando todas as ${viewMode === 'bird' ? activeBirdData.length + ' espécies' : activeFamilyData.length + ' famílias'}`
                  : `Mostrando top ${Math.min(TOP_N, viewMode === 'bird' ? activeBirdData.length : activeFamilyData.length)} de ${viewMode === 'bird' ? activeBirdData.length + ' espécies' : activeFamilyData.length + ' famílias'}`
                }
              </p>
              {hasMore && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 flex-shrink-0"
                >
                  {showAll ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      Ver menos
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      Ver todas ({viewMode === 'bird' ? activeBirdData.length : activeFamilyData.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          </>
        )}

        {/* ── MONTHLY LINE CHART ── */}
        {selectedItem && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {selectedItem.kind === 'bird' && selectedItem.imgUrl && (
                <img src={selectedItem.imgUrl} alt={selectedItem.birdName}
                  className="rounded-full object-cover border-2 border-[#159d51] shadow-sm flex-shrink-0"
                  style={{ width: 48, height: 48 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {selectedItem.kind === 'family' && (
                <div className="rounded-full bg-[#5042E0]/20 flex items-center justify-center flex-shrink-0"
                  style={{ width: 48, height: 48 }}>
                  <svg className="w-6 h-6 text-[#5042E0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className={`font-bold text-base leading-tight truncate ${selectedItem.kind === 'family' ? 'text-[#5042E0] italic' : 'text-gray-800'}`}>
                  {selectedItem.kind === 'bird' ? selectedItem.birdName : selectedItem.family}
                </h2>
                {selectedItem.kind === 'bird' && selectedItem.scientificName && (
                  <p className="text-xs italic text-gray-400 leading-tight truncate">{selectedItem.scientificName}</p>
                )}
                {selectedItem.kind === 'family' && (
                  <p className="text-xs text-gray-400 leading-tight">Família</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {monthlyLoading ? (
                  <div className="w-5 h-5 border-2 border-[#159d51] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <p className={`text-lg font-bold ${selectedItem.kind === 'family' ? 'text-[#5042E0]' : 'text-[#159d51]'}`}>
                      {monthlyTotal}
                    </p>
                    <p className="text-[10px] text-gray-400">avistamento{monthlyTotal !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-gray-300">{year === 'all' ? 'todos os anos' : year}</p>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ml-2"
                title="Fechar"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* SVG Line Chart */}
            {!monthlyLoading && monthlyData.length === 12 && (() => {
              const PAD = { l: 42, r: 16, t: 16, b: 36 };
              const VW = 660, VH = 190;
              const pw = VW - PAD.l - PAD.r;
              const ph = VH - PAD.t - PAD.b;
              const lineColor = selectedItem.kind === 'family' ? '#5042E0' : '#159d51';
              const pts = monthlyData.map((d, i) => ({
                x: PAD.l + (i / 11) * pw,
                y: PAD.t + ph * (1 - d.count / monthlyMax),
                count: d.count,
              }));
              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              const areaPath = `${linePath} L${pts[11].x.toFixed(1)},${(PAD.t + ph).toFixed(1)} L${PAD.l.toFixed(1)},${(PAD.t + ph).toFixed(1)} Z`;
              const gridYCount = 4;
              return (
                <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: 190 }} overflow="visible">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
                      <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {Array.from({ length: gridYCount + 1 }, (_, i) => {
                    const y = PAD.t + (i / gridYCount) * ph;
                    const val = Math.round(monthlyMax * (1 - i / gridYCount));
                    return (
                      <g key={i}>
                        <line x1={PAD.l} y1={y} x2={PAD.l + pw} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                        {val > 0 && (
                          <text x={PAD.l - 5} y={y + 4} textAnchor="end" fill="#D1D5DB" fontSize="9">{val}</text>
                        )}
                      </g>
                    );
                  })}
                  {/* Area fill */}
                  <path d={areaPath} fill="url(#areaGrad)" />
                  {/* Line */}
                  <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  {/* Dots + count labels */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      {p.count > 0 && (
                        <>
                          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={lineColor} strokeWidth="2" />
                          <text x={p.x} y={p.y - 8} textAnchor="middle" fill={lineColor} fontSize="9" fontWeight="600">{p.count}</text>
                        </>
                      )}
                      {p.count === 0 && (
                        <circle cx={p.x} cy={p.y} r="2.5" fill="#E5E7EB" />
                      )}
                    </g>
                  ))}
                  {/* Baseline */}
                  <line x1={PAD.l} y1={PAD.t + ph} x2={PAD.l + pw} y2={PAD.t + ph} stroke="#E5E7EB" strokeWidth="1" />
                  {/* Month labels */}
                  {MONTHS_PT.map((m, i) => (
                    <text key={i} x={PAD.l + (i / 11) * pw} y={VH - 6} textAnchor="middle" fill="#9CA3AF" fontSize="10">{m}</text>
                  ))}
                </svg>
              );
            })()}
          </div>
        )}
      </main>

      <Footer />

      {/* ── BIRD TOOLTIP ── */}
      {tooltip?.kind === 'bird' && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 min-w-[200px] max-w-[260px]">
            {tooltip.imgUrl ? (
              <img src={tooltip.imgUrl} alt={tooltip.birdName}
                className="rounded-lg object-cover flex-shrink-0 border border-gray-100"
                style={{ width: 52, height: 52 }} />
            ) : (
              <div className="rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52 }}>
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-gray-800 leading-tight truncate">{tooltip.birdName}</span>
              {tooltip.scientificName && (
                <span className="text-xs italic text-gray-400 leading-tight truncate">{tooltip.scientificName}</span>
              )}
              <span className="text-xs font-bold text-[#159d51] mt-1">
                {tooltip.count} avistamento{tooltip.count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex justify-center -mt-px">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -translate-y-1.5 shadow-sm" />
          </div>
        </div>
      )}

      {/* ── FAMILY TOOLTIP ── */}
      {tooltip?.kind === 'family' && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[240px] max-w-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-[#5042E0] italic">{tooltip.family}</span>
              <span className="text-xs font-bold text-gray-500 ml-2 whitespace-nowrap">
                {tooltip.count} avistamento{tooltip.count !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Bird list */}
            <div className="flex flex-col gap-1.5">
              {tooltip.birds.slice(0, 8).map((b, i) => {
                const img = birdImgById.get(b.birdId) ?? null;
                return (
                <div key={i} className="flex items-center gap-2">
                  {img ? (
                    <img src={img} alt={b.birdName}
                      className="rounded-full object-cover flex-shrink-0 border border-gray-100"
                      style={{ width: 28, height: 28 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center"
                      style={{ width: 28, height: 28 }}>
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate leading-tight">{b.birdName}</p>
                    {b.scientificName && (
                      <p className="text-[10px] italic text-gray-400 truncate leading-tight">{b.scientificName}</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#159d51] flex-shrink-0">{b.count}</span>
                </div>
              ); })}
              {tooltip.birds.length > 8 && (
                <p className="text-[10px] text-gray-400 text-center mt-0.5">
                  +{tooltip.birds.length - 8} mais espécie{tooltip.birds.length - 8 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-center -mt-px">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -translate-y-1.5 shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
