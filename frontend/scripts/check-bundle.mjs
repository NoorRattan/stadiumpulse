import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const assetsDirectory = fileURLToPath(
  new URL("../dist/assets/", import.meta.url),
);
const files = readdirSync(assetsDirectory).filter((file) =>
  /\.(?:css|js)$/.test(file),
);

const measured = files.map((file) => {
  const contents = readFileSync(join(assetsDirectory, file));
  return {
    file,
    raw: contents.byteLength,
    gzip: gzipSync(contents).byteLength,
  };
});

const largestJs = measured
  .filter(({ file }) => file.endsWith(".js"))
  .sort((a, b) => b.raw - a.raw)[0];
const largestCss = measured
  .filter(({ file }) => file.endsWith(".css"))
  .sort((a, b) => b.raw - a.raw)[0];

const limits = {
  js: 500_000,
  css: 120_000,
};

for (const asset of [largestJs, largestCss]) {
  if (!asset)
    throw new Error("Build output is missing JavaScript or CSS assets.");
  console.log(
    `${asset.file}: ${asset.raw.toLocaleString()} bytes raw / ${asset.gzip.toLocaleString()} bytes gzip`,
  );
}

if (largestJs.raw > limits.js) {
  throw new Error(
    `Largest JavaScript chunk exceeds ${limits.js.toLocaleString()} bytes.`,
  );
}
if (largestCss.raw > limits.css) {
  throw new Error(
    `Largest CSS asset exceeds ${limits.css.toLocaleString()} bytes.`,
  );
}

console.log("Bundle budgets pass.");
