'use client'

// Handle de arraste entre painel e centro. Reporta o delta horizontal (px)
// a cada movimento; o pai decide como ajustar a largura.
export function ResizeHandle({ onResize }: { onResize: (deltaX: number) => void }) {
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    let lastX = e.clientX

    function move(ev: MouseEvent) {
      onResize(ev.clientX - lastX)
      lastX = ev.clientX
    }
    function up() {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className="w-1.5 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-blue-200 active:bg-blue-300 transition-colors"
    />
  )
}
