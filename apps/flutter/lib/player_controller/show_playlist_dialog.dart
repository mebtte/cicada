import 'package:flutter/material.dart';
import './playlist.dart';
import './playqueue.dart';

/// 显示播放列表/队列弹窗
/// [initialTabIndex] 0=播放列表, 1=播放队列
void showPlaylistDialog(BuildContext context, {int initialTabIndex = 1}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true, // 确保弹窗显示在播放控制器之上
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
            initialIndex: initialTabIndex,
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
                    Tab(text: "Playlist"),
                    Tab(text: "Playqueue"),
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
