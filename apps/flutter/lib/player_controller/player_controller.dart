import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import './actions.dart' as actions;

class PlayController extends StatelessWidget {
  final PlayqueueMusic playqueueMusic;

  const PlayController({super.key, required this.playqueueMusic});

  @override
  Widget build(BuildContext context) {
    final music = playqueueMusic.music;
    final cover = music.cover;
    return Container(
      color: Colors.white,
      height: 60,
      child: Row(
        // crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (cover != null)
            AspectRatio(
              aspectRatio: 1,
              child: Image.network(cover, fit: BoxFit.cover),
            ),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  music.name,
                  style: TextStyle(fontSize: 16),
                  textAlign: TextAlign.left,
                ),
                Text(
                  music.singers.isEmpty
                      ? 'Unknown singers'
                      : music.singers.map((s) => s.name).join(','),
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
          actions.Actions(),
        ],
      ),
    );
  }
}
