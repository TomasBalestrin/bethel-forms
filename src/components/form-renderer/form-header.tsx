interface FormHeaderProps {
  logoUrl?: string
  headerName?: string
  primaryColor: string
  textColor: string
  backgroundColor: string
}

// Cabeçalho fixo do topo: logo à esquerda, nome à direita, linha gradiente
// (cor principal) abaixo. Compartilhado entre o render público e o preview do
// editor para manter WYSIWYG.
export function FormHeader({
  logoUrl,
  headerName,
  primaryColor,
  textColor,
  backgroundColor,
}: FormHeaderProps) {
  return (
    <div style={{ backgroundColor }}>
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-7 sm:h-9 max-w-[160px] object-contain" />
        ) : (
          <span />
        )}
        {headerName && (
          <span className="font-semibold text-sm sm:text-base truncate pl-3" style={{ color: textColor }}>
            {headerName}
          </span>
        )}
      </div>
      <div
        className="h-px sm:h-0.5"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${primaryColor} 55%, transparent 100%)` }}
      />
    </div>
  )
}
