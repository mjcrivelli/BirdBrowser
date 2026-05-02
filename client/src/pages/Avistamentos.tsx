import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BirdWithSeenStatus } from '@shared/schema';
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

const MAX_BAR_H = 260;
const COL_W = 76;
const PHOTO_SIZE = 44;

function barColor(rank: number): string {
  if (rank === 1) return '#F59E0B'; // amber
  if (rank === 2) return '#94A3B8'; // slate
  if (rank === 3) return '#FB923C'; // orange
  if (rank <= 10) return '#22C55E'; // green-500
  return '#86EFAC';                 // green-300
}

function rankLabel(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

interface TooltipInfo {
  birdName: string;
  scientificName: string;
  count: number;
  imgUrl: string | null;
  x: number;
  y: number;
}

export default function Avistamentos() {
  const [year, setYear]       = useState<string>('all');
  const [period, setPeriod]   = useState<string>('alltime');
  const [season, setSeason]   = useState<string>('');
  const [geoOnly, setGeoOnly] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const { data: years = [] } = useQuery<number[]>({
    queryKey: ['/api/sightings/years'],
  });

  const params = new URLSearchParams();
  if (year !== 'all') params.set('year', year);
  if (period !== 'alltime') params.set('period', period);
  if (season) params.set('season', season);
  if (geoOnly) params.set('geoOnly', 'true');
  const queryUrl = `/api/sightings/by-bird${params.toString() ? '?' + params.toString() : ''}`;

  const { data: birdData = [], isLoading, isError } = useQuery<BirdCount[]>({
    queryKey: [queryUrl],
  });

  const { data: allBirds = [] } = useQuery<BirdWithSeenStatus[]>({
    queryKey: ['/api/birds'],
  });

  const maxCount = birdData.length > 0 ? birdData[0].count : 1;
  const totalSightings = birdData.reduce((s, b) => s + b.count, 0);
  const totalWidth = birdData.length * (COL_W + 4);

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
        {!isLoading && !isError && birdData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-72 text-center gap-3">
            <svg className="w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-400 font-medium">Nenhum avistamento encontrado para este filtro.</p>
          </div>
        )}

        {/* Chart */}
        {!isLoading && !isError && birdData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Stats */}
            <div className="flex flex-wrap gap-5 mb-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#22C55E]" />
                {birdData.length} espécie{birdData.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#1565c0]" />
                {totalSightings} avistamento{totalSightings !== 1 ? 's' : ''} no total
              </span>
            </div>

            {/* Scrollable bar chart */}
            <div className="overflow-x-auto">
              <div
                className="flex items-end gap-1 pb-2"
                style={{ minWidth: totalWidth, height: MAX_BAR_H + PHOTO_SIZE + 48 }}
              >
                {birdData.map((bird, idx) => {
                  const rank   = idx + 1;
                  const barH   = Math.max(6, Math.round((bird.count / maxCount) * MAX_BAR_H));
                  const color  = barColor(rank);
                  const bInfo  = allBirds.find(b => b.name === bird.birdName);
                  const imgUrl = bInfo ? (bInfo.customImageUrl || bInfo.imageUrl) : null;

                  return (
                    <div
                      key={bird.birdName}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                      style={{ width: COL_W }}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        setTooltip({
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
                      {/* Rank */}
                      <span className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">
                        {rankLabel(rank)}
                      </span>

                      {/* Count */}
                      <span className="text-xs font-bold text-gray-700 mb-1 leading-none">
                        {bird.count}
                      </span>

                      {/* Bar */}
                      <div
                        className="w-11 rounded-t-lg transition-all duration-300"
                        style={{ height: barH, backgroundColor: color }}
                      />

                      {/* Photo */}
                      <div className="mt-2">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={bird.birdName}
                            className="rounded-full object-cover border-2 border-white shadow-sm"
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center"
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                          >
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Bird name */}
                      <p
                        className="text-center text-[9px] leading-tight text-gray-500 mt-1"
                        style={{
                          width: COL_W - 6,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        } as React.CSSProperties}
                      >
                        {bird.birdName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-center text-gray-300 mt-2">
              Role para o lado para ver todas as espécies · Passe o mouse sobre a barra para ver detalhes
            </p>
          </div>
        )}
      </main>

      <Footer />

      {/* Rich hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex items-center gap-3 min-w-[200px] max-w-[260px]">
            {tooltip.imgUrl ? (
              <img
                src={tooltip.imgUrl}
                alt={tooltip.birdName}
                className="rounded-lg object-cover flex-shrink-0 border border-gray-100"
                style={{ width: 52, height: 52 }}
              />
            ) : (
              <div
                className="rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"
                style={{ width: 52, height: 52 }}
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-gray-800 leading-tight truncate">
                {tooltip.birdName}
              </span>
              {tooltip.scientificName && (
                <span className="text-xs italic text-gray-400 leading-tight truncate">
                  {tooltip.scientificName}
                </span>
              )}
              <span className="text-xs font-bold text-[#22C55E] mt-1">
                {tooltip.count} avistamento{tooltip.count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {/* Arrow */}
          <div className="flex justify-center -mt-px">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -translate-y-1.5 shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
