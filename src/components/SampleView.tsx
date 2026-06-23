import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import type { Sample } from '../api/types'
import { JsonBlock } from './ui'

// Render a chat-style messages array if present (common to sft/preference/rl).
function Messages({ messages }: { messages: unknown }) {
  if (!Array.isArray(messages)) return null
  return (
    <div className="messages">
      {messages.map((m, i) => {
        const role = (m as { role?: string })?.role ?? 'msg'
        const content = (m as { content?: unknown })?.content
        return (
          <div key={i} className="message">
            <span className="message-role">{role}</span>
            <span className="message-content">
              {typeof content === 'string' ? content : JSON.stringify(content)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// A small, kind-aware preview: pull out the most useful field per kind, and
// keep the full raw sample available behind a disclosure.
export function SampleView({ sample }: { sample: Sample }) {
  const { t } = useTranslation()
  const kind = sample.kind ?? 'unknown'
  const id = sample.id

  return (
    <div className="sample">
      <div className="sample-head">
        <span className={`badge badge-kind kind-${kind}`}>{kind}</span>
        {id != null && <code className="sample-id">{String(id)}</code>}
      </div>

      <KindBody sample={sample} kind={kind} />

      <details className="details">
        <summary>{t('common.rawJson')}</summary>
        <JsonBlock value={sample} />
      </details>
    </div>
  )
}

function KindBody({ sample, kind }: { sample: Sample; kind: string }) {
  switch (kind) {
    case 'sft':
      return <Messages messages={sample.messages} />
    case 'preference':
      return (
        <div className="pref">
          <Messages messages={sample.messages ?? sample.prompt} />
          <Field label="chosen" value={sample.chosen} />
          <Field label="rejected" value={sample.rejected} />
        </div>
      )
    case 'rl':
      return (
        <div>
          <Messages messages={sample.messages ?? sample.prompt} />
          <Field label="reward" value={sample.reward} />
        </div>
      )
    case 'trajectory':
      return (
        <div>
          <Field label="steps" value={summarizeSteps(sample.steps)} />
          <Messages messages={sample.messages} />
        </div>
      )
    default:
      return null
  }
}

function summarizeSteps(steps: unknown): string {
  if (Array.isArray(steps)) return i18n.t('sample.stepCount', { count: steps.length })
  return i18n.t('common.dash')
}

function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null
  const text =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : JSON.stringify(value)
  return (
    <div className="field-inline">
      <span className="field-key">{label}:</span> <span>{text}</span>
    </div>
  )
}
