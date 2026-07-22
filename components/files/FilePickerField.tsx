"use client";

import Image from "next/image";
import type { RefObject } from "react";
import SelectedFilesList from "./SelectedFilesList";

export interface FilePickerFieldProps {
  id: string;
  inputRef: RefObject<HTMLInputElement | null>;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  files: File[];
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  hint?: string;
  chooseLabel?: string;
  addMoreLabel?: string;
}

export default function FilePickerField({
  id,
  inputRef,
  accept,
  multiple = true,
  required = false,
  files,
  onFilesSelected,
  onRemove,
  hint,
  chooseLabel = "Elegir archivos",
  addMoreLabel = "Agregar archivos",
}: FilePickerFieldProps) {
  const hasFiles = files.length > 0;

  return (
    <div>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required && !hasFiles}
        onChange={onFilesSelected}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-primary hover:border-primary/40 hover:bg-primary/5 transition"
      >
        {hasFiles ? addMoreLabel : chooseLabel}
      </label>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
      <SelectedFilesList files={files} onRemove={onRemove} />
    </div>
  );
}
