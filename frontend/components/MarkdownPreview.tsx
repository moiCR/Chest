"use client";

import { useState, type FormEvent } from "react";

type MarkdownPreviewProps = {
  content: string;
};

const inlineStyles: Record<string, React.CSSProperties> = {
  h1: { fontSize: "1.5rem", fontWeight: 700, marginTop: "1.25rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.9)" },
  h2: { fontSize: "1.25rem", fontWeight: 700, marginTop: "1rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.85)" },
  h3: { fontSize: "1.1rem", fontWeight: 600, marginTop: "0.75rem", marginBottom: "0.4rem", color: "rgba(255,255,255,0.8)" },
  p: { marginBottom: "0.75rem", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" },
  ul: { listStyleType: "disc", paddingLeft: "1.5rem", marginBottom: "0.75rem", color: "rgba(255,255,255,0.7)" },
  ol: { listStyleType: "decimal", paddingLeft: "1.5rem", marginBottom: "0.75rem", color: "rgba(255,255,255,0.7)" },
  li: { marginBottom: "0.25rem" },
  blockquote: { borderLeft: "3px solid rgba(255,255,255,0.2)", paddingLeft: "1rem", margin: "0.75rem 0", fontStyle: "italic", color: "rgba(255,255,255,0.5)" },
  code: { fontFamily: "monospace", background: "rgba(255,255,255,0.08)", padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.85em", color: "rgba(255,255,255,0.85)" },
  pre: { background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px", overflowX: "auto", marginBottom: "0.75rem" },
  a: { color: "rgba(255,255,255,0.85)", textDecoration: "underline" },
  hr: { border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1rem 0" },
  strong: { fontWeight: 700, color: "rgba(255,255,255,0.9)" },
  em: { fontStyle: "italic" },
};

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    type Match = { index: number; length: number; node: React.ReactNode };
    const candidates: Match[] = [];

    if (boldMatch && boldMatch.index !== undefined) {
      candidates.push({ index: boldMatch.index, length: boldMatch[0].length, node: <strong key={key++}>{boldMatch[1]}</strong> });
    }
    if (italicMatch && italicMatch.index !== undefined && italicMatch[1] !== italicMatch[0].slice(1, -1).replace(/\*\*/g, "")) {
      candidates.push({ index: italicMatch.index, length: italicMatch[0].length, node: <em key={key++}>{italicMatch[1]}</em> });
    }
    if (codeMatch && codeMatch.index !== undefined) {
      candidates.push({ index: codeMatch.index, length: codeMatch[0].length, node: <code key={key++}>{codeMatch[1]}</code> });
    }

    const firstMatch = candidates.length > 0 ? candidates.reduce((a, b) => a.index < b.index ? a : b) : null;

    if (firstMatch) {
      if (firstMatch.index > 0) {
        nodes.push(remaining.slice(0, firstMatch.index));
      }
      nodes.push(firstMatch.node);
      remaining = remaining.slice(firstMatch.index + firstMatch.length);
    } else {
      nodes.push(remaining);
      break;
    }
  }

  return nodes;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return <p className="text-sm text-white/30 italic">Preview will appear here...</p>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} style={inlineStyles.pre}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} style={inlineStyles.h1}>{parseInline(line.slice(2))}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={inlineStyles.h2}>{parseInline(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={inlineStyles.h3}>{parseInline(line.slice(4))}</h3>);
    } else if (line.startsWith("> ")) {
      elements.push(<blockquote key={key++} style={inlineStyles.blockquote}>{parseInline(line.slice(2))}</blockquote>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} style={inlineStyles.ul}>
          {items.map((item, idx) => <li key={idx} style={inlineStyles.li}>{parseInline(item)}</li>)}
        </ul>
      );
      continue;
    } else if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={key++} style={inlineStyles.ol}>
          {items.map((item, idx) => <li key={idx} style={inlineStyles.li}>{parseInline(item)}</li>)}
        </ol>
      );
      continue;
    } else if (line === "---" || line === "***") {
      elements.push(<hr key={key++} style={inlineStyles.hr} />);
    } else if (line.trim() === "") {
      i++;
      continue;
    } else {
      elements.push(<p key={key++} style={inlineStyles.p}>{parseInline(line)}</p>);
    }

    i++;
  }

  return <div className="markdown-preview">{elements}</div>;
}
