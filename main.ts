// The World in One Image — entry runner (Node 22, standard library only).
//
// The poster lives in this repo as entry.png. This program checks it against
// the competition gate (a whole PNG, at most 1 MiB, at most 1024 x 1024 px)
// and stages the exact same bytes at /output/entry.png. The run is fully
// deterministic: the same entry.png always yields the same output bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;
const MAX_SIDE = 1024;

function die(message: string): never {
  console.error(`entry runner: ${message}`);
  process.exit(1);
}

const poster = readFileSync(new URL("./entry.png", import.meta.url));

if (!poster.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
  die("entry.png is not a PNG file");
}
if (poster.length > MAX_BYTES) {
  die(`entry.png is ${poster.length} bytes, over the 1 MiB limit`);
}
// IHDR chunk: width sits at offset 16, height at offset 20 (big-endian u32).
const width = poster.readUInt32BE(16);
const height = poster.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  die(`poster is ${width}x${height}, over the 1024x1024 limit`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const target = `${outDir}/entry.png`;
writeFileSync(target, poster);

const staged = readFileSync(target);
if (!staged.equals(poster)) {
  die("staged bytes differ from entry.png");
}
const digest = createHash("sha256").update(staged).digest("hex");
console.log(`entry runner: wrote ${target} — ${poster.length} bytes, ${width}x${height}, sha256 ${digest}`);
