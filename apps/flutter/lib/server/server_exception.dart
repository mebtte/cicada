class ServerException implements Exception {
  final String code;
  final String message;

  ServerException({required this.code, required this.message});

  @override
  String toString() => 'ServerException(#$code): $message';
}
