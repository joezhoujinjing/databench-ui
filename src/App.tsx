import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HealthBadge } from './components/HealthBadge'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { DatasetsPage } from './pages/DatasetsPage'
import { DatasetDetailPage } from './pages/DatasetDetailPage'
import { IngestPage } from './pages/IngestPage'
import { TransformsPage } from './pages/TransformsPage'
import { RecipePage } from './pages/RecipePage'
import { LineagePage } from './pages/LineagePage'

const NAV = [
  { to: '/datasets', key: 'nav.datasets' },
  { to: '/ingest', key: 'nav.ingest' },
  { to: '/transforms', key: 'nav.transforms' },
  { to: '/recipe', key: 'nav.recipe' },
  { to: '/lineage', key: 'nav.lineage' },
] as const

export default function App() {
  const { t } = useTranslation()
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">databench<span className="brand-dim"> {t('brand.suffix')}</span></div>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <LanguageSwitcher />
        <HealthBadge />
      </header>

      <main className="content">
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
      </main>
    </div>
  )
}
