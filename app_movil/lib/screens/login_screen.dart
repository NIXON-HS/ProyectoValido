import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'dart:math' as math;

final RegExp _emailRegex    = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final RegExp _fullNameRegex = RegExp(
  r'^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)+$',
);

// ── Password strength helper ──────────────────────────────────
class _PwdStrength {
  final String label;
  final Color  color;
  final double ratio;
  final bool   strong;
  const _PwdStrength({required this.label, required this.color, required this.ratio, required this.strong});
}

_PwdStrength _analyzePassword(String v) {
  if (v.isEmpty) return const _PwdStrength(label: '', color: Colors.transparent, ratio: 0, strong: false);
  final sets = [RegExp(r'[a-z]'), RegExp(r'[A-Z]'), RegExp(r'\d'), RegExp(r'[^A-Za-z0-9]')]
      .where((r) => r.hasMatch(v)).length;
  if (v.length >= 10 && sets == 4) return _PwdStrength(label: '¡Segura!', color: AppColors.emerald500, ratio: 1.0, strong: true);
  if (v.length >= 8  && sets >= 3) return _PwdStrength(label: 'Media',   color: AppColors.amber500,   ratio: 0.65, strong: false);
  return                            _PwdStrength(label: 'Débil',    color: AppColors.red500,     ratio: 0.30, strong: false);
}

// ── Glow orb ─────────────────────────────────────────────────
class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.color, required this.size});
  final Color  color;
  final double size;
  @override
  Widget build(BuildContext context) => Container(
    width: size, height: size,
    decoration: BoxDecoration(shape: BoxShape.circle, color: color,
      boxShadow: [BoxShadow(color: color, blurRadius: size * 0.8, spreadRadius: size * 0.2)]),
  );
}

// ── Gradient button ──────────────────────────────────────────
class _GradientButton extends StatelessWidget {
  const _GradientButton({required this.label, required this.onPressed, this.loading = false});
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: onPressed != null ? AppGradients.brand : null,
          color:    onPressed != null ? null : AppColors.slate200,
          borderRadius: AppRadius.lg,
          boxShadow: onPressed != null ? AppShadows.button() : null,
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: AppRadius.lg,
          child: InkWell(
            borderRadius: AppRadius.lg,
            onTap: onPressed,
            child: Center(
              child: loading
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : Text(label, style: GoogleFonts.inter(
                      color: onPressed != null ? Colors.white : AppColors.slate400,
                      fontWeight: FontWeight.w700, fontSize: 15)),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Theme toggle button ───────────────────────────────────────
class _ThemeToggle extends StatelessWidget {
  const _ThemeToggle({required this.isDark, required this.onTap});
  final bool isDark;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isDark
              ? AppColors.slate800.withValues(alpha: 0.9)
              : Colors.white.withValues(alpha: 0.9),
          borderRadius: AppRadius.full,
          border: Border.all(color: isDark ? AppColors.slate700 : AppColors.slate200),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              size: 18, color: isDark ? Colors.white : AppColors.slate700),
          const SizedBox(width: 8),
          Text(isDark ? 'Claro' : 'Oscuro',
              style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : AppColors.slate700)),
        ]),
      ),
    );
  }
}

// ── Main LoginScreen ──────────────────────────────────────────
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey      = GlobalKey<FormState>();
  final _emailCtrl    = TextEditingController();
  final _passCtrl     = TextEditingController();
  final _confirmCtrl  = TextEditingController();
  final _nombreCtrl   = TextEditingController();

  late final AnimationController _anim;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  bool _isRegistering   = false;
  bool _isLoading       = false;
  bool _obscurePass     = true;
  bool _obscureConfirm  = true;

  bool get _isDark => ThemeController.isDark.value;

  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_rebuild);
    _anim  = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))..forward();
    _fade  = CurvedAnimation(parent: _anim, curve: Curves.easeOutQuart);
    _slide = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(CurvedAnimation(parent: _anim, curve: Curves.easeOutQuart));
  }

  void _rebuild() => setState(() {});

  @override
  void dispose() {
    ThemeController.isDark.removeListener(_rebuild);
    _anim.dispose();
    _emailCtrl.dispose(); _passCtrl.dispose();
    _confirmCtrl.dispose(); _nombreCtrl.dispose();
    super.dispose();
  }

  // ── Validators ──
  String? _validateName(String? v) {
    if (!_isRegistering) return null;
    final n = v?.trim() ?? '';
    if (n.isEmpty)                    return 'Ingresa tu nombre completo.';
    if (!_fullNameRegex.hasMatch(n))  return 'Primera letra mayúscula, sin números, mínimo 2 palabras.';
    return null;
  }

  String? _validateEmail(String? v) {
    final n = v?.trim() ?? '';
    if (n.isEmpty)                   return 'Ingresa tu correo.';
    if (!_emailRegex.hasMatch(n))    return 'Correo inválido.';
    return null;
  }

  String? _validatePassword(String? v) {
    final n = v?.trim() ?? '';
    if (n.isEmpty) return 'Ingresa tu contraseña.';
    if (_isRegistering && !_analyzePassword(n).strong) {
      return 'Usa 10+ caracteres, mayúscula, número y símbolo.';
    }
    if (!_isRegistering && n.length < 6) {
      return 'Mínimo 6 caracteres.';
    }
    return null;
  }

  String? _validateConfirm(String? v) {
    if (!_isRegistering) return null;
    if ((v?.trim() ?? '').isEmpty) return 'Confirma tu contraseña.';
    if (v?.trim() != _passCtrl.text.trim()) return 'Las contraseñas no coinciden.';
    return null;
  }

  // ── Auth helpers ──
  String _firebaseMsg(FirebaseAuthException e) => switch (e.code) {
    'email-already-in-use' => 'Ese correo ya está registrado.',
    'invalid-email'        => 'Correo no válido.',
    'weak-password'        => 'Contraseña muy débil.',
    'user-not-found'       => 'No existe cuenta con ese correo.',
    'wrong-password'       => 'Contraseña incorrecta.',
    'network-request-failed' => 'Sin conexión. Verifica tu internet.',
    _ => e.message ?? 'No se pudo completar la acción.',
  };

  Future<bool> _checkRoleMobile(User user) async {
    final data = await ApiService.getUser(user.uid);
    if (data != null && data['rol'] == 'admin') {
      await FirebaseAuth.instance.signOut();
      if (mounted) {
        _showSnack('Los administradores deben usar el Panel Web.', isError: true);
      }
      return false;
    }
    return true;
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        Icon(isError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
            color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(msg)),
      ]),
      backgroundColor: isError ? AppColors.red500 : AppColors.emerald600,
    ));
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isLoading = true);
    try {
      if (_isRegistering) {
        final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
            email: _emailCtrl.text.trim(), password: _passCtrl.text.trim());
        await ApiService.syncUser(cred.user!, _nombreCtrl.text.trim());
      } else {
        final cred = await FirebaseAuth.instance.signInWithEmailAndPassword(
            email: _emailCtrl.text.trim(), password: _passCtrl.text.trim());
        final allowed = await _checkRoleMobile(cred.user!);
        if (!allowed || !mounted) return;
      }
      if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    } on FirebaseAuthException catch (e) {
      if (mounted) _showSnack(_firebaseMsg(e), isError: true);
    } catch (e) {
      if (mounted) _showSnack('Error inesperado: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _googleSignIn() async {
    setState(() => _isLoading = true);
    try {
      UserCredential cred;
      if (kIsWeb) {
        cred = await FirebaseAuth.instance.signInWithPopup(GoogleAuthProvider());
      } else {
        final gsi  = GoogleSignIn(serverClientId: '682947339145-7ng0efmopfsuog3sfl1vovvrun4j1ogm.apps.googleusercontent.com');
        final user = await gsi.signIn();
        if (user == null) return;
        final auth = await user.authentication;
        cred = await FirebaseAuth.instance.signInWithCredential(
            GoogleAuthProvider.credential(accessToken: auth.accessToken, idToken: auth.idToken));
      }
      await ApiService.syncUser(cred.user!,
          cred.user!.displayName?.trim().isNotEmpty == true ? cred.user!.displayName!.trim() : 'Cliente');
      final allowed = await _checkRoleMobile(cred.user!);
      if (!allowed || !mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    } catch (e) {
      if (mounted) _showSnack('Error con Google: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Build ──
  @override
  Widget build(BuildContext context) {
    final pwdStrength = _analyzePassword(_passCtrl.text);

    final bgGradient = _isDark
        ? const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [Color(0xFF020617), Color(0xFF0F172A), Color(0xFF111827)])
        : const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [Color(0xFFDBEEFF), Color(0xFFF3F8FF), Color(0xFFFFFFFF)]);

    return Scaffold(
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 280),
        decoration: BoxDecoration(gradient: bgGradient),
        child: Stack(children: [
          // Orbs
          Positioned(top: -50, right: -30, child: _GlowOrb(
              color: AppColors.blue500.withValues(alpha: _isDark ? 0.18 : 0.12), size: 200)),
          Positioned(bottom: -60, left: -40, child: _GlowOrb(
              color: AppColors.indigo500.withValues(alpha: _isDark ? 0.14 : 0.10), size: 240)),

          SafeArea(child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Center(child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                // ── Top row ──
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  // Logo
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: _isDark ? AppColors.slate800.withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.9),
                      borderRadius: AppRadius.xl,
                      border: Border.all(color: _isDark ? AppColors.slate700 : AppColors.slate200),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                        height: 36, width: 36,
                        decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.md),
                        child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('TechStore 360', style: GoogleFonts.inter(
                            fontWeight: FontWeight.w800,
                            color: _isDark ? Colors.white : AppColors.slate900)),
                        Text('Compra simple y segura', style: GoogleFonts.inter(
                            fontSize: 12, color: _isDark ? AppColors.slate400 : AppColors.slate500)),
                      ]),
                    ]),
                  ),
                  _ThemeToggle(isDark: _isDark, onTap: () => ThemeController.toggle()),
                ]),

                const SizedBox(height: 28),

                // ── Form card ──
                FadeTransition(opacity: _fade, child: SlideTransition(position: _slide,
                  child: Container(
                    decoration: BoxDecoration(
                      color: _isDark
                          ? AppColors.slate900.withValues(alpha: 0.9)
                          : Colors.white.withValues(alpha: 0.95),
                      borderRadius: AppRadius.xxl,
                      border: Border.all(color: _isDark ? AppColors.slate700 : AppColors.slate200),
                      boxShadow: [BoxShadow(
                        color: _isDark
                            ? Colors.black.withValues(alpha: 0.40)
                            : AppColors.blue500.withValues(alpha: 0.10),
                        blurRadius: 40, offset: const Offset(0, 20),
                      )],
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      // Accent bar
                      Container(height: 4,
                          decoration: const BoxDecoration(
                            gradient: AppGradients.brand,
                            borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(28), topRight: Radius.circular(28)),
                          )),

                      Padding(padding: const EdgeInsets.fromLTRB(22, 22, 22, 24),
                        child: Form(key: _formKey,
                          autovalidateMode: AutovalidateMode.onUserInteraction,
                          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                            // ── Header ──
                            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  gradient: _isDark ? AppGradients.brand
                                      : const LinearGradient(
                                          colors: [Color(0xFFDBEAFE), Color(0xFFE0F2FE)],
                                          begin: Alignment.topLeft, end: Alignment.bottomRight),
                                  borderRadius: AppRadius.lg,
                                ),
                                child: Icon(
                                  _isRegistering ? Icons.person_add_alt_1_rounded : Icons.lock_outline_rounded,
                                  size: 26,
                                  color: _isDark ? Colors.white : AppColors.blue600,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(
                                  _isRegistering ? 'Crear cuenta' : 'Bienvenido',
                                  style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w900,
                                      color: _isDark ? Colors.white : AppColors.slate900),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _isRegistering
                                      ? 'Regístrate para comprar y ver tu historial.'
                                      : 'Accede para continuar con tus compras.',
                                  style: GoogleFonts.inter(fontSize: 13, height: 1.45,
                                      color: _isDark ? AppColors.slate400 : AppColors.slate500),
                                ),
                              ])),
                            ]),

                            const SizedBox(height: 24),

                            // ── Fields ──
                            AnimatedSwitcher(duration: const Duration(milliseconds: 300),
                              child: Column(key: ValueKey(_isRegistering), children: [
                                if (_isRegistering) ...[
                                  _Field(ctrl: _nombreCtrl, label: 'Nombre completo',
                                      icon: Icons.person_outline_rounded,
                                      validator: _validateName,
                                      inputAction: TextInputAction.next,
                                      hints: const [AutofillHints.name]),
                                  const SizedBox(height: 14),
                                ],
                                _Field(ctrl: _emailCtrl, label: 'Correo electrónico',
                                    icon: Icons.mail_outline_rounded,
                                    validator: _validateEmail,
                                    keyboard: TextInputType.emailAddress,
                                    inputAction: TextInputAction.next,
                                    hints: const [AutofillHints.email]),
                                const SizedBox(height: 14),
                                _Field(ctrl: _passCtrl, label: 'Contraseña',
                                    icon: Icons.lock_outline_rounded,
                                    validator: _validatePassword,
                                    obscure: _obscurePass,
                                    inputAction: _isRegistering ? TextInputAction.next : TextInputAction.done,
                                    hints: _isRegistering
                                        ? const [AutofillHints.newPassword]
                                        : const [AutofillHints.password],
                                    onSubmitted: _isRegistering ? null : (_) => _submit(),
                                    suffixIcon: IconButton(
                                      icon: Icon(_obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                                      onPressed: () => setState(() => _obscurePass = !_obscurePass),
                                    ),
                                    onChanged: (_) => setState(() {})),
                                if (_isRegistering && _passCtrl.text.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  _PasswordStrengthBar(strength: pwdStrength, isDark: _isDark),
                                ],
                                if (_isRegistering) ...[
                                  const SizedBox(height: 14),
                                  _Field(ctrl: _confirmCtrl, label: 'Confirmar contraseña',
                                      icon: Icons.verified_user_outlined,
                                      validator: _validateConfirm,
                                      obscure: _obscureConfirm,
                                      inputAction: TextInputAction.done,
                                      hints: const [AutofillHints.newPassword],
                                      onSubmitted: (_) => _submit(),
                                      suffixIcon: IconButton(
                                        icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                                        onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                                      )),
                                ],
                              ]),
                            ),

                            const SizedBox(height: 22),

                            // ── Primary button ──
                            _GradientButton(
                              label: _isRegistering ? 'Crear cuenta' : 'Entrar',
                              onPressed: _isLoading ? null : _submit,
                              loading: _isLoading,
                            ),

                            const SizedBox(height: 16),

                            // ── Divider ──
                            Row(children: [
                              Expanded(child: Divider(color: _isDark ? AppColors.slate700 : AppColors.slate200)),
                              Padding(padding: const EdgeInsets.symmetric(horizontal: 14),
                                  child: Text('o', style: GoogleFonts.inter(
                                      fontSize: 12, fontWeight: FontWeight.w600,
                                      color: _isDark ? AppColors.slate500 : AppColors.slate400))),
                              Expanded(child: Divider(color: _isDark ? AppColors.slate700 : AppColors.slate200)),
                            ]),

                            const SizedBox(height: 16),

                            // ── Google ──
                            OutlinedButton.icon(
                              onPressed: _isLoading ? null : _googleSignIn,
                              icon: _GoogleLogo(),
                              label: Text('Continuar con Google',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                            ),

                            const SizedBox(height: 16),

                            // ── Toggle auth mode ──
                            Center(child: TextButton(
                              onPressed: _isLoading ? null : () => setState(() {
                                _isRegistering = !_isRegistering;
                                _passCtrl.clear(); _confirmCtrl.clear(); _nombreCtrl.clear();
                                _formKey.currentState?.reset();
                              }),
                              child: Text(
                                _isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                              ),
                            )),
                          ]),
                        ),
                      ),
                    ]),
                  ),
                )),
                const SizedBox(height: 24),
              ]),
            )),
          )),
        ]),
      ),
    );
  }
}

// ── Reusable text field ───────────────────────────────────────
class _Field extends StatelessWidget {
  const _Field({
    required this.ctrl, required this.label, required this.icon, required this.validator,
    this.keyboard = TextInputType.text, this.inputAction = TextInputAction.next,
    this.obscure = false, this.suffixIcon, this.hints, this.onSubmitted, this.onChanged,
  });
  final TextEditingController ctrl;
  final String label;
  final IconData icon;
  final String? Function(String?) validator;
  final TextInputType keyboard;
  final TextInputAction inputAction;
  final bool obscure;
  final Widget? suffixIcon;
  final Iterable<String>? hints;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: ctrl,
      validator: validator,
      keyboardType: keyboard,
      textInputAction: inputAction,
      obscureText: obscure,
      autocorrect: false,
      autofillHints: hints,
      onFieldSubmitted: onSubmitted,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        suffixIcon: suffixIcon,
      ),
    );
  }
}

// ── Password strength bar ─────────────────────────────────────
class _PasswordStrengthBar extends StatelessWidget {
  const _PasswordStrengthBar({required this.strength, required this.isDark});
  final _PwdStrength strength;
  final bool isDark;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.slate800.withValues(alpha: 0.6) : AppColors.slate50,
        borderRadius: AppRadius.md,
        border: Border.all(color: isDark ? AppColors.slate700 : AppColors.slate200),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: ClipRRect(
            borderRadius: AppRadius.full,
            child: LinearProgressIndicator(
              value: strength.ratio,
              backgroundColor: isDark ? AppColors.slate700 : AppColors.slate200,
              valueColor: AlwaysStoppedAnimation<Color>(strength.color),
              minHeight: 6,
            ),
          )),
          if (strength.label.isNotEmpty) ...[
            const SizedBox(width: 10),
            Text(strength.label,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: strength.color)),
          ],
        ]),
        if (!strength.strong && strength.ratio > 0) ...[
          const SizedBox(height: 6),
          Text('Usa 10+ caracteres con mayúscula, número y símbolo.',
              style: TextStyle(fontSize: 11, color: isDark ? AppColors.slate400 : AppColors.slate500)),
        ],
      ]),
    );
  }
}

// ── Google logo ───────────────────────────────────────────────
class _GoogleLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CustomPaint(size: const Size(20, 20), painter: _GooglePainter());
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2.0;
    final cy = size.height / 2.0;
    final rOut = size.width / 2.0;
    final thickness = size.width * 0.28;
    final rIn = rOut - thickness;

    // Helper to convert degrees to radians
    double rad(double deg) => deg * 3.141592653589793 / 180.0;

    Path getSectorPath(double startDeg, double sweepDeg) {
      final path = Path();
      final startRad = rad(startDeg);
      final sweepRad = rad(sweepDeg);
      final rectOut = Rect.fromCircle(center: Offset(cx, cy), radius: rOut);
      final rectIn = Rect.fromCircle(center: Offset(cx, cy), radius: rIn);

      // Start at outer arc start
      path.moveTo(cx + rOut * math.cos(startRad), cy + rOut * math.sin(startRad));
      // Outer arc
      path.arcTo(rectOut, startRad, sweepRad, false);
      // Line to inner arc end
      path.lineTo(cx + rIn * math.cos(startRad + sweepRad), cy + rIn * math.sin(startRad + sweepRad));
      // Inner arc (counter-clockwise)
      path.arcTo(rectIn, startRad + sweepRad, -sweepRad, false);
      path.close();
      return path;
    }

    // Paints with Google's official brand colors
    final paintRed = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.fill;

    final paintYellow = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.fill;

    final paintGreen = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.fill;

    final paintBlue = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    // 1. Red sector: top (220 to 323 degrees, sweep 103)
    canvas.drawPath(getSectorPath(220.0, 103.0), paintRed);

    // 2. Yellow sector: left (140 to 220 degrees, sweep 80)
    canvas.drawPath(getSectorPath(140.0, 80.0), paintYellow);

    // 3. Green sector: bottom-left to bottom-right (45 to 140 degrees, sweep 95)
    canvas.drawPath(getSectorPath(45.0, 95.0), paintGreen);

    // 4. Blue sector: bottom-right arc (0 to 45 degrees, sweep 45)
    canvas.drawPath(getSectorPath(0.0, 45.0), paintBlue);

    // 5. Blue horizontal bar (rectangle from center to outer right edge)
    canvas.save();
    final clipPath = Path()..addOval(Rect.fromCircle(center: Offset(cx, cy), radius: rOut));
    canvas.clipPath(clipPath);
    final barRect = Rect.fromLTWH(cx, cy - thickness / 2.0, rOut, thickness);
    canvas.drawRect(barRect, paintBlue);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
