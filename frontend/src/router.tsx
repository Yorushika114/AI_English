import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PracticePage from './pages/PracticePage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <PracticePage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'profile', element: <ProfilePage /> }
    ]
  }
])
