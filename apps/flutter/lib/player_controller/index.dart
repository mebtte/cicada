import 'package:cicada/player_controller/player_controller.dart';
import 'package:cicada/states/playqueue.dart';
import 'package:cicada/states/route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// musicbill 页面底部工具栏的高度
const double _musicbillBottomToolbarHeight = 52.0;
// search 页面底部工具栏的高度
const double _searchBottomToolbarHeight = 60.0;

class PlayerControllerContainer extends StatelessWidget {
  const PlayerControllerContainer({super.key});

  @override
  Widget build(BuildContext context) {
    final currentMusic = context.watch<PlayqueueState>().currentMusic;
    final currentRoute = context.watch<RouteState>().currentRoute;

    if (currentMusic == null) {
      return Container();
    }

    // 根据路由计算底部偏移量
    double bottomOffset = 0.0;
    if (currentRoute == '/musicbill') {
      bottomOffset = _musicbillBottomToolbarHeight;
    } else if (currentRoute == '/search') {
      bottomOffset = _searchBottomToolbarHeight;
    }

    return AnimatedPositioned(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      left: 0,
      right: 0,
      bottom: bottomOffset,
      child: PlayController(playqueueMusic: currentMusic),
    );
  }
}
