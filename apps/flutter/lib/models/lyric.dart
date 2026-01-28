class LyricLine {
  final Duration startTime;
  final String content;

  LyricLine({required this.startTime, required this.content});
}

class LyricParser {
  static List<LyricLine> parse(String lrc) {
    if (lrc.isEmpty) return [];

    final lines = lrc.split('\n');
    final List<LyricLine> lyricLines = [];
    final RegExp timeTagRegExp = RegExp(r'\[(\d{2}):(\d{2})\.(\d{2,3})\]');

    for (var line in lines) {
      final matches = timeTagRegExp.allMatches(line);
      if (matches.isEmpty) continue;

      final content = line.replaceAll(timeTagRegExp, '').trim();
      if (content.isEmpty) continue;

      for (final match in matches) {
        final minutes = int.parse(match.group(1)!);
        final seconds = int.parse(match.group(2)!);
        final milliseconds = int.parse(match.group(3)!);

        // Normalize milliseconds to 3 digits if it's 2
        final normalizedMilliseconds = match.group(3)!.length == 2
            ? milliseconds * 10
            : milliseconds;

        final startTime = Duration(
          minutes: minutes,
          seconds: seconds,
          milliseconds: normalizedMilliseconds,
        );

        lyricLines.add(LyricLine(startTime: startTime, content: content));
      }
    }

    lyricLines.sort((a, b) => a.startTime.compareTo(b.startTime));
    return lyricLines;
  }
}
