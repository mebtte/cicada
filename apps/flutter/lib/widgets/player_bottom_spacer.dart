import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../states/playqueue.dart';

/// 播放器底部留白组件
/// 当有音乐播放显示播放器时，提供相应高度的留白，防止内容被遮挡
class PlayerBottomSpacer extends StatelessWidget {
  /// 额外的高度，用于页面有自己的底部工具栏时
  final double extraHeight;

  const PlayerBottomSpacer({super.key, this.extraHeight = 0});

  @override
  Widget build(BuildContext context) {
    final currentMusic = context.watch<PlayqueueState>().currentMusic;

    // 播放器高度 54 + margin bottom 8 + extra spacing 20
    final playerHeight = currentMusic == null ? 0.0 : 82.0;
    final totalHeight = playerHeight + extraHeight;

    if (totalHeight == 0) return const SizedBox.shrink();

    return SizedBox(height: totalHeight);
  }
}
