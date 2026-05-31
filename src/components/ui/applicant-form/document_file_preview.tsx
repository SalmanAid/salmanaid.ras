"use client"

import { Check, Upload } from "lucide-react"

type DocumentFilePreviewProps = {
    file: File | null
    onClick: () => void
    onFileDrop: (file: File) => void
    label: string
}

function formatFileSize(size: number) {
    if (size < 1024 * 1024) {
        return `${Math.max(1, Math.round(size / 1024))} KB`
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function ApplicantForm_DocumentFilePreview({ file, onClick, onFileDrop, label }: DocumentFilePreviewProps) {
    const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
        event.preventDefault()
        const droppedFile = event.dataTransfer.files?.[0]

        if (droppedFile) {
            onFileDrop(droppedFile)
        }
    }

    if (!file) {
        return (
            <button
                type="button"
                onClick={onClick}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="flex h-38 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D8DEE8] bg-white text-center transition hover:border-[#74CDB4] hover:bg-[#F0FDF9]"
            >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#667085]">
                    <Upload size={20} strokeWidth={2} />
                </span>
                <span className="mt-4 text-xs font-semibold text-[#111827]">{label}</span>
                <span className="mt-2 text-[11px] font-medium text-[#667085]">
                    Seret dan Lepas atau <span className="text-[#F59E0B]">Cari</span>
                </span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={onClick}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex h-38 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#A7F3D0] bg-[#ECFDF5] text-center transition hover:border-[#10B981] hover:bg-[#DDFCEE]"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#059669] text-[#059669]">
                <Check size={21} strokeWidth={3} />
            </span>
            <span className="mt-4 max-w-full truncate px-6 text-xs font-semibold text-[#111827]">
                {file.name}
            </span>
            <span className="mt-2 text-[11px] font-medium text-[#667085]">
                {formatFileSize(file.size)}
            </span>
        </button>
    )
}
