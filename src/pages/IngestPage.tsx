import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateDataset, useIngestJsonl } from '../api/hooks'
import type { IngestKind, Sample } from '../api/types'
import { Card, InlineError } from '../components/ui'
import { ManifestView } from '../components/ManifestView'

const KINDS: IngestKind[] = ['sft', 'preference', 'rl', 'trajectory']

const SAMPLE_PLACEHOLDER = `[
  {
    "kind": "sft",
    "id": "ex-1",
    "messages": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "Hi there!" }
    ]
  }
]`

export function IngestPage() {
  return (
    <div className="grid-2">
      <JsonlUploadCard />
      <JsonSamplesCard />
    </div>
  )
}

function JsonlUploadCard() {
  const { t } = useTranslation()
  const ingest = useIngestJsonl()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<IngestKind | ''>('')
  const [source, setSource] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    ingest.mutate({
      file,
      name: name || undefined,
      kind: kind || undefined,
      source: source || undefined,
    })
  }

  return (
    <Card title={t('ingest.uploadTitle')}>
      <p className="text-muted">{t('ingest.uploadDescription')}</p>
      <form className="form" onSubmit={submit}>
        <label className="field-label">{t('ingest.fileLabel')}</label>
        <input
          className="input"
          type="file"
          accept=".jsonl,application/x-ndjson,application/jsonl"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <label className="field-label">{t('ingest.nameLabel')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="field-label">{t('ingest.kindLabel')}</label>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as IngestKind | '')}>
          <option value="">{t('ingest.kindInfer')}</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <label className="field-label">{t('ingest.sourceLabel')}</label>
        <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />

        <button className="btn btn-primary" type="submit" disabled={!file || ingest.isPending}>
          {ingest.isPending ? t('ingest.uploading') : t('ingest.ingestAction')}
        </button>
      </form>

      {ingest.isError && <InlineError error={ingest.error} />}
      {ingest.data && <ResultManifest title={t('ingest.ingested')} manifest={ingest.data} />}
    </Card>
  )
}

function JsonSamplesCard() {
  const { t } = useTranslation()
  const create = useCreateDataset()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [text, setText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setParseError(null)
    let samples: Sample[]
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        setParseError(t('ingest.errExpectArray'))
        return
      }
      samples = parsed
    } catch (err) {
      setParseError(t('ingest.errInvalidJson', { message: (err as Error).message }))
      return
    }
    create.mutate({
      name: name || undefined,
      message: message || undefined,
      samples,
    })
  }

  return (
    <Card title={t('ingest.createTitle')}>
      <p className="text-muted">{t('ingest.createDescription')}</p>
      <form className="form" onSubmit={submit}>
        <label className="field-label">{t('ingest.nameLabel')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="field-label">{t('ingest.messageLabel')}</label>
        <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} />

        <label className="field-label">{t('ingest.samplesLabel')}</label>
        <textarea
          className="input textarea mono"
          rows={12}
          placeholder={SAMPLE_PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button className="btn btn-primary" type="submit" disabled={!text.trim() || create.isPending}>
          {create.isPending ? t('ingest.creating') : t('ingest.createAction')}
        </button>
      </form>

      {parseError && <div className="text-error">{parseError}</div>}
      {create.isError && <InlineError error={create.error} />}
      {create.data && <ResultManifest title={t('ingest.created')} manifest={create.data} />}
    </Card>
  )
}

function ResultManifest({ title, manifest }: { title: string; manifest: Parameters<typeof ManifestView>[0]['manifest'] }) {
  return (
    <div className="result">
      <div className="result-head">✓ {title}</div>
      <ManifestView manifest={manifest} linkToDetail />
    </div>
  )
}
