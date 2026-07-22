"use client";

interface FileUploadToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function FileUploadToast({
  message,
  onDismiss,
}: FileUploadToastProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-xl bg-[#303030] px-4 py-3 text-sm text-white shadow-xl"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-white/70 hover:text-white text-lg leading-none"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
