import 'package:flutter/material.dart';
import '../../states/musicbill.dart';

/// 音乐清单详情页头部组件
/// 显示封面、名称和音乐数量
class MusicbillHeader extends StatelessWidget {
  final Musicbill musicbill;

  const MusicbillHeader({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1.6,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Stack(
          children: [
            // 背景封面
            Positioned.fill(child: _buildBackgroundCover(context)),
            // 渐变遮罩
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.0),
                      Colors.black.withValues(alpha: 0.3),
                      Colors.black.withValues(alpha: 0.6),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),
            // 内容层
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: _buildMusicbillDetails(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建背景封面
  Widget _buildBackgroundCover(BuildContext context) {
    if (musicbill.cover != null && musicbill.cover!.isNotEmpty) {
      return Image.network(
        musicbill.cover!,
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildDefaultBackground(context);
        },
      );
    }
    return _buildDefaultBackground(context);
  }

  /// 构建默认背景
  Widget _buildDefaultBackground(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor.withValues(alpha: 0.3),
            Theme.of(context).primaryColor.withValues(alpha: 0.1),
          ],
        ),
      ),
      child: Icon(
        Icons.library_music_rounded,
        size: 60,
        color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
      ),
    );
  }

  /// 构建音乐清单详细信息
  Widget _buildMusicbillDetails(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildName(context),
        const SizedBox(height: 6),
        _buildMusicCount(context),
      ],
    );
  }

  /// 构建名称
  Widget _buildName(BuildContext context) {
    return Text(
      musicbill.name,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        shadows: [
          Shadow(color: Colors.black54, blurRadius: 12, offset: Offset(0, 2)),
        ],
      ),
      overflow: TextOverflow.ellipsis,
      maxLines: 2,
    );
  }

  /// 构建音乐数量
  Widget _buildMusicCount(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.music_note_outlined, size: 14, color: Colors.white),
        const SizedBox(width: 6),
        Text(
          '${musicbill.musicList.length} tracks',
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white,
            shadows: [
              Shadow(
                color: Colors.black45,
                blurRadius: 8,
                offset: Offset(0, 1),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
