#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type {
  CallToolRequest,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { convert, listUnits, UnknownUnitError, DimensionMismatchError } from "./units.ts";

const CONVERT_TOOL = {
  name: "convert",
  description:
    "Convert a numeric value between units of length, mass, time, or temperature. " +
    `Known units: ${listUnits().join(", ")}.`,
  inputSchema: {
    type: "object",
    properties: {
      value: { type: "number", description: "the value to convert" },
      from: { type: "string", description: "the unit value is expressed in" },
      to: { type: "string", description: "the unit to convert value into" },
    },
    required: ["value", "from", "to"],
  },
};

const server = new Server(
  { name: "mcp-unitconv", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CONVERT_TOOL],
}));

export async function handleCallTool(request: CallToolRequest): Promise<CallToolResult> {
  if (request.params.name !== "convert") {
    throw new Error(`unknown tool: ${request.params.name}`);
  }

  const args = request.params.arguments ?? {};
  const { value, from, to } = args as { value?: unknown; from?: unknown; to?: unknown };

  // The type/finiteness checks below are enforced here, at the tool boundary,
  // rather than inside convert() itself: the SDK only validates arguments
  // against the JSON schema's "type" keyword, which doesn't rule out NaN or
  // +/-Infinity for a "number".
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return {
      isError: true,
      content: [{ type: "text", text: "value must be a finite number" }],
    };
  }
  if (typeof from !== "string" || typeof to !== "string") {
    return {
      isError: true,
      content: [{ type: "text", text: "from and to must be strings" }],
    };
  }

  try {
    const result = convert(value, from, to);
    return { content: [{ type: "text", text: String(result) }] };
  } catch (err) {
    if (err instanceof UnknownUnitError || err instanceof DimensionMismatchError) {
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }
    throw err;
  }
}

server.setRequestHandler(CallToolRequestSchema, handleCallTool);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run the server when this file is executed directly (node dist/server.js),
// not when it's imported for its exports (e.g. from tests).
const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
