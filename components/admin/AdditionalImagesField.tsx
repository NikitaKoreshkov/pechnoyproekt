'use client'

import ImageUploader from './ImageUploader'

interface AdditionalImagesFieldProps {
  value: string[]
  onChange: (urls: string[]) => void
  placeholder?: string
  maxCount?: number
}

export default function AdditionalImagesField({
  value = [],
  onChange,
  placeholder = 'URL или загрузить файл',
  maxCount = 20
}: AdditionalImagesFieldProps) {
  const list = Array.isArray(value) ? value : []
  const updateOne = (index: number, url: string) => {
    const next = [...list]
    next[index] = url
    onChange(next)
  }
  const removeOne = (index: number) => {
    onChange(list.filter((_, i) => i !== index))
  }
  const addOne = () => {
    if (list.length >= maxCount) return
    onChange([...list, ''])
  }

  return (
    <div className="space-y-3">
      {list.map((url, i) => (
        <div key={i} className="flex gap-2 items-start border rounded p-2 bg-gray-50">
          <div className="flex-1 min-w-0">
            <ImageUploader
              value={url || ''}
              onChange={(u) => updateOne(i, u)}
              placeholder={placeholder}
            />
          </div>
          <button
            type="button"
            onClick={() => removeOne(i)}
            className="shrink-0 px-3 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50"
            title="Удалить изображение"
          >
            Удалить
          </button>
        </div>
      ))}
      {list.length < maxCount && (
        <button
          type="button"
          onClick={addOne}
          className="px-3 py-2 border border-dashed border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-sm"
        >
          + Добавить изображение
        </button>
      )}
    </div>
  )
}
