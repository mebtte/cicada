import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';

class PlayIndicator extends StatelessWidget {
  final PlayqueueMusic playqueueMusic;

  const PlayIndicator({super.key, required this.playqueueMusic});

  @override
  Widget build(BuildContext context) {
    return Text(playqueueMusic.music.name);
  }
}
