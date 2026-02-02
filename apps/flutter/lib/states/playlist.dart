import 'package:cicada/event_bus.dart';
import 'package:cicada/models/music.dart';
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

  /// 从播放列表中移除音乐
  void removeMusic(String pid) {
    playlist.removeWhere((m) => m.pid == pid);
    notifyListeners();
  }

  void Function() subscribe() {
    final playMusicSubscription = eventBus.on<PlayMusicEvent>().listen((event) {
      addMusicList([event.music]);
    });
    final addMusicListToPlaylistSubscription = eventBus
        .on<AddMusicListToPlaylistEvent>()
        .listen((event) {
          addMusicList(event.musicList);
        });
    return () {
      playMusicSubscription.cancel();
      addMusicListToPlaylistSubscription.cancel();
    };
  }
}

final playlistState = PlaylistState();
