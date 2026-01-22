import 'package:flutter/material.dart';
import '../../states/musicbill.dart';
import './musicbill_card.dart';
import './musicbill_list_header.dart';
import '../../widgets/player_bottom_spacer.dart';

/// 音乐清单列表组件
/// 显示用户的所有音乐清单，支持空状态展示和加载状态
class MusicbillList extends StatelessWidget {
  final List<Musicbill> musicbillList;
  final bool isLoading;

  const MusicbillList({
    super.key,
    required this.musicbillList,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          MusicbillListHeader(count: musicbillList.length),
          if (isLoading)
            _buildLoadingState()
          else if (musicbillList.isEmpty)
            _buildEmptyState(context)
          else
            _buildList(context),
        ],
      ),
    );
  }

  /// 构建列表
  Widget _buildList(BuildContext context) {
    return Expanded(
      child: ListView.builder(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: MediaQuery.of(context).padding.bottom,
        ),
        itemCount: musicbillList.length + 1,
        itemBuilder: (context, index) {
          if (index == musicbillList.length) {
            return const PlayerBottomSpacer();
          }
          final musicbill = musicbillList[index];
          return MusicbillCard(musicbill: musicbill);
        },
      ),
    );
  }

  /// 构建加载状态
  Widget _buildLoadingState() {
    return const Expanded(child: Center(child: CircularProgressIndicator()));
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
}
