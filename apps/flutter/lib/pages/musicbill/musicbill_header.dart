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
      aspectRatio: 1.0,
      child: Container(
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
            // 顶部渐变遮罩
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.5),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            // 底部渐变遮罩 (融入背景)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Theme.of(
                        context,
                      ).scaffoldBackgroundColor.withValues(alpha: 0.0),
                      Theme.of(context).scaffoldBackgroundColor,
                    ],
                    stops: const [0.5, 1.0],
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
        fontSize: 24, // Slightly larger for better impact
        fontWeight: FontWeight.w800,
        color: Colors.black87, // Changed to dark
        height: 1.2,
      ),
      overflow: TextOverflow.ellipsis,
      maxLines: 2,
    );
  }

  /// 构建音乐数量
  Widget _buildMusicCount(BuildContext context) {
    return Row(
      children: [
        Icon(
          Icons.music_note_rounded,
          size: 16,
          color: Theme.of(context).primaryColor,
        ),
        const SizedBox(width: 6),
        Text(
          '${musicbill.musicList.length} tracks',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.black.withValues(alpha: 0.6), // Darker grey
          ),
        ),
      ],
    );
  }
}
