import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import { BottomNavigation, BottomNavigationAction, Box } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { label: 'Biblioteca', value: '/', icon: <MenuBookOutlinedIcon /> },
  { label: 'Vocabulário', value: '/vocabulary', icon: <TranslateOutlinedIcon /> },
  { label: 'Ajustes', value: '/settings', icon: <SettingsOutlinedIcon /> },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = tabs.some((tab) => tab.value === location.pathname) ? location.pathname : '/'

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: 860, mx: 'auto' }}>
        <Outlet />
      </Box>
      <BottomNavigation
        value={current}
        onChange={(_, value: string) => navigate(value)}
        showLabels
        sx={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid rgba(26, 31, 28, 0.08)',
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
