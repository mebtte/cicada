import '../../models/music.dart';
import '../../server/request.dart';

class SearchMusicResponse {
  final int total;
  final List<Music> musicList;

  SearchMusicResponse({required this.total, required this.musicList});

  factory SearchMusicResponse.fromJson(Map<String, dynamic> json) =>
      SearchMusicResponse(
        total: json['total'],
        musicList: (json['musicList'] as List)
            .map((e) => Music.fromJson(e))
            .toList(),
      );
}

Future<SearchMusicResponse> searchMusic({
  required String keyword,
  int page = 1,
  int pageSize = 50,
}) async {
  final response = await httpGet(
    path: '/api/music/search',
    query: {
      'keyword': keyword,
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    },
    withToken: true,
  );
  return SearchMusicResponse.fromJson(response);
}
