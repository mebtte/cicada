import 'package:cicada/models/music.dart';
import '../../server/request.dart';

class MusicWithLyricSnippet {
  final Music music;
  final String snippet;

  /// The specific lines to show, if we want detailed control
  final List<String> snippetLines;

  MusicWithLyricSnippet({
    required this.music,
    required this.snippet,
    required this.snippetLines,
  });
}

class _RawMusicWithLyrics {
  final Music music;
  final List<_RawLyric> lyrics;

  _RawMusicWithLyrics({required this.music, required this.lyrics});

  factory _RawMusicWithLyrics.fromJson(Map<String, dynamic> json) {
    return _RawMusicWithLyrics(
      music: Music.fromJson(json),
      lyrics:
          (json['lyrics'] as List<dynamic>?)
              ?.map((e) => _RawLyric.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class _RawLyric {
  final String lrc;
  _RawLyric({required this.lrc});
  factory _RawLyric.fromJson(Map<String, dynamic> json) =>
      _RawLyric(lrc: json['lrc'] ?? '');
}

class _LrcLine {
  final String content;
  final String raw;

  _LrcLine(this.content, this.raw);
}

Future<List<MusicWithLyricSnippet>> searchMusicByLyric({
  required String keyword,
  int page = 1,
  int pageSize = 20,
}) async {
  final response = await httpGet(
    path: '/api/music/search_by_lyric',
    query: {
      'keyword': keyword,
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    },
    withToken: true,
  );

  final List<dynamic> listCallback = response['musicList'] ?? [];
  final rawList = listCallback.map((e) => _RawMusicWithLyrics.fromJson(e));

  final List<MusicWithLyricSnippet> results = [];
  final lowerKeyword = keyword.toLowerCase();

  for (final item in rawList) {
    String snippet = '';
    List<String> snippetLines = [];

    for (final lyric in item.lyrics) {
      // Simple LRC parsing
      final lines = lyric.lrc.split('\n');
      final parsedLines = <_LrcLine>[];

      for (final line in lines) {
        final match = RegExp(r'^\[.*?\](.*)$').firstMatch(line);
        if (match != null) {
          parsedLines.add(_LrcLine(match.group(1) ?? '', line));
        } else if (line.trim().isNotEmpty) {
          // Fallback for lines without timestamp? PWA filters strictly by type text/lyric.
          // If strict LRC, maybe ignore. But let's include if unsure or just skip.
          // Standard LRC has timestamps.
          // parsedLines.add(_LrcLine(line, line));
        }
      }

      // Find match
      int matchIndex = -1;
      for (int i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i].content.toLowerCase().contains(lowerKeyword)) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex != -1) {
        // Extract context: -2 to +2
        final start = (matchIndex - 2).clamp(0, parsedLines.length - 1);
        final end = (matchIndex + 2).clamp(0, parsedLines.length - 1);

        final contextLines = <_LrcLine>[];
        for (int i = start; i <= end; i++) {
          contextLines.add(parsedLines[i]);
        }

        snippet = contextLines.map((e) => e.raw).join('\n');
        snippetLines = contextLines.map((e) => e.content).toList();
        break; // Found a match in one of the lyrics versions
      }
    }

    results.add(
      MusicWithLyricSnippet(
        music: item.music,
        snippet: snippet,
        snippetLines: snippetLines,
      ),
    );
  }

  return results;
}
