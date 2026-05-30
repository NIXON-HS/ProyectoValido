import 'package:flutter/material.dart';
import '../services/theme_controller.dart';

class ThemeFab extends StatelessWidget {
  const ThemeFab({super.key, this.size = 56});

  final double size;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: ThemeController.isDark,
      builder: (context, isDark, child) {
        return SizedBox(
          width: size,
          height: size,
          child: FloatingActionButton(
            onPressed: ThemeController.toggle,
            tooltip: isDark ? 'Modo claro' : 'Modo oscuro',
            backgroundColor: isDark
                ? Colors.white24
                : Theme.of(context).colorScheme.primary,
            child: Icon(
              isDark ? Icons.dark_mode : Icons.light_mode,
              color: Colors.white,
            ),
          ),
        );
      },
    );
  }
}
