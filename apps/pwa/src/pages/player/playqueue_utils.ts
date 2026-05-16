import generateRandomString from '../../utils/generate_random_string.js';

type QueueFields = {
  index: number;
  pid: string;
  shuffle: boolean;
};

function createManualQueueMusic<TMusic extends object>({
  music,
  index,
}: {
  music: TMusic;
  index: number;
}): TMusic & QueueFields {
  return {
    ...music,
    index,
    pid: generateRandomString(),
    shuffle: false,
  };
}

export function insertMusicToPlayqueue<
  TMusic extends object,
  TQueueMusic extends TMusic & QueueFields,
>({
  playqueue,
  currentPosition,
  music,
}: {
  playqueue: TQueueMusic[];
  currentPosition: number;
  music: TMusic;
}) {
  const insertPosition = currentPosition + 1;
  const queueMusic = createManualQueueMusic({
    music,
    index: insertPosition + 1,
  });

  // 随机预填的下一首只是占位, 手动“下一首播放”需要直接占用这个槽位.
  if (playqueue[insertPosition]?.shuffle) {
    return [
      ...playqueue.slice(0, insertPosition),
      queueMusic,
      ...playqueue.slice(insertPosition + 1),
    ];
  }

  return [
    ...playqueue.slice(0, insertPosition),
    queueMusic,
    ...playqueue.slice(insertPosition).map((m) => ({
      ...m,
      index: m.index + 1,
    })),
  ];
}
