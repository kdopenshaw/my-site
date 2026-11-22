import { useEffect, useRef } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  type MDXEditorMethods,
} from '@mdxeditor/editor';
import { floatingSelectionUIPlugin } from '@mdxeditor/floating-selection-ui-plugin';
import '@mdxeditor/editor/style.css';
import type { MarkdownRow as MarkdownRowModel } from '../../data/types';
import { MarkdownSelectionToolbar } from './MarkdownSelectionToolbar';

type Props = {
  row: MarkdownRowModel;
  onSave?: (body: string) => void;
  onFinish?: () => void;
  onDeselect?: () => void;
  onCancel?: (originalBody: string) => void;
  startEditing?: boolean;
};

const plugins = [
  headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  markdownShortcutPlugin(),
  floatingSelectionUIPlugin({
    component: MarkdownSelectionToolbar,
    side: 'top',
    align: 'center',
  }),
];

export function MarkdownRow({ row, onSave, onFinish, onDeselect, onCancel, startEditing = false }: Props) {
  const editable = Boolean(onSave);
  const editorRef = useRef<MDXEditorMethods>(null);
  const snapshotRef = useRef(row.body);
  const debounceRef = useRef(0);
  const lastSavedRef = useRef(row.body);
  const focusedRef = useRef(false);

  useEffect(() => {
    snapshotRef.current = row.body;
    lastSavedRef.current = row.body;
  }, [row.id]);

  useEffect(() => {
    if (!startEditing || !editable) return;
    snapshotRef.current = row.body;
    focusedRef.current = true;
    editorRef.current?.focus(undefined, { defaultSelection: 'rootEnd', preventScroll: true });
  }, [startEditing, editable, row.id]);

  const commit = (body: string) => {
    lastSavedRef.current = body;
    onSave?.(body);
  };

  const scheduleCommit = (body: string) => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => commit(body), 350);
  };

  const revert = () => {
    window.clearTimeout(debounceRef.current);
    editorRef.current?.setMarkdown(snapshotRef.current);
    focusedRef.current = false;
    onCancel?.(snapshotRef.current);
  };

  const saveAndExit = () => {
    window.clearTimeout(debounceRef.current);
    const body = editorRef.current?.getMarkdown() ?? lastSavedRef.current;
    if (editable) commit(body);
    focusedRef.current = false;
    (document.activeElement as HTMLElement | null)?.blur();
    onFinish?.();
    onDeselect?.();
  };

  return (
    <article
      className="dbk-row dbk-mdx"
      onKeyDownCapture={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          revert();
          return;
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          saveAndExit();
        }
      }}
    >
      <MDXEditor
        key={row.id}
        ref={editorRef}
        className="dbk-mdx-editor"
        contentEditableClassName="dbk-markdown"
        markdown={row.body}
        readOnly={!editable}
        autoFocus={startEditing ? { defaultSelection: 'rootEnd', preventScroll: true } : false}
        placeholder="Write markdown…"
        plugins={plugins}
        toMarkdownOptions={{ bullet: '-', listItemIndent: 'one' }}
        onChange={(markdown, initialMarkdownNormalize) => {
          if (!editable || initialMarkdownNormalize) return;
          if (!focusedRef.current) {
            focusedRef.current = true;
            snapshotRef.current = lastSavedRef.current;
          }
          scheduleCommit(markdown);
        }}
        onBlur={() => {
          window.clearTimeout(debounceRef.current);
          const body = editorRef.current?.getMarkdown() ?? lastSavedRef.current;
          if (editable) commit(body);
          focusedRef.current = false;
          onFinish?.();
        }}
      />
    </article>
  );
}
