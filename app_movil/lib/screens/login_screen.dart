import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../services/api_service.dart';
import 'home_screen.dart';

const Color _brandBlue = Color(0xFF2563EB);
const Color _brandSky = Color(0xFF38BDF8);

final RegExp _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final RegExp _fullNameRegex = RegExp(
  r'^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*(?: [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*)+$',
);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _nombreCtrl = TextEditingController();

  late final AnimationController _introController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  bool _isRegistering = false;
  bool _isLoading = false;
  bool _isDarkMode = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void initState() {
    super.initState();
    _introController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    )..forward();
    _fadeAnimation = CurvedAnimation(
      parent: _introController,
      curve: Curves.easeOut,
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
          CurvedAnimation(parent: _introController, curve: Curves.easeOutCubic),
        );
  }

  @override
  void dispose() {
    _introController.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    _nombreCtrl.dispose();
    super.dispose();
  }

  ColorScheme _buildColorScheme() {
    return ColorScheme.fromSeed(
      seedColor: _brandBlue,
      brightness: _isDarkMode ? Brightness.dark : Brightness.light,
    );
  }

  ThemeData _buildTheme() {
    final scheme = _buildColorScheme();
    final borderColor = _isDarkMode
        ? const Color(0xFF334155)
        : const Color(0xFFBFDBFE);
    final fillColor = _isDarkMode
        ? const Color(0xFF0F172A)
        : const Color(0xFFFFFFFF);

    return ThemeData(
      useMaterial3: true,
      brightness: scheme.brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: Colors.transparent,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: scheme.onSurface,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fillColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 18,
        ),
        labelStyle: TextStyle(color: scheme.onSurfaceVariant),
        hintStyle: TextStyle(color: scheme.onSurfaceVariant),
        prefixIconColor: scheme.primary,
        suffixIconColor: scheme.primary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: scheme.primary, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          backgroundColor: scheme.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          foregroundColor: scheme.primary,
          side: BorderSide(color: borderColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: scheme.primary),
      ),
    );
  }

  String? _validateName(String? value) {
    if (!_isRegistering) return null;
    final normalized = value?.trim() ?? '';
    if (normalized.isEmpty) return 'Ingresa tu nombre completo.';
    if (!_fullNameRegex.hasMatch(normalized)) {
      return 'Usa mayúsculas al inicio de cada palabra, un solo espacio y sin números.';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    final normalized = value?.trim() ?? '';
    if (normalized.isEmpty) return 'Ingresa tu correo electrónico.';
    if (!_emailRegex.hasMatch(normalized)) {
      return 'Ingresa un correo válido.';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    final normalized = value?.trim() ?? '';
    if (normalized.isEmpty) return 'Ingresa tu contraseña.';
    if (normalized.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (!_isRegistering) return null;
    final normalized = value?.trim() ?? '';
    if (normalized.isEmpty) return 'Confirma tu contraseña.';
    if (normalized != _passCtrl.text.trim()) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }

  String _friendlyAuthMessage(FirebaseAuthException error) {
    switch (error.code) {
      case 'email-already-in-use':
        return 'Ese correo ya está registrado.';
      case 'invalid-email':
        return 'El correo electrónico no es válido.';
      case 'weak-password':
        return 'La contraseña es demasiado débil.';
      case 'user-not-found':
        return 'No existe una cuenta con ese correo.';
      case 'wrong-password':
        return 'La contraseña es incorrecta.';
      case 'network-request-failed':
        return 'No se pudo conectar. Verifica tu internet.';
      default:
        return error.message ?? 'No se pudo completar la acción.';
    }
  }

  Future<bool> _checkRoleMobile(User user) async {
    final data = await ApiService.getUser(user.uid);
    if (data != null && data['rol'] == 'admin') {
      await FirebaseAuth.instance.signOut();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Los administradores deben usar el Panel Web.'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    }
    return true;
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _isLoading = true);
    try {
      if (_isRegistering) {
        final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text.trim(),
        );
        await ApiService.syncUser(cred.user!, _nombreCtrl.text.trim());
      } else {
        final cred = await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text.trim(),
        );
        final allowed = await _checkRoleMobile(cred.user!);
        if (!allowed || !mounted) return;
      }

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => HomeScreen()),
        );
      }
    } on FirebaseAuthException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_friendlyAuthMessage(error))));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $error')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    try {
      UserCredential userCredential;

      if (kIsWeb) {
        final provider = GoogleAuthProvider();
        userCredential = await FirebaseAuth.instance.signInWithPopup(provider);
      } else {
        final GoogleSignIn googleSignIn = GoogleSignIn(
          serverClientId:
              '682947339145-7ng0efmopfsuog3sfl1vovvrun4j1ogm.apps.googleusercontent.com',
        );
        final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
        if (googleUser == null) return;

        final GoogleSignInAuthentication googleAuth =
            await googleUser.authentication;
        final AuthCredential credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        userCredential = await FirebaseAuth.instance.signInWithCredential(
          credential,
        );
      }

      await ApiService.syncUser(
        userCredential.user!,
        userCredential.user!.displayName?.trim().isNotEmpty == true
            ? userCredential.user!.displayName!.trim()
            : 'Cliente',
      );

      final allowed = await _checkRoleMobile(userCredential.user!);
      if (!allowed || !mounted) return;

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => HomeScreen()),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error con Google: $error')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _toggleMode() {
    setState(() {
      _isDarkMode = !_isDarkMode;
    });
  }

  void _toggleAuthMode() {
    setState(() {
      _isRegistering = !_isRegistering;
      _passCtrl.clear();
      _confirmCtrl.clear();
      _nombreCtrl.clear();
      _formKey.currentState?.reset();
    });
  }

  InputDecoration _fieldDecoration({
    required String label,
    required IconData icon,
    Widget? suffixIcon,
    String? helperText,
  }) {
    return InputDecoration(
      labelText: label,
      helperText: helperText,
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required String? Function(String?) validator,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction? textInputAction,
    void Function(String)? onFieldSubmitted,
    bool obscureText = false,
    Widget? suffixIcon,
    String? helperText,
    bool autocorrect = true,
    Iterable<String>? autofillHints,
  }) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      onFieldSubmitted: onFieldSubmitted,
      obscureText: obscureText,
      autocorrect: autocorrect,
      autofillHints: autofillHints,
      decoration: _fieldDecoration(
        label: label,
        icon: icon,
        suffixIcon: suffixIcon,
        helperText: helperText,
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      key: const ValueKey('login-form'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildField(
          controller: _emailCtrl,
          label: 'Correo electrónico',
          icon: Icons.email_outlined,
          validator: _validateEmail,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.email],
        ),
        const SizedBox(height: 16),
        _buildField(
          controller: _passCtrl,
          label: 'Contraseña',
          icon: Icons.lock_outline_rounded,
          validator: _validatePassword,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) => _submit(),
          suffixIcon: IconButton(
            onPressed: () =>
                setState(() => _obscurePassword = !_obscurePassword),
            icon: Icon(
              _obscurePassword
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
            ),
          ),
          autofillHints: const [AutofillHints.password],
        ),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      key: const ValueKey('register-form'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildField(
          controller: _nombreCtrl,
          label: 'Nombre completo',
          icon: Icons.person_outline_rounded,
          validator: _validateName,
          textInputAction: TextInputAction.next,
          helperText: 'Ejemplo: Alex Maguert',
          autofillHints: const [AutofillHints.name],
        ),
        const SizedBox(height: 16),
        _buildField(
          controller: _emailCtrl,
          label: 'Correo electrónico',
          icon: Icons.email_outlined,
          validator: _validateEmail,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.email],
        ),
        const SizedBox(height: 16),
        _buildField(
          controller: _passCtrl,
          label: 'Contraseña',
          icon: Icons.lock_outline_rounded,
          validator: _validatePassword,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.next,
          suffixIcon: IconButton(
            onPressed: () =>
                setState(() => _obscurePassword = !_obscurePassword),
            icon: Icon(
              _obscurePassword
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
            ),
          ),
          autofillHints: const [AutofillHints.newPassword],
        ),
        const SizedBox(height: 16),
        _buildField(
          controller: _confirmCtrl,
          label: 'Confirmar contraseña',
          icon: Icons.verified_user_outlined,
          validator: _validateConfirmPassword,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) => _submit(),
          suffixIcon: IconButton(
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            icon: Icon(
              _obscureConfirm
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
            ),
          ),
          autofillHints: const [AutofillHints.newPassword],
        ),
      ],
    );
  }

  Widget _buildPrimaryButton(ColorScheme scheme) {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submit,
        child: _isLoading
            ? SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.4,
                  valueColor: AlwaysStoppedAnimation<Color>(scheme.onPrimary),
                ),
              )
            : Text(_isRegistering ? 'Crear cuenta' : 'Entrar'),
      ),
    );
  }

  Widget _buildGoogleButton() {
    return OutlinedButton.icon(
      onPressed: _isLoading ? null : _handleGoogleSignIn,
      icon: Container(
        height: 28,
        width: 28,
        decoration: BoxDecoration(
          color: _isDarkMode
              ? const Color(0xFF1E293B)
              : const Color(0xFFF8FAFC),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.g_mobiledata_rounded, size: 24),
      ),
      label: const Text('Continuar con Google'),
    );
  }

  Widget _buildModeToggle() {
    return TextButton(
      onPressed: _isLoading ? null : _toggleAuthMode,
      child: Text(
        _isRegistering
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate',
      ),
    );
  }

  Widget _buildThemeButton(ColorScheme scheme) {
    return Material(
      color: scheme.surface.withValues(alpha: _isDarkMode ? 0.88 : 0.96),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.9)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: _toggleMode,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _isDarkMode
                    ? Icons.light_mode_outlined
                    : Icons.dark_mode_outlined,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(_isDarkMode ? 'Claro' : 'Oscuro'),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = _buildColorScheme();
    final bgGradient = _isDarkMode
        ? const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF020617), Color(0xFF0F172A), Color(0xFF111827)],
          )
        : const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFDCEEFF), Color(0xFFF3F8FF), Color(0xFFFFFFFF)],
          );

    return AnimatedTheme(
      duration: const Duration(milliseconds: 250),
      data: _buildTheme(),
      child: Scaffold(
        body: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          decoration: BoxDecoration(gradient: bgGradient),
          child: Stack(
            children: [
              Positioned(
                top: -40,
                right: -20,
                child: _GlowOrb(
                  color: _isDarkMode
                      ? _brandSky.withValues(alpha: 0.18)
                      : _brandBlue.withValues(alpha: 0.14),
                  size: 190,
                ),
              ),
              Positioned(
                bottom: -50,
                left: -30,
                child: _GlowOrb(
                  color: _isDarkMode
                      ? _brandBlue.withValues(alpha: 0.14)
                      : _brandSky.withValues(alpha: 0.16),
                  size: 220,
                ),
              ),
              SafeArea(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 500),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: scheme.surface.withValues(
                                    alpha: _isDarkMode ? 0.9 : 0.96,
                                  ),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: scheme.outlineVariant.withValues(
                                      alpha: 0.9,
                                    ),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      height: 36,
                                      width: 36,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: _isDarkMode
                                              ? [
                                                  const Color(0xFF38BDF8),
                                                  const Color(0xFF2563EB),
                                                ]
                                              : [
                                                  const Color(0xFF60A5FA),
                                                  const Color(0xFF2563EB),
                                                ],
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(
                                        Icons.storefront_rounded,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'TechStore 360',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            color: scheme.onSurface,
                                          ),
                                        ),
                                        Text(
                                          'Compra simple y segura',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: scheme.onSurfaceVariant,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              _buildThemeButton(scheme),
                            ],
                          ),
                          const SizedBox(height: 24),
                          FadeTransition(
                            opacity: _fadeAnimation,
                            child: SlideTransition(
                              position: _slideAnimation,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: scheme.surface.withValues(
                                    alpha: _isDarkMode ? 0.9 : 0.94,
                                  ),
                                  borderRadius: BorderRadius.circular(30),
                                  border: Border.all(
                                    color: scheme.outlineVariant.withValues(
                                      alpha: 0.9,
                                    ),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _isDarkMode
                                          ? Colors.black.withValues(alpha: 0.35)
                                          : Colors.blue.withValues(alpha: 0.10),
                                      blurRadius: 40,
                                      offset: const Offset(0, 20),
                                    ),
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(22),
                                  child: Form(
                                    key: _formKey,
                                    autovalidateMode:
                                        AutovalidateMode.onUserInteraction,
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: _isDarkMode
                                                      ? [
                                                          const Color(
                                                            0xFF0EA5E9,
                                                          ),
                                                          const Color(
                                                            0xFF2563EB,
                                                          ),
                                                        ]
                                                      : [
                                                          const Color(
                                                            0xFFDBEAFE,
                                                          ),
                                                          const Color(
                                                            0xFFE0F2FE,
                                                          ),
                                                        ],
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(18),
                                              ),
                                              child: Icon(
                                                _isRegistering
                                                    ? Icons
                                                          .person_add_alt_rounded
                                                    : Icons.login_rounded,
                                                size: 26,
                                                color: _isDarkMode
                                                    ? Colors.white
                                                    : _brandBlue,
                                              ),
                                            ),
                                            const SizedBox(width: 14),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    _isRegistering
                                                        ? 'Crear cuenta'
                                                        : 'Iniciar sesión',
                                                    style: TextStyle(
                                                      fontSize: 28,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: scheme.onSurface,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  Text(
                                                    _isRegistering
                                                        ? 'Regístrate para comprar rápido y revisar tu historial.'
                                                        : 'Accede a tu cuenta para continuar con tus compras.',
                                                    style: TextStyle(
                                                      height: 1.45,
                                                      color: scheme
                                                          .onSurfaceVariant,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        AnimatedSwitcher(
                                          duration: const Duration(
                                            milliseconds: 260,
                                          ),
                                          transitionBuilder:
                                              (child, animation) {
                                                final offsetAnimation =
                                                    Tween<Offset>(
                                                      begin: const Offset(
                                                        0,
                                                        0.03,
                                                      ),
                                                      end: Offset.zero,
                                                    ).animate(animation);
                                                return FadeTransition(
                                                  opacity: animation,
                                                  child: SlideTransition(
                                                    position: offsetAnimation,
                                                    child: child,
                                                  ),
                                                );
                                              },
                                          child: _isRegistering
                                              ? _buildRegisterForm()
                                              : _buildLoginForm(),
                                        ),
                                        const SizedBox(height: 20),
                                        _buildPrimaryButton(scheme),
                                        const SizedBox(height: 14),
                                        _buildGoogleButton(),
                                        const SizedBox(height: 10),
                                        _buildModeToggle(),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Diseño adaptado para móvil, con identidad visual azul y experiencia rápida.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12.5,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [color, color.withValues(alpha: 0.0)]),
      ),
    );
  }
}
