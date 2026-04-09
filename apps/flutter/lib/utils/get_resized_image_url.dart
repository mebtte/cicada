/// 获取指定尺寸的图片 URL
///
/// 服务端支持通过 `?size=xxx` 参数来获取裁剪后的图片
/// [url] - 原始图片 URL
/// [size] - 期望的图片尺寸（宽高，取最大值）
String getResizedImageUrl(String url, int size) {
  if (url.isEmpty) return url;

  // 处理已经有参数的 URL
  if (url.contains('?')) {
    return '$url&size=$size';
  }
  return '$url?size=$size';
}
