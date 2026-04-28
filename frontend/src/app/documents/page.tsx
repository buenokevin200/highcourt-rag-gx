'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getDocuments, uploadDocument, deleteDocument, getMe } from '@/lib/api-client'
import { Scale, Upload, Trash2, FileText, ArrowLeft, Loader } from 'lucide-react'

interface Doc {
  id: number
  original_filename: string
  file_size: number
  page_count: number
  case_number?: string
  court?: string
  judge?: string
  ruling_date?: string
  chunk_count: number
  created_at: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [metadata, setMetadata] = useState({ case_number: '', court: '', judge: '', ruling_date: '' })
  const [showMetadata, setShowMetadata] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    getMe().catch(() => {
      localStorage.removeItem('token')
      router.push('/login')
    })
    loadDocs()
  }, [router])

  async function loadDocs() {
    try {
      const data = await getDocuments()
      setDocs(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se aceptan archivos PDF')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      Object.entries(metadata).forEach(([k, v]) => { if (v) formData.append(k, v) })
      await uploadDocument(formData)
      setMetadata({ case_number: '', court: '', judge: '', ruling_date: '' })
      setShowMetadata(false)
      await loadDocs()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al subir documento')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }, [metadata])

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de eliminar este documento y sus chunks de la base vectorial?')) return
    try {
      await deleteDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Scale className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showMetadata ? 'Ocultar metadatos' : '+ Añadir metadatos'}
            </button>
            <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm font-medium">
              <Upload className="w-4 h-4" />
              {uploading ? 'Subiendo...' : 'Subir PDF'}
              <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {showMetadata && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Metadatos del documento</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="N° de expediente"
                value={metadata.case_number}
                onChange={e => setMetadata(prev => ({ ...prev, case_number: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Tribunal"
                value={metadata.court}
                onChange={e => setMetadata(prev => ({ ...prev, court: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Juez"
                value={metadata.judge}
                onChange={e => setMetadata(prev => ({ ...prev, judge: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Fecha (ej: 15/03/2024)"
                value={metadata.ruling_date}
                onChange={e => setMetadata(prev => ({ ...prev, ruling_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-600">No hay documentos</p>
            <p className="text-sm">Sube sentencias en PDF para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.original_filename}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                        <span>{formatSize(doc.file_size)}</span>
                        <span>{doc.page_count} páginas</span>
                        <span>{doc.chunk_count} chunks</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                      {(doc.case_number || doc.court || doc.judge) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-600">
                          {doc.case_number && <span className="bg-gray-100 px-2 py-0.5 rounded">Exp: {doc.case_number}</span>}
                          {doc.court && <span className="bg-gray-100 px-2 py-0.5 rounded">{doc.court}</span>}
                          {doc.judge && <span className="bg-gray-100 px-2 py-0.5 rounded">Juez: {doc.judge}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
