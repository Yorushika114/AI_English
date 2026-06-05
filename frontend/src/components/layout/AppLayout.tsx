import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import SceneDrawer from './SceneDrawer'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <div className="min-h-screen bg-bg flex flex-col" style={{ minWidth: 768 }}>
      <TopBar onMenuClick={() => setDrawerOpen(true)} />
      <SceneDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
