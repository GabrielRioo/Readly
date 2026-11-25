import { Box, Button, Typography } from '@mui/material'
import { Component, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box sx={{ p: 3, maxWidth: 520 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Algo quebrou nesta tela.
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Seus livros continuam neste aparelho. Volte à biblioteca e abra de novo.
        </Typography>
        <Button variant="contained" onClick={() => window.location.assign('/')}>
          Voltar à biblioteca
        </Button>
      </Box>
    )
  }
}
