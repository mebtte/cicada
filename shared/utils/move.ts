import fs from 'fs/promises';
import exist from './exist';

/**
 * 移动文件并修改文件的 birthtime
 * @author mebtte<i@mebtte.com>
 */
async function mvFile(source: string, destination: string) {
  const data = await fs.readFile(source);
  await fs.writeFile(destination, data);
  await fs.rm(source, {
    recursive: true,
    force: true,
  });
}

/**
 * 移动文件夹或者文件
 * 并修改 birthtime
 * @author mebtte<i@mebtte.com>
 */
async function mvDirectoryOrFile(source: string, destination: string) {
  const stat = await fs.stat(source);
  if (stat.isDirectory()) {
    const destinationExist = await exist(destination);
    if (!destinationExist) {
      await fs.mkdir(destination);
    }

    const children = await fs.readdir(source);
    for (const child of children) {
      await mvDirectoryOrFile(`${source}/${child}`, `${destination}/${child}`);
    }
  } else {
    await mvFile(source, destination);
  }
}

export default mvDirectoryOrFile;
