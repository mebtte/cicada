import 'package:cicada/models/music.dart';
import '../../utils/prefix_server_origin.dart';
import '../request.dart';

class Musicbill {
  String name;
  String? cover;
  List<Music> musicList;

  Musicbill({required this.name, required this.cover, required this.musicList});

  factory Musicbill.fromJson(Map<String, dynamic> json) => Musicbill(
    name: json['name'],
    cover: prefixServerOrigin(json['cover']),
    musicList: (json['musicList'] as List<dynamic>)
        .map((json) => Music.fromJson(json))
        .toList(),
  );
}

Future<Musicbill> getMusicbill({required String id}) async {
  final responseData = await httpGet(
    path: "/api/musicbill",
    query: {"id": id},
    withToken: true,
  );
  return Musicbill.fromJson(responseData);
}
