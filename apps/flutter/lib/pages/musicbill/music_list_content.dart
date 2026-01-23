import 'package:flutter/material.dart';
import '../../states/musicbill.dart';
import '../../event_bus.dart';
import './music_list_item.dart';
import '../../widgets/player_bottom_spacer.dart';

class MusicListContent extends StatelessWidget {
  final Musicbill musicbill;
  final double bottomToolbarHeight;

  const MusicListContent({
    super.key,
    required this.musicbill,
    required this.bottomToolbarHeight,
  });

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate((context, index) {
          if (index == musicbill.musicList.length) {
            // 为底部工具栏和播放器控制器留出空间
            return PlayerBottomSpacer(extraHeight: bottomToolbarHeight);
          }
          final music = musicbill.musicList[index];
          return MusicListItem(
            music: music,
            onTap: () {
              eventBus.fire(PlayMusicEvent(music: music));
            },
          );
        }, childCount: musicbill.musicList.length + 1),
      ),
    );
  }
}
