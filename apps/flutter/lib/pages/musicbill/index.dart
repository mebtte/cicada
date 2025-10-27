import 'package:cicada/states/playlist.dart';
import 'package:uuid/uuid.dart';
import '../../utils/get_musicbill_by_id.dart';
import '../../states/musicbill.dart' as musicbill_state;
import 'package:flutter/material.dart';

const uuid = Uuid();

class Musicbill extends StatefulWidget {
  const Musicbill({super.key});

  @override
  State<Musicbill> createState() => _MusicbillState();
}

class _MusicbillState extends State<Musicbill> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id =
          (ModalRoute.of(context)!.settings.arguments
              as Map<String, String>)['id']!;
      final musicbill = musicbill_state.musicbillState.musicbillList.firstWhere(
        (m) => m.id == id,
      );
      if (musicbill.status != musicbill_state.MusicbillStatus.LOADING) {
        Future.delayed(
          Duration.zero,
          () => musicbill_state.musicbillState.reloadMusicbill(
            id: id,
            silence:
                musicbill.status == musicbill_state.MusicbillStatus.SUCCESSFUL,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final id =
        (ModalRoute.of(context)!.settings.arguments
            as Map<String, String>)['id']!;
    final musicbill = useMusicbillById(context, id);
    return Scaffold(
      appBar: AppBar(title: Text(musicbill.name)),
      body: Column(
        children: [
          if (musicbill.musicList.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: musicbill.musicList.length,
                itemBuilder: (context, index) {
                  final music = musicbill.musicList[index];
                  return ListTile(
                    leading: const Icon(Icons.music_note_outlined),
                    title: Text(music.name),
                    onTap: () {
                      playlistState.addMusicList([
                        PlaylistMusic(
                          pid: uuid.v4(),
                          id: music.id,
                          name: music.name,
                          asset: music.asset,
                        ),
                      ]);
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
