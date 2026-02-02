import '../states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Playqueue extends StatelessWidget {
  const Playqueue({super.key});

  @override
  Widget build(BuildContext context) {
    final playqueueState = context.watch<PlayqueueState>();
    final playqueue = playqueueState.playqueue;
    final currentMusic = playqueueState.currentMusic;

    if (playqueue.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.queue_music_outlined, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(
              'Playqueue is empty',
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemCount: playqueue.length,
      itemBuilder: (context, index) {
        final playqueueMusic = playqueue[playqueue.length - index - 1];
        final displayIndex = playqueue.length - index;
        final music = playqueueMusic.music;
        final artistNames = music.singers.map((s) => s.name).join(', ');
        final isCurrentPlaying = currentMusic?.pid == playqueueMusic.pid;
        final primaryColor = Theme.of(context).primaryColor;

        return InkWell(
          onTap: () {
            // TODO: 跳转播放
          },
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
              ],
            ),
          ),
        );
      },
    );
  }
}
