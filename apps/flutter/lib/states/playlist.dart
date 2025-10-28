import 'package:cicada/model/music.dart';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';

final uuid = Uuid();

class PlaylistMusic {
  final String pid;
  final Music music;

  PlaylistMusic({required this.pid, required this.music});
}

class PlaylistState extends ChangeNotifier {
  List<PlaylistMusic> playlist = [];

  void addMusicList(List<Music> musicList) {
    final existedMusicIds = playlist.map((m) => m.music.id);
    final unrepeatedMusicList = musicList
        .where((m) => !existedMusicIds.contains(m.id))
        .toList();
    playlist.addAll(
      unrepeatedMusicList.map(
        (music) => PlaylistMusic(pid: uuid.v4(), music: music),
      ),
    );
    notifyListeners();
  }
}

final playlistState = PlaylistState();
