// Times the example worker's /bench route on workerd and prints the results.
// Workers clocks only advance on I/O, so each render is timed from the client.
// Usage: bun run bench [runs]
import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Case = { name: string; query: string };

const cases: readonly Case[] = [
  { name: "simple png", query: "card=simple&format=png" },
  { name: "rich png (gradients, shadows)", query: "card=rich&format=png" },
  { name: "flat png (same layout)", query: "card=flat&format=png" },
  { name: "rich webp", query: "card=rich&format=webp" },
];

const runs = Number(process.argv[2] ?? 30);
const port = 8788;
const base = `http://localhost:${port}`;

const worker = spawn("bunx", ["wrangler", "dev", "--port", String(port)], {
  cwd: fileURLToPath(new URL("../examples/worker/", import.meta.url)),
  stdio: "ignore",
});

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function request(query: string): Promise<{ ms: number; bytes: number }> {
  const start = performance.now();
  const response = await fetch(`${base}/bench?${query}`);
  if (!response.ok) throw new Error(`The bench route returned ${response.status}.`);
  const bytes = (await response.arrayBuffer()).byteLength;
  return { ms: performance.now() - start, bytes };
}

function percentile(sorted: readonly number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}

/* oxlint-disable no-await-in-loop -- requests run one at a time so they never overlap. */
async function waitForWorker(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await request("card=simple");
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error("The worker did not start in 60 seconds.");
}

async function measure(item: Case): Promise<string> {
  // Warm-up requests load the fonts and the wasm module.
  for (let i = 0; i < 3; i++) await request(item.query);

  const times: number[] = [];
  let bytes = 0;
  for (let i = 0; i < runs; i++) {
    const result = await request(item.query);
    times.push(result.ms);
    bytes = result.bytes;
  }
  times.sort((a, b) => a - b);
  return `| ${item.name} | ${percentile(times, 0.5).toFixed(1)} | ${percentile(times, 0.95).toFixed(1)} | ${bytes} |`;
}

try {
  await waitForWorker();
  const rows: string[] = [];
  for (const item of cases) rows.push(await measure(item));

  const table = [
    `Request time on workerd, ${runs} runs per card (local HTTP, so it includes a little overhead).`,
    "",
    "| Card | p50 ms | p95 ms | Bytes |",
    "| --- | ---: | ---: | ---: |",
    ...rows,
  ].join("\n");

  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
  }
} finally {
  worker.kill();
}
/* oxlint-enable no-await-in-loop */
