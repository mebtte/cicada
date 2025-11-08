import 'package:cicada/event_bus.dart';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../extensions/list.dart';
import '../models/music.dart';

final uuid = Uuid();

class PlayqueueMusic {
  final String pid;
  final Music music;

  PlayqueueMusic({required this.pid, required this.music});
}

class PlayqueueState extends ChangeNotifier {
  int playqueueIndex = -1;
  List<PlayqueueMusic> playqueue = [];

  PlayqueueMusic? get currentMusic => playqueue.safeGet(playqueueIndex);

  void jump(Music music) {
    final playqueueMusic = PlayqueueMusic(pid: uuid.v4(), music: music);
    if (playqueueIndex == -1) {
      playqueue = [playqueueMusic, ...playqueue];
    } else {
      playqueue = [
        ...playqueue.sublist(0, playqueueIndex + 1),
        playqueueMusic,
        ...playqueue.sublist(playqueueIndex + 1),
      ];
    }
    notifyListeners();
  }

  void next() {
    final nextPlayqueueIndex = playqueueIndex + 1;
    if (nextPlayqueueIndex >= playqueue.length) {
      /**
       * @todo remind user
       * @author mebtte<i@mebtte.com>
       */
      print("No more music in playqueue");
    } else {
      playqueueIndex = nextPlayqueueIndex;
      notifyListeners();
    }
  }

  void Function() listen() {
    final playMusicSubscription = eventBus.on<PlayMusicEvent>().listen((event) {
      jump(event.music);
      next();
    });
    return () {
      playMusicSubscription.cancel();
    };
  }
}

final playqueueState = PlayqueueState();
