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
  final bool isUserAdded;

  PlayqueueMusic({
    required this.pid,
    required this.music,
    this.isUserAdded = false,
  });
}

class PlayqueueState extends ChangeNotifier {
  int playqueueIndex = -1;
  List<PlayqueueMusic> playqueue = [];

  PlayqueueMusic? get currentMusic => playqueue.safeGet(playqueueIndex);

  void jump(Music music, {bool isUserAdded = false}) {
    final playqueueMusic = PlayqueueMusic(
      pid: uuid.v4(),
      music: music,
      isUserAdded: isUserAdded,
    );
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

  List<PlayqueueMusic> insertAfterCurrent(
    List<Music> musicList, {
    bool isUserAdded = true,
  }) {
    final newItems = musicList
        .map(
          (music) => PlayqueueMusic(
            pid: uuid.v4(),
            music: music,
            isUserAdded: isUserAdded,
          ),
        )
        .toList();

    if (newItems.isEmpty) {
      return const [];
    }

    if (playqueueIndex == -1) {
      playqueue = [...newItems, ...playqueue];
    } else {
      playqueue = [
        ...playqueue.sublist(0, playqueueIndex + 1),
        ...newItems,
        ...playqueue.sublist(playqueueIndex + 1),
      ];
    }
    notifyListeners();
    return newItems;
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

  void setCurrentIndex(int index) {
    if (index < -1 || index >= playqueue.length || index == playqueueIndex) {
      return;
    }
    playqueueIndex = index;
    notifyListeners();
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
        jump(playlistMusic.music, isUserAdded: false);
        next();
      }
    } else {
      playqueueIndex = nextPlayqueueIndex;
      notifyListeners();
    }
  }

  void remove(PlayqueueMusic item) {
    final index = playqueue.indexWhere((element) => element.pid == item.pid);
    if (index != -1) {
      playqueue = List.from(playqueue)..removeAt(index);
      if (index < playqueueIndex) {
        playqueueIndex--;
      } else if (index == playqueueIndex) {
        // If removing current song, logic might be complex (skip to next?),
        // but UI only allows removing NEXT songs, so this might not be hit.
        // For safety, let's say if we remove current, we stay at current index
        // which now points to the next song, effectively skipping.
        // But if it was the last song, we might need to handle empty or end of list.
        if (playqueueIndex >= playqueue.length) {
          playqueueIndex = playqueue.length - 1;
        }
      }
      notifyListeners();
    }
  }

  void rewind(PlayqueueMusic item) {
    final index = playqueue.indexWhere((element) => element.pid == item.pid);
    if (index != -1) {
      setCurrentIndex(index);
    }
  }

  // Actually, rewind works for both forward and backward if it just sets the index.
  // I will just use rewind (or rename it to proper 'jumpTo' but 'rewind' exists).

  void Function() subscribe() {
    final playMusicSubscription = eventBus.on<PlayMusicEvent>().listen((event) {
      jump(event.music, isUserAdded: false);
      next();
    });
    final addMusicListToPlaylistSubscription = eventBus
        .on<AddMusicListToPlaylistEvent>()
        .listen((event) {
          if (currentMusic == null) {
            final random = Random();
            jump(
              event.musicList[random.nextInt(event.musicList.length)],
              isUserAdded: false,
            );
            next();
          }
        });
    final insertToPlayqueueSubscription = eventBus
        .on<InsertToPlayqueueEvent>()
        .listen((event) {
          if (currentMusic == null) {
            final random = Random();
            jump(
              event.musicList[random.nextInt(event.musicList.length)],
              isUserAdded: false,
            );
            next();
          } else {
            insertAfterCurrent(event.musicList, isUserAdded: true);
          }
        });
    return () {
      playMusicSubscription.cancel();
      addMusicListToPlaylistSubscription.cancel();
      insertToPlayqueueSubscription.cancel();
    };
  }
}

final playqueueState = PlayqueueState();
