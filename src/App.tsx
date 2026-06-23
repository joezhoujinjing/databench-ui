import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConnectionPanel } from './components/ConnectionPanel'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { Card, ErrorState, Spinner } from './components/ui'
import { FEATURES, useCapabilities, useModuleEnabled } from './api/capabilities'
import { CLIENT_VERSION } from './api/version'
import { DatasetsPage } from './pages/DatasetsPage'
import { DatasetDetailPage } from './pages/DatasetDetailPage'
import { IngestPage } from './pages/IngestPage'
import { TransformsPage } from './pages/TransformsPage'
import { RecipePage } from './pages/RecipePage'
import { LineagePage } from './pages/LineagePage'

const NAV = [
  { to: '/datasets', key: 'nav.datasets', feature: undefined },
  { to: '/ingest', key: 'nav.ingest', feature: undefined },
  { to: '/transforms', key: 'nav.transforms', feature: FEATURES.transforms },
  { to: '/recipe', key: 'nav.recipe', feature: FEATURES.recipes },
  { to: '/lineage', key: 'nav.lineage', feature: FEATURES.lineage },
] as const

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
      {label}
    </NavLink>
  )
}

export default function App() {
  const { t } = useTranslation()
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">databench<span className="brand-dim"> {t('brand.suffix')}</span></div>
        <Nav />
        <LanguageSwitcher />
        <ConnectionPanel />
      </header>

      <main className="content">
        <Gate />
      </main>
    </div>
  )
}

function Nav() {
  const { t } = useTranslation()
  const transforms = useModuleEnabled(FEATURES.transforms)
  const recipes = useModuleEnabled(FEATURES.recipes)
  const lineage = useModuleEnabled(FEATURES.lineage)
  const enabled: Record<string, boolean> = {
    [FEATURES.transforms]: transforms,
    [FEATURES.recipes]: recipes,
    [FEATURES.lineage]: lineage,
  }
  return (
    <nav className="nav">
      {NAV.filter((item) => !item.feature || enabled[item.feature]).map((item) => (
        <NavItem key={item.to} to={item.to} label={t(item.key)} />
      ))}
    </nav>
  )
}

// Capability-driven gate: never blanks the screen. Shows a connecting spinner, a
// connection error (with the panel still available to fix the base), or a clear
// version-incompatibility message before letting the app render.
function Gate() {
  const { t } = useTranslation()
  const { isLoading, isError, error, compatibility } = useCapabilities()

  if (isLoading) {
    return <Card title={t('gate.connectingTitle')}><Spinner label={t('gate.connecting')} /></Card>
  }

  if (isError) {
    return (
      <Card title={t('gate.cannotConnectTitle')}>
        <ErrorState error={error} />
        <p className="text-muted">{t('gate.cannotConnectHint')}</p>
      </Card>
    )
  }

  if (compatibility && !compatibility.ok) {
    return (
      <Card title={t('gate.incompatibleTitle')}>
        {compatibility.reason === 'client_too_old' ? (
          <p>{t('gate.clientTooOld', { min: compatibility.minClient, current: CLIENT_VERSION })}</p>
        ) : (
          <p>{t('gate.apiUnsupported', { api: compatibility.apiVersion })}</p>
        )}
        <p className="text-muted">{t('gate.incompatibleHint')}</p>
      </Card>
    )
  }

  return <AppRoutes />
}

function AppRoutes() {
  const { t } = useTranslation()
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/datasets" replace />} />
      <Route path="/datasets" element={<DatasetsPage />} />
      <Route path="/datasets/:ref" element={<DatasetDetailPage />} />
      <Route path="/ingest" element={<IngestPage />} />
      <Route path="/transforms" element={<TransformsPage />} />
      <Route path="/recipe" element={<RecipePage />} />
      <Route path="/lineage" element={<LineagePage />} />
      <Route path="*" element={<div className="card">{t('notFound')}</div>} />
    </Routes>
  )
}
