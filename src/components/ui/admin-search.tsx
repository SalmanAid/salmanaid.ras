"use client"

import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

type AdminSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
  className,
}: AdminSearchProps) {
  return (
    <label className={cn("relative block w-full", className)}>
      <span className="sr-only">Cari</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Hapus pencarian"
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  )
}
