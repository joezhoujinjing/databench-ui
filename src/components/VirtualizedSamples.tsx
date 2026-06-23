import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { useInfiniteSamples } from '../api/hooks'
import type { Sample } from '../api/types'
import { SampleView } from './SampleView'
import { EmptyState, ErrorState, Spinner } from './ui'

// Lazy, virtualized sample browser. Loads one page at a time (capped by the
// backend) and only renders the rows currently in view, so a 1000s-row dataset
// stays responsive and we never pull the whole thing into memory.
export function VirtualizedSamples({
  refName,
  pageSize,
}: {
  refName: string
  pageSize: number
}) {
  const { t } = useTranslation()
  const query = useInfiniteSamples(refName, pageSize)
  const parentRef = useRef<HTMLDivElement>(null)

  const rows: Sample[] = query.data?.pages.flatMap((p) => p.items as Sample[]) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const loaded = rows.length

  const virtualizer = useVirtualizer({
    count: loaded,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 6,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Fetch the next page once the user scrolls near the end of what's loaded.
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1]
    if (!last) return
    if (last.index >= loaded - 1 && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [virtualItems, loaded, query])

  if (query.isLoading) return <Spinner />
  if (query.isError) return <ErrorState error={query.error} />
  if (loaded === 0) return <EmptyState>{t('detail.noSamples')}</EmptyState>

  return (
    <div className="samples">
      <div className="row between samples-toolbar">
        <span className="text-muted">{t('detail.loadedOf', { loaded, total })}</span>
      </div>

      <div ref={parentRef} className="virtual-scroll">
        <div className="virtual-inner" style={{ height: virtualizer.getTotalSize() }}>
          {virtualItems.map((vi) => (
            <div
              key={vi.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="virtual-row"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              <SampleView sample={rows[vi.index]} />
            </div>
          ))}
        </div>
      </div>

      {query.isFetchingNextPage && <Spinner label={t('detail.loadingMore')} />}
      {!query.hasNextPage && loaded > 0 && (
        <div className="text-muted samples-end">{t('detail.allLoaded', { total })}</div>
      )}
    </div>
  )
}
