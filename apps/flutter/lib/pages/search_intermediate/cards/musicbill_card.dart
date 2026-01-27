import 'package:flutter/material.dart';
import '../../../server/api/get_exploration.dart';

class MusicbillCard extends StatelessWidget {
  final ExplorationPublicMusicbill musicbill;

  const MusicbillCard({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // TODO: 打开歌单详情
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[200],
              ),
              child: musicbill.cover != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        musicbill.cover!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (context, error, stackTrace) {
                          return const Center(
                            child: Icon(Icons.queue_music, size: 48),
                          );
                        },
                      ),
                    )
                  : const Center(child: Icon(Icons.queue_music, size: 48)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            musicbill.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          Text(
            '公共歌单',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
