import 'package:dio/dio.dart';

/// Base URL for API endpoints
const String kApiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'https://api.greensentinel.dev/v1',
);

/// API Client using Dio for network requests
class ApiClient {
  /// Private constructor for singleton pattern
  ApiClient._() {
    _init();
  }

  /// Singleton instance
  static final ApiClient instance = ApiClient._();

  /// Dio instance for making network requests
  late final Dio dio;

  /// Initialize the Dio client with interceptors and configuration
  void _init() {
    final baseOptions = BaseOptions(
      baseUrl: kApiBase,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: 'multipart/form-data',
      validateStatus: (status) => status != null && status < 500,
    );

    dio = Dio(baseOptions);

    // Add interceptors
    dio.interceptors.add(_createRetryInterceptor());
    dio.interceptors.add(_createLoggingInterceptor());
  }

  /// Creates a retry interceptor that retries failed requests
  Interceptor _createRetryInterceptor() {
    return InterceptorsWrapper(
      onError: (DioException error, ErrorInterceptorHandler handler) async {
        if (_shouldRetry(error)) {
          int retryCount = error.requestOptions.extra['retryCount'] ?? 0;
          if (retryCount < 3) {
            // Exponential backoff: 1s, 2s, 4s
            final delay = Duration(seconds: 1 << retryCount);
            await Future.delayed(delay);

            // Clone and retry the request
            final options = Options(
              method: error.requestOptions.method,
              headers: error.requestOptions.headers,
            );

            final newRequestOptions = error.requestOptions.copyWith(
              extra: {
                ...error.requestOptions.extra,
                'retryCount': retryCount + 1,
              },
            );

            try {
              final response = await dio.request<dynamic>(
                error.requestOptions.path,
                data: error.requestOptions.data,
                queryParameters: error.requestOptions.queryParameters,
                options: options,
                cancelToken: error.requestOptions.cancelToken,
              );
              return handler.resolve(response);
            } catch (e) {
              return handler.next(error);
            }
          }
        }
        return handler.next(error);
      },
    );
  }

  /// Creates a logging interceptor for debugging
  Interceptor _createLoggingInterceptor() {
    return InterceptorsWrapper(
      onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
        print('🌐 REQUEST[${options.method}] => PATH: ${options.path}');
        return handler.next(options);
      },
      onResponse: (Response response, ResponseInterceptorHandler handler) {
        print('✅ RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (DioException err, ErrorInterceptorHandler handler) {
        print('⚠️ ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
        return handler.next(err);
      },
    );
  }

  /// Determines if a request should be retried based on error type
  bool _shouldRetry(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.connectionError;
  }
}
