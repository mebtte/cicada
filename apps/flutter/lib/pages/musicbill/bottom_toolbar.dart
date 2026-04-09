import 'package:flutter/material.dart';
import '../../states/musicbill.dart';
import '../../widgets/safe_tooltip.dart';
import '../../event_bus.dart';
import '../../player_controller/show_playlist_dialog.dart';

/// 音乐清单底部工具栏组件
/// 提供返回按钮和添加全部到播放列表功能
class BottomToolbar extends StatelessWidget {
  final Musicbill musicbill;

  const BottomToolbar({super.key, required this.musicbill});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _buildBackButton(context),
              const Spacer(),
              _buildAddAllButton(context),
            ],
          ),
        ),
      ),
    );
  }

  /// 构建返回按钮
  Widget _buildBackButton(BuildContext context) {
    return SafeTooltip(
      message: 'Back',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.pop(context),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.arrow_back, color: Colors.black87, size: 20),
          ),
        ),
      ),
    );
  }

  /// 构建添加全部按钮
  Widget _buildAddAllButton(BuildContext context) {
    final isEnabled = musicbill.musicList.isNotEmpty;

    return SafeTooltip(
      message: isEnabled ? 'Add all to playlist' : 'No music to add',
      alignment: TooltipAlignment.right,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isEnabled
              ? () {
                  eventBus.fire(
                    AddMusicListToPlaylistEvent(musicList: musicbill.musicList),
                  );
                  // 显示播放列表弹窗，定位到播放列表 tab
                  showPlaylistDialog(context, initialTabIndex: 0);
                }
              : null,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isEnabled
                  ? Theme.of(context).primaryColor
                  : Colors.grey.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.playlist_add,
              color: isEnabled ? Colors.white : Colors.grey,
              size: 20,
            ),
          ),
        ),
      ),
    );
  }
}
