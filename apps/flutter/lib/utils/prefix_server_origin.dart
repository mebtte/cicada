import '../states/server.dart';

String? prefixServerOrigin(String? asset) {
  return asset == null ? null : "${serverState.currentServer!.origin}$asset";
}
