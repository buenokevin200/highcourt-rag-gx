'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSettings, updateSettings, testConnection, getMe } from '@/lib/api-client'
import { Scale, Save, CheckCircle, XCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ is_admin: boolean } | null>(null)
  const [settings, setSettings] = useState({
    api_endpoint: '',
    api_key: '',
    llm_model: '',
    embedding_model: '',
    temperature: 0.1,
    top_k: 5,
    chunk_size: 1000,
    chunk_overlap: 200,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [savedMsg, setSavedMsg] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    getMe().then(u => {
      setUser(u)
      if (!u.is_admin) { router.push('/'); return }
      loadSettings()
    }).catch(() => {
      localStorage.removeItem('token')
      router.push('/login')
    })
  }, [router])

  async function loadSettings() {
    try {
      const data = await getSettings()
      setSettings(prev => ({ ...prev, ...data }))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setSaving(true); setSavedMsg('')
    try {
      await updateSettings(settings)
      setSavedMsg('Configuración guardada correctamente')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err: unknown) {
      setSavedMsg(err instanceof Error ? err.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  async function handleTestConnection() {
    setTesting(true); setTestResult(null)
    try {
      const result = await testConnection({
        api_endpoint: settings.api_endpoint,
        api_key: settings.api_key,
        llm_model: settings.llm_model,
      })
      setTestResult(result)
    } catch (err: unknown) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Error de conexión' })
    } finally { setTesting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Scale className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Admin Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {savedMsg && (
          <div className={`p-3 rounded-lg text-sm ${savedMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {savedMsg}
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
              <input
                type="text"
                value={settings.api_endpoint}
                onChange={e => setSettings(prev => ({ ...prev, api_endpoint: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.api_key}
                  onChange={e => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="sk-..."
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo LLM</label>
                <input
                  type="text"
                  value={settings.llm_model}
                  onChange={e => setSettings(prev => ({ ...prev, llm_model: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo Embeddings</label>
                <input
                  type="text"
                  value={settings.embedding_model}
                  onChange={e => setSettings(prev => ({ ...prev, embedding_model: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="text-embedding-3-small"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={settings.temperature}
                  onChange={e => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Top-K (chunks a recuperar)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.top_k}
                  onChange={e => setSettings(prev => ({ ...prev, top_k: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunk Size</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={settings.chunk_size}
                  onChange={e => setSettings(prev => ({ ...prev, chunk_size: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunk Overlap</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.chunk_overlap}
                  onChange={e => setSettings(prev => ({ ...prev, chunk_overlap: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {testing ? 'Probando...' : 'Probar Conexión'}
            </button>
          </div>

          {testResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {testResult.message}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
