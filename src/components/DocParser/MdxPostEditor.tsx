import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import {compile, run} from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  FileUp,
  PanelLeft,
  PanelRight,
  Play,
  Save,
  Sparkles,
  Wand2,
} from 'lucide-react';
import styles from './MdxPostEditor.module.css';
import MDXErrorBoundary from './MDXErrorBoundary';
import SnippetsSidebar from './SnippetsSidebar';
import {
  Badge,
  Button,
  IconButton,
  Input,
  Separator,
  cn,
  mdxComponents,
  useDebouncedValue,
} from './ui';
import {
  COMPONENT_SNIPPETS,
  STARTER_MDX,
  downloadTextFile,
  getWordCount,
  readingTimeMinutes,
  type CompileState,
} from './constants';

async function pickTextFile(accept = '.md,.mdx,text/markdown,text/plain') {
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      resolve(await file.text());
    };
    input.click();
  });
}

export default function MdxPostEditor() {
  const isBrowser = useIsBrowser();

  const [mdx, setMdx] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('mdx_editor_draft_v1');
      return saved ?? STARTER_MDX;
    }
    return STARTER_MDX;
  });
  const [title, setTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('mdx_editor_title_v1') ?? 'post.mdx';
    }
    return 'post.mdx';
  });
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [search, setSearch] = useState('');
  const [compileState, setCompileState] = useState<CompileState>({status: 'idle'});
  const [PreviewComponent, setPreviewComponent] = useState<ComponentType<any> | null>(null);

  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const debouncedMdx = useDebouncedValue(mdx, 350);
  const wordCount = useMemo(() => getWordCount(mdx), [mdx]);
  const readMins = useMemo(() => readingTimeMinutes(wordCount), [wordCount]);

  const filteredSnippets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COMPONENT_SNIPPETS;
    return COMPONENT_SNIPPETS.filter(
      (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }, [search]);

  const insertAtCursor = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor || !monacoRef.current) {
      setMdx((value) => `${value}\n${text}`);
      return;
    }
    const selection = editor.getSelection();
    const range = selection
      ? new monacoRef.current.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn,
        )
      : undefined;

    editor.executeEdits('insert-snippet', [
      {
        range: range ?? editor.getModel()!.getFullModelRange(),
        text,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }, []);

  const wrapSelection = useCallback((before: string, after = before) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    const selected = model.getValueInRange(selection);
    editor.executeEdits('wrap-selection', [
      {
        range: selection,
        text: `${before}${selected || ''}${after}`,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }, []);

  const applyHeading = useCallback((level: 1 | 2 | 3) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection) return;

    const line = selection.startLineNumber;
    const lineContent = model.getLineContent(line);
    const stripped = lineContent.replace(/^#{1,6}\s+/, '');
    const prefix = '#'.repeat(level) + ' ';
    const range = new monaco.Range(line, 1, line, lineContent.length + 1);
    editor.executeEdits('heading', [{range, text: prefix + stripped}]);
    editor.focus();
  }, []);

  const saveDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('mdx_editor_draft_v1', mdx);
    window.localStorage.setItem('mdx_editor_title_v1', title);
  }, [mdx, title]);

  const exportMdx = useCallback(() => {
    saveDraft();
    const filename = title.endsWith('.md') || title.endsWith('.mdx') ? title : `${title}.mdx`;
    downloadTextFile(filename, mdx);
  }, [mdx, title, saveDraft]);

  const importMdx = useCallback(async () => {
    const text = await pickTextFile();
    if (!text) return;
    setMdx(text);
  }, []);

  const formatSmart = useCallback(() => {
    const formatted = mdx
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/g, ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
    setMdx(formatted);
  }, [mdx]);

  const registerMdxCompletions = useCallback((monaco: typeof import('monaco-editor')) => {
    const provider = monaco.languages.registerCompletionItemProvider('markdown', {
      triggerCharacters: ['<', ':', '"', '-'],
      provideCompletionItems: (model, position) => {
        const line = model.getLineContent(position.lineNumber);
        const prefix = line.slice(0, position.column - 1);
        const suggestions: Monaco.languages.CompletionItem[] = [];
        const range = new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        );

        if (prefix.includes('<') && !prefix.includes('>')) {
          const components = [
            {label: 'Callout', insert: 'Callout type="info" title=""\n  \n</Callout>', detail: 'Block callout'},
            {label: 'Steps', insert: 'Steps\n  <li></li>\n</Steps>', detail: 'Steps list'},
            {label: 'YouTube', insert: 'YouTube id="" title="" /', detail: 'Embed video'},
            {label: 'Kbd', insert: 'Kbd></Kbd', detail: 'Keyboard key'},
          ];

          for (const comp of components) {
            suggestions.push({
              label: comp.label,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: comp.insert,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              detail: comp.detail,
            });
          }
        }

        if (model.getValue().startsWith('---')) {
          const fmKeys = ['title', 'description', 'date', 'tags', 'draft', 'cover', 'slug'];
          for (const key of fmKeys) {
            suggestions.push({
              label: key,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: `${key}: `,
              range,
              detail: 'Frontmatter',
            });
          }
        }

        suggestions.push(
          {
            label: 'Insert image',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '![alt](url)',
            range,
            detail: 'Markdown',
          },
          {
            label: 'Inline code',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '`${1:code}`',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Markdown',
          },
          {
            label: 'Code fence',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '```$1\n$2\n```',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Markdown',
          },
        );

        return {suggestions};
      },
    });

    return () => provider.dispose();
  }, []);

  const compileMdx = useCallback(
    async (source: string) => {
      if (!isBrowser) return;
      setCompileState({status: 'compiling'});
      try {
        const compiled = await compile(source, {
          outputFormat: 'function-body',
          development: false,
          providerImportSource: '@mdx-js/react',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
          rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, {behavior: 'wrap'}]],
        });

        const mod = (await run(compiled, {
          ...jsxRuntime,
          useMDXComponents: () => mdxComponents,
        })) as any;

        const Component = mod.default as ComponentType<any>;
        setPreviewComponent(() => Component);
        setCompileState({status: 'ok'});
      } catch (error: any) {
        const message = String(error?.message ?? error);
        const match = message.match(/\((\d+):(\d+)\)/) || message.match(/(\d+):(\d+)/);
        const line = match ? Number(match[1]) : undefined;
        const column = match ? Number(match[2]) : undefined;
        setCompileState({status: 'error', message, line, column});
        setPreviewComponent(null);
      }
    },
    [isBrowser],
  );

  useEffect(() => {
    if (!isBrowser) return;
    void compileMdx(debouncedMdx);
  }, [debouncedMdx, compileMdx, isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;
    const t = setTimeout(() => saveDraft(), 900);
    return () => clearTimeout(t);
  }, [mdx, title, saveDraft, isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 's') {
          event.preventDefault();
          saveDraft();
        }
        if (key === 'enter') {
          event.preventDefault();
          setShowPreview((value) => !value);
        }
        if (key === 'b') {
          event.preventDefault();
          wrapSelection('**', '**');
        }
        if (key === 'i') {
          event.preventDefault();
          wrapSelection('*', '*');
        }
        if (key === 'k') {
          event.preventDefault();
          wrapSelection('[', '](url)');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveDraft, wrapSelection, isBrowser]);

  useEffect(() => {
    if (compileState.status !== 'error') return;
    if (!compileState.line || !compileState.column) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.revealPositionInCenter({lineNumber: compileState.line, column: compileState.column});
    editor.setPosition({lineNumber: compileState.line, column: compileState.column});
  }, [compileState]);

  const onEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      editor.updateOptions({
        wordWrap: 'on',
        minimap: {enabled: false},
        fontLigatures: true,
        fontSize: 14,
        lineHeight: 22,
        padding: {top: 14, bottom: 14},
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        formatOnPaste: true,
        formatOnType: false,
        stickyScroll: {enabled: true},
        scrollBeyondLastLine: false,
      });

      const dispose = registerMdxCompletions(monaco);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
        editor.getAction('actions.find')?.run();
      });

      return () => {
        dispose();
      };
    },
    [registerMdxCompletions],
  );

  const statusChip =
    compileState.status === 'compiling' ? (
      <Badge tone="info">
        <Sparkles size={14} /> Compiling
      </Badge>
    ) : compileState.status === 'ok' ? (
      <Badge tone="ok">
        <CheckCircle2 size={14} /> Preview OK
      </Badge>
    ) : compileState.status === 'error' ? (
      <Badge tone="warn">
        <AlertTriangle size={14} /> Preview error
      </Badge>
    ) : (
      <Badge tone="info">Idle</Badge>
    );

  if (!isBrowser) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.previewBody}>Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.logoBox}>
            <Play size={16} />
          </div>
          <div className={styles.titleGroup}>
            <h1>MDX Post Editor</h1>
            <span>Authoring + live MDX preview</span>
          </div>
          <div className={styles.divider} aria-hidden />
          <div className={styles.topInputs}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="post.mdx" />
            <div className={styles.chipRow}>
              {statusChip}
              <Badge tone="info">{wordCount} words</Badge>
              <Badge tone="info">~{readMins} min read</Badge>
              <Badge tone="info">Preview: {showPreview ? 'ON' : 'OFF'}</Badge>
            </div>
          </div>
          <div className={styles.controls}>
            <IconButton title="Toggle left panel" onClick={() => setShowLeft((v) => !v)}>
              <PanelLeft size={16} />
            </IconButton>
            <IconButton title="Toggle right panel" onClick={() => setShowRight((v) => !v)}>
              <PanelRight size={16} />
            </IconButton>
            <IconButton title="Smart format" onClick={formatSmart}>
              <Wand2 size={16} />
            </IconButton>
            <IconButton title="Save draft (Ctrl+S)" onClick={saveDraft}>
              <Save size={16} />
            </IconButton>
            <IconButton title="Import MD/MDX" onClick={importMdx}>
              <FileUp size={16} />
            </IconButton>
            <IconButton title="Export MDX" onClick={exportMdx}>
              <FileDown size={16} />
            </IconButton>
            <Button variant={showPreview ? 'ghost' : 'primary'} onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? 'Hide preview' : 'Show preview'}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          <AnimatePresence initial={false}>
            {showLeft && (
              <SnippetsSidebar
                search={search}
                onSearchChange={setSearch}
                snippets={filteredSnippets}
                onInsert={insertAtCursor}
                onWrapSelection={wrapSelection}
                onApplyHeading={applyHeading}
              />
            )}
          </AnimatePresence>

          <div
            className={cn(
              styles.centerPanel,
              !showLeft && showRight && styles.centerWide,
              !showRight && showLeft && styles.centerWide,
              !showLeft && !showRight && styles.centerFull,
            )}
          >
            <div className={styles.editorShell}>
              <div className={styles.editorHeader}>
                <div>Editor</div>
                <div className={styles.muted}>
                  <Badge tone="info">MDX</Badge>
                </div>
              </div>
              <div className={styles.editorBody}>
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  theme="vs-dark"
                  value={mdx}
                  onChange={(value) => setMdx(value ?? '')}
                  onMount={onEditorMount}
                  options={{automaticLayout: true}}
                />
              </div>
              {compileState.status === 'error' ? (
                <div className={styles.alert}>
                  <div style={{display: 'flex', gap: 8}}>
                    <AlertTriangle size={16} />
                    <div>
                      <div style={{fontWeight: 700}}>MDX compilation failed</div>
                      <div className={styles.small}>
                        {compileState.line && compileState.column ? (
                          <span>
                            Line {compileState.line}, Col {compileState.column} -
                          </span>
                        ) : null}{' '}
                        {compileState.message}
                      </div>
                      <div style={{marginTop: 8}}>
                        <Button variant="ghost" onClick={() => void compileMdx(mdx)}>
                          Recompile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showRight && (
              <motion.aside
                className={cn(styles.rightPanel, !showLeft && styles.rightTight)}
                initial={{opacity: 0, x: 12}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 12}}
                transition={{duration: 0.18}}
              >
                <div className={styles.previewCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>Preview</div>
                    <div style={{display: 'flex', gap: 8}}>
                      {statusChip}
                      <Button variant={showPreview ? 'primary' : 'ghost'} onClick={() => setShowPreview((v) => !v)}>
                        {showPreview ? 'Live' : 'Hidden'}
                      </Button>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.previewBody}>
                      {!showPreview ? (
                        <div className={styles.small}>Preview is hidden. Toggle it with Ctrl + Enter.</div>
                      ) : PreviewComponent ? (
                        <article className={styles.prose}>
                          <MDXErrorBoundary>
                            <PreviewComponent components={mdxComponents as any} frontmatter={{}} />
                          </MDXErrorBoundary>
                        </article>
                      ) : (
                        <div className={styles.small}>Fix compilation errors to see a preview.</div>
                      )}
                    </div>
                    <Separator />
                    <div className={styles.small} style={{fontWeight: 700, marginBottom: 8}}>
                      Publish checklist
                    </div>
                    <div className={styles.checklist}>
                      <ChecklistItem ok={title.trim().length > 0} label="Filename" />
                      <ChecklistItem ok={wordCount >= 120} label=">= 120 words" />
                      <ChecklistItem ok={!/\bTODO\b/i.test(mdx)} label="No TODO" />
                      <ChecklistItem ok={compileState.status === 'ok'} label="Preview OK" />
                    </div>
                    <div className={cn(styles.small, styles.muted)} style={{marginTop: 10}}>
                      Tip: keep components small and reusable. Use frontmatter to drive your site metadata.
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.footer}>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
            <span className={styles.muted} style={{fontWeight: 700}}>
              MDX Editor
            </span>
            <span className={styles.muted}>Draft autosaves to localStorage - Ctrl+S save - Ctrl+Enter preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ok, label}: {ok: boolean; label: string}) {
  return (
    <div className={cn(styles.checkItem, ok && styles.checkItemOk)}>
      {ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      <span>{label}</span>
    </div>
  );
}

