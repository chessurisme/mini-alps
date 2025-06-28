
'use client';

import React, { useEffect, useState } from 'react';
import { Editor, rootCtx, editorViewOptionsCtx, defaultValueCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';

interface MilkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

const PLACEHOLDERS = [
  "A thought, a dream, a memory...",
  "What story will you tell?",
  "Let the ink flow...",
  "The first line is always the hardest.",
  "Plant a seed of an idea here.",
  "What's on your mind?",
  "Whisper your secrets to the page.",
  "Begin with a single word.",
  "Or paste a URL, or a #hexcode..."
];


const MilkdownInternal = ({ content, onChange, readOnly, placeholder }: MilkdownEditorProps & { placeholder: string }) => {
    useEditor((root) => {
      return Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.set(defaultValueCtx, content);
          ctx.set(editorViewOptionsCtx, {
              editable: () => !readOnly,
              attributes: {
                'data-placeholder': readOnly ? '' : placeholder,
              }
          });
          ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
            onChange(markdown);
          });
        })
        .use(nord)
        .use(commonmark)
        .use(gfm)
        .use(listener)
        .use(history);
    });
    
    return <Milkdown />;
};
MilkdownInternal.displayName = 'MilkdownInternal';


export const MilkdownEditor = (props: MilkdownEditorProps) => {
    const [mounted, setMounted] = useState(false);
    const [placeholder, setPlaceholder] = useState('');

    useEffect(() => {
        setMounted(true);
        setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);
    }, []);

    if (!mounted) {
        return (
             <div className="flex-grow w-full resize-none border-0 shadow-none text-base px-2 focus-visible:ring-0 prose dark:prose-invert max-w-none rounded-md bg-muted animate-pulse">
                <p className="p-4">Loading Editor...</p>
            </div>
        );
    }

    return (
        <MilkdownProvider>
            <MilkdownInternal {...props} placeholder={placeholder} />
        </MilkdownProvider>
    );
};
MilkdownEditor.displayName = 'MilkdownEditor';
