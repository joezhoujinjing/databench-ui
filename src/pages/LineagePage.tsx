import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLineage } from '../api/hooks'
import { Card, EmptyState, ErrorState, JsonBlock, Spinner } from '../components/ui'
import { TreeNode } from '../components/TreeNode'

export function LineagePage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const refFromUrl = params.get('ref') ?? ''
  const [input, setInput] = useState(refFromUrl)
  const [activeRef, setActiveRef] = useState(refFromUrl)
  const [raw, setRaw] = useState(false)

  // Keep input in sync when navigated here with a ?ref= query.
  useEffect(() => {
    setInput(refFromUrl)
    setActiveRef(refFromUrl)
  }, [refFromUrl])

  const lineage = useLineage(activeRef || undefined)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const ref = input.trim()
    setActiveRef(ref)
    setParams(ref ? { ref } : {})
  }

  return (
    <Card title={t('lineage.title')}>
      <form className="form-inline" onSubmit={submit}>
        <input
          className="input"
          placeholder={t('lineage.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={!input.trim()}>
          {t('common.load')}
        </button>
      </form>

      {!activeRef && <EmptyState>{t('lineage.emptyPrompt')}</EmptyState>}

      {activeRef && (
        <>
          {lineage.isLoading && <Spinner />}
          {lineage.isError && <ErrorState error={lineage.error} />}
          {lineage.data !== undefined && !lineage.isError && (
            <>
              <div className="row gap mt">
                <button className="btn btn-sm" onClick={() => setRaw((v) => !v)}>
                  {raw ? t('lineage.treeView') : t('common.rawJson')}
                </button>
              </div>
              {raw ? (
                <JsonBlock value={lineage.data} />
              ) : (
                <div className="tree">
                  <TreeNode label={t('lineage.rootLabel')} value={lineage.data} defaultOpen />
                </div>
              )}
            </>
          )}
        </>
      )}
    </Card>
  )
}
