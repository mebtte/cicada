import 'package:cicada/audio_handler.dart';
import 'package:cicada/states/audio.dart';
import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';

class Actions extends StatelessWidget {
  const Actions({super.key});

  @override
  Widget build(BuildContext context) {
    final playing = context.watch<AudioState>().playing;
    final spacing = SizedBox(width: 10);
    return Row(
      children: [
        spacing,
        IconButton(
          onPressed: () {
            final audioHandler = GetIt.instance.get<MyAudioHandler>();
            playing ? audioHandler.pause() : audioHandler.play();
          },
          icon: Icon(playing ? Icons.pause : Icons.play_arrow),
        ),
        spacing,
        IconButton(
          onPressed: () {
            playqueueState.next();
          },
          icon: Icon(Icons.skip_next),
        ),
        spacing,
        IconButton(onPressed: () {}, icon: Icon(Icons.list_outlined)),
        spacing,
      ],
    );
  }
}
