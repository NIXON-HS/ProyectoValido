import 'package:flutter/material.dart';

class ThemeController {
  // true = dark, false = light
  static final ValueNotifier<bool> isDark = ValueNotifier<bool>(true);

  static void toggle() => isDark.value = !isDark.value;
}
