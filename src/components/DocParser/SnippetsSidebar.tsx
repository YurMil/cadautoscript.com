import React from 'react';
import {motion} from 'framer-motion';
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Search,
  Table,
} from 'lucide-react';
import styles from './MdxPostEditor.module.css';
import {Card, IconButton, Input, Separator} from './ui';

export default function SnippetsSidebar({
  search,
  onSearchChange,
  snippets,
  onInsert,
  onWrapSelection,
  onApplyHeading,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  snippets: Array<{name: string; description: string; snippet: string}>;
  onInsert: (text: string) => void;
  onWrapSelection: (before: string, after?: string) => void;
  onApplyHeading: (level: 1 | 2 | 3) => void;
}) {
  return (
    <motion.aside
      className={styles.leftPanel}
      initial={{opacity: 0, x: -12}}
      animate={{opacity: 1, x: 0}}
      exit={{opacity: 0, x: -12}}
      transition={{duration: 0.18}}
    >
      <Card
        title="Insert"
        right={
          <span className={styles.muted}>
            <Search size={14} /> Snippets
          </span>
        }
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search snippets..."
          />
          <div className={styles.snippetList}>
            {snippets.map((snippet) => (
              <button
                key={snippet.name}
                type="button"
                className={styles.snippet}
                onClick={() => onInsert(snippet.snippet)}
              >
                <div className={styles.snippetTitle}>{snippet.name}</div>
                <div className={styles.snippetDesc}>{snippet.description}</div>
              </button>
            ))}
          </div>
          <Separator />
          <div className={styles.toolbar}>
            <IconButton title="Bold (Ctrl+B)" onClick={() => onWrapSelection('**', '**')}>
              <Bold size={14} />
            </IconButton>
            <IconButton title="Italic (Ctrl+I)" onClick={() => onWrapSelection('*', '*')}>
              <Italic size={14} />
            </IconButton>
            <IconButton title="Inline code" onClick={() => onWrapSelection('`', '`')}>
              <Code2 size={14} />
            </IconButton>
            <IconButton title="Heading 1" onClick={() => onApplyHeading(1)}>
              <Heading1 size={14} />
            </IconButton>
            <IconButton title="Heading 2" onClick={() => onApplyHeading(2)}>
              <Heading2 size={14} />
            </IconButton>
            <IconButton title="Heading 3" onClick={() => onApplyHeading(3)}>
              <Heading3 size={14} />
            </IconButton>
            <IconButton title="Link (Ctrl+K)" onClick={() => onWrapSelection('[', '](url)')}>
              <Link2 size={14} />
            </IconButton>
            <IconButton title="Image" onClick={() => onInsert('![alt](url)\n')}>
              <ImageIcon size={14} />
            </IconButton>
            <IconButton title="Bulleted list" onClick={() => onInsert('- item\n- item\n')}>
              <List size={14} />
            </IconButton>
            <IconButton title="Numbered list" onClick={() => onInsert('1. item\n2. item\n')}>
              <ListOrdered size={14} />
            </IconButton>
            <IconButton title="Quote" onClick={() => onInsert('> quote\n')}>
              <Quote size={14} />
            </IconButton>
            <IconButton
              title="Table"
              onClick={() => onInsert('| Col A | Col B |\n| --- | --- |\n| 1 | 2 |\n')}
            >
              <Table size={14} />
            </IconButton>
          </div>
          <div className={styles.note}>
            <div className={styles.small}>
              <strong>Shortcuts:</strong> Ctrl+S save, Ctrl+Enter preview, Ctrl+F find, Ctrl+B bold, Ctrl+I
              italic, Ctrl+K link
            </div>
          </div>
        </div>
      </Card>
      <div style={{marginTop: 14}}>
        <Card title="Security">
          <div className={styles.small}>
            This editor compiles MDX in the browser. For untrusted content, compile on the server and allow
            only known components.
          </div>
        </Card>
      </div>
    </motion.aside>
  );
}
