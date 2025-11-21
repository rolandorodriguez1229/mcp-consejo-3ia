const mcp = new HttpServer({
  name: "mcp-consejo-3ia",
  version: "1.0.0"
});

// tools list
mcp.setListToolsHandler(async () => listToolsResponse(tools));

// tool caller
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
