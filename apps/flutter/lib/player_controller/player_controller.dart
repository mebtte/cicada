import 'dart:ui';
import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import './actions.dart' as actions;
import './cover.dart';
import './info.dart';

import '../pages/player/index.dart';

class PlayController extends StatelessWidget {
  static const double kContentHeight = 54.0;
  static const double kMargin = 6.0;

  /// 播放器总高度（包含上下边距，但不包含 SafeArea）
  /// 实际高度通常还需要加上 MediaQuery.of(context).padding.bottom
  static const double kTotalHeight = kContentHeight + kMargin * 2;

  final PlayqueueMusic playqueueMusic;

  const PlayController({super.key, required this.playqueueMusic});

  @override
  Widget build(BuildContext context) {
    final music = playqueueMusic.music;
    const borderRadius = kContentHeight / 2;

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const PlayerDetailPage(),
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
                  const begin = Offset(0.0, 1.0);
                  const end = Offset.zero;
                  const curve = Curves.ease;

                  var tween = Tween(
                    begin: begin,
                    end: end,
                  ).chain(CurveTween(curve: curve));

                  return SlideTransition(
                    position: animation.drive(tween),
                    child: child,
                  );
                },
          ),
        );
      },
      child: Container(
        margin: EdgeInsets.fromLTRB(
          kMargin,
          kMargin,
          kMargin,
          kMargin + MediaQuery.of(context).padding.bottom,
        ),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 16,
              offset: const Offset(0, -4),
              spreadRadius: 0,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              height: kContentHeight,
              padding: const EdgeInsets.symmetric(
                horizontal: kMargin,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(borderRadius),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  // 封面
                  RotatingCover(coverUrl: music.cover),

                  const SizedBox(width: 8),

                  // 歌曲信息
                  Expanded(child: MusicInfo(music: music)),

                  const SizedBox(width: 4),

                  // 操作按钮
                  actions.Actions(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
