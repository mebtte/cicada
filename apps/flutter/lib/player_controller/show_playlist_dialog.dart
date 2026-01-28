import 'package:flutter/material.dart';
import './playlist.dart';
import './playqueue.dart';

void showPlaylistDialog(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return FractionallySizedBox(
        heightFactor: 0.8,
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: DefaultTabController(
            length: 2,
            initialIndex: 1,
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 8, bottom: 4),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const TabBar(
                  tabs: [
                    Tab(text: "播放列表"),
                    Tab(text: "播放队列"),
                  ],
                ),
                Expanded(
                  child: TabBarView(children: [Playlist(), Playqueue()]),
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}
