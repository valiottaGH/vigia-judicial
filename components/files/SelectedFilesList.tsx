"use client";

import Image from "next/image";

export interface SelectedFilesListProps {
  files: File[];
  onRemove: (index: number) => void;
}

export default function SelectedFilesList({
  files,
  onRemove,
}: SelectedFilesListProps) {
  if (files.length === 0) return null;

  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className="relative group rounded-lg border border-border bg-background/80 px-3 py-2 pr-8 min-h-[2.25rem] flex items-center"
        >
          <span className="text-xs text-foreground truncate" title={file.name}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Quitar ${file.name}`}
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          >
            <RemoveFileIcon />
          </button>
        </li>
      ))}
    </ul>
  );
}

function RemoveFileIcon() {
  return (
    <Image
      src="/icons/remove-file.png"
      alt=""
      width={14}
      height={14}
      aria-hidden
    />
  );
}

/** Agrega archivos nuevos sin duplicar por nombre, tamaño y fecha de modificación. */
export function mergeSelectedFiles(prev: File[], incoming: File[]): File[] {
  const seen = new Set(
    prev.map((f) => `${f.name}:${f.size}:${f.lastModified}`)
  );
  const merged = [...prev];
  for (const file of incoming) {
    const key = `${file.name}:${file.size}:${file.lastModified}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(file);
    }
  }
  return merged;
}
