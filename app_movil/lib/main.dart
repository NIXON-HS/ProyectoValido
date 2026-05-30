import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'screens/login_screen.dart';
import 'services/theme_controller.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (e) {
    debugPrint('Error inicializando Firebase: $e');
  }
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    ThemeController.isDark.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeController.isDark.value;
    return MaterialApp(
      title: 'TechStore 360',
      debugShowCheckedModeBanner: false,
      theme:      AppTheme.light(),
      darkTheme:  AppTheme.dark(),
      themeMode:  isDark ? ThemeMode.dark : ThemeMode.light,
      home: const LoginScreen(),
    );
  }
}
