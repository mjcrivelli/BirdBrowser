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
  Cell,
} from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const COLORS = [
  '#2e7d32', '#1565c0', '#c62828', '#f57f17', '#6a1b9a',
  '#00838f', '#558b2f', '#4527a0', '#ad1457', '#00695c',
  '#e65100', '#283593', '#37474f', '#6d4c41', '#0277bd',
  '#2e7d32', '#880e4f', '#1b5e20', '#bf360c', '#311b92',
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
      <p className="font-semibold text-gray-800 mb-2 text-sm">{label}</p>
      <p className="text-xs text-gray-500 mb-2">Total: {total} avistamento{total !== 1 ? 's' : ''}</p>
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

export default function Avistamentos() {
  const { data: rows = [], isLoading, isError } = useQuery<RawRow[]>({
    queryKey: ['/api/sightings/by-month'],
  });

  const { data, birds } = buildChartData(rows);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="min-h-screen bg-[#F9FBF9] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-montserrat text-[#333333] mb-2">
            Avistamentos
          </h1>
          <p className="text-gray-500 text-sm">
            Aves registradas pelos visitantes da Cachoeira da Toca ao longo do tempo
          </p>
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
            <p className="text-gray-400 font-medium">Nenhum avistamento registrado ainda.</p>
            <p className="text-gray-300 text-sm">Os dados aparecerão aqui assim que os visitantes começarem a marcar aves vistas.</p>
          </div>
        )}

        {!isLoading && !isError && data.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#2e7d32]" />
                  <span>{birds.length} espécie{birds.length !== 1 ? 's' : ''} registrada{birds.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#1565c0]" />
                  <span>{total} avistamento{total !== 1 ? 's' : ''} no total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#c62828]" />
                  <span>{data.length} {data.length !== 1 ? 'meses' : 'mês'} com registros</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                >
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
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="square"
                    iconSize={10}
                  />
                  {birds.map((bird, i) => (
                    <Bar
                      key={bird}
                      dataKey={bird}
                      stackId="a"
                      fill={getColor(i)}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {birds.length > 10 && (
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
