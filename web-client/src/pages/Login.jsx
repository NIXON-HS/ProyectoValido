/* eslint-disable complexity, no-nested-ternary, react/prop-types */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import { ArrowRight, CircleAlert, Eye, EyeOff, Lock, Mail, MoonStar, ShieldCheck, SunMedium, User } from 'lucide-react';

function normalizeName(value) {
    return value.trim().replace(/\s+/g, ' ');
}

function validateFullName(value) {
    const normalized = normalizeName(value);
    if (!normalized) return 'Ingresa tu nombre completo.';
    if (/\d/.test(normalized)) return 'El nombre no debe contener números.';
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(normalized)) return 'Usa solo letras y espacios.';
    if (normalized.includes('  ')) return 'Usa un solo espacio entre nombres.';

    const parts = normalized.split(' ');
    if (parts.length < 2) return 'Debe existir al menos un espacio entre nombres.';
    if (parts.some((part) => part.length < 3)) return 'Cada nombre debe tener al menos 3 caracteres.';
    if (parts.some((part) => part[0] !== part[0].toLocaleUpperCase('es-ES'))) return 'Cada nombre debe iniciar con mayúscula.';
    if (parts.some((part) => part.slice(1) !== part.slice(1).toLocaleLowerCase('es-ES'))) return 'El resto de cada nombre debe ir en minúsculas.';
    return '';
}

function validateEmail(value) {
    const normalized = value.trim();
    if (!normalized) return 'Ingresa tu correo electrónico.';
    if (/\s/.test(normalized)) return 'El correo no debe contener espacios.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Ingresa un correo válido.';
    return '';
}

function getVisibleError(value, errorMessage) {
    return value.trim() ? errorMessage : '';
}

function getPasswordStrength(value) {
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);
    const score = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    const strong = value.length >= 10 && score === 4;

    if (!value) {
        return { label: 'Vacía', tone: 'bg-slate-200', bar: 0, strong: false, hint: 'Usa 10+ caracteres y mezcla mayúsculas, minúsculas, números y símbolos.' };
    }
    if (strong) {
        return { label: 'Alta', tone: 'bg-emerald-500', bar: 100, strong: true, hint: 'Contraseña segura lista para crear la cuenta.' };
    }
    if (value.length >= 8 && score >= 3) {
        return { label: 'Media', tone: 'bg-amber-500', bar: 65, strong: false, hint: 'Añade un símbolo o una letra más para que sea segura.' };
    }
    return { label: 'Fácil', tone: 'bg-rose-500', bar: 30, strong: false, hint: 'Necesitas más longitud y variedad de caracteres.' };
}

async function syncUserWithBackend(user, displayName) {
    try {
        await api.post('/usuarios', {
            id: user.uid,
            email: user.email,
            nombre: displayName || user.displayName || 'Usuario Nuevo',
            rol: 'admin',
        });
    } catch (error) {
        console.error('Error al sincronizar con el backend', error.response?.data || error.message);
    }
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
    } catch (error) {
        console.warn('No se pudo validar el rol del usuario en el backend.', error.message);
    }
    return true;
}

async function submitRegister({ email, password, confirmPassword, nombre, nameError, passwordStrength, signup, syncUserWithBackend }) {
    if (nameError) throw new Error(nameError);
    if (!passwordStrength.strong) throw new Error('La contraseña debe ser alta antes de crear la cuenta.');
    if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');
    const credential = await signup(email.trim(), password);
    await syncUserWithBackend(credential.user, normalizeName(nombre));
}

async function submitLogin({ email, password, login, checkRoleWeb, setError }) {
    const credential = await login(email.trim(), password);
    const allowed = await checkRoleWeb(credential.user, setError);
    if (!allowed) throw new Error('Usuario no autorizado');
}

function ThemeToggleButton({ isLight, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-[1.02] ${isLight ? 'border-slate-200 bg-white/85 text-slate-800' : 'border-slate-700 bg-slate-900/80 text-slate-100'}`}
            aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
            {isLight ? <MoonStar size={18} /> : <SunMedium size={18} />}
            <span>{isLight ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
    );
}

function Badge({ isLight, icon: Icon, title, description }) {
    return (
        <div className="login-signal rounded-2xl px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon size={16} className={isLight ? 'login-success' : 'text-emerald-300'} />
                <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>{title}</span>
            </div>
            <p className="login-muted mt-2 text-sm leading-6">{description}</p>
        </div>
    );
}

function TextField({ id, label, icon: Icon, value, onChange, placeholder, type = 'text', inputMode, autoComplete, required = true, error, isLight, trailing }) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{label}</label>
            <div className="relative">
                <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} size={20} />
                <input
                    id={id}
                    type={type}
                    inputMode={inputMode}
                    autoComplete={autoComplete}
                    required={required}
                    value={value}
                    onChange={onChange}
                    className="login-textfield w-full rounded-2xl border py-3.5 pl-11 pr-12 text-base outline-none transition-all"
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                />
                {trailing ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div> : null}
            </div>
            {error ? <p className="login-error rounded-xl px-3 py-2 text-xs leading-5">{error}</p> : null}
        </div>
    );
}

function PasswordMeter({ strength }) {
    let labelClass = 'login-muted';
    if (strength.strong) {
        labelClass = 'login-success';
    } else if (strength.label === 'Media') {
        labelClass = 'login-warning';
    }

    return (
        <div className="login-signal space-y-2 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                <span className="login-muted">Contraseña {strength.label}</span>
                <span className={strength.strong ? 'login-success' : 'login-warning'}>{strength.strong ? 'Segura' : 'Mejorable'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.tone}`} style={{ width: `${strength.bar}%` }} />
            </div>
            <p className={`text-xs leading-5 ${labelClass}`}>{strength.hint}</p>
        </div>
    );
}

function PasswordToggle({ visible, onToggle, isLight }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`rounded-full p-2 transition-colors ${isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );
}

function GoogleButton({ isLight, loading, onClick }) {
    const buttonClass = isLight
        ? 'border-slate-200 bg-white/95 text-slate-700 hover:border-sky-300 hover:bg-sky-50'
        : 'border-slate-700 bg-slate-950/70 text-slate-100 hover:border-sky-500/40 hover:bg-slate-900';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${buttonClass}`}
        >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Continuar con Google
        </button>
    );
}

function useLoginController() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { login, signup, loginWithGoogle } = useAuth();
    const { isLight, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const nameError = isRegistering ? validateFullName(nombre) : '';
    const emailError = validateEmail(email);
    const visibleNameError = getVisibleError(nombre, nameError);
    const visibleEmailError = getVisibleError(email, emailError);
    const passwordStrength = getPasswordStrength(password);
    const passwordMismatch = isRegistering && confirmPassword && password !== confirmPassword;
    const visiblePasswordError = isRegistering && password.trim() && !passwordStrength.strong ? 'La contraseña aún no es segura.' : '';
    const visibleConfirmError = isRegistering && confirmPassword.trim() && passwordMismatch ? 'Las contraseñas no coinciden.' : '';
    const canSubmit = isRegistering
        ? !loading && !nameError && !emailError && passwordStrength.strong && !passwordMismatch && confirmPassword.length > 0
        : !loading && !emailError && password.length > 0;

    const panelClasses = isLight
        ? 'bg-white/94 border-slate-200/90 shadow-[0_24px_80px_rgba(15,23,42,0.10)]'
        : 'bg-slate-900/72 border-slate-700/70 shadow-[0_24px_80px_rgba(2,6,23,0.46)]';
    const buttonClasses = isLight
        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10'
        : 'bg-white text-slate-950 hover:bg-slate-100 shadow-lg shadow-black/25';

    let submitLabel = 'Ingresar al panel';
    if (loading) submitLabel = 'Procesando...';
    else if (isRegistering) submitLabel = 'Crear cuenta segura';

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            if (isRegistering) {
                await submitRegister({ email, password, confirmPassword, nombre, nameError, passwordStrength, signup, syncUserWithBackend });
            } else {
                await submitLogin({ email, password, login, checkRoleWeb, setError });
            }
            navigate('/');
        } catch (authError) {
            console.error('Error en el flujo de autenticación', authError);
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
            await syncUserWithBackend(credential.user, credential.user.displayName);
            const allowed = await checkRoleWeb(credential.user, setError);
            if (!allowed) return;
            navigate('/');
        } catch (googleError) {
            console.error('Error al iniciar sesión con Google', googleError);
            setError('Error al iniciar sesión con Google.');
        } finally {
            setLoading(false);
        }
    }

    return {
        isRegistering,
        setIsRegistering,
        setError,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        nombre,
        setNombre,
        error,
        loading,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        nameError,
        visibleNameError,
        emailError,
        visibleEmailError,
        passwordStrength,
        passwordMismatch,
        visiblePasswordError,
        visibleConfirmError,
        canSubmit,
        panelClasses,
        buttonClasses,
        submitLabel,
        isLight,
        toggleTheme,
        handleSubmit,
        handleGoogleLogin,
    };
}

function LoginLeftPanel({ isLight }) {
    return (
        <section className="login-panel login-hero rounded-[2rem] p-8 lg:p-10">
            <div className="relative z-10 max-w-xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                    <ShieldCheck size={16} />
                    Centro de acceso TechStore 360
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100/80">Panel privado</p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                        Entrada segura, visual clara y ritmo elegante.
                    </h1>
                    <p className="mt-5 max-w-lg text-base leading-7 text-slate-200/90">
                        Una puerta de acceso pensada para administrar la tienda con calma, distinguir rápido lo importante y dejar una impresión más moderna desde el primer instante.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/85">
                        <ShieldCheck size={16} />
                        Acceso sobrio, ordenado y listo para trabajar.
                    </div>
                </div>
            </div>
        </section>
    );
}

function LoginCardHeader({ isRegistering, isLight, error }) {
    return (
        <div className="mb-8 text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/15 text-sky-200'}`}>
                {isRegistering ? <ShieldCheck size={28} /> : <Lock size={28} />}
            </div>
            <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>
            <p className={`mt-2 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isRegistering ? 'Completa los campos para crear un usuario confiable.' : 'Ingresa con tu correo y contraseña para continuar.'}
            </p>
            {error && (
                <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-left ${isLight ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
                    <CircleAlert size={20} className="mt-0.5 shrink-0" />
                    <span className="text-sm leading-6">{error}</span>
                </div>
            )}
        </div>
    );
}

function LoginFields({
    isRegistering,
    nombre,
    setNombre,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    nameError,
    visibleNameError,
    emailError,
    visibleEmailError,
    passwordStrength,
    passwordMismatch,
    visiblePasswordError,
    visibleConfirmError,
    isLight,
}) {
    return (
        <div className="space-y-5">
            {isRegistering && <TextField id="nombre-completo" label="Nombre completo" icon={User} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" error={visibleNameError} isLight={isLight} />}

            <TextField id="correo-electronico" label="Correo electrónico" icon={Mail} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@techstore.com" error={visibleEmailError} isLight={isLight} />

            <TextField
                id="contrasena"
                label="Contraseña"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                error={visiblePasswordError}
                isLight={isLight}
                trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((current) => !current)} isLight={isLight} />}
            />

            {isRegistering && password.trim() ? <PasswordMeter strength={passwordStrength} /> : null}

            {isRegistering && (
                <TextField
                    id="confirmar-contrasena"
                    label="Confirmar contraseña"
                    icon={Lock}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    error={visibleConfirmError}
                    isLight={isLight}
                    trailing={<PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((current) => !current)} isLight={isLight} />}
                />
            )}
        </div>
    );
}

function LoginActions({ canSubmit, loading, buttonClasses, submitLabel, isRegistering, isLight, handleSubmit, handleGoogleLogin, handleModeChange }) {
    return (
        <div className="mt-5 space-y-5">
            <button type="button" onClick={handleSubmit} disabled={!canSubmit} className={`group flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${buttonClasses}`}>
                {submitLabel}
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>

            <div className="flex items-center gap-4">
                <div className="login-divider h-px flex-1" />
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">o continuar con</span>
                <div className="login-divider h-px flex-1" />
            </div>

            <GoogleButton isLight={isLight} loading={loading} onClick={handleGoogleLogin} />

            <div className="login-signal rounded-2xl px-4 py-4 text-center text-sm">
                {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                <button
                    type="button"
                    onClick={handleModeChange}
                    className={`ml-2 font-semibold transition-colors ${isLight ? 'login-accent hover:opacity-80' : 'text-cyan-300 hover:text-cyan-200'}`}
                >
                    {isRegistering ? 'Inicia sesión' : 'Regístrate'}
                </button>
            </div>
        </div>
    );
}

function LoginCard(props) {
    const {
        isRegistering,
        setIsRegistering,
        setError,
        nombre,
        setNombre,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        error,
        loading,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        nameError,
        visibleNameError,
        emailError,
        visibleEmailError,
        passwordStrength,
        passwordMismatch,
        visiblePasswordError,
        visibleConfirmError,
        canSubmit,
        panelClasses,
        buttonClasses,
        submitLabel,
        isLight,
        handleSubmit,
        handleGoogleLogin,
    } = props;

    function handleModeChange() {
        setError('');
        setIsRegistering(!isRegistering);
    }

    return (
        <section className={`rounded-[2rem] border p-6 sm:p-8 ${panelClasses} backdrop-blur-xl`}>
            <LoginCardHeader isRegistering={isRegistering} isLight={isLight} error={error} />
            <LoginFields
                isRegistering={isRegistering}
                nombre={nombre}
                setNombre={setNombre}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                nameError={nameError}
                visibleNameError={visibleNameError}
                emailError={emailError}
                visibleEmailError={visibleEmailError}
                passwordStrength={passwordStrength}
                passwordMismatch={passwordMismatch}
                visiblePasswordError={visiblePasswordError}
                visibleConfirmError={visibleConfirmError}
                isLight={isLight}
            />
            <LoginActions
                canSubmit={canSubmit}
                loading={loading}
                buttonClasses={buttonClasses}
                submitLabel={submitLabel}
                isRegistering={isRegistering}
                isLight={isLight}
                handleSubmit={handleSubmit}
                handleGoogleLogin={handleGoogleLogin}
                handleModeChange={handleModeChange}
            />
        </section>
    );
}

function LoginView() {
    const props = useLoginController();

    return (
        <div className="theme-shell relative min-h-screen overflow-hidden px-4 py-8 transition-colors duration-300">
            <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full blur-3xl" style={{ background: 'var(--login-orb-a)' }} />
                <div className="absolute top-40 right-[-4rem] h-80 w-80 rounded-full blur-3xl" style={{ background: 'var(--login-orb-b)' }} />
                <div className="absolute bottom-[-5rem] left-[-3rem] h-80 w-80 rounded-full blur-3xl" style={{ background: 'var(--login-orb-c)' }} />
            </div>

            <ThemeToggleButton isLight={props.isLight} onToggle={props.toggleTheme} />

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
                <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <LoginLeftPanel isLight={props.isLight} />
                    <LoginCard {...props} />
                </div>
            </div>
        </div>
    );
}

export default function Login() {
    return <LoginView />;
}