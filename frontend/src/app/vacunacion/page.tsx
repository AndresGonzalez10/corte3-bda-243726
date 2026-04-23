'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// URL 100% dinámica
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface VacunacionData {
  mascota_id: number;
  mascota: string;
  especie: string;
  dueno: string;
  telefono: string;
  email: string | null;
  ultima_vacuna: string | null;
  estado_vacunacion: string;
  dias_desde_ultima_vacuna: number | null;
}

export default function VacunacionPage() {
  const [datos, setDatos]         = useState<VacunacionData[]>([]);
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [loading, setLoading]     = useState<boolean>(false);
  const [latencia, setLatencia]   = useState<number | null>(null);
  const [logs, setLogs]           = useState<string[]>([]);
  const [rol, setRol]             = useState<string>('');
  const [username, setUsername]   = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('username') || '';
    const r = localStorage.getItem('rol') || '';
    if (!u) { router.push('/'); return; }
    setUsername(u);
    setRol(r);
  }, [router]);

  const addLog = (msg: string) => {
    const ts = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 20));
  };

  const consultarVacunacion = async () => {
    if (!username) return;
    setLoading(true);
    const inicio = Date.now();
    try {
      const res = await fetch(`${API}/vacunas/pendientes`, {
        headers: { 'Authorization': `Bearer ${username}` }
      });
      const json = await res.json();
      const ms   = Date.now() - inicio;
      setLatencia(ms);
      setDatos(json.data);
      setFromCache(json.fromCache);
      addLog(json.fromCache
        ? `CACHE HIT — vacunacion_pendiente — ${ms}ms (Redis)`
        : `CACHE MISS — vacunacion_pendiente — ${ms}ms (PostgreSQL)`
      );
    } catch (e: any) {
      addLog(`ERROR: ${e.message || 'Error de red'}`);
    } finally {
      setLoading(false);
    }
  };

  const invalidarCache = async () => {
    try {
      const res = await fetch(`${API}/vacunas/aplicar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${username}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mascota_id: 1, vacuna_id: 1, costo_cobrado: 350 })
      });
      const json = await res.json();
      addLog(`VACUNA APLICADA — caché invalidado → ${json.mensaje || 'OK'}`);
    } catch (e: any) {
      addLog(`ERROR al aplicar vacuna: ${e.message || 'Error de red'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <h1 className="font-bold text-slate-900">Clínica Veterinaria</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">{rol}</span>
          <Link href="/mascotas" className="text-slate-600 hover:text-slate-900">Mascotas</Link>
          <button onClick={() => { localStorage.clear(); router.push('/'); }} className="text-slate-500 hover:text-red-600">Salir</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Mascotas con Vacunación Pendiente</h2>
          <p className="text-sm text-slate-500">
            Esta consulta está cacheada en Redis con TTL de 5 minutos.
            Observa los logs para ver CACHE HIT / MISS y la diferencia de latencia.
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={consultarVacunacion}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {loading ? 'Consultando...' : 'Consultar vacunación pendiente'}
            </button>
            <button
              onClick={invalidarCache}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Aplicar vacuna (invalida caché)
            </button>
          </div>

          {latencia !== null && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              fromCache ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {fromCache ? '✓ CACHE HIT' : '○ CACHE MISS'} — {latencia}ms
            </div>
          )}
        </div>

        {/* Logs de caché */}
        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-1 min-h-[120px]">
          <p className="text-slate-400 mb-2">— Logs de caché Redis —</p>
          {logs.length === 0 && <p className="text-slate-600">Haz clic en "Consultar" para ver los logs</p>}
          {logs.map((l, i) => (
            <p key={i} className={l.includes('HIT') ? 'text-green-400' : l.includes('MISS') ? 'text-yellow-400' : l.includes('ERROR') ? 'text-red-400' : 'text-blue-400'}>
              {l}
            </p>
          ))}
        </div>

        {/* Tabla de resultados */}
        {datos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Mascota', 'Especie', 'Dueño', 'Teléfono', 'Estado vacunación', 'Última vacuna'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800">{d.mascota}</td>
                    <td className="px-4 py-2 text-slate-600 capitalize">{d.especie}</td>
                    <td className="px-4 py-2 text-slate-600">{d.dueno}</td>
                    <td className="px-4 py-2 text-slate-600">{d.telefono}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.estado_vacunacion === 'Nunca vacunada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {d.estado_vacunacion}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{d.ultima_vacuna?.split('T')[0] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}