import 'package:flutter/material.dart';
import '../../models/music.dart';
import '../../widgets/cached_image.dart';
import '../musicbill/music_option_menu.dart';

class MusicWithLyricListItem extends StatelessWidget {
  final Music music;
  final List<String> snippetLines;
  final String keyword;
  final VoidCallback onTap;

  const MusicWithLyricListItem({
    super.key,
    required this.music,
    required this.snippetLines,
    required this.keyword,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          onLongPress: () => _showMusicOptions(context),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildCover(context),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            music.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          _buildArtists(context),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.more_horiz,
                        color: Colors.grey[400],
                        size: 20,
                      ),
                      onPressed: () => _showMusicOptions(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      style: const ButtonStyle(
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
                if (snippetLines.isNotEmpty) ...[
                  Divider(color: Colors.grey[200], height: 16),
                  ...snippetLines.map((line) => _buildLyricLine(context, line)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLyricLine(BuildContext context, String line) {
    if (keyword.isEmpty) {
      return Text(
        line,
        style: const TextStyle(fontSize: 12, color: Colors.black54),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      );
    }

    final lowerLine = line.toLowerCase();
    final lowerKeyword = keyword.toLowerCase();
    final index = lowerLine.indexOf(lowerKeyword);

    if (index == -1) {
      return Text(
        line,
        style: const TextStyle(fontSize: 12, color: Colors.black54),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      );
    }

    // Simple highlighting
    final spans = <TextSpan>[];
    int currentIndex = 0;

    // Find all occurrences
    var searchIndex = lowerLine.indexOf(lowerKeyword);
    while (searchIndex != -1) {
      if (searchIndex > currentIndex) {
        spans.add(TextSpan(text: line.substring(currentIndex, searchIndex)));
      }
      spans.add(
        TextSpan(
          text: line.substring(searchIndex, searchIndex + keyword.length),
          style: TextStyle(color: Theme.of(context).primaryColor),
        ),
      );
      currentIndex = searchIndex + keyword.length;
      searchIndex = lowerLine.indexOf(lowerKeyword, currentIndex);
    }

    if (currentIndex < line.length) {
      spans.add(TextSpan(text: line.substring(currentIndex)));
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 12, color: Colors.black54),
          children: spans,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  void _showMusicOptions(BuildContext context) {
    final overlay = Overlay.of(context, rootOverlay: true);
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (_) => MusicOptionMenu(
        music: music,
        onPlay: onTap,
        onClose: () {
          entry.remove();
        },
        parentContext: context,
      ),
    );

    overlay.insert(entry);
  }

  Widget _buildCover(BuildContext context) {
    if (music.cover != null && music.cover!.isNotEmpty) {
      return CachedImage(
        imageUrl: music.cover,
        width: 44,
        height: 44,
        size: 88, // 2x for high DPI screens
        borderRadius: BorderRadius.circular(8),
        placeholder: _buildDefaultCover(context),
        errorWidget: _buildDefaultCover(context),
      );
    }
    return _buildDefaultCover(context);
  }

  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        Icons.music_note_rounded,
        color: Theme.of(context).primaryColor.withValues(alpha: 0.8),
        size: 22,
      ),
    );
  }

  Widget _buildArtists(BuildContext context) {
    if (music.singers.isEmpty) {
      return const Text(
        'Unknown Artist',
        style: TextStyle(fontSize: 10, color: Colors.black54),
      );
    }
    final artistNames = music.singers.map((singer) => singer.name).join(', ');
    return Text(
      artistNames,
      style: const TextStyle(fontSize: 10, color: Colors.black54),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}
