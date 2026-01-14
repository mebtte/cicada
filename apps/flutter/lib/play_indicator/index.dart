import 'package:cicada/play_indicator/play_indicator.dart';
import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class PlayIndicatorContainer extends StatelessWidget {
  const PlayIndicatorContainer({super.key});

  @override
  Widget build(BuildContext context) {
    final currentMusic = context.watch<PlayqueueState>().currentMusic;
    return currentMusic == null
        ? Container()
        : PlayIndicator(playqueueMusic: currentMusic);
  }
}
