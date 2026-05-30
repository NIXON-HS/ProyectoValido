import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Brand palette ────────────────────────────────────────────
class AppColors {
  AppColors._();

  static const blue50  = Color(0xFFEFF6FF);
  static const blue100 = Color(0xFFDBEAFE);
  static const blue200 = Color(0xFFBFDBFE);
  static const blue400 = Color(0xFF60A5FA);
  static const blue500 = Color(0xFF3B82F6);
  static const blue600 = Color(0xFF2563EB);
  static const blue700 = Color(0xFF1D4ED8);

  static const indigo400 = Color(0xFF818CF8);
  static const indigo500 = Color(0xFF6366F1);
  static const indigo600 = Color(0xFF4F46E5);

  static const violet500 = Color(0xFF8B5CF6);

  static const emerald400 = Color(0xFF34D399);
  static const emerald500 = Color(0xFF10B981);
  static const emerald600 = Color(0xFF059669);

  static const amber400  = Color(0xFFFBBF24);
  static const amber500  = Color(0xFFF59E0B);

  static const red400 = Color(0xFFF87171);
  static const red500 = Color(0xFFEF4444);

  // Slate scale
  static const slate50  = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);
  static const slate950 = Color(0xFF020617);

  // Light bg
  static const lightBgStart  = Color(0xFFDBEEFF);
  static const lightBgEnd    = Color(0xFFF8FBFF);

  // Dark bg
  static const darkBgStart   = Color(0xFF0F172A);
  static const darkBgEnd     = Color(0xFF020617);
}

// ── Gradients ────────────────────────────────────────────────
class AppGradients {
  AppGradients._();

  static const brand = LinearGradient(
    colors: [AppColors.blue500, AppColors.indigo600],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const brandSubtle = LinearGradient(
    colors: [AppColors.blue400, AppColors.indigo500],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const lightBg = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [AppColors.lightBgStart, AppColors.lightBgEnd],
  );

  static const darkBg = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [AppColors.darkBgStart, AppColors.darkBgEnd],
  );
}

// ── Shadows ──────────────────────────────────────────────────
class AppShadows {
  AppShadows._();

  static List<BoxShadow> card({bool isDark = false}) => [
    BoxShadow(
      color: isDark
          ? Colors.black.withValues(alpha: 0.30)
          : AppColors.blue500.withValues(alpha: 0.08),
      blurRadius: 24,
      offset: const Offset(0, 12),
    ),
  ];

  static List<BoxShadow> button({bool isDark = false}) => [
    BoxShadow(
      color: AppColors.blue500.withValues(alpha: isDark ? 0.30 : 0.22),
      blurRadius: 18,
      offset: const Offset(0, 8),
    ),
  ];
}

// ── Radii ────────────────────────────────────────────────────
class AppRadius {
  AppRadius._();
  static const sm  = BorderRadius.all(Radius.circular(12));
  static const md  = BorderRadius.all(Radius.circular(16));
  static const lg  = BorderRadius.all(Radius.circular(20));
  static const xl  = BorderRadius.all(Radius.circular(24));
  static const xxl = BorderRadius.all(Radius.circular(28));
  static const full = BorderRadius.all(Radius.circular(999));
}

// ── Theme builder ─────────────────────────────────────────────
class AppTheme {
  AppTheme._();

  static TextTheme _textTheme(Brightness brightness) {
    final base = GoogleFonts.interTextTheme();
    final color = brightness == Brightness.dark ? Colors.white : AppColors.slate900;
    return base.copyWith(
      displayLarge:  base.displayLarge?.copyWith(color: color, fontWeight: FontWeight.w900, letterSpacing: -1),
      displayMedium: base.displayMedium?.copyWith(color: color, fontWeight: FontWeight.w900, letterSpacing: -0.5),
      headlineLarge: base.headlineLarge?.copyWith(color: color, fontWeight: FontWeight.w900),
      headlineMedium:base.headlineMedium?.copyWith(color: color, fontWeight: FontWeight.w800),
      headlineSmall: base.headlineSmall?.copyWith(color: color, fontWeight: FontWeight.w800),
      titleLarge:    base.titleLarge?.copyWith(color: color, fontWeight: FontWeight.w700),
      titleMedium:   base.titleMedium?.copyWith(color: color, fontWeight: FontWeight.w600),
      titleSmall:    base.titleSmall?.copyWith(color: color, fontWeight: FontWeight.w600),
      bodyLarge:     base.bodyLarge?.copyWith(color: color),
      bodyMedium:    base.bodyMedium?.copyWith(color: color),
      bodySmall:     base.bodySmall?.copyWith(color: AppColors.slate500),
      labelLarge:    base.labelLarge?.copyWith(color: color, fontWeight: FontWeight.w600),
      labelMedium:   base.labelMedium?.copyWith(color: AppColors.slate500, fontWeight: FontWeight.w600),
    );
  }

  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary:   AppColors.blue600,
      onPrimary: Colors.white,
      primaryContainer:   AppColors.blue100,
      onPrimaryContainer: AppColors.blue700,
      secondary:          AppColors.indigo500,
      onSecondary:        Colors.white,
      secondaryContainer: Color(0xFFE0E7FF),
      onSecondaryContainer: AppColors.indigo600,
      surface:            Colors.white,
      onSurface:          AppColors.slate900,
      surfaceContainerHighest: AppColors.slate50,
      onSurfaceVariant:   AppColors.slate500,
      outline:            AppColors.slate200,
      outlineVariant:     AppColors.slate200,
      error:   AppColors.red500,
      onError: Colors.white,
      scrim:   Colors.black,
      shadow:  Colors.black,
    );

    return _build(scheme, Brightness.light);
  }

  static ThemeData dark() {
    const scheme = ColorScheme(
      brightness: Brightness.dark,
      primary:   AppColors.blue500,
      onPrimary: Colors.white,
      primaryContainer:   Color(0xFF1E3A8A),
      onPrimaryContainer: AppColors.blue200,
      secondary:          AppColors.indigo400,
      onSecondary:        Colors.white,
      secondaryContainer: Color(0xFF312E81),
      onSecondaryContainer: Color(0xFFC7D2FE),
      surface:            AppColors.slate900,
      onSurface:          Colors.white,
      surfaceContainerHighest: AppColors.slate800,
      onSurfaceVariant:   AppColors.slate400,
      outline:            AppColors.slate700,
      outlineVariant:     AppColors.slate800,
      error:   AppColors.red400,
      onError: Colors.white,
      scrim:   Colors.black,
      shadow:  Colors.black,
    );

    return _build(scheme, Brightness.dark);
  }

  static ThemeData _build(ColorScheme scheme, Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.slate700 : AppColors.slate200;
    final fillColor   = isDark ? AppColors.slate900  : Colors.white;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: Colors.transparent,
      textTheme: _textTheme(brightness),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: isDark ? Colors.white : AppColors.slate900,
        ),
        iconTheme: IconThemeData(
          color: isDark ? Colors.white : AppColors.slate700,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: fillColor,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        labelStyle: TextStyle(color: scheme.onSurfaceVariant, fontWeight: FontWeight.w500),
        hintStyle:  TextStyle(color: scheme.onSurfaceVariant),
        prefixIconColor: scheme.primary,
        suffixIconColor: scheme.onSurfaceVariant,
        border: OutlineInputBorder(
          borderRadius: AppRadius.lg,
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadius.lg,
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.lg,
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppRadius.lg,
          borderSide: const BorderSide(color: AppColors.red500),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppRadius.lg,
          borderSide: const BorderSide(color: AppColors.red500, width: 2),
        ),
        errorStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.red500),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          backgroundColor: scheme.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.lg),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          backgroundColor: scheme.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.lg),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          foregroundColor: scheme.primary,
          side: BorderSide(color: borderColor),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.lg),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: scheme.primary,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: isDark ? AppColors.slate900 : Colors.white,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.xxl),
        margin: EdgeInsets.zero,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: isDark ? AppColors.slate800 : AppColors.slate900,
        contentTextStyle: GoogleFonts.inter(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.lg),
        behavior: SnackBarBehavior.floating,
      ),
      dividerTheme: DividerThemeData(color: borderColor, thickness: 1),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: isDark ? AppColors.slate900 : Colors.white,
        selectedItemColor: scheme.primary,
        unselectedItemColor: scheme.onSurfaceVariant,
      ),
    );
  }
}
