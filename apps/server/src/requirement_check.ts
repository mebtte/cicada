import which from 'which';

function print(message: string) {
  // eslint-disable-next-line no-console
  console.log(`\n--- warning ---\n${message}\n--- warning ---\n`);
}

async function requirementCheck() {
  try {
    await which('ffmpeg');
  } catch (error) {
    print(
      `未在 PATH 下找到 ffmpeg 命令, 请手动安装
ffmpeg 用于压缩音频(无损音质不会进行压缩)
从而更好地节省存储空间和进行网络传输
当 ffmpeg 不存在时将不进行压缩保存`,
    );
  }
}

export default requirementCheck;
