import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

const toHtml = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

const toMarkdown = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, {
    fences: true,
    bullet: '-',
    listItemIndent: 'one',
  });

export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '';
  return String(toHtml.processSync(markdown));
}

export function htmlToMarkdown(html: string): string {
  if (isBlankHtml(html)) return '';
  return String(toMarkdown.processSync(html)).replace(/\n+$/, '\n');
}

/** ATX heading typed as plain text in a paragraph/div. */
export function typedHeading(text: string): { level: number; text: string } | null {
  const m = text.replace(/\u00a0/g, ' ').match(/^(#{1,6})[ \t]+([\s\S]*)$/);
  if (!m) return null;
  return { level: m[1].length, text: m[2] };
}

export function looksLikeMarkdownSource(text: string): boolean {
  return /^(#{1,6}[ \t]|[-*][ \t]|>[ \t])/m.test(text.replace(/\u00a0/g, ' '));
}

export function isBlankHtml(html: string): boolean {
  const text = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\u200b/g, '')
    .trim();
  return text.length === 0;
}
