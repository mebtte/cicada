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

    return Container(
      margin: const EdgeInsets.all(16),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              _buildAvatar(context),
              const SizedBox(width: 20),
              _buildUserDetails(context),
            ],
          ),
        ),
      ),
    );
  }

  /// 构建用户头像
  Widget _buildAvatar(BuildContext context) {
    return CircleAvatar(
      radius: 40,
      backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
      backgroundImage: user!.avatar != null && user!.avatar!.isNotEmpty
          ? NetworkImage(user!.avatar!)
          : null,
      child: user!.avatar == null || user!.avatar!.isEmpty
          ? Icon(Icons.person, size: 40, color: Theme.of(context).primaryColor)
          : null,
    );
  }

  /// 构建用户详细信息
  Widget _buildUserDetails(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildNickname(context),
          const SizedBox(height: 4),
          _buildUsername(context),
          if (server != null) ...[
            const SizedBox(height: 8),
            _buildServerInfo(context),
          ],
        ],
      ),
    );
  }

  /// 构建昵称
  Widget _buildNickname(BuildContext context) {
    return Text(
      user!.nickname,
      style: Theme.of(
        context,
      ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
      overflow: TextOverflow.ellipsis,
    );
  }

  /// 构建用户名
  Widget _buildUsername(BuildContext context) {
    return Text(
      '@${user!.username}',
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
      overflow: TextOverflow.ellipsis,
    );
  }

  /// 构建服务器信息
  Widget _buildServerInfo(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.cloud, size: 16, color: Colors.grey[500]),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            server!.hostname,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.grey[500]),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
