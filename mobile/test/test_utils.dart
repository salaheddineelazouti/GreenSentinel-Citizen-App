import 'package:flutter/material.dart';
import 'package:mockito/mockito.dart';

/// A utility class containing helpful methods for testing
class TestUtils {
  /// Creates a dummy image file path for testing
  static String getDummyImagePath() {
    return 'test/mock_image.jpg';
  }
}

/// Helper class for listening to state changes in tests
class Listener<T> extends Mock {
  void call(T? previous);
}
