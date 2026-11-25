import { Box } from '@mui/material'

export function ReaderBody({
  html,
  fontSize,
  lineHeight,
}: {
  html: string
  fontSize: number
  lineHeight: number
}) {
  return (
    <Box
      className="reader-html fade-up"
      lang="en"
      sx={{
        maxWidth: 680,
        mx: 'auto',
        px: 2.5,
        py: 3,
        fontFamily: '"Literata Variable", "Iowan Old Style", Palatino, serif',
        fontSize,
        lineHeight,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
