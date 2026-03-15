'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import {
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Link as LinkIcon,
  BarChart3,
} from 'lucide-react'

interface FormCardProps {
  form: {
    id: string
    name: string
    slug: string
    status: string
    createdAt: string
    _count?: { responses: number }
  }
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

const statusConfig = {
  draft: { label: 'Rascunho', variant: 'secondary' as const },
  published: { label: 'Publicado', variant: 'success' as const },
  blocked: { label: 'Bloqueado', variant: 'destructive' as const },
}

export function FormCard({ form, onDuplicate, onDelete }: FormCardProps) {
  const status = statusConfig[form.status as keyof typeof statusConfig] || statusConfig.draft
  const responseCount = form._count?.responses || 0

  function copyLink() {
    const url = `${window.location.origin}/f/${form.slug}`
    navigator.clipboard.writeText(url)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/form/${form.id}/edit`}
              className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate block"
            >
              {form.name}
            </Link>
            <p className="text-xs text-gray-400 mt-1">
              Criado em {formatDate(form.createdAt)}
            </p>
          </div>
          <DropdownMenu
            trigger={
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreVertical size={16} className="text-gray-400" />
              </button>
            }
          >
            <DropdownMenuItem onClick={() => window.location.href = `/form/${form.id}/edit`}>
              <span className="flex items-center gap-2">
                <Edit size={14} /> Editar
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/form/${form.id}/responses`}>
              <span className="flex items-center gap-2">
                <Eye size={14} /> Ver respostas
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyLink}>
              <span className="flex items-center gap-2">
                <LinkIcon size={14} /> Copiar link
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(form.id)}>
              <span className="flex items-center gap-2">
                <Copy size={14} /> Duplicar
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(form.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <span className="flex items-center gap-2">
                <Trash2 size={14} /> Excluir
              </span>
            </DropdownMenuItem>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <BarChart3 size={14} />
            {responseCount} {responseCount === 1 ? 'resposta' : 'respostas'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
