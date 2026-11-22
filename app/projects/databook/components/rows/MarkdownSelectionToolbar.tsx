import { useLayoutEffect, useRef } from 'react';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  ListsToggle,
  Separator,
} from '@mdxeditor/editor';
import * as Toolbar from '@radix-ui/react-toolbar';
import type { FloatingUIComponentProps } from '@mdxeditor/floating-selection-ui-plugin';

const EDGE = 8;

function contentBounds() {
  const main = document.querySelector('.dbk-main-column');
  const sidebar = document.querySelector('.dbk-sidebar');
  const mainBox = main instanceof HTMLElement ? main.getBoundingClientRect() : null;
  const sidebarBox = sidebar instanceof HTMLElement ? sidebar.getBoundingClientRect() : null;
  const overlaying = Boolean(
    sidebar instanceof HTMLElement && getComputedStyle(sidebar).position === 'fixed',
  );

  const left = overlaying && sidebarBox
    ? sidebarBox.right + EDGE
    : (mainBox?.left ?? 0) + EDGE;
  const right = (mainBox?.right ?? window.innerWidth) - EDGE;
  return { left, right: Math.max(left + 160, right) };
}

export function MarkdownSelectionToolbar(_props: FloatingUIComponentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const apply = () => {
      const wrapper = node.closest('[data-radix-popper-content-wrapper]') as HTMLElement | null;
      if (wrapper) wrapper.style.translate = 'none';
      const { left, right } = contentBounds();
      node.style.maxWidth = `${Math.max(160, right - left)}px`;
      const rect = node.getBoundingClientRect();
      let dx = 0;
      if (rect.left < left) dx = left - rect.left;
      if (rect.right + dx > right) dx -= rect.right + dx - right;
      if (wrapper) wrapper.style.translate = `${dx}px 0px`;
      else node.style.marginLeft = `${dx}px`;
    };

    const raf = requestAnimationFrame(apply);
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    window.addEventListener('resize', apply);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  return (
    <Toolbar.Root
      ref={ref}
      className="dbk-mdx-popover"
      aria-label="Text formatting"
      onMouseDown={(e) => e.preventDefault()}
    >
      <BlockTypeSelect />
      <Separator />
      <BoldItalicUnderlineToggles />
      <CodeToggle />
      <Separator />
      <ListsToggle options={['bullet', 'number']} />
      <Separator />
      <CreateLink />
    </Toolbar.Root>
  );
}
