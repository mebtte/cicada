import 'package:cicada/models/singer.dart';
import 'package:cicada/utils/prefix_server_origin.dart';

/// 音乐类型
enum MusicType {
  song, // 歌曲，有歌词
  instrumental, // 纯音乐，无歌词
}

class Music {
  final String id;
  final String name;
  final String asset;
  final String? cover;
  final List<Singer> singers;
  final MusicType type;

  Music({
    required this.id,
    required this.name,
    required this.asset,
    required this.cover,
    required this.singers,
    required this.type,
  });

  /// 是否是纯音乐
  bool get isInstrumental => type == MusicType.instrumental;

  factory Music.fromJson(Map<String, dynamic> json) => Music(
    id: json['id'],
    name: json['name'],
    asset: prefixServerOrigin(json['asset']) ?? '',
    cover: prefixServerOrigin(json['cover']),
    singers:
        (json['singers'] as List<dynamic>?)
            ?.map((json) => Singer.fromJson(json))
            .toList() ??
        [],
    // 服务端 type: 1=歌曲, 2=纯音乐
    type: json['type'] == 2 ? MusicType.instrumental : MusicType.song,
  );
}
