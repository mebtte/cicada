import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../states/server.dart';

/// 用户个人资料页面
/// 显示用户信息和提供退出登录功能
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final currentUser = context.watch<ServerState>().currentUser;
    final currentServer = context.watch<ServerState>().currentServer;

    if (currentUser == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: const Center(child: Text('No user logged in')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        children: [
          _buildUserHeader(context, currentUser, currentServer),
          const Divider(),
          _buildUserInfo(context, currentUser, currentServer),
          const Divider(),
          _buildActions(context),
        ],
      ),
    );
  }

  /// 构建用户头部
  Widget _buildUserHeader(BuildContext context, User user, Server? server) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
            backgroundImage: user.avatar != null && user.avatar!.isNotEmpty
                ? NetworkImage(user.avatar!)
                : null,
            child: user.avatar == null || user.avatar!.isEmpty
                ? Icon(
                    Icons.person,
                    size: 50,
                    color: Theme.of(context).primaryColor,
                  )
                : null,
          ),
          const SizedBox(height: 16),
          Text(
            user.nickname,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            '@${user.username}',
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  /// 构建用户信息列表
  Widget _buildUserInfo(BuildContext context, User user, Server? server) {
    return Column(
      children: [
        ListTile(
          leading: const Icon(Icons.cloud),
          title: const Text('Server'),
          subtitle: Text(server?.hostname ?? 'Unknown'),
        ),
        ListTile(
          leading: const Icon(Icons.link),
          title: const Text('Server URL'),
          subtitle: Text(server?.origin ?? 'Unknown'),
        ),
        ListTile(
          leading: const Icon(Icons.security),
          title: const Text('Two-Factor Authentication'),
          subtitle: Text(user.twoFAEnabled ? 'Enabled' : 'Disabled'),
          trailing: user.twoFAEnabled
              ? const Icon(Icons.check_circle, color: Colors.green)
              : const Icon(Icons.cancel, color: Colors.grey),
        ),
      ],
    );
  }

  /// 构建操作按钮
  Widget _buildActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          OutlinedButton.icon(
            onPressed: () => _showLogoutDialog(context),
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              side: const BorderSide(color: Colors.red),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  /// 显示退出登录确认对话框
  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              // 关闭对话框
              Navigator.of(dialogContext).pop();
              // 返回到根路由
              Navigator.of(context).popUntil((route) => route.isFirst);
              // 退出登录（这会触发 App 重新构建并显示登录页面）
              serverState.reselectUser();
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
