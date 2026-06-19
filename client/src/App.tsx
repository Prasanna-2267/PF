import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';

type Health = { status: string; service: string; env: string };

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get<Health>('/health')).data,
    retry: false,
  });

  const status = isLoading ? 'checking…' : isError ? 'offline' : (data?.status ?? 'unknown');
  const ok = status === 'ok';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-slate-100">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
          Parallax Flow
        </h1>
        <p className="mt-3 text-slate-400">Secure learning platform — Phase 0 scaffold</p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm">
        <span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span>API:</span>
        <span className="font-medium">{status}</span>
        {data?.env ? <span className="text-slate-500">({data.env})</span> : null}
      </div>
    </div>
  );
}

export default App;
