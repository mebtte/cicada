import 'package:cicada/event_bus.dart';
import 'package:cicada/states/musicbill.dart';
import 'package:flutter/material.dart';

class Actions extends StatelessWidget {
  final Musicbill musicbill;
  const Actions({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Row(
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: musicbill.musicList.isNotEmpty
                  ? () {
                      eventBus.fire(
                        AddMusicListToPlaylistEvent(
                          musicList: musicbill.musicList,
                        ),
                      );
                    }
                  : null,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: musicbill.musicList.isNotEmpty
                      ? Theme.of(context).primaryColor.withValues(alpha: 0.08)
                      : Colors.grey.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.playlist_add,
                  color: musicbill.musicList.isNotEmpty
                      ? Theme.of(context).primaryColor
                      : Colors.grey,
                  size: 20,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Add all to playlist',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: musicbill.musicList.isNotEmpty
                  ? Colors.black87
                  : Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
}
