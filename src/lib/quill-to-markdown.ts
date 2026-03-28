/**
 * Converts a Quill Delta JSON string to Markdown.
 *
 * Quill Delta format: { "ops": [ { insert, attributes? }, ... ] }
 * Line-level attributes (header, list) are applied via the "\n" op
 * that terminates a line, so we buffer text and flush on newline.
 */

interface DeltaOp {
  insert: string | Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export function quillDeltaToMarkdown(deltaJson: string): string {
  const delta = JSON.parse(deltaJson) as { ops: DeltaOp[] };
  if (!delta.ops || !Array.isArray(delta.ops)) {
    throw new Error("Invalid Quill Delta: missing ops array");
  }

  const lines: string[] = [];
  let lineBuffer = "";

  for (const op of delta.ops) {
    // Skip embed objects (doc_mention, image, etc.)
    if (typeof op.insert !== "string") continue;

    const text = op.insert;
    const attrs = op.attributes ?? {};

    // Split the insert on newlines — each \n may carry line-level formatting
    const parts = text.split("\n");

    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];

      // Apply inline formatting to non-empty segments
      if (segment.length > 0) {
        lineBuffer += formatInline(segment, attrs);
      }

      // Every \n boundary (all parts except the last) means end-of-line
      if (i < parts.length - 1) {
        lines.push(formatLine(lineBuffer, attrs));
        lineBuffer = "";
      }
    }
  }

  // Flush any remaining buffer
  if (lineBuffer.length > 0) {
    lines.push(lineBuffer);
  }

  // Join lines and clean up excessive blank lines
  let md = lines.join("\n");

  // Collapse 3+ consecutive newlines into 2 (one blank line)
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim() + "\n";
}

/** Apply inline formatting (bold, italic, link) to a text segment. */
function formatInline(text: string, attrs: Record<string, unknown>): string {
  let result = text;

  if (attrs.bold) {
    result = `**${result}**`;
  }
  if (attrs.italic) {
    result = `*${result}*`;
  }
  if (attrs.link && typeof attrs.link === "string") {
    result = `[${result}](${attrs.link})`;
  }

  return result;
}

/** Apply line-level formatting (header, list) when flushing a line. */
function formatLine(
  content: string,
  attrs: Record<string, unknown>,
): string {
  // Header
  if (attrs.header) {
    const level = Number(attrs.header);
    const prefix = "#".repeat(level);
    return `${prefix} ${content}`;
  }

  // List — ClickUp sends { list: { list: "bullet" } } or { list: "bullet" }
  const listAttr = attrs.list;
  if (listAttr) {
    const listType =
      typeof listAttr === "object" && listAttr !== null
        ? (listAttr as Record<string, unknown>).list
        : listAttr;

    if (listType === "bullet") {
      return `- ${content}`;
    }
    if (listType === "ordered") {
      return `1. ${content}`;
    }
  }

  return content;
}
