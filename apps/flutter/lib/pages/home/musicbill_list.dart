import 'package:flutter/material.dart';
import '../../states/musicbill.dart';
import './create_musicbill_dialog.dart';

/// 音乐清单列表组件
/// 显示用户的所有音乐清单，支持空状态展示
class MusicbillList extends StatelessWidget {
  final List<Musicbill> musicbillList;

  const MusicbillList({super.key, required this.musicbillList});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          _buildHeader(context),
          if (musicbillList.isEmpty)
            _buildEmptyState(context)
          else
            _buildList(context),
        ],
      ),
    );
  }

  /// 构建标题栏
  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Text(
            'My Musicbills',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${musicbillList.length}',
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateDialog(context),
            tooltip: 'Create musicbill',
          ),
        ],
      ),
    );
  }

  /// 显示创建音乐清单对话框
  void _showCreateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const CreateMusicbillDialog(),
    );
  }

  /// 构建列表
  Widget _buildList(BuildContext context) {
    return Expanded(
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: musicbillList.length,
        itemBuilder: (context, index) {
          final musicbill = musicbillList[index];
          return _buildMusicbillCard(context, musicbill);
        },
      ),
    );
  }

  /// 构建空状态
  Widget _buildEmptyState(BuildContext context) {
    return Expanded(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.library_music_outlined,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No musicbills yet',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建音乐清单卡片
  Widget _buildMusicbillCard(BuildContext context, Musicbill musicbill) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: _buildCover(context, musicbill),
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
  Widget _buildCover(BuildContext context, Musicbill musicbill) {
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
