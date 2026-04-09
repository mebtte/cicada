import 'package:cicada/models/music.dart';
import 'package:flutter/material.dart';

class MusicInfo extends StatelessWidget {
  final Music music;

  const MusicInfo({super.key, required this.music});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          music.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.normal,
            color: Colors.black87,
            height: 1.2,
            decoration: TextDecoration.none,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(
          music.singers.isEmpty
              ? 'Unknown singers'
              : music.singers.map((s) => s.name).join(', '),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.normal,
            color: Colors.black54,
            height: 1.2,
            decoration: TextDecoration.none,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}
