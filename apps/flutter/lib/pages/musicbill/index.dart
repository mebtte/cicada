import 'package:uuid/uuid.dart';
import 'package:flutter/material.dart';
import '../../utils/get_musicbill_by_id.dart';
import '../../states/musicbill.dart' as musicbill_state;
import '../../event_bus.dart';
import './actions.dart' as actions;
import '../../widgets/player_bottom_spacer.dart';

const uuid = Uuid();

class Musicbill extends StatefulWidget {
  final String id;

  const Musicbill({super.key, required this.id});

  @override
  State<Musicbill> createState() => _MusicbillState();
}

class _MusicbillState extends State<Musicbill> {
  @override
  void initState() {
    super.initState();
    final musicbill = musicbill_state.musicbillState.musicbillList.firstWhere(
      (m) => m.id == widget.id,
    );
    if (musicbill.status != musicbill_state.MusicbillStatus.LOADING) {
      Future.delayed(
        Duration.zero,
        () => musicbill_state.musicbillState.reloadMusicbill(
          id: widget.id,
          silence:
              musicbill.status == musicbill_state.MusicbillStatus.SUCCESSFUL,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final musicbill = useMusicbillById(context, widget.id);
    final empty = musicbill.musicList.isEmpty;
    return Scaffold(
      appBar: AppBar(title: Text(musicbill.name)),
      body: Column(
        children: [
          actions.Actions(musicbill: musicbill),
          if (empty)
            Expanded(child: Center(child: Text("No Music")))
          else
            Expanded(
              child: ListView.builder(
                itemCount: musicbill.musicList.length + 1,
                itemBuilder: (context, index) {
                  if (index == musicbill.musicList.length) {
                    return const PlayerBottomSpacer();
                  }
                  final music = musicbill.musicList[index];
                  return ListTile(
                    leading: const Icon(Icons.music_note_outlined),
                    title: Text(music.name),
                    onTap: () {
                      eventBus.fire(PlayMusicEvent(music: music));
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
