import 'package:cicada/models/music.dart';
import 'package:cicada/models/singer.dart';
import '../server/api/get_musicbill.dart' as get_musicbill;
import '../server/api/get_musicbill_list.dart';
import 'package:flutter/material.dart';

enum MusicbillStatus { INITIAL, LOADING, SUCCESSFUL, FAILED }

class Musicbill {
  String id;
  String name;
  String? cover;

  List<Music> musicList = [];
  MusicbillStatus status = MusicbillStatus.INITIAL;

  Musicbill({
    required this.id,
    required this.name,
    required this.cover,

    this.musicList = const [],
    this.status = MusicbillStatus.INITIAL,
  });
}

class MusicbillState extends ChangeNotifier {
  bool loading = false;
  Exception? exception;
  List<Musicbill> musicbillList = [];

  void reloadMusicbillList({required bool silence}) async {
    exception = null;
    loading = true;
    notifyListeners();

    try {
      final data = await getMusicbillList();
      musicbillList = data
          .map((m) => Musicbill(id: m.id, name: m.name, cover: m.cover))
          .toList();
    } catch (e) {
      exception = e as Exception;
    }
    loading = false;
    notifyListeners();
  }

  void reloadMusicbill({required String id, bool silence = true}) async {
    if (!silence) {
      musicbillList = musicbillList.map((musicbill) {
        if (musicbill.id == id) {
          musicbill.status = MusicbillStatus.LOADING;
        }
        return musicbill;
      }).toList();
      notifyListeners();
    }
    try {
      final newMusicbill = await get_musicbill.getMusicbill(id: id);
      musicbillList = musicbillList.map((musicbill) {
        if (musicbill.id == id) {
          return Musicbill(
            id: id,
            name: newMusicbill.name,
            cover: newMusicbill.cover,

            musicList: newMusicbill.musicList
                .map(
                  (music) => Music(
                    id: music.id,
                    name: music.name,
                    cover: music.cover,
                    asset: music.asset,
                    type: music.type,
                    singers: music.singers
                        .map(
                          (s) => Singer(
                            id: s.id,
                            name: s.name,
                            aliases: s.aliases,
                            avatar: s.avatar,
                          ),
                        )
                        .toList(),
                  ),
                )
                .toList(),
            status: MusicbillStatus.SUCCESSFUL,
          );
        }
        return musicbill;
      }).toList();
      notifyListeners();
    } catch (e) {
      /**
       * @todo notification
       * @author mebtte<i@mebtte.com>
       */
      musicbillList = musicbillList.map((musicbill) {
        if (musicbill.id == id) {
          musicbill.status = MusicbillStatus.FAILED;
        }
        return musicbill;
      }).toList();
      notifyListeners();
    }
  }
}

final musicbillState = MusicbillState();
