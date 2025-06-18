import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:green_sentinel_mobile/main.dart';

/// A widget for toggling between theme modes
class ThemeToggle extends ConsumerWidget {
  const ThemeToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentThemeMode = ref.watch(themeProvider);

    return ListTile(
      leading: const Icon(Icons.dark_mode),
      title: Text('theme'.tr()),
      trailing: DropdownButton<ThemeMode>(
        value: currentThemeMode,
        underline: const SizedBox(),
        onChanged: (ThemeMode? newValue) {
          if (newValue != null) {
            // Since we're using the existing themeProvider from main.dart,
            // we need to update its state directly through its notifier
            final notifier = ref.read(themeProvider.notifier);
            // Keep toggling until we reach the desired theme mode
            while (ref.read(themeProvider) != newValue) {
              notifier.toggleTheme();
            }
          }
        },
        items: [
          DropdownMenuItem(
            value: ThemeMode.system,
            child: Text('system'.tr()),
          ),
          DropdownMenuItem(
            value: ThemeMode.light,
            child: Text('light'.tr()),
          ),
          DropdownMenuItem(
            value: ThemeMode.dark,
            child: Text('dark'.tr()),
          ),
        ],
      ),
    );
  }
}
