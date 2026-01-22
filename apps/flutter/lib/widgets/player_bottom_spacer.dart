import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../states/playqueue.dart';

/// 播放器底部留白组件
/// 当有音乐播放显示播放器时，提供相应高度的留白，防止内容被遮挡
class PlayerBottomSpacer extends StatelessWidget {
  const PlayerBottomSpacer({super.key});

  @override
  Widget build(BuildContext context) {
    final currentMusic = context.watch<PlayqueueState>().currentMusic;
    if (currentMusic == null) return const SizedBox.shrink();

    // 播放器高度 54 + margin bottom 8 + extra spacing 20
    return const SizedBox(height: 82);
  }
}
