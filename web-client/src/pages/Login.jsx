import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, User } from 'lucide-react';
import api from '../api';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function syncUserWithBackend(user, displayName) {
    try {
      await api.post('/usuarios', {
        id: user.uid,
        email: user.email,
        nombre: displayName || user.displayName || 'Usuario Nuevo',
        rol: 'cliente'
      });
    } catch (e) {
      console.error('Error al sincronizar con el backend', e.response?.data || e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (isRegistering) {
        const credential = await signup(email, password);
        await syncUserWithBackend(credential.user, nombre);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(isRegistering ? 'Fallo al registrar. Posiblemente el correo ya está en uso.' : 'Fallo al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      const credential = await loginWithGoogle();
      // En caso de que sea usuario nuevo, intentamos sincronizar
      await syncUserWithBackend(credential.user, credential.user.displayName);
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
      
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              TechStore 360
            </h1>
            <p className="text-slate-400 text-sm">
              {isRegistering ? 'Crea una cuenta nueva' : 'Bienvenido de vuelta, ingresa tus datos'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="text" 
                    required 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="Alex Maguert"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="usuario@techstore.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Ingresar al Panel')}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px bg-slate-700 flex-1"></div>
            <span className="text-slate-500 text-sm">O continuar con</span>
            <div className="h-px bg-slate-700 flex-1"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Google
          </button>

          <div className="mt-8 text-center text-sm text-slate-400">
            {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isRegistering ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
