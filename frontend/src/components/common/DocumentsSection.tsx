"use client";

import React, { useRef } from "react";

export interface DocAttachment {
  name: string;
}

interface DocumentsSectionProps {
  attachments: DocAttachment[];
  onUpload?: (newFiles: { name: string }[]) => void;
  onDelete?: (index: number) => void;
  title?: string;
  /** If true, hide the top border (e.g. when used inside a tab). */
  noBorder?: boolean;
}

export default function DocumentsSection({
  attachments,
  onUpload,
  onDelete,
  title = "Documents",
  noBorder = false,
}: DocumentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !onUpload) return;
    const newAttachments = Array.from(files).map((f) => ({ name: f.name }));
    onUpload(newAttachments);
    e.target.value = "";
  };

  return (
    <div className={noBorder ? "" : "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {onUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Upload
            </button>
          </>
        )}
      </div>
      {attachments.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {attachments.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-300 group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">•</span>
                <span className="truncate">{a.name}</span>
              </span>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  className="shrink-0 p-1 text-gray-400 hover:text-red-600 rounded"
                  aria-label={`Delete ${a.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No documents uploaded.
        </p>
      )}
    </div>
  );
}
