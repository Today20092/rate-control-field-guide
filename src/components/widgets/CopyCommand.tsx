import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** A command line with a copy button that confirms in text, not just colour. */
export default function CopyCommand({ command }: { command: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setState('copied')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md bg-ink p-3 text-paper">
      <code className="min-w-0 flex-1 overflow-x-auto px-1 py-2 text-[0.8rem] whitespace-pre">{command}</code>
      <button type="button" onClick={copy} className="ctl border-paper bg-ink text-paper hover:bg-ink-soft">
        {state === 'copied' ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
        {state === 'copied' ? 'Copied' : 'Copy'}
      </button>
      {state === 'failed' && (
        <p className="basis-full text-sm">Copy failed. Select the command to copy it.</p>
      )}
      <span className="sr-only" aria-live="polite">
        {state === 'copied'
          ? 'Command copied'
          : state === 'failed'
            ? 'Copy failed, select the text instead'
            : ''}
      </span>
    </div>
  )
}
