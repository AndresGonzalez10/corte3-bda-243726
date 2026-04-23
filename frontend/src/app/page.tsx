'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 1. Le decimos a TypeScript qué forma tiene un Usuario
interface Usuario {
  username: string;
  label: string;
  rol: string;
}

const USUARIOS: Usuario[] = [
  { username: 'vet_lopez',     label: 'Dr. Fernando López (Veterinario)',   rol: 'veterinario' },
  { username: 'vet_garcia',    label: 'Dra. Sofía García (Veterinario)',    rol: 'veterinario' },
  { username: 'vet_mendez',    label: 'Dr. Andrés Méndez (Veterinario)',    rol: 'veterinario' },
  { username: 'recepcionista', label: 'Recepcionista',                      rol: 'recepcion'   },
  { username: 'administrador', label: 'Administrador',                      rol: 'admin'       },
];

export default function LoginPage() {
  const [selected, setSelected] = useState<string>('vet_lopez');
  const router = useRouter();

  const handleLogin = () => {
    const user = USUARIOS.find(u => u.username === selected);
    
    // 2. Validación de seguridad para TypeScript
    if (!user) return; 

    localStorage.setItem('username', user.username);
    localStorage.setItem('rol', user.rol);
    router.push('/mascotas');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Clínica Veterinaria</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de gestión con seguridad de BD</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Selecciona tu usuario</label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {USUARIOS.map(u => (
              <option key={u.username} value={u.username}>{u.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Rol seleccionado:</p>
          <p>{USUARIOS.find(u => u.username === selected)?.rol}</p>
          <p className="mt-2 text-slate-400">
            El rol determina qué tablas y filas puede ver en PostgreSQL (GRANT + RLS).
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          Ingresar al sistema
        </button>
      </div>
    </div>
  );
}