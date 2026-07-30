/**
 * TokenSaveOS Core Compression Engine & Cost Estimator
 */

export const MODEL_PRICING = {
  "gpt-4o": { name: "OpenAI GPT-4o", inputPer1k: 0.005, outputPer1k: 0.015, color: "#10a37f" },
  "claude-3-5-sonnet": { name: "Anthropic Claude 3.5 Sonnet", inputPer1k: 0.003, outputPer1k: 0.015, color: "#d97706" },
  "gemini-1-5-pro": { name: "Google Gemini 1.5 Pro", inputPer1k: 0.00125, outputPer1k: 0.005, color: "#2563eb" },
  "llama-3-70b": { name: "Llama 3 70B (Groq)", inputPer1k: 0.00059, outputPer1k: 0.00079, color: "#a855f7" }
};

export function estimateTokenCount(text) {
  if (!text) return 0;
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil((charCount / 4 + wordCount) / 2));
}

export function compressPrompt(rawText, options = {}) {
  const {
    stripWhitespace = true,
    removeComments = true,
    dedupLines = true,
    minifyJson = true,
    aggressivePrune = false
  } = options;

  let text = rawText || "";
  const originalTokens = estimateTokenCount(text);

  if (originalTokens === 0) {
    return {
      compressedText: "",
      originalTokens: 0,
      compressedTokens: 0,
      tokensSaved: 0,
      compressionRatio: 0,
      estimatedSavingsUSD: 0
    };
  }

  // 1. Minify JSON blocks if present
  if (minifyJson) {
    text = text.replace(/```json\s*([\s\S]*?)\s*```/g, (match, jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        return "```json\n" + JSON.stringify(parsed) + "\n```";
      } catch (e) {
        return match;
      }
    });
  }

  // 2. Remove code comments
  if (removeComments) {
    text = text.replace(/\/\*[\s\S]*?\*\//g, "");
    text = text.replace(/(^|\s)#\s+[^\n]*/g, "$1");
  }

  // 3. Deduplicate redundant consecutive lines
  if (dedupLines) {
    const lines = text.split("\n");
    const uniqueLines = [];
    let prev = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed !== prev || trimmed === "") {
        uniqueLines.push(line);
        if (trimmed !== "") prev = trimmed;
      }
    }
    text = uniqueLines.join("\n");
  }

  // 4. Strip extra whitespace & blank lines
  if (stripWhitespace) {
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n\s*\n/g, "\n");
    text = text.trim();
  }

  // 5. Aggressive pruning
  if (aggressivePrune) {
    const fillers = [
      /\bplease\b/gi, /\bkindly\b/gi, /\bas an ai\b/gi,
      /\bas mentioned before\b/gi, /\bfor your information\b/gi,
      /\bin order to\b/gi, /\bat this point in time\b/gi
    ];
    for (const rx of fillers) {
      text = text.replace(rx, "");
    }
    text = text.replace(/  +/g, " ");
  }

  const compressedTokens = estimateTokenCount(text);
  const tokensSaved = Math.max(0, originalTokens - compressedTokens);
  const compressionRatio = originalTokens > 0 ? ((tokensSaved / originalTokens) * 100).toFixed(1) : 0;

  const inputRate = MODEL_PRICING["gpt-4o"].inputPer1k;
  const estimatedSavingsUSD = ((tokensSaved / 1000) * inputRate).toFixed(5);

  return {
    compressedText: text,
    originalTokens,
    compressedTokens,
    tokensSaved,
    compressionRatio: parseFloat(compressionRatio),
    estimatedSavingsUSD: parseFloat(estimatedSavingsUSD)
  };
}
