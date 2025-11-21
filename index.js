import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!ANTHROPIC_API_KEY || !GEMINI_API_KEY) {
  console.error("❌ Missing API keys");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const server = new Server(
  { name: "mcp-consejo-3ia", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const tools = [
  {
    name: "call_claude",
    description: "Call Claude with a prompt",
    inputSchema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"]
    }
  },
  {
    name: "call_gemini",
    description: "Call Google Gemini with a prompt",
    inputSchema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"]
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "call_claude") {
    const result = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: args.prompt }]
    });

    const text = result.content?.[0]?.text ?? "";
    return { content: [{ type: "text", text }] };
  }

  if (name === "call_gemini") {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: args.prompt
    });

    return { content: [{ type: "text", text: result.text ?? "" }] };
  }

  return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
});

// HTTP MCP route
const app = express();
app.use(cors());
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const response = await server.handleMessage(req.body);
  res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 MCP server running on port ${PORT}`));
