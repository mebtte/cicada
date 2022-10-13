import sanitize from 'sanitize-filename';

function formatMusicFilename({
  name,
  singerNames,
  ext,
}: {
  name: string;
  singerNames: string[];
  ext: string;
}) {
  return sanitize(
    `${
      // eslint-disable-next-line no-nested-ternary
      singerNames.length === 0
        ? '未知歌手'
        : singerNames.length > 3
        ? '群星'
        : singerNames.join(',')
    } - ${name}${ext}`,
  );
}

export default formatMusicFilename;
