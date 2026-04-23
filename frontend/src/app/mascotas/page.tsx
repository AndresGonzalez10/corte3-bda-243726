'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// URL 100% dinámica
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  fecha_nacimiento: string | null;
  dueno: string;
  telefono: string;
}

export default function MascotasPage() {
  const [mascotas, setMascotas]   = useState<Mascota[]>([]);
  const [busqueda, setBusqueda]   = useState<string>('');
  const [loading, setLoading]     = useState<boolean>(false);
  const [error, setError]         = useState<string>('');
  const [rol, setRol]             = useState<string>('');
  const [username, setUsername]   = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('username') || '';
    const r = localStorage.getItem('rol') || '';
    
    if (!u) { router.push('/'); return; }
    setUsername(u);
    setRol(r);
    cargarMascotas(u, '');
  }, [router]);

  const headers = (u: string) => ({ 'Authorization': `Bearer ${u}`, 'Content-Type': 'application/json' });

  const cargarMascotas = async (u: string, nombre: string) => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/mascotas/buscar?nombre=${encodeURIComponent(nombre)}`, { headers: headers(u) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMascotas(json.data);
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    cargarMascotas(username, busqueda);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <h1 className="font-bold text-slate-900">Clínica Veterinaria</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">{rol}</span>
          <Link href="/vacunacion" className="text-slate-600 hover:text-slate-900">Vacunación</Link>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-600">Salir</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Búsqueda de Mascotas</h2>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>Demo de seguridad:</strong> Intenta ingresar{' '}
            <code className="bg-amber-100 px-1 rounded">' OR '1'='1</code> o{' '}
            <code className="bg-amber-100 px-1 rounded">'; DROP TABLE mascotas; --</code> en el buscador.
            El sistema lo previene con queries parametrizadas.
          </div>

          <form onSubmit={handleBuscar} className="flex gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Nombre de la mascota (prueba inyección aquí)"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => { setBusqueda(''); cargarMascotas(username, ''); }}
              className="border border-slate-300 text-slate-600 px-3 py-2 rounded-lg text-sm"
            >
              Ver todas
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-500 py-10">Cargando...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {mascotas.length} mascota(s) visible(s) para el rol <strong>{rol}</strong>
                {rol === 'veterinario' && ' (RLS activo — solo tus mascotas asignadas)'}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['ID', 'Nombre', 'Especie', 'Nacimiento', 'Dueño', 'Teléfono'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mascotas.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
                ) : mascotas.map(m => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-400">{m.id}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{m.nombre}</td>
                    <td className="px-4 py-2 text-slate-600 capitalize">{m.especie}</td>
                    <td className="px-4 py-2 text-slate-600">{m.fecha_nacimiento?.split('T')[0]}</td>
                    <td className="px-4 py-2 text-slate-600">{m.dueno}</td>
                    <td className="px-4 py-2 text-slate-600">{m.telefono}</td>
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