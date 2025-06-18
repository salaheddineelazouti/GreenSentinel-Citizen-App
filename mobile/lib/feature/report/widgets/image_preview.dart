import 'dart:io';

import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A widget that displays a preview of a captured image with a retake button
class ImagePreview extends StatelessWidget {
  /// Creates a new [ImagePreview]
  const ImagePreview({
    super.key,
    required this.imagePath,
    required this.onRetake,
  });

  /// Path to the image file
  final String imagePath;

  /// Callback that is called when the user wants to retake the image
  final VoidCallback onRetake;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.topRight,
      children: [
        // Image preview
        Container(
          constraints: const BoxConstraints(maxWidth: 300, maxHeight: 300),
          decoration: BoxDecoration(
            borderRadius: AppTheme().getBorderRadius('md'),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: AppTheme().getBorderRadius('md'),
            child: Image.file(
              File(imagePath),
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 300,
                  height: 300,
                  color: AppColors.gray200,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.broken_image,
                        size: 48,
                        color: AppColors.gray600,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Erreur de chargement',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.gray600,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),

        // Retake button
        Positioned(
          top: 8,
          right: 8,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              shape: BoxShape.circle,
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onRetake,
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Icon(
                    Icons.refresh,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
