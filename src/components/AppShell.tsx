import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import { BottomNavigation, BottomNavigationAction, Box } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { usePreferences } from '../hooks/usePreferences.ts'

const tabs = [
  { label: 'Tela Inicial', value: '/', icon: <MenuBookOutlinedIcon /> },
  { label: 'Vocabulário', value: '/vocabulary', icon: <TranslateOutlinedIcon /> },
  { label: 'Ajustes', value: '/settings', icon: <SettingsOutlinedIcon /> },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { preferences } = usePreferences()
  const current = tabs.some((tab) => tab.value === location.pathname) ? location.pathname : '/'
  const kindle = preferences.theme === 'kindle'

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }} className="app-shell">
      <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: 920, mx: 'auto' }}>
        <Outlet />
      </Box>
      <BottomNavigation
        value={current}
        onChange={(_, value: string) => navigate(value)}
        showLabels
        sx={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: kindle ? '#f3f1ea' : 'background.paper',
          backgroundImage: 'none',
          backdropFilter: kindle ? 'none' : 'blur(10px)',
          pb: 'env(safe-area-inset-bottom)',
          height: 'calc(56px + env(safe-area-inset-bottom))',
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.value} label={tab.label} value={tab.value} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Box>
  )
}
