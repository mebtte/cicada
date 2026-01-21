import '../request.dart';

/// 创建音乐清单
///
/// 参数:
/// - name: 音乐清单名称
///
/// 返回:
/// - 创建成功的音乐清单 ID
Future<String> createMusicbill({required String name}) async {
  final responseData = await httpPost(
    path: "/api/musicbill",
    data: {"name": name},
    withToken: true,
  );
  // 服务器直接返回 ID 字符串
  return responseData as String;
}
