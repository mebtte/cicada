import '../../server/request.dart';

Future<String> getLyric({required String id}) async {
  final response = await httpGet(
    path: '/api/lyric_list',
    query: {'musicId': id},
    withToken: true,
  );

  // The API returns an array of lyric objects: [{ id: number, lrc: string }]
  // We'll use the first lyric if available
  if (response is List && response.isNotEmpty) {
    final firstLyric = response[0];
    if (firstLyric is Map && firstLyric['lrc'] != null) {
      return firstLyric['lrc'] as String;
    }
  }

  return '';
}
