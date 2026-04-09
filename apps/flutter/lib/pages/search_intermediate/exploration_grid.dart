import 'package:flutter/material.dart';
import '../../server/api/get_exploration.dart';
import '../../widgets/player_bottom_spacer.dart';
import './cards/music_card.dart';
import './cards/singer_card.dart';
import './cards/musicbill_card.dart';

class ExplorationGrid extends StatelessWidget {
  final ExplorationData data;
  final double bottomToolbarHeight;

  const ExplorationGrid({
    super.key,
    required this.data,
    required this.bottomToolbarHeight,
  });

  @override
  Widget build(BuildContext context) {
    final allItems = _getAllItems();

    return SafeArea(
      bottom: false,
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.75,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => allItems[index],
                childCount: allItems.length,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: PlayerBottomSpacer(extraHeight: bottomToolbarHeight),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
        ],
      ),
    );
  }

  List<Widget> _getAllItems() {
    final allItems = <Widget>[];

    for (final music in data.musicList) {
      allItems.add(MusicCard(music: music));
    }
    for (final singer in data.singerList) {
      allItems.add(SingerCard(singer: singer));
    }
    for (final musicbill in data.publicMusicbillList) {
      allItems.add(MusicbillCard(musicbill: musicbill));
    }
    allItems.shuffle();
    return allItems;
  }
}
