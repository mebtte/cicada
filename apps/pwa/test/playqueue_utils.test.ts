import assert from "node:assert/strict";
import test from "node:test";

import { insertMusicToPlayqueue } from "../src/pages/player/playqueue_utils.js";

interface TestMusic {
  id: string;
  cover: string;
  name: string;
  type: number;
  aliases: string[];
  singers: { id: string; name: string; aliases: string[] }[];
  asset: string;
}

interface TestQueueMusic extends TestMusic {
  index: number;
  pid: string;
  shuffle: boolean;
}

function createMusic(id: string): TestMusic {
  return {
    id,
    cover: "",
    name: id,
    type: 1,
    aliases: [],
    singers: [],
    asset: `${id}.mp3`,
  };
}

function createQueueMusic({
  id,
  index,
  shuffle,
}: {
  id: string;
  index: number;
  shuffle: boolean;
}): TestQueueMusic {
  return {
    ...createMusic(id),
    index,
    pid: `${id}-pid`,
    shuffle,
  };
}

test("play-next replaces the prefilled random next music", () => {
  const later = createQueueMusic({ id: "later", index: 3, shuffle: false });
  const result = insertMusicToPlayqueue({
    playqueue: [
      createQueueMusic({ id: "current", index: 1, shuffle: false }),
      createQueueMusic({ id: "random-next", index: 2, shuffle: true }),
      later,
    ],
    currentPosition: 0,
    music: createMusic("manual-next"),
  });

  assert.equal(result.length, 3);
  assert.equal(result[1].id, "manual-next");
  assert.equal(result[1].index, 2);
  assert.equal(result[1].shuffle, false);
  assert.equal(result[2], later);
});

test("play-next still inserts before an explicit next music", () => {
  const result = insertMusicToPlayqueue({
    playqueue: [
      createQueueMusic({ id: "current", index: 1, shuffle: false }),
      createQueueMusic({ id: "explicit-next", index: 2, shuffle: false }),
    ],
    currentPosition: 0,
    music: createMusic("manual-next"),
  });

  assert.equal(result.length, 3);
  assert.equal(result[1].id, "manual-next");
  assert.equal(result[1].index, 2);
  assert.equal(result[2].id, "explicit-next");
  assert.equal(result[2].index, 3);
});
