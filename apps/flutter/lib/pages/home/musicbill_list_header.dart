import 'package:flutter/material.dart';
import './create_musicbill_dialog.dart';

/// 音乐清单列表标题栏组件
/// 显示标题、数量徽章和添加按钮
class MusicbillListHeader extends StatelessWidget {
  final int count;

  const MusicbillListHeader({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
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
          _buildCountBadge(context),
          const Spacer(),
          _buildAddButton(context),
        ],
      ),
    );
  }

  /// 构建数量徽章
  Widget _buildCountBadge(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$count',
        style: TextStyle(
          color: Theme.of(context).primaryColor,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    );
  }

  /// 构建添加按钮
  Widget _buildAddButton(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.add),
      onPressed: () => _showCreateDialog(context),
      tooltip: 'Create musicbill',
    );
  }

  /// 显示创建音乐清单对话框
  void _showCreateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const CreateMusicbillDialog(),
    );
  }
}
