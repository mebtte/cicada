import 'package:cicada/event_bus.dart';
import 'package:cicada/states/playlist.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Playlist extends StatelessWidget {
  const Playlist({super.key});

  @override
  Widget build(BuildContext context) {
    final playlist = context.watch<PlaylistState>().playlist;
    return playlist.isEmpty
        ? Text("Playlist is empty")
        : Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: playlist.length,
                  itemBuilder: (context, index) {
                    final playlistMusic = playlist[index];
                    return ListTile(
                      leading: const Icon(Icons.music_note_outlined),
                      title: Text(playlistMusic.music.name),
                      onTap: () => eventBus.fire(
                        PlayMusicEvent(music: playlistMusic.music),
                      ),
                    );
                  },
                ),
              ),
              Text("action"),
            ],
          );
  }
}
