import 'package:cicada/player_controller/player_controller.dart';
import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class PlayerControllerContainer extends StatelessWidget {
  const PlayerControllerContainer({super.key});

  @override
  Widget build(BuildContext context) {
    final currentMusic = context.watch<PlayqueueState>().currentMusic;
    return currentMusic == null
        ? Container()
        : PlayController(playqueueMusic: currentMusic);
  }
}
