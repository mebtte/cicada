import 'package:flutter/material.dart';
import '../../../server/api/get_exploration.dart';
import '../../../widgets/cached_image.dart';

class SingerCard extends StatelessWidget {
  final ExplorationSinger singer;

  const SingerCard({super.key, required this.singer});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // TODO: 打开歌手详情
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
              child: singer.avatar != null
                  ? CachedImage(
                      imageUrl: singer.avatar,
                      size: 200, // Fixed size for exploration cards
                      borderRadius: BorderRadius.circular(8),
                      placeholder: const Center(
                        child: Icon(Icons.person, size: 48),
                      ),
                      errorWidget: const Center(
                        child: Icon(Icons.person, size: 48),
                      ),
                    )
                  : const Center(child: Icon(Icons.person, size: 48)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            singer.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          Text(
            '歌手',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
