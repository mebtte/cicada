import 'package:flutter/material.dart';
import '../../states/musicbill.dart';
import '../../widgets/cached_image.dart';

/// 音乐清单卡片组件
/// 显示单个音乐清单的信息（封面、名称）
class MusicbillCard extends StatelessWidget {
  final Musicbill musicbill;

  const MusicbillCard({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.pushNamed(
            context,
            "/musicbill",
            arguments: {"id": musicbill.id},
          ),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                _buildCover(context),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        musicbill.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (musicbill.status == MusicbillStatus.SUCCESSFUL) ...[
                        const SizedBox(height: 2),
                        Text(
                          '${musicbill.musicList.length} tracks',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.black54,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: Colors.grey[400], size: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// 构建封面
  Widget _buildCover(BuildContext context) {
    if (musicbill.cover != null && musicbill.cover!.isNotEmpty) {
      return CachedImage(
        imageUrl: musicbill.cover,
        width: 44,
        height: 44,
        size: 88, // 2x for high DPI screens
        borderRadius: BorderRadius.circular(8),
        placeholder: _buildDefaultCover(context),
        errorWidget: _buildDefaultCover(context),
      );
    }

    return _buildDefaultCover(context);
  }

  /// 构建默认封面
  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        Icons.library_music_rounded,
        color: Theme.of(context).primaryColor.withValues(alpha: 0.8),
        size: 22,
      ),
    );
  }
}
