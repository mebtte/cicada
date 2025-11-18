import '../states/playqueue.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Playqueue extends StatelessWidget {
  const Playqueue({super.key});

  @override
  Widget build(BuildContext context) {
    final playqueue = context.watch<PlayqueueState>().playqueue;
    return ListView.builder(
      itemCount: playqueue.length,
      itemBuilder: (context, index) {
        final playqueueMusic = playqueue[playqueue.length - index - 1];
        return ListTile(
          leading: const Icon(Icons.music_note_outlined),
          title: Text(playqueueMusic.music.name),
          onTap: () {},
        );
      },
    );
  }
}
