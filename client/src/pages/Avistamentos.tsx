import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BirdWithSeenStatus } from '@shared/schema';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const SEASONS = [
  { value: '', label: 'Todas' },
  { value: 'summer', label: 'Verão' },
  { value: 'autumn', label: 'Outono' },
  { value: 'winter', label: 'Inverno' },
  { value: 'spring', label: 'Primavera' },
];

const COLORS = [
  '#2e7d32', '#1565c0', '#c62828', '#f57f17', '#6a1b9a',
  '#00838f', '#558b2f', '#4527a0', '#ad1457', '#00695c',
  '#e65100', '#283593', '#37474f', '#6d4c41', '#0277bd',
  '#7b1fa2', '#880e4f', '#1b5e20', '#bf360c', '#311b92',
];

function getColor(index: number): string {
  return COLORS[index % COLORS.length];
}

interface RawRow {
  monthKey: string;
  birdName: string;
  count: number;
}

interface ChartDataPoint {
  month: string;
  [birdName: string]: string | number;
}

function buildChartData(rows: RawRow[]): { data: ChartDataPoint[]; birds: string[] } {
  if (rows.length === 0) return { data: [], birds: [] };

  const monthSet = new Set<string>();
  const birdSet = new Set<string>();

  for (const r of rows) {
    monthSet.add(r.monthKey);
    birdSet.add(r.birdName);
  }

  const sortedMonths = Array.from(monthSet).sort();
  const birds = Array.from(birdSet).sort();

  const lookup: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    if (!lookup[r.monthKey]) lookup[r.monthKey] = {};
    lookup[r.monthKey][r.birdName] = r.count;
  }

  const data: ChartDataPoint[] = sortedMonths.map((mk) => {
    const [year, monthNum] = mk.split('-');
    const label = `${MONTHS_PT[parseInt(monthNum, 10) - 1]}/${year.slice(2)}`;
    const point: ChartDataPoint = { month: label };
    for (const bird of birds) {
      point[bird] = lookup[mk]?.[bird] ?? 0;
    }
    return point;
  });

  return { data, birds };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const items = payload.filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  const total = items.reduce((s, p) => s + p.value, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
      <p className="font-semibold text-gray-800 mb-1 text-sm">{label}</p>
      <p className="text-xs text-gray-400 mb-2">Total: {total} avistamento{total !== 1 ? 's' : ''}</p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.fill }} />
            <span className="text-gray-700 truncate">{entry.name}</span>
            <span className="ml-auto font-medium text-gray-900 pl-2">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MEDALS = [
  { label: '1º', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-500', icon: '🥇' },
  { label: '2º', bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-400',  icon: '🥈' },
  { label: '3º', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-400', icon: '🥉' },
];

interface TopBirdsProps {
  rows: RawRow[];
  allBirds: BirdWithSeenStatus[];
}

function TopBirds({ rows, allBirds }: TopBirdsProps) {
  const sorted = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of rows) acc[r.birdName] = (acc[r.birdName] || 0) + r.count;
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [rows]);

  if (sorted.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {sorted.map(([name, count], i) => {
        const medal = MEDALS[i];
        const bird = allBirds.find((b) => b.name === name);
        const imageUrl = bird ? (bird.customImageUrl || bird.imageUrl) : null;
        return (
          <div key={name} className={`bg-white rounded-xl shadow-sm border ${medal.border} p-4 flex flex-col items-center text-center gap-3`}>
            <div className={`w-10 h-10 rounded-full ${medal.bg} flex items-center justify-center text-lg`}>
              {medal.icon}
            </div>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-24 h-24 rounded-xl object-cover shadow-sm border border-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="min-w-0 w-full">
              <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${medal.text}`}>{medal.label} lugar</p>
              <p className="text-sm font-bold text-gray-800 leading-tight">{name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{count} avistamento{count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Avistamentos() {
  const [season, setSeason] = useState('');
  const [geoOnly, setGeoOnly] = useState(false);

  const params = new URLSearchParams();
  if (season) params.set('season', season);
  if (geoOnly) params.set('geoOnly', 'true');
  const queryUrl = `/api/sightings/by-month${params.toString() ? '?' + params.toString() : ''}`;

  const { data: rows = [], isLoading, isError } = useQuery<RawRow[]>({
    queryKey: [queryUrl],
  });

  const { data: allBirds = [] } = useQuery<BirdWithSeenStatus[]>({
    queryKey: ['/api/birds'],
  });

  const { data, birds } = buildChartData(rows);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="min-h-screen bg-[#F9FBF9] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold font-montserrat text-[#333333] mb-2">
            Avistamentos
          </h1>
          <p className="text-gray-400 text-sm">
            Aves registradas pelos visitantes da Cachoeira da Toca ao longo do tempo
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-center">
          {/* Season tabs */}
          <div className="flex flex-wrap gap-1.5">
            {SEASONS.map((s) => (
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

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Geo toggle */}
          <button
            onClick={() => setGeoOnly((v) => !v)}
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

          {geoOnly && (
            <p className="text-xs text-gray-400 italic w-full -mt-1">
              Mostrando somente avistamentos com localização registrada dentro de 10 km da Cachoeira da Toca.
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-72">
            <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-72 text-gray-400">
            <p>Não foi possível carregar os dados.</p>
          </div>
        )}

        {!isLoading && !isError && data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-72 text-center gap-3">
            <svg className="w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-400 font-medium">Nenhum avistamento encontrado para este filtro.</p>
            <p className="text-gray-300 text-sm">
              {geoOnly ? 'Poucos visitantes compartilharam localização próxima à Toca.' : 'Os dados aparecerão assim que os visitantes começarem a marcar aves.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && data.length > 0 && (
          <>
            {/* Top bird card */}
            <TopBirds rows={rows} allBirds={allBirds} />

            {/* Stats + chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#2e7d32]" />
                  {birds.length} espécie{birds.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#1565c0]" />
                  {total} avistamento{total !== 1 ? 's' : ''} no total
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#c62828]" />
                  {data.length} {data.length !== 1 ? 'meses' : 'mês'} com registros
                </span>
              </div>

              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#666' }}
                    allowDecimals={false}
                    label={{
                      value: 'Avistamentos',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: { fontSize: 12, fill: '#999' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="square" iconSize={10} />
                  {birds.map((bird, i) => (
                    <Bar key={bird} dataKey={bird} stackId="a" fill={getColor(i)} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {birds.length > 8 && (
              <p className="text-xs text-center text-gray-400">
                Passe o mouse sobre as barras para ver o detalhamento por espécie.
              </p>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
