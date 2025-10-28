import 'package:cicada/model/music.dart';
import 'package:flutter/material.dart';
import '../extensions/list.dart';

class PlayqueueMusic {
  final String pid;
  final Music music;

  PlayqueueMusic({required this.pid, required this.music});
}

class PlayqueueState extends ChangeNotifier {
  int playqueueIndex = -1;
  List<PlayqueueMusic> playqueue = [];

  PlayqueueMusic? get currentMusic => playqueue.safeGet(playqueueIndex);

  void insert(PlayqueueMusic music) {
    if (playqueueIndex == -1) {
      playqueue = [music, ...playqueue];
    } else {
      playqueue = [
        ...playqueue.sublist(0, playqueueIndex),
        music,
        ...playqueue.sublist(playqueueIndex),
      ];
    }
    notifyListeners();
  }

  void next() {
    final nextPlayqueueIndex = playqueueIndex + 1;
    if (nextPlayqueueIndex >= playqueue.length) {}
    notifyListeners();
  }
}

final playqueueState = PlayqueueState();
