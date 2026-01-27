import '../request.dart';
import '../../models/music.dart';
import '../../utils/prefix_server_origin.dart';

class ExplorationSinger {
  final String id;
  final String name;
  final String? avatar;

  ExplorationSinger({required this.id, required this.name, this.avatar});

  factory ExplorationSinger.fromJson(Map<String, dynamic> json) {
    return ExplorationSinger(
      id: json['id'],
      name: json['name'],
      avatar: prefixServerOrigin(json['avatar']),
    );
  }
}

class ExplorationPublicMusicbill {
  final String id;
  final String name;
  final String? cover;

  ExplorationPublicMusicbill({
    required this.id,
    required this.name,
    this.cover,
  });

  factory ExplorationPublicMusicbill.fromJson(Map<String, dynamic> json) {
    return ExplorationPublicMusicbill(
      id: json['id'],
      name: json['name'],
      cover: prefixServerOrigin(json['cover']),
    );
  }
}

class ExplorationData {
  final List<Music> musicList;
  final List<ExplorationSinger> singerList;
  final List<ExplorationPublicMusicbill> publicMusicbillList;

  ExplorationData({
    required this.musicList,
    required this.singerList,
    required this.publicMusicbillList,
  });

  factory ExplorationData.fromJson(Map<String, dynamic> json) {
    return ExplorationData(
      musicList:
          (json['musicList'] as List<dynamic>?)
              ?.map((m) => Music.fromJson(m))
              .toList() ??
          [],
      singerList:
          (json['singerList'] as List<dynamic>?)
              ?.map((s) => ExplorationSinger.fromJson(s))
              .toList() ??
          [],
      publicMusicbillList:
          (json['publicMusicbillList'] as List<dynamic>?)
              ?.map((mb) => ExplorationPublicMusicbill.fromJson(mb))
              .toList() ??
          [],
    );
  }
}

Future<ExplorationData> getExploration() async {
  final data = await httpGet(path: '/api/exploration', withToken: true);
  return ExplorationData.fromJson(data);
}
