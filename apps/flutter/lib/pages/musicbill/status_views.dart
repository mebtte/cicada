import 'package:flutter/material.dart';
import '../../widgets/error_view.dart';
import '../../states/musicbill.dart' as musicbill_state;

/// 加载中视图
class MusicbillLoadingView extends StatelessWidget {
  const MusicbillLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(
          Theme.of(context).primaryColor,
        ),
      ),
    );
  }
}

/// 错误视图
class MusicbillErrorView extends StatelessWidget {
  final String musicbillId;

  const MusicbillErrorView({super.key, required this.musicbillId});

  @override
  Widget build(BuildContext context) {
    return ErrorView(
      title: '加载音乐失败',
      onRetry: () {
        musicbill_state.musicbillState.reloadMusicbill(
          id: musicbillId,
          silence: false,
        );
      },
    );
  }
}

/// 空数据视图
class MusicbillEmptyView extends StatelessWidget {
  const MusicbillEmptyView({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.music_note_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No music yet',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
