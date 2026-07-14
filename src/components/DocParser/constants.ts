export const STARTER_MDX = String.raw`---
title: "Embed and explain inside MDX"
description: "Drop calculators into MDX, capture screenshots, or write run-books."
tags: ["mdx", "docs", "editor"]
---

# {frontmatter.title}

<Callout type="info" title="Why MDX?">
  MDX lets you mix Markdown with React components.
</Callout>

## Quick start

<Steps>
  <li>Edit the MDX on the left.</li>
  <li>Use the component palette to insert snippets.</li>
  <li>Toggle live preview.</li>
</Steps>

### Keyboard

- Save: <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
- Toggle preview: <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>

\`\`\`ts
// You can show code blocks normally
export const sum = (a: number, b: number) => a + b
\`\`\`

<YouTube id="dQw4w9WgXcQ" title="Demo" />
`;

export const COMPONENT_SNIPPETS: Array<{name: string; description: string; snippet: string}> = [
  {
    name: 'Callout',
    description: 'Informational block with a title and tone',
    snippet: `<Callout type="info" title="Heads up">
  Your note here.
</Callout>
`,
  },
  {
    name: 'Steps',
    description: 'Ordered steps',
    snippet: `<Steps>
  <li>First</li>
  <li>Second</li>
</Steps>
`,
  },
  {
    name: 'YouTube',
    description: 'Embed a YouTube video (privacy-enhanced)',
    snippet: `<YouTube id="VIDEO_ID" title="Title" />
`,
  },
  {
    name: 'Frontmatter',
    description: 'YAML frontmatter for metadata',
    snippet: `---
title: ""
description: ""
tags: []
---

`,
  },
  {
    name: 'Table',
    description: 'Markdown table',
    snippet: `| Col A | Col B |
| --- | --- |
| 1 | 2 |
`,
  },
  {
    name: 'Code block',
    description: 'Fenced code block',
    snippet: '```tsx\nexport function Example() {\n  return <div>Hello</div>\n}\n```\n',
  },
];

export type CompileState =
  | {status: 'idle' | 'compiling'}
  | {status: 'ok'; warnings?: string[]}
  | {status: 'error'; message: string; line?: number; column?: number};

export function getWordCount(text: string) {
  const stripped = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/---[\s\S]*?---/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const words = stripped
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return words.length;
}

export function readingTimeMinutes(wordCount: number) {
  return Math.max(1, Math.round(wordCount / 200));
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
