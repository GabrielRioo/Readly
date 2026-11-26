import { useEffect, useState } from 'react'
import {
  addBook,
  backfillMissingCovers,
  deleteBook,
  listBooks,
  updateBookDetails,
} from '../../../services/bookStorage.ts'
import type { BookSummary } from '../../../types/book.ts'
import { errorMessage } from '../../../utils/text.ts'

export function useLibrary() {
  const [books, setBooks] = useState<BookSummary[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let active = true
    listBooks()
      .then((rows) => {
        if (!active) return
        setBooks(rows)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setStatus('error')
        setError('Não foi possível abrir a biblioteca neste aparelho.')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    let active = true
    void backfillMissingCovers((book) => {
      if (!active) return
      setBooks((current) => current.map((item) => (item.id === book.id ? book : item)))
    })
    return () => {
      active = false
    }
  }, [status])

  async function importFiles(files: FileList) {
    setImporting(true)
    setNotice(null)
    setError(null)
    const failures: string[] = []
    let added = 0

    for (const file of files) {
      try {
        await addBook(file)
        added += 1
      } catch (caught) {
        failures.push(`${file.name}: ${errorMessage(caught, 'não foi possível importar')}`)
      }
    }

    try {
      setBooks(await listBooks())
      setStatus('ready')
    } catch {
      setStatus('error')
      setError('Não foi possível atualizar a biblioteca.')
    }

    if (failures.length > 0) {
      setError(failures.slice(0, 3).join(' '))
    }
    if (added > 0) {
      setNotice(added === 1 ? '1 livro adicionado.' : `${added} livros adicionados.`)
    }
    setImporting(false)
  }

  async function removeBook(id: string) {
    setError(null)
    try {
      await deleteBook(id)
      setBooks((current) => current.filter((book) => book.id !== id))
    } catch {
      setError('Não foi possível excluir o livro.')
    }
  }

  async function editBook(
    id: string,
    patch: { title: string; coverBlob?: Blob | null },
  ): Promise<void> {
    setError(null)
    const updated = await updateBookDetails(id, patch)
    setBooks((current) => current.map((book) => (book.id === id ? updated : book)))
  }

  return {
    books,
    status,
    error,
    notice,
    importing,
    importFiles,
    removeBook,
    editBook,
    dismissNotice: () => setNotice(null),
  }
}
