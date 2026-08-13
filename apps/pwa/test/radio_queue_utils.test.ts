import assert from "node:assert/strict";
import test from "node:test";

import { getNextRadioQueueIndex } from "../src/pages/radio/radio_queue_utils.js";

test("rapid next clicks cannot advance past the prefetched queue", () => {
  const queueLength = 2;
  const afterFirstClick = getNextRadioQueueIndex({
    currentIndex: 0,
    queueLength,
  });
  const afterSecondClick = getNextRadioQueueIndex({
    currentIndex: afterFirstClick,
    queueLength,
  });

  assert.equal(afterFirstClick, 1);
  assert.equal(afterSecondClick, 1);
});

test("next advances again after another music is prefetched", () => {
  assert.equal(
    getNextRadioQueueIndex({ currentIndex: 1, queueLength: 3 }),
    2,
  );
});

test("next is ignored before the first music is loaded", () => {
  assert.equal(
    getNextRadioQueueIndex({ currentIndex: -1, queueLength: 0 }),
    -1,
  );
});
