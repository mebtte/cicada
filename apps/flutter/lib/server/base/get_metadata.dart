import '../request.dart';
import '../../states/server.dart';

class Metadata {
  final String hostname;
  final String version;

  Metadata({required this.hostname, required this.version});

  factory Metadata.fromJSON(Map<String, dynamic> json) =>
      Metadata(hostname: json['hostname'], version: json['version']);
}

Future<Metadata> getMetadata(String? origin) async {
  final responseData = await httpGet(
    origin: origin ?? serverState.currentServer!.origin,
    path: "/base/metadata",
  );
  return Metadata.fromJSON(responseData);
}
