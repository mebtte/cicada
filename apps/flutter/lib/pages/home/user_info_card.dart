import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../states/server.dart';
import '../../utils/get_resized_image_url.dart';

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
      aspectRatio: 1.5,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
        ),
        clipBehavior: Clip.hardEdge,
        child: Stack(
          children: [
            // 背景头像（从右侧逐渐显现）
            Positioned.fill(child: _buildBackgroundAvatar(context)),
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
            // 底部渐变遮罩（从上到下，融入背景）
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
      return CachedNetworkImage(
        imageUrl: getResizedImageUrl(user!.avatar!, 400), // Background avatar
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.cover,
        placeholder: (_, __) => _buildDefaultBackground(context),
        errorWidget: (_, __, ___) => _buildDefaultBackground(context),
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
      ],
    );
  }

  /// 构建昵称
  Widget _buildNickname(BuildContext context) {
    return Text(
      user!.nickname,
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        color: Colors.black87,
        height: 1.2,
      ),
      overflow: TextOverflow.ellipsis,
    );
  }

  /// 构建用户名
  Widget _buildUsername(BuildContext context) {
    return Text(
      '${user!.username}@${server!.hostname}',
      style: TextStyle(
        fontSize: 14,
        color: Colors.black.withValues(alpha: 0.6),
        fontWeight: FontWeight.w600,
      ),
      overflow: TextOverflow.ellipsis,
    );
  }
}
