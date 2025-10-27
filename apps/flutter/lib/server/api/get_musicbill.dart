import '../../utils/prefix_server_origin.dart';
import '../request.dart';

class Singer {
  final String id;
  final String name;
  final List<String> aliases;

  Singer({required this.id, required this.name, required this.aliases});

  factory Singer.fromJSON(Map<String, dynamic> json) => Singer(
    id: json['id'],
    name: json['name'],
    aliases: List<String>.from(json['aliases']),
  );
}

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

class Musicbill {
  String name;
  String? cover;
  List<Music> musicList;

  Musicbill({required this.name, required this.cover, required this.musicList});

  factory Musicbill.fromJSON(Map<String, dynamic> json) => Musicbill(
    name: json['name'],
    cover: prefixServerOrigin(json['cover']),
    musicList: (json['musicList'] as List<dynamic>)
        .map((json) => Music.fromJSON(json))
        .toList(),
  );
}

Future<Musicbill> getMusicbill({required String id}) async {
  final responseData = await httpGet(
    path: "/api/musicbill",
    query: {"id": id},
    withToken: true,
  );
  return Musicbill.fromJSON(responseData);
}
