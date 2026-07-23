import assert from "node:assert/strict";
import test from "node:test";

import capitalize from "../src/utils/capitalize.js";
import stringArrayEqual from "../src/utils/string_array_equal.js";
import parseSearch from "../src/utils/parse_search.js";
import {
  getBaseVersion,
  getSemanticVersion,
  getMajorVersion,
  compareSemanticVersion,
  isSameMajorVersion,
  isServerVersionSupported,
} from "../src/utils/version.js";
import Cache from "../src/utils/cache.js";
import { getIsHeaderBackButtonPath } from "../src/pages/player/header/back_button.js";
import { isPasswordLengthValid } from "../src/constants/user.js";
import {
  isComposingEnterKeyDown,
  isKeyboardEventComposing,
} from "../src/utils/keyboard.js";
import {
  getSmoothMusicAsset,
  getSourceMusicAsset,
} from "../src/utils/music_asset.js";
import {
  formatMusicFilenamePerformerPrefix,
  sanitizeMusicFilename,
} from "../src/utils/music_filename.js";
import {
  getClientLanguage,
  Language,
} from "../src/constants/language.js";

test("capitalize uppercases the first letter of each word", () => {
  assert.equal(capitalize("hello world"), "Hello World");
  assert.equal(capitalize("cicada"), "Cicada");
});

test("client language uses canonical API values", () => {
  assert.equal(getClientLanguage(Language.EN), "en");
  assert.equal(getClientLanguage(Language.ZH_HANS), "zh-Hans");
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

test("cache removes entries with the same scoped key replacement used for set", () => {
  enum CacheKey {
    VALUE = "value",
  }
  const cache = new Cache<
    CacheKey,
    {
      [CacheKey.VALUE]: string;
    }
  >();
  const keyReplace = (key: string) => `user-1:${key}`;

  cache.set({ key: CacheKey.VALUE, keyReplace, value: "recommendation" });
  assert.equal(cache.get(CacheKey.VALUE, keyReplace), "recommendation");
  cache.remove(CacheKey.VALUE, keyReplace);
  assert.equal(cache.get(CacheKey.VALUE, keyReplace), null);

  cache.destroy();
});

test("version helpers compare semantic major versions", () => {
  assert.equal(getBaseVersion("3.1.0-local"), "3.1.0");
  assert.equal(getBaseVersion("3.1.0-beta.2606181430"), "3.1.0");
  assert.equal(getBaseVersion("3.1.0"), "3.1.0");
  assert.equal(getMajorVersion("v3.1.0"), 3);
  assert.equal(getMajorVersion("3.1.0-beta.20260508"), 3);
  assert.equal(getMajorVersion("unknown"), null);
  assert.deepEqual(getSemanticVersion("3.1.2-local"), {
    major: 3,
    minor: 1,
    patch: 2,
  });
  assert.equal(getSemanticVersion("unknown"), null);
  assert.equal(compareSemanticVersion("3.2.0", "3.1.9"), 1);
  assert.equal(compareSemanticVersion("3.1.0", "3.1.0-beta.1"), 0);
  assert.equal(compareSemanticVersion("3.1.1-local", "3.1.0"), 1);
  assert.equal(compareSemanticVersion("3.1.0", "3.1.1"), -1);

  assert.equal(isSameMajorVersion("3.1.0-local", "3.2.0-beta.1"), true);
  assert.equal(isSameMajorVersion("3.1.0", "3.2.0-beta.1"), true);
  assert.equal(isSameMajorVersion("3.1.0", "4.0.0"), false);
  assert.equal(isSameMajorVersion("unknown", "4.0.0"), true);
  assert.equal(isServerVersionSupported("3.1.0-local", "3.1.1"), true);
  assert.equal(isServerVersionSupported("3.1.0", "3.2.0-beta.1"), true);
  assert.equal(isServerVersionSupported("3.1.0-local", "3.1.0"), true);
  assert.equal(isServerVersionSupported("3.1.0", "3.1.1-local"), true);
  assert.equal(
    isServerVersionSupported("3.1.0-local", "3.1.1-beta.2606181430"),
    true,
  );
  assert.equal(isServerVersionSupported("3.1.0", "3.1.0-beta.1"), true);
  assert.equal(isServerVersionSupported("3.1.1", "3.1.0"), false);
  assert.equal(isServerVersionSupported("3.1.0", "4.0.0"), false);
  assert.equal(isServerVersionSupported("unknown", "4.0.0"), false);
});

test("header shows back button on nested player detail pages except musicbill", () => {
  assert.equal(
    getIsHeaderBackButtonPath("/player/musicbill/musicbill-1"),
    false,
  );
  assert.equal(getIsHeaderBackButtonPath("/musicbill/musicbill-1"), false);
  assert.equal(getIsHeaderBackButtonPath("/player/music/music-1"), true);
  assert.equal(getIsHeaderBackButtonPath("/player/artist/artist-1"), true);

  assert.equal(getIsHeaderBackButtonPath("/player"), false);
  assert.equal(getIsHeaderBackButtonPath("/player/setting"), false);
  assert.equal(getIsHeaderBackButtonPath("/player/search"), false);
});

test("password length accepts 6 to 32 characters", () => {
  assert.equal(isPasswordLengthValid("12345"), false);
  assert.equal(isPasswordLengthValid("123456"), true);
  assert.equal(isPasswordLengthValid("1".repeat(32)), true);
  assert.equal(isPasswordLengthValid("1".repeat(33)), false);
});

test("keyboard helpers detect IME composition before handling Enter", () => {
  const composingEnter = {
    key: "Enter",
    isComposing: true,
    keyCode: 13,
  } as KeyboardEvent;
  const legacyComposingEnter = {
    key: "Enter",
    isComposing: false,
    keyCode: 229,
  } as KeyboardEvent;
  const committedEnter = {
    key: "Enter",
    isComposing: false,
    keyCode: 13,
  } as KeyboardEvent;

  assert.equal(isKeyboardEventComposing(composingEnter), true);
  assert.equal(isComposingEnterKeyDown(composingEnter), true);
  assert.equal(isComposingEnterKeyDown(legacyComposingEnter), true);
  assert.equal(isComposingEnterKeyDown(committedEnter), false);
});

test("music playback assets use quality query parameter", () => {
  assert.equal(
    getSmoothMusicAsset("/asset/music/song.mp3"),
    "http://localhost/asset/music/song.mp3?quality=smooth",
  );
  assert.equal(
    getSourceMusicAsset("/asset/music/song.mp3"),
    "http://localhost/asset/music/song.mp3?quality=source",
  );
});

test("music filenames keep first three performers and sanitize invalid characters", () => {
  const performerPrefix = formatMusicFilenamePerformerPrefix([
    "A/One",
    "B:Two",
    "C*Three",
    "D?Four",
  ]);

  assert.equal(performerPrefix, "A/One,B:Two,C*Three,...");
  assert.equal(formatMusicFilenamePerformerPrefix([]), "");
  assert.equal(
    sanitizeMusicFilename(`${performerPrefix} - Song <Title>|.flac`),
    "A_One,B_Two,C_Three,... - Song _Title__.flac",
  );
});
