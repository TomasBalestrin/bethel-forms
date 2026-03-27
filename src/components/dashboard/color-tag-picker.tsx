'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag, Trash2 } from 'lucide-react'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#92400e', '#14b8a6', '#6b7280',
]

interface ColorTagPickerProps {
  color: string | null
  onChange: (color: string | null) => void
}

export function ColorTagPicker({ color, onChange }: ColorTagPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="p-0.5 rounded hover:bg-gray-100 transition-colors"
      >
        {color ? (
          <div
            className="w-4 h-4 rounded-full border border-black/10"
            style={{ backgroundColor: color }}
          />
        ) : (
          <Tag size={14} className="text-gray-300 hover:text-gray-400" />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-6 gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#1f2937' : 'transparent',
                }}
              />
            ))}
          </div>
          {color && (
            <div className="flex justify-end mt-2 pt-1.5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
