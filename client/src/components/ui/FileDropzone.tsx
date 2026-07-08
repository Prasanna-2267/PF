import { useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { UploadIcon, FileTextIcon, CloseIcon } from './icons';

/** Drag-and-drop + click file picker. Validates type/size, surfaces one file. */
export function FileDropzone({
  file,
  onFile,
  accept = 'application/pdf',
  acceptLabel = 'PDF up to 50 MB',
  maxSizeMB = 50,
  disabled = false,
  className,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  acceptLabel?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (f: File): boolean => {
    if (accept && !accept.split(',').some((a) => f.type === a.trim())) {
      setError('That file type is not accepted.');
      return false;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`File is larger than ${maxSizeMB} MB.`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (validate(f)) onFile(f);
  };

  if (file) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-3 rounded-field border border-line bg-surface p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-soft-fg">
            <FileTextIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{file.name}</p>
            <p className="text-xs text-muted tabular">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          {!disabled ? (
            <button
              type="button"
              aria-label="Remove file"
              onClick={() => {
                onFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-sunken hover:text-fg"
            >
              <CloseIcon size={18} />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:bg-sunken',
          disabled && 'pointer-events-none opacity-55',
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg">
          <UploadIcon size={20} />
        </span>
        <span className="text-sm font-semibold text-fg">
          Drag a file here, or <span className="text-primary">browse</span>
        </span>
        <span className="text-xs text-muted">{acceptLabel}</span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {error ? <p className="mt-1.5 text-xs font-medium text-danger-fg">{error}</p> : null}
    </div>
  );
}
