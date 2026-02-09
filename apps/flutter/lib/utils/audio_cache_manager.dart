import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:just_audio/just_audio.dart';

/// 音频缓存管理器
///
/// 管理音频文件的本地缓存，避免重复下载
class AudioCacheManager {
  static AudioCacheManager? _instance;
  static AudioCacheManager get instance => _instance ??= AudioCacheManager._();

  AudioCacheManager._();

  Directory? _cacheDir;

  /// 初始化缓存目录
  Future<void> init() async {
    final appDir = await getApplicationCacheDirectory();
    _cacheDir = Directory('${appDir.path}/audio_cache');
    if (!await _cacheDir!.exists()) {
      await _cacheDir!.create(recursive: true);
    }
  }

  /// 获取缓存目录
  Directory get cacheDir {
    if (_cacheDir == null) {
      throw StateError('AudioCacheManager not initialized. Call init() first.');
    }
    return _cacheDir!;
  }

  /// 根据音乐 ID 获取缓存文件路径
  File getCacheFile(String musicId) {
    return File('${cacheDir.path}/$musicId.cache');
  }

  /// 检查音乐是否已缓存
  Future<bool> isCached(String musicId) async {
    final file = getCacheFile(musicId);
    return await file.exists();
  }

  /// 获取缓存的音频源
  ///
  /// 如果已缓存，返回本地文件源；否则返回带缓存的网络源
  AudioSource getAudioSource(String musicId, String url) {
    final cacheFile = getCacheFile(musicId);

    // 使用 LockCachingAudioSource 来缓存音频
    // 如果缓存文件存在，它会直接从缓存读取
    // 如果不存在，它会边下载边播放，同时保存到缓存文件
    return LockCachingAudioSource(Uri.parse(url), cacheFile: cacheFile);
  }

  /// 清除所有缓存
  Future<void> clearCache() async {
    if (await cacheDir.exists()) {
      await cacheDir.delete(recursive: true);
      await cacheDir.create(recursive: true);
    }
  }

  /// 获取缓存大小（字节）
  Future<int> getCacheSize() async {
    if (!await cacheDir.exists()) return 0;

    int totalSize = 0;
    await for (final entity in cacheDir.list(recursive: true)) {
      if (entity is File) {
        totalSize += await entity.length();
      }
    }
    return totalSize;
  }

  /// 获取格式化的缓存大小
  Future<String> getFormattedCacheSize() async {
    final bytes = await getCacheSize();
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}
