/* eslint-disable complexity, no-nested-ternary, react/prop-types */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import {
  ArrowRight, CircleAlert, Eye, EyeOff, Lock, Mail,
  MoonStar, ShieldCheck, SunMedium, User, Zap, Check,
} from 'lucide-react';

/* ── Helpers ── */
function normalizeName(v) { return v.trim().replace(/\s+/g, ' '); }

function validateFullName(v) {
  const n = normalizeName(v);
  if (!n) return 'Ingresa tu nombre completo.';
  if (/\d/.test(n)) return 'El nombre no debe contener números.';
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(n)) return 'Usa solo letras y espacios.';
  const parts = n.split(' ').filter(Boolean);
  if (parts.length < 2) return 'Ingresa al menos dos palabras.';
  if (parts.some(p => p.length < 3)) return 'Cada palabra debe tener mínimo 3 caracteres.';
  if (parts.some(p => p[0] !== p[0].toLocaleUpperCase('es'))) return 'Cada palabra debe iniciar con mayúscula.';
  return '';
}

function validateEmail(v) {
  const n = v.trim();
  if (!n) return 'Ingresa tu correo electrónico.';
  if (/\s/.test(n)) return 'El correo no debe tener espacios.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return 'Correo inválido.';
  return '';
}

function getPasswordStrength(v) {
  if (!v) return { label: 'Vacía', tone: 'bg-slate-300', bar: 0, strong: false, hint: 'Usa 10+ caracteres con mayúsculas, números y símbolos.' };
  const s = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(v)).length;
  const ok = v.length >= 10 && s === 4;
  if (ok)                        return { label: 'Alta',  tone: 'bg-emerald-500', bar: 100, strong: true,  hint: '¡Contraseña segura!' };
  if (v.length >= 8 && s >= 3)   return { label: 'Media', tone: 'bg-amber-400',   bar: 65,  strong: false, hint: 'Añade un símbolo o más longitud.' };
  return                                { label: 'Baja',  tone: 'bg-red-500',     bar: 30,  strong: false, hint: 'Necesitas más longitud y variedad.' };
}

async function syncUserWithBackend(user, displayName) {
  try {
    await api.post('/usuarios', { id: user.uid, email: user.email, nombre: displayName || user.displayName || 'Usuario Nuevo', rol: 'admin' });
  } catch (e) { console.error('Sync error', e.message); }
}

async function checkRoleWeb(user, setError) {
  try {
    const res = await api.get(`/usuarios/${user.uid}`);
    if (res.data?.rol === 'cliente') {
      const { getAuth, signOut } = await import('firebase/auth');
      await signOut(getAuth());
      setError('⛔ Los clientes deben usar la App Móvil.');
      return false;
    }
  } catch (e) { console.warn('Role check skipped', e.message); }
  return true;
}

/* ── Theme Toggle ── */
function ThemeToggle({ isLight, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border px-3.5 py-2.5
        text-sm font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-[1.04]
        ${isLight ? 'border-slate-200 bg-white/85 text-slate-700' : 'border-slate-700/80 bg-slate-900/80 text-slate-100'}`}
      aria-label={isLight ? 'Modo oscuro' : 'Modo claro'}
    >
      {isLight ? <MoonStar size={16} strokeWidth={1.8} /> : <SunMedium size={16} strokeWidth={1.8} />}
      <span className="hidden sm:block">{isLight ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}

/* ── Password Meter ── */
function PasswordMeter({ strength }) {
  return (
    <div className="login-signal rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="login-muted">Fortaleza: <span className={strength.strong ? 'login-success' : 'login-warning'}>{strength.label}</span></span>
        {strength.strong && <span className="login-success flex items-center gap-1"><Check size={12} strokeWidth={2.5} /> Segura</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
        <div className={`h-full rounded-full transition-all duration-500 ${strength.tone}`} style={{ width: `${strength.bar}%` }} />
      </div>
      <p className="login-muted text-xs leading-5">{strength.hint}</p>
    </div>
  );
}

/* ── Text Field ── */
function TextField({ id, label, icon: Icon, value, onChange, placeholder, type = 'text', inputMode, autoComplete, error, trailing }) {
  return (
    <div className="login-field-group space-y-1.5">
      <label htmlFor={id} className="login-field-label block text-sm font-semibold">{label}</label>
      <div className="relative">
        <Icon className="login-field-icon absolute left-3.5 top-1/2 -translate-y-1/2" size={17} strokeWidth={1.8} />
        <input
          id={id} type={type} inputMode={inputMode} autoComplete={autoComplete}
          value={value} onChange={onChange} placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="login-textfield w-full rounded-xl border py-3 pl-10 pr-11 text-sm outline-none transition-all"
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && <p className="login-error rounded-lg px-3 py-2 text-xs leading-5">{error}</p>}
    </div>
  );
}

/* ── Password Toggle ── */
function PasswordToggle({ visible, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="login-muted rounded-lg p-1.5 transition-colors hover:text-slate-700"
      aria-label={visible ? 'Ocultar' : 'Mostrar'}>
      {visible ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
    </button>
  );
}

/* ── Google Button ── */
function GoogleButton({ loading, onClick, isLight }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold
        transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0
        ${isLight ? 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 shadow-sm'
                  : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-blue-500/30 hover:bg-slate-800'}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuar con Google
    </button>
  );
}

/* ── Left Hero Panel ── */
function HeroPanel() {
  const features = [
    { icon: ShieldCheck, text: 'Autenticación segura con Firebase' },
    { icon: Zap,         text: 'Panel de administración en tiempo real' },
    { icon: Check,       text: 'Gestión de usuarios, productos y compras' },
  ];
  return (
    <section className="login-hero hidden rounded-[2rem] p-10 lg:flex lg:flex-col lg:justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
          <Zap size={20} strokeWidth={2} />
        </div>
        <span className="text-lg font-bold text-white">TechStore 360</span>
      </div>

      {/* Main copy */}
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80 mb-3">Panel Administrativo</p>
        <h1 className="text-4xl font-black text-white leading-tight sm:text-5xl">
          Gestiona tu tienda<br />
          <span className="text-blue-300">desde un solo lugar.</span>
        </h1>
        <p className="mt-5 text-base text-slate-300/90 leading-relaxed max-w-sm">
          Controla usuarios, productos y compras con una interfaz rápida, segura y diseñada para administradores.
        </p>

        {/* Feature list */}
        <ul className="mt-8 space-y-3">
          {features.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-200/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon size={14} strokeWidth={2} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer badge */}
      <div className="rounded-xl border border-white/10 bg-white/8 px-4 py-3">
        <p className="text-xs text-slate-300/80">
          🔒 Acceso exclusivo para <strong className="text-white">administradores</strong>. Los clientes deben usar la App Móvil.
        </p>
      </div>
    </section>
  );
}

/* ── Login Card ── */
function LoginCard({ ctrl }) {
  const {
    isRegistering, setIsRegistering, setError,
    email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, nombre, setNombre,
    error, loading,
    showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    visibleNameError, visibleEmailError, passwordStrength,
    visiblePasswordError, visibleConfirmError,
    canSubmit, panelClasses, buttonClasses, submitLabel,
    isLight, handleSubmit, handleGoogleLogin,
  } = ctrl;

  return (
    <section className={`login-card-shell rounded-[2rem] border p-7 sm:p-8 ${panelClasses} backdrop-blur-2xl`}>
      {/* Header */}
      <div className="mb-7 text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl
          ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/15 text-blue-400'}`}>
          {isRegistering ? <ShieldCheck size={26} strokeWidth={1.8} /> : <Lock size={26} strokeWidth={1.8} />}
        </div>
        <h2 className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {isRegistering ? 'Crear cuenta' : 'Bienvenido de vuelta'}
        </h2>
        <p className={`mt-1.5 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {isRegistering ? 'Completa los campos para registrarte.' : 'Ingresa con tu correo y contraseña.'}
        </p>

        {/* Error */}
        {error && (
          <div className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-left text-sm
            ${isLight ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
            <CircleAlert size={18} className="mt-0.5 shrink-0" strokeWidth={1.8} />
            <span className="leading-6">{error}</span>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {isRegistering && (
          <TextField id="nombre-completo" label="Nombre completo" icon={User}
            value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="María García" error={visibleNameError} />
        )}
        <TextField id="correo-electronico" label="Correo electrónico" icon={Mail}
          type="email" inputMode="email" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="usuario@techstore.com" error={visibleEmailError} />
        <TextField id="contrasena" label="Contraseña" icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete={isRegistering ? 'new-password' : 'current-password'}
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••••" error={visiblePasswordError}
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(p => !p)} />}
        />
        {isRegistering && password.trim() && <PasswordMeter strength={passwordStrength} />}
        {isRegistering && (
          <TextField id="confirmar-contrasena" label="Confirmar contraseña" icon={Lock}
            type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña" error={visibleConfirmError}
            trailing={<PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(p => !p)} />}
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-4">
        <button
          type="button" onClick={handleSubmit} disabled={!canSubmit}
          id="btn-login-submit"
          className={`group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold
            transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 ${buttonClasses}`}>
          {submitLabel}
          {!loading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" strokeWidth={2} />}
        </button>

        <div className="flex items-center gap-3">
          <div className="login-divider h-px flex-1" />
          <span className="login-muted text-xs uppercase tracking-[0.25em]">o</span>
          <div className="login-divider h-px flex-1" />
        </div>

        <GoogleButton loading={loading} onClick={handleGoogleLogin} isLight={isLight} />

        <p className="login-signal rounded-xl px-4 py-3 text-center text-sm">
          {isRegistering ? '¿Ya tienes una cuenta? ' : '¿No tienes cuenta? '}
          <button
            type="button"
            onClick={() => { setError(''); setIsRegistering(!isRegistering); }}
            className="login-accent ml-1 font-semibold hover:opacity-80 transition-opacity">
            {isRegistering ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </section>
  );
}

/* ── Controller ── */
function useLoginController() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre]               = useState('');
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, signup, loginWithGoogle } = useAuth();
  const { isLight, toggleTheme }           = useTheme();
  const navigate                           = useNavigate();

  const nameError        = isRegistering ? validateFullName(nombre) : '';
  const emailError       = validateEmail(email);
  const visibleNameError = nombre.trim()          ? nameError   : '';
  const visibleEmailError = email.trim()          ? emailError  : '';
  const passwordStrength = getPasswordStrength(password);
  const passwordMismatch = isRegistering && confirmPassword && password !== confirmPassword;
  const visiblePasswordError = isRegistering && password.trim() && !passwordStrength.strong ? 'Contraseña aún no es segura.' : '';
  const visibleConfirmError  = isRegistering && confirmPassword.trim() && passwordMismatch   ? 'Las contraseñas no coinciden.' : '';

  const canSubmit = isRegistering
    ? !loading && !nameError && !emailError && passwordStrength.strong && !passwordMismatch && confirmPassword.length > 0
    : !loading && !emailError && password.length > 0;

  const panelClasses = isLight
    ? 'bg-white/90 border-slate-200/80 shadow-[0_32px_80px_rgba(15,23,42,0.10)]'
    : 'bg-slate-900/80 border-slate-700/60 shadow-[0_32px_80px_rgba(2,6,23,0.50)]';
  const buttonClasses = isLight
    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/15'
    : 'bg-white text-slate-950 hover:bg-slate-100 shadow-lg shadow-black/30';

  const submitLabel = loading ? 'Procesando...' : isRegistering ? 'Crear cuenta' : 'Ingresar al panel';

  async function handleSubmit() {
    try {
      setError(''); setLoading(true);
      if (isRegistering) {
        if (nameError) throw new Error(nameError);
        if (!passwordStrength.strong) throw new Error('Contraseña no es segura.');
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');
        const cred = await signup(email.trim(), password);
        await syncUserWithBackend(cred.user, normalizeName(nombre));
      } else {
        const cred = await login(email.trim(), password);
        const ok = await checkRoleWeb(cred.user, setError);
        if (!ok) throw new Error('No autorizado');
      }
      navigate('/');
    } catch (e) {
      console.error(e);
      if (!error) setError(isRegistering ? 'Error al registrar. ¿El correo ya está en uso?' : 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally { setLoading(false); }
  }

  async function handleGoogleLogin() {
    try {
      setError(''); setLoading(true);
      const cred = await loginWithGoogle();
      await syncUserWithBackend(cred.user, cred.user.displayName);
      const ok = await checkRoleWeb(cred.user, setError);
      if (!ok) return;
      navigate('/');
    } catch (e) {
      console.error(e);
      setError('Error al iniciar sesión con Google.');
    } finally { setLoading(false); }
  }

  return {
    isRegistering, setIsRegistering, setError,
    email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, nombre, setNombre,
    error, loading, showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    visibleNameError, visibleEmailError, passwordStrength,
    passwordMismatch, visiblePasswordError, visibleConfirmError,
    canSubmit, panelClasses, buttonClasses, submitLabel,
    isLight, toggleTheme, handleSubmit, handleGoogleLogin,
  };
}

/* ── Entry ── */
export default function Login() {
  const ctrl = useLoginController();

  return (
    <div className="theme-shell relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10 transition-colors duration-300">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full blur-3xl opacity-70" style={{ background: 'var(--login-orb-a)' }} />
        <div className="absolute top-1/2 right-[-6rem] h-80 w-80 rounded-full blur-3xl opacity-60" style={{ background: 'var(--login-orb-b)' }} />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-80 w-80 rounded-full blur-3xl opacity-50" style={{ background: 'var(--login-orb-c)' }} />
      </div>

      <ThemeToggle isLight={ctrl.isLight} onToggle={ctrl.toggleTheme} />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-stretch">
          <HeroPanel />
          <LoginCard ctrl={ctrl} />
        </div>
      </div>
    </div>
  );
}