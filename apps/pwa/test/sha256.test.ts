import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { bytesToHex, sha256Hex } from "../src/utils/sha256.js";

function nodeSha256Hex(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

test("sha256Hex matches known SHA-256 vectors", () => {
  assert.equal(
    sha256Hex(new Uint8Array()),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.equal(
    sha256Hex(new TextEncoder().encode("abc")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("sha256Hex matches node crypto across block boundaries", () => {
  const input = new Uint8Array(257);
  for (let i = 0; i < input.length; i += 1) {
    input[i] = (i * 31 + 7) % 256;
  }

  assert.equal(sha256Hex(input), nodeSha256Hex(input));
});

test("bytesToHex converts byte arrays to lowercase hex", () => {
  assert.equal(bytesToHex(new Uint8Array([0, 15, 16, 255])), "000f10ff");
});
