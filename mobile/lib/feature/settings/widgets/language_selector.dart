import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:green_sentinel_mobile/feature/settings/settings_controller.dart';

/// A widget for selecting the application language
class LanguageSelector extends ConsumerWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsState = ref.watch(settingsControllerProvider);
    final currentLocale = settingsState.locale;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 8.0),
          child: Text(
            'language'.tr(),
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        RadioListTile<String>(
          title: const Text('french').tr(),
          value: 'fr',
          groupValue: currentLocale.languageCode,
          secondary: const Icon(Icons.language),
          onChanged: (value) {
            if (value != null) {
              ref.read(settingsControllerProvider.notifier).setLocale(value);
              context.setLocale(Locale(value));
            }
          },
        ),
        RadioListTile<String>(
          title: const Text('english').tr(),
          value: 'en',
          groupValue: currentLocale.languageCode,
          secondary: const Icon(Icons.language),
          onChanged: (value) {
            if (value != null) {
              ref.read(settingsControllerProvider.notifier).setLocale(value);
              context.setLocale(Locale(value));
            }
          },
        ),
      ],
    );
  }
}
