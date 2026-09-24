import { test } from "node:test";
import assert from "node:assert/strict";
import { handleCallTool } from "../src/server.ts";

function callConvert(args: Record<string, unknown>) {
  return handleCallTool({ method: "tools/call", params: { name: "convert", arguments: args } });
}

test("convert tool: returns the converted value as text", async () => {
  const result = await callConvert({ value: 1, from: "km", to: "m" });
  assert.equal(result.isError, undefined);
  assert.deepEqual(result.content, [{ type: "text", text: "1000" }]);
});

test("convert tool: rejects a non-finite value", async () => {
  const result = await callConvert({ value: Number.NaN, from: "km", to: "m" });
  assert.equal(result.isError, true);
  assert.match((result.content[0] as { text: string }).text, /finite number/);
});

test("convert tool: rejects a non-numeric value", async () => {
  const result = await callConvert({ value: "1", from: "km", to: "m" });
  assert.equal(result.isError, true);
  assert.match((result.content[0] as { text: string }).text, /finite number/);
});

test("convert tool: rejects non-string from/to", async () => {
  const result = await callConvert({ value: 1, from: 5, to: "m" });
  assert.equal(result.isError, true);
  assert.match((result.content[0] as { text: string }).text, /from and to must be strings/);
});

test("convert tool: reports unknown unit errors", async () => {
  const result = await callConvert({ value: 1, from: "parsec", to: "m" });
  assert.equal(result.isError, true);
  assert.match((result.content[0] as { text: string }).text, /unknown unit/);
});

test("convert tool: reports dimension mismatch errors", async () => {
  const result = await callConvert({ value: 1, from: "km", to: "kg" });
  assert.equal(result.isError, true);
  assert.match((result.content[0] as { text: string }).text, /dimension mismatch/);
});

test("convert tool: rejects unknown tool names", async () => {
  await assert.rejects(
    () => handleCallTool({ method: "tools/call", params: { name: "nope", arguments: {} } }),
    /unknown tool: nope/,
  );
});
