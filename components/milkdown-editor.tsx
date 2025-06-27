
'use client';

import React, { useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { Editor, rootCtx, editorViewOptionsCtx, defaultValueCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history, undo, redo } from '@milkdown/plugin-history';
import { callCommand } from '@milkdown/utils';


interface MilkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

export interface MilkdownEditorHandles {
  undo: () => void;
  redo: () => void;
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


const MilkdownInternal = forwardRef<MilkdownEditorHandles, MilkdownEditorProps & { placeholder: string }>(
  ({ content, onChange, readOnly, placeholder }, ref) => {
    const [getInstance, loading] = useInstance();

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
        .use(history)
    });
    
    useImperativeHandle(ref, () => ({
      undo: () => {
        if (loading) return;
        getInstance()?.action(callCommand(undo.key));
      },
      redo: () => {
        if (loading) return;
        getInstance()?.action(callCommand(redo.key));
      },
    }));
    
    return <Milkdown />;
  }
);
MilkdownInternal.displayName = 'MilkdownInternal';


export const MilkdownEditor = forwardRef<MilkdownEditorHandles, MilkdownEditorProps>((props, ref) => {
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
            <MilkdownInternal {...props} placeholder={placeholder} ref={ref} />
        </MilkdownProvider>
    );
});
MilkdownEditor.displayName = 'MilkdownEditor';
