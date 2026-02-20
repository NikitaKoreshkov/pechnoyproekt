'use client'

import { useEffect, useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import ImageUploader from '@/components/admin/ImageUploader'

export default function ContractTemplatePage() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/contract-template')
      if (res.ok) {
        const data = await res.json()
        setFilePath(data.filePath || null)
      }
    } catch (err) {
      console.error('Error loading contract template:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/contract-template', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setFilePath(data.filePath)
        alert('✅ Типовой документ успешно загружен!')
      } else {
        const error = await res.json()
        alert(`❌ Ошибка загрузки: ${error.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('Error uploading file:', err)
      alert('❌ Ошибка при загрузке файла')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить типовой документ? После удаления будет использоваться документ по умолчанию.')) {
      return
    }

    try {
      const res = await fetch('/api/admin/contract-template', {
        method: 'DELETE'
      })

      if (res.ok) {
        setFilePath(null)
        alert('✅ Типовой документ удален!')
      } else {
        const error = await res.json()
        alert(`❌ Ошибка удаления: ${error.error || 'Неизвестная ошибка'}`)
      }
    } catch (err) {
      console.error('Error deleting file:', err)
      alert('❌ Ошибка при удалении файла')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminTopBar title="Типовой договор" backHref="/admin/changes" />
        <div className="bg-white border rounded p-4">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminTopBar title="Типовой договор" backHref="/admin/changes" />
      
      <section className="bg-white border rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Управление типовым договором</h2>
        <p className="text-sm text-gray-600">
          Загрузите PDF файл типового договора. Если файл загружен, он будет использоваться вместо документа по умолчанию.
        </p>

        {filePath ? (
          <div className="border rounded p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Текущий документ:</p>
                <a 
                  href={filePath} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  {filePath}
                </a>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Загрузить новый документ (заменит текущий):</p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                }}
                disabled={uploading}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="border rounded p-4 bg-gray-50">
            <p className="text-sm text-gray-700 mb-4">Типовой документ не загружен. Используется документ по умолчанию.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Загрузить типовой документ (PDF):
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                }}
                disabled={uploading}
                className="w-full"
              />
              {uploading && <p className="text-sm text-gray-500 mt-2">Загрузка...</p>}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <strong>Важно:</strong> Типовой документ доступен для скачивания пользователями на странице "Как мы работаем".
            Если документ не загружен, будет использоваться автоматически сгенерированный документ по умолчанию.
          </p>
        </div>
      </section>
    </div>
  )
}

