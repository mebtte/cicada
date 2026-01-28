import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:provider/provider.dart';
import '../audio_handler.dart';
import '../states/audio.dart';
import '../states/playqueue.dart';
import './show_playlist_dialog.dart';

class Actions extends StatelessWidget {
  const Actions({super.key});

  @override
  Widget build(BuildContext context) {
    final playing = context.watch<AudioState>().playing;
    final spacing = SizedBox(width: 2);
    return Row(
      children: [
        IconButton(
          onPressed: () {
            final audioHandler = GetIt.instance.get<MyAudioHandler>();
            playing ? audioHandler.pause() : audioHandler.play();
          },
          icon: Icon(playing ? Icons.pause : Icons.play_arrow),
          iconSize: 20,
          padding: EdgeInsets.zero,
          constraints: BoxConstraints(minWidth: 32, minHeight: 32),
        ),
        spacing,
        IconButton(
          onPressed: () {
            playqueueState.next();
          },
          icon: Icon(Icons.skip_next),
          iconSize: 20,
          padding: EdgeInsets.zero,
          constraints: BoxConstraints(minWidth: 32, minHeight: 32),
        ),
        spacing,
        IconButton(
          onPressed: () {
            showPlaylistDialog(context);
          },
          icon: Icon(Icons.list_outlined),
          iconSize: 20,
          padding: EdgeInsets.zero,
          constraints: BoxConstraints(minWidth: 32, minHeight: 32),
        ),
      ],
    );
  }
}
