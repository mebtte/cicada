import 'package:cicada/constants/exception.dart';
import 'package:cicada/models/music.dart';
import 'package:flutter/material.dart';
import 'package:cicada/server/server_exception.dart';
import '../server/api/add_music_to_musicbill.dart' as add_music_to_musicbill;
import '../server/api/get_musicbill.dart' as get_musicbill;
import '../server/api/get_musicbill_list.dart' as get_musicbill_list;
import '../server/api/remove_music_from_musicbill.dart'
    as remove_music_from_musicbill;

enum MusicbillStatus { INITIAL, LOADING, SUCCESSFUL, FAILED }

const musicbillRefreshInterval = Duration(minutes: 5);

class Musicbill {
  final String id;
  final String name;
  final String? cover;
  final bool isPublic;
  final bool isShared;
  final List<Music> musicList;
  final MusicbillStatus status;

  Musicbill({
    required this.id,
    required this.name,
    required this.cover,
    required this.isPublic,
    required this.isShared,

    this.musicList = const [],
    this.status = MusicbillStatus.INITIAL,
  });

  Musicbill copyWith({
    String? name,
    String? cover,
    bool? isPublic,
    bool? isShared,
    List<Music>? musicList,
    MusicbillStatus? status,
  }) {
    return Musicbill(
      id: id,
      name: name ?? this.name,
      cover: cover ?? this.cover,
      isPublic: isPublic ?? this.isPublic,
      isShared: isShared ?? this.isShared,
      musicList: musicList ?? this.musicList,
      status: status ?? this.status,
    );
  }
}

class MusicbillState extends ChangeNotifier {
  bool loading = false;
  Exception? exception;
  List<Musicbill> musicbillList = [];
  final Map<String, DateTime> _musicbillLastEnteredAt = {};

  Future<void> reloadMusicbillList({required bool silence}) async {
    final shouldShowLoading = !silence || musicbillList.isEmpty;
    exception = null;
    if (shouldShowLoading) {
      loading = true;
      notifyListeners();
    }

    try {
      final data = await get_musicbill_list.getMusicbillList();
      final previousMusicbillMap = {
        for (final musicbill in musicbillList) musicbill.id: musicbill,
      };
      musicbillList = data.map((m) {
        final previousMusicbill = previousMusicbillMap[m.id];
        return Musicbill(
          id: m.id,
          name: m.name,
          cover: m.cover,
          isPublic: m.isPublic,
          isShared: m.isShared,
          musicList: previousMusicbill?.musicList ?? const [],
          status: previousMusicbill?.status ?? MusicbillStatus.INITIAL,
        );
      }).toList();
    } catch (e) {
      exception = e is Exception ? e : Exception(e.toString());
    }
    loading = false;
    notifyListeners();
  }

  Future<void> reloadMusicbill({
    required String id,
    bool silence = true,
  }) async {
    final existingMusicbill = getMusicbillById(id);
    if (!silence && existingMusicbill != null) {
      _upsertMusicbill(
        existingMusicbill.copyWith(status: MusicbillStatus.LOADING),
      );
    }

    try {
      final newMusicbill = await get_musicbill.getMusicbill(id: id);
      final refreshedMusicbill = Musicbill(
        id: id,
        name: newMusicbill.name,
        cover: newMusicbill.cover,
        isPublic: newMusicbill.isPublic,
        isShared: newMusicbill.isShared,
        musicList: List<Music>.from(newMusicbill.musicList),
        status: MusicbillStatus.SUCCESSFUL,
      );
      _upsertMusicbill(refreshedMusicbill);
    } catch (e) {
      if (existingMusicbill != null) {
        _upsertMusicbill(
          existingMusicbill.copyWith(status: MusicbillStatus.FAILED),
        );
      }
    }
  }

  bool shouldSilentlyRefreshOnEnter(String id) {
    final now = DateTime.now();
    final lastEnteredAt = _musicbillLastEnteredAt[id];
    _musicbillLastEnteredAt[id] = now;
    return lastEnteredAt == null ||
        now.difference(lastEnteredAt) > musicbillRefreshInterval;
  }

  Musicbill? getMusicbillById(String id) {
    try {
      return musicbillList.firstWhere((musicbill) => musicbill.id == id);
    } on StateError {
      return null;
    }
  }

  bool containsMusic({required String musicbillId, required String musicId}) {
    final musicbill = getMusicbillById(musicbillId);
    if (musicbill == null || musicbill.status != MusicbillStatus.SUCCESSFUL) {
      return false;
    }
    return musicbill.musicList.any((music) => music.id == musicId);
  }

  Future<void> addMusicToMusicbill({
    required String musicbillId,
    required Music music,
  }) async {
    final musicbill = getMusicbillById(musicbillId);
    if (musicbill == null ||
        musicbill.status != MusicbillStatus.SUCCESSFUL ||
        containsMusic(musicbillId: musicbillId, musicId: music.id)) {
      return;
    }

    final previousMusicList = musicbill.musicList;
    _upsertMusicbill(
      musicbill.copyWith(musicList: [music, ...previousMusicList]),
    );

    try {
      await add_music_to_musicbill.addMusicToMusicbill(
        musicbillId: musicbillId,
        musicId: music.id,
      );
    } catch (e) {
      if (e is ServerException && e.code == musicAlreadyExistedInMusicbill) {
        return;
      }
      _upsertMusicbill(musicbill.copyWith(musicList: previousMusicList));
      rethrow;
    }
  }

  Future<void> removeMusicFromMusicbill({
    required String musicbillId,
    required Music music,
  }) async {
    final musicbill = getMusicbillById(musicbillId);
    if (musicbill == null ||
        musicbill.status != MusicbillStatus.SUCCESSFUL ||
        !containsMusic(musicbillId: musicbillId, musicId: music.id)) {
      return;
    }

    final previousMusicList = musicbill.musicList;
    _upsertMusicbill(
      musicbill.copyWith(
        musicList: previousMusicList
            .where((existingMusic) => existingMusic.id != music.id)
            .toList(),
      ),
    );

    try {
      await remove_music_from_musicbill.removeMusicFromMusicbill(
        musicbillId: musicbillId,
        musicId: music.id,
      );
    } catch (e) {
      if (e is ServerException && e.code == musicNotExistedInMusicbill) {
        return;
      }
      _upsertMusicbill(musicbill.copyWith(musicList: previousMusicList));
      rethrow;
    }
  }

  void _upsertMusicbill(Musicbill nextMusicbill) {
    final musicbillIndex = musicbillList.indexWhere(
      (musicbill) => musicbill.id == nextMusicbill.id,
    );

    if (musicbillIndex == -1) {
      musicbillList = [nextMusicbill, ...musicbillList];
    } else {
      final nextMusicbillList = List<Musicbill>.from(musicbillList);
      nextMusicbillList[musicbillIndex] = nextMusicbill;
      musicbillList = nextMusicbillList;
    }

    notifyListeners();
  }
}

final musicbillState = MusicbillState();
