import 'dart:math';

import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';

final random = Random();

class PlaylistMusic {
  final String pid;
  final String id;
  final String name;
  final String asset;

  PlaylistMusic({
    required this.pid,
    required this.id,
    required this.name,
    required this.asset,
  });
}

class PlaylistState extends ChangeNotifier {
  List<PlaylistMusic> playlist = [];

  void addMusicList(List<PlaylistMusic> musicList) {
    final existedMusicIds = playlist.map((m) => m.id).toList();
    final unrepeatedMusicList = musicList
        .where((m) => !existedMusicIds.contains(m.id))
        .toList();
    playlist.addAll(unrepeatedMusicList);
    notifyListeners();

    if (playqueueState.currentMusic == null) {
      Future.delayed(Duration.zero, () => playqueueState.next());
    }
  }
}

final playlistState = PlaylistState();
