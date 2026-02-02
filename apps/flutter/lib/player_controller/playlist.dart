import 'package:cicada/event_bus.dart';
import 'package:cicada/states/playlist.dart';
import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Playlist extends StatelessWidget {
  const Playlist({super.key});

  @override
  Widget build(BuildContext context) {
    final playlist = context.watch<PlaylistState>().playlist;
    final currentMusic = context.watch<PlayqueueState>().currentMusic;

    if (playlist.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.playlist_play_outlined,
              size: 48,
              color: Colors.grey[300],
            ),
            const SizedBox(height: 12),
            Text(
              'Playlist is empty',
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemCount: playlist.length,
      itemBuilder: (context, index) {
        // 倒序显示：最新添加的在顶部
        final playlistMusic = playlist[playlist.length - index - 1];
        final displayIndex = playlist.length - index;
        final music = playlistMusic.music;
        final artistNames = music.singers.map((s) => s.name).join(', ');
        final isCurrentPlaying = currentMusic?.music.id == music.id;
        final primaryColor = Theme.of(context).primaryColor;

        return InkWell(
          onTap: () => eventBus.fire(PlayMusicEvent(music: music)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                // 索引
                SizedBox(
                  width: 28,
                  child: Text(
                    '$displayIndex',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isCurrentPlaying ? primaryColor : Colors.grey[400],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 12),
                // 音乐信息
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        music.name,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isCurrentPlaying
                              ? FontWeight.w600
                              : FontWeight.w400,
                          color: isCurrentPlaying
                              ? primaryColor
                              : Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (artistNames.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          artistNames,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[500],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                // 删除按钮
                IconButton(
                  icon: Icon(
                    Icons.close_rounded,
                    size: 18,
                    color: Colors.grey[400],
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(
                    minWidth: 32,
                    minHeight: 32,
                  ),
                  onPressed: () => _showDeleteConfirmDialog(
                    context,
                    playlistMusic.pid,
                    music.name,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showDeleteConfirmDialog(
    BuildContext context,
    String pid,
    String musicName,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: Text('Remove "$musicName" from playlist?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              context.read<PlaylistState>().removeMusic(pid);
              Navigator.pop(context);
            },
            child: Text('Delete', style: TextStyle(color: Colors.red[600])),
          ),
        ],
      ),
    );
  }
}
