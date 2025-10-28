import 'package:cicada/model/singer.dart';
import 'package:cicada/utils/prefix_server_origin.dart';

class Music {
  final String id;
  final String name;
  final String asset;
  final String? cover;
  final List<Singer> singers;

  Music({
    required this.id,
    required this.name,
    required this.asset,
    required this.cover,
    required this.singers,
  });

  factory Music.fromJSON(Map<String, dynamic> json) => Music(
    id: json['id'],
    name: json['name'],
    asset: prefixServerOrigin(json['asset'])!,
    cover: prefixServerOrigin(json['cover']),
    singers: (json['singers'] as List<dynamic>)
        .map((json) => Singer.fromJSON(json))
        .toList(),
  );
}
