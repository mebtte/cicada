import 'dart:ui';
import 'package:cicada/states/playqueue.dart';
import 'package:flutter/material.dart';
import './actions.dart' as actions;

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
    final cover = music.cover;

    return Container(
      margin: EdgeInsets.fromLTRB(
        kMargin,
        kMargin,
        kMargin,
        kMargin + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 16,
            offset: Offset(0, -4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            height: kContentHeight,
            padding: const EdgeInsets.all(kMargin),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                // 封面
                if (cover != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: Image.network(
                        cover,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return _buildDefaultCover(context);
                        },
                      ),
                    ),
                  )
                else
                  _buildDefaultCover(context),

                const SizedBox(width: 8),

                // 歌曲信息
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        music.name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.normal,
                          color: Colors.black87,
                          height: 1.2,
                          decoration: TextDecoration.none,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        music.singers.isEmpty
                            ? 'Unknown singers'
                            : music.singers.map((s) => s.name).join(', '),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.normal,
                          color: Colors.black54,
                          height: 1.2,
                          decoration: TextDecoration.none,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 4),

                // 操作按钮
                actions.Actions(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// 构建默认封面
  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(
        Icons.music_note,
        color: Theme.of(context).primaryColor,
        size: 20,
      ),
    );
  }
}
