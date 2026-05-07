import assert from "node:assert/strict";
import test from "node:test";

import capitalize from "../src/utils/capitalize.js";
import stringArrayEqual from "../src/utils/string_array_equal.js";
import parseSearch from "../src/utils/parse_search.js";
import { getIsHeaderBackButtonPath } from "../src/pages/player/header/back_button.js";

test("capitalize uppercases the first letter of each word", () => {
  assert.equal(capitalize("hello world"), "Hello World");
  assert.equal(capitalize("cicada"), "Cicada");
});

test("stringArrayEqual compares array length and item order", () => {
  assert.equal(stringArrayEqual(["a", "b"], ["a", "b"]), true);
  assert.equal(stringArrayEqual(["a", "b"], ["b", "a"]), false);
  assert.equal(stringArrayEqual(["a"], ["a", "b"]), false);
});

test("parseSearch decodes the search string into key-value pairs", () => {
  assert.deepEqual(
    parseSearch<"keyword" | "page">("?keyword=lofi%20mix&page=2"),
    {
      keyword: "lofi mix",
      page: "2",
    },
  );
});

test("header shows back button on player detail pages", () => {
  assert.equal(
    getIsHeaderBackButtonPath("/player/musicbill/musicbill-1"),
    true,
  );
  assert.equal(getIsHeaderBackButtonPath("/musicbill/musicbill-1"), true);
  assert.equal(getIsHeaderBackButtonPath("/player/music/music-1"), true);
  assert.equal(getIsHeaderBackButtonPath("/player/singer/singer-1"), true);

  assert.equal(getIsHeaderBackButtonPath("/player"), false);
  assert.equal(getIsHeaderBackButtonPath("/player/setting"), false);
  assert.equal(getIsHeaderBackButtonPath("/player/search"), false);
});
