import 'package:flutter/material.dart';
import '../../states/server.dart';

/// 用户信息卡片组件
/// 显示用户头像、昵称、用户名和服务器信息
class UserInfoCard extends StatelessWidget {
  final User? user;
  final Server? server;

  const UserInfoCard({super.key, required this.user, required this.server});

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return const SizedBox.shrink();
    }

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
            // 背景头像（从右侧逐渐显现）
            Positioned.fill(child: _buildBackgroundAvatar(context)),
            // 渐变遮罩（从上到下，顶部透明到底部不透明）
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
                child: _buildUserDetails(context),
              ),
            ),
            // 交互层 (水波纹)
            Positioned.fill(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => Navigator.pushNamed(context, '/profile'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建背景头像
  Widget _buildBackgroundAvatar(BuildContext context) {
    if (user!.avatar != null && user!.avatar!.isNotEmpty) {
      return Image.network(
        user!.avatar!,
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
        Icons.person_rounded,
        size: 60,
        color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
      ),
    );
  }

  /// 构建用户详细信息
  Widget _buildUserDetails(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildNickname(context),
        const SizedBox(height: 2),
        _buildUsername(context),
        if (server != null) ...[
          const SizedBox(height: 6),
          _buildServerInfo(context),
        ],
      ],
    );
  }

  /// 构建昵称
  Widget _buildNickname(BuildContext context) {
    return Text(
      user!.nickname,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        shadows: [
          Shadow(color: Colors.black54, blurRadius: 12, offset: Offset(0, 2)),
        ],
      ),
      overflow: TextOverflow.ellipsis,
    );
  }

  /// 构建用户名
  Widget _buildUsername(BuildContext context) {
    return Text(
      '@${user!.username}',
      style: const TextStyle(
        fontSize: 14,
        color: Colors.white,
        shadows: [
          Shadow(color: Colors.black54, blurRadius: 10, offset: Offset(0, 1)),
        ],
      ),
      overflow: TextOverflow.ellipsis,
    );
  }

  /// 构建服务器信息
  Widget _buildServerInfo(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.cloud_outlined, size: 14, color: Colors.white),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            server!.hostname,
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
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
