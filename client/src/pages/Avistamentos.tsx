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
  if (rank === 1) return '#F59E0B';
  if (rank === 2) return '#94A3B8';
  if (rank === 3) return '#FB923C';
  if (rank <= 10) return '#22C55E';
  return '#86EFAC';
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

export default function Avistamentos() {
  const [year, setYear]         = useState<string>('all');
  const [period, setPeriod]     = useState<string>('alltime');
  const [season, setSeason]     = useState<string>('');
  const [geoOnly, setGeoOnly]   = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'bird' | 'family'>('bird');
  const [tooltip, setTooltip]   = useState<TooltipInfo | null>(null);

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

  // For bird-mode photo lookup
  const { data: allBirds = [] } = useQuery<any[]>({
    queryKey: ['/api/birds'],
  });

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

  const totalWidth = viewMode === 'bird'
    ? activeBirdData.length   * (COL_W_BIRD   + 4)
    : activeFamilyData.length * (COL_W_FAMILY + 4);

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-5 items-end">
          {/* Year dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ano</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-40 h-9 text-sm">
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
              <SelectTrigger className="w-52 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="h-9 w-px bg-gray-100 hidden sm:block self-end" />

          {/* Season tabs */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estação</label>
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSeason(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    season === s.value
                      ? 'bg-[#4CAF50] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-9 w-px bg-gray-100 hidden sm:block self-end" />

          {/* Geo toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Localização</label>
            <button
              onClick={() => setGeoOnly(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                geoOnly
                  ? 'bg-[#1565c0] text-white border-[#1565c0] shadow-sm'
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

        {geoOnly && (
          <p className="text-xs text-gray-400 italic -mt-4 mb-4 px-1">
            Mostrando somente avistamentos com localização registrada dentro de 10 km da Cachoeira da Toca.
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-72">
            <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
          </div>
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

        {/* Chart */}
        {!isLoading && !isError && totalSightings > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

            {/* Stats row + view toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-5 text-sm text-gray-500">
                {viewMode === 'family' && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
                    {familiesCount} famíli{familiesCount !== 1 ? 'as' : 'a'}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#22C55E]" />
                  {speciesCount} espécie{speciesCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#1565c0]" />
                  {totalSightings} avistamento{totalSightings !== 1 ? 's' : ''} no total
                </span>
              </div>

              {/* View-mode toggle */}
              <div className="flex items-center gap-0 rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => { setViewMode('bird'); setTooltip(null); }}
                  className={`px-3 py-1.5 transition-colors ${
                    viewMode === 'bird'
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Por espécie
                </button>
                <button
                  onClick={() => { setViewMode('family'); setTooltip(null); }}
                  className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${
                    viewMode === 'family'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Por família
                </button>
              </div>
            </div>

            {/* Scrollable bar chart */}
            <div className="overflow-x-auto">
              <div
                className="flex items-end gap-1 pb-2"
                style={{ minWidth: totalWidth, height: MAX_BAR_H + PHOTO_SIZE + 60 }}
              >
                {/* ── BIRD MODE ── */}
                {viewMode === 'bird' && activeBirdData.map((bird, idx) => {
                  const rank   = idx + 1;
                  const barH   = Math.max(6, Math.round((bird.count / maxBirdCount) * MAX_BAR_H));
                  const color  = barColor(rank);
                  const bInfo  = allBirds.find((b: any) => b.name === bird.birdName);
                  const imgUrl = bInfo ? (bInfo.customImageUrl || bInfo.imageUrl) : null;

                  return (
                    <div
                      key={bird.birdName}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                      style={{ width: COL_W_BIRD }}
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
                      <span className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">{rankLabel(rank)}</span>
                      <span className="text-xs font-bold text-gray-700 mb-1 leading-none">{bird.count}</span>
                      <div className="w-11 rounded-t-lg transition-all duration-300" style={{ height: barH, backgroundColor: color }} />
                      <div className="mt-2">
                        {imgUrl ? (
                          <img src={imgUrl} alt={bird.birdName}
                            className="rounded-full object-cover border-2 border-white shadow-sm"
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center"
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-[9px] leading-tight text-gray-500 mt-1"
                        style={{ width: COL_W_BIRD - 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                        {bird.birdName}
                      </p>
                    </div>
                  );
                })}

                {/* ── FAMILY MODE ── */}
                {viewMode === 'family' && activeFamilyData.map((fam, idx) => {
                  const rank  = idx + 1;
                  const barH  = Math.max(6, Math.round((fam.count / maxFamilyCount) * MAX_BAR_H));
                  const color = barColor(rank);
                  // Use top-bird's photo as the family thumbnail
                  const topBird  = fam.birds[0];
                  const imgUrl   = topBird?.imageUrl ?? null;

                  return (
                    <div
                      key={fam.family}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                      style={{ width: COL_W_FAMILY }}
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
                      <span className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">{rankLabel(rank)}</span>
                      <span className="text-xs font-bold text-gray-700 mb-1 leading-none">{fam.count}</span>
                      <div className="w-14 rounded-t-lg transition-all duration-300" style={{ height: barH, backgroundColor: color }} />
                      {/* Row of up to 3 bird thumbnails */}
                      <div className="mt-2 flex gap-0.5 justify-center">
                        {fam.birds.slice(0, 3).map((b, i) => (
                          b.imageUrl ? (
                            <img key={i} src={b.imageUrl} alt={b.birdName}
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
                          )
                        ))}
                        {fam.birds.length > 3 && (
                          <div className="rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center"
                            style={{ width: 28, height: 28 }}>
                            <span className="text-[8px] font-bold text-gray-500">+{fam.birds.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-[9px] leading-tight text-[#8B5CF6] font-semibold mt-1.5"
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

            <p className="text-xs text-center text-gray-300 mt-2">
              Role para o lado para ver {viewMode === 'bird' ? 'todas as espécies' : 'todas as famílias'} · Passe o mouse sobre a barra para ver detalhes
            </p>
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
              <span className="text-xs font-bold text-[#22C55E] mt-1">
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
              <span className="text-sm font-bold text-[#8B5CF6] italic">{tooltip.family}</span>
              <span className="text-xs font-bold text-gray-500 ml-2 whitespace-nowrap">
                {tooltip.count} avistamento{tooltip.count !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Bird list */}
            <div className="flex flex-col gap-1.5">
              {tooltip.birds.slice(0, 8).map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.birdName}
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
                  <span className="text-xs font-bold text-[#22C55E] flex-shrink-0">{b.count}</span>
                </div>
              ))}
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
