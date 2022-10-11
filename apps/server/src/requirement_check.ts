import which from 'which';

function print(message: string) {
  // eslint-disable-next-line no-console
  console.log(`--- warning ---\n${message}\n`);
}

async function requirementCheck() {
  try {
    await which('ffmpeg');
  } catch (error) {
    print(
      '未找到 ffmpeg 命令, 请手动安装\nffmpeg 用于压缩音频, 更好的利用存储空间\n当 ffmpeg 不存在时将不进行压缩保存',
    );
  }
}

export default requirementCheck;
