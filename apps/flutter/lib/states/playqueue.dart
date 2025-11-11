import 'dart:math';

import 'package:cicada/event_bus.dart';
import 'package:cicada/states/playlist.dart';
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

  void previous() {
    final nextPlayqueueIndex = playqueueIndex - 1;
    if (nextPlayqueueIndex < 0) {
      /**
       * @todo remind user there is no music in playqueue
       * @author mebtte<i@mebtte.com>
       */
      print("can not skip to previous");
    } else {
      playqueueIndex = nextPlayqueueIndex;
      notifyListeners();
    }
  }

  void next() {
    final nextPlayqueueIndex = playqueueIndex + 1;
    if (nextPlayqueueIndex >= playqueue.length) {
      final playlist = playlistState.playlist;
      if (playlist.isEmpty) {
        /**
         * @todo remind user
         * @author mebtte<i@mebtte.com>
         */
        print("no musics in playlist");
      } else {
        final random = Random();
        final playlistMusic = playlist[random.nextInt(playlist.length)];
        jump(playlistMusic.music);
        next();
      }
    } else {
      playqueueIndex = nextPlayqueueIndex;
      notifyListeners();
    }
  }

  void Function() subscribe() {
    final playMusicSubscription = eventBus.on<PlayMusicEvent>().listen((event) {
      jump(event.music);
      next();
    });
    final addMusicListToPlaylistSubscription = eventBus
        .on<AddMusicListToPlaylistEvent>()
        .listen((event) {
          if (currentMusic == null) {
            final random = Random();
            jump(event.musicList[random.nextInt(event.musicList.length)]);
            next();
          }
        });
    return () {
      playMusicSubscription.cancel();
      addMusicListToPlaylistSubscription.cancel();
    };
  }
}

final playqueueState = PlayqueueState();
