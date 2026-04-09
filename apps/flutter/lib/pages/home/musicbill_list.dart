import 'package:flutter/material.dart';
import '../../states/musicbill.dart';
import './musicbill_card.dart';

import '../../widgets/error_view.dart';
import '../../widgets/player_bottom_spacer.dart';

/// 音乐清单列表组件
/// 显示用户的所有音乐清单，支持空状态展示和加载状态
class MusicbillList extends StatelessWidget {
  final List<Musicbill> musicbillList;
  final bool isLoading;
  final Exception? exception;
  final VoidCallback? onRetry;

  const MusicbillList({
    super.key,
    required this.musicbillList,
    this.isLoading = false,
    this.exception,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (exception != null && onRetry != null) {
      return SliverFillRemaining(
        child: ErrorView(errorMessage: exception.toString(), onRetry: onRetry!),
      );
    }

    if (musicbillList.isEmpty) {
      return SliverFillRemaining(child: _buildEmptyStateContent(context));
    }

    return SliverPadding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: MediaQuery.of(context).padding.bottom,
      ),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate((context, index) {
          if (index == musicbillList.length) {
            return const PlayerBottomSpacer();
          }
          final musicbill = musicbillList[index];
          return MusicbillCard(musicbill: musicbill);
        }, childCount: musicbillList.length + 1),
      ),
    );
  }

  /// 构建空状态内容
  Widget _buildEmptyStateContent(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.library_music_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No musicbills yet',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
