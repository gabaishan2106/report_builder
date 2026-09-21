import { useMemo, useRef, useState } from 'react'
import './AsmAreaFilter.css'

interface Props {
  areas: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function AsmAreaFilter({ areas, selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/\*/g, '')
    if (!term) return areas
    return areas.filter((a) => a.toLowerCase().includes(term))
  }, [areas, search])

  function toggle(area: string) {
    if (selected.includes(area)) {
      onChange(selected.filter((a) => a !== area))
    } else {
      onChange([...selected, area])
    }
  }

  function clearAll() {
    onChange([])
  }

  // Close on outside click
  useMemo(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const label =
    selected.length === 0
      ? 'All ASM Areas'
      : selected.length === 1
      ? selected[0]
      : `${selected.length} ASM Areas selected`

  return (
    <div className="asm-filter" ref={containerRef}>
      <button type="button" className="asm-filter-trigger" onClick={() => setOpen((o) => !o)}>
        <span>{label}</span>
        <span className="asm-filter-caret">▾</span>
      </button>

      {open && (
        <div className="asm-filter-panel">
          <input
            type="text"
            className="asm-filter-search"
            placeholder="Search area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="asm-filter-list">
            {filtered.length === 0 && <div className="asm-filter-empty">No matches</div>}
            {filtered.map((area) => (
              <label key={area} className="asm-filter-item">
                <input
                  type="checkbox"
                  checked={selected.includes(area)}
                  onChange={() => toggle(area)}
                />
                {area}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button type="button" className="asm-filter-clear" onClick={clearAll}>
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
