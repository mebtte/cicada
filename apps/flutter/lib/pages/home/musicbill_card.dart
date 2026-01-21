import 'package:flutter/material.dart';
import '../../states/musicbill.dart';

/// 音乐清单卡片组件
/// 显示单个音乐清单的信息（封面、名称）
class MusicbillCard extends StatelessWidget {
  final Musicbill musicbill;

  const MusicbillCard({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: _buildCover(context),
        title: Text(
          musicbill.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.pushNamed(
          context,
          "/musicbill",
          arguments: {"id": musicbill.id},
        ),
      ),
    );
  }

  /// 构建封面
  Widget _buildCover(BuildContext context) {
    if (musicbill.cover != null && musicbill.cover!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          musicbill.cover!,
          width: 56,
          height: 56,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildDefaultCover(context);
          },
        ),
      );
    }

    return _buildDefaultCover(context);
  }

  /// 构建默认封面
  Widget _buildDefaultCover(BuildContext context) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(Icons.library_music, color: Theme.of(context).primaryColor),
    );
  }
}
