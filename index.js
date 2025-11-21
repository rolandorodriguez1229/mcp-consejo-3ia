import express from "express";
import cors from "cors";

// IMPORT CORRECTO DEL SERVIDOR HTTP MCP
import {
  HttpServer,
  listToolsResponse,
  callToolResponse
} from "@modelcontextprotocol/server-http";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// KEYS
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!ANTHROPIC_API_KEY || !GEMINI_API_KEY) {
  console.error("❌ Missing API keys");
  process.exit(1);
}

// CLIENTES API
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// SERVIDOR MCP CORRECTO
const mcp = new HttpServer({
  name: "mcp-consejo-3ia",
  version: "1.0.0"
});

// TOOLS DECLARADAS
const tools = [
  {
    name: "call_claude",
    description: "Call Claude with a prompt.",
    inputSchema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"]
    }
  },
  {
    name: "call_gemini",
    description: "Call Google Gemini with a prompt.",
    inputSchema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"]
    }
  }
];

// LISTA DE TOOLS
mcp.setListToolsHandler(async () => listToolsResponse(tools));

// EJECUCIÓN DE CADA TOOL
mcp.setCallToolHandler(async ({ name, args }) => {
  if (name === "call_claude") {
    const result = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: args.prompt }]
    });
    const text = result.content?.[0]?.text ?? "";
    return callToolResponse.text(text);
  }

  if (name === "call_gemini") {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: args.prompt
    });
    return callToolResponse.text(result.text ?? "");
  }

  return callToolResponse.error(`Unknown tool: ${name}`);
});

// SERVIDOR EXPRESS HTTP
const app = express();
app.use(cors());
app.use(express.json());

// ENDPOINT MCP
app.post("/mcp", async (req, res) => {
  try {
    const response = await mcp.handleHttp(req.body);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: `${err}` });
  }
});

// ARRANCAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 MCP HTTP server running at port ${PORT}`)
);
