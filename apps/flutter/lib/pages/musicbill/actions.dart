import 'package:cicada/event_bus.dart';
import 'package:cicada/states/musicbill.dart';
import 'package:flutter/material.dart';

class Actions extends StatelessWidget {
  final Musicbill musicbill;
  const Actions({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsetsGeometry.all(10),
      child: Row(
        children: [
          IconButton(
            onPressed: musicbill.musicList.isNotEmpty
                ? () {
                    eventBus.fire(
                      AddMusicListToPlaylistEvent(
                        musicList: musicbill.musicList,
                      ),
                    );
                  }
                : null,
            icon: Icon(Icons.playlist_add),
          ),
        ],
      ),
    );
  }
}
