import { useEffect } from 'react';
import { isEphemeralUploadUrl, resolveAssetUrl } from '../config';

function formatDocType(str) {
  if (!str) return 'Document';
  return str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isImage(doc) {
  const mime = String(doc?.mimeType || '').toLowerCase();
  const url = String(doc?.documentUrl || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(url);
}

/**
 * Popup viewer for one KYC user's documents, with previous/next controls.
 */
export default function KycDocumentViewer({ docs, index, onIndexChange, onClose }) {
  const list = Array.isArray(docs) ? docs : [];
  const total = list.length;
  const current = total > 0 ? list[Math.min(Math.max(index, 0), total - 1)] : null;
  const src = current?.documentUrl && !isEphemeralUploadUrl(current.documentUrl)
    ? resolveAssetUrl(current.documentUrl)
    : null;

  useEffect(() => {
    if (!current) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft' && total > 1) {
        onIndexChange((index - 1 + total) % total);
      }
      if (e.key === 'ArrowRight' && total > 1) {
        onIndexChange((index + 1) % total);
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [current, index, total, onClose, onIndexChange]);

  if (!current) return null;

  const goPrev = () => onIndexChange((index - 1 + total) % total);
  const goNext = () => onIndexChange((index + 1) % total);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="KYC document viewer"
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{formatDocType(current.documentType)}</p>
            <p className="text-xs text-gray-500">
              {index + 1} of {total}
              {current.createdAt ? ` · Uploaded ${new Date(current.createdAt).toLocaleString()}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 min-h-[50vh] bg-gray-900 flex items-center justify-center">
          {total > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow flex items-center justify-center"
              aria-label="Previous document"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="w-full h-[70vh] flex items-center justify-center p-3">
            {!src ? (
              <p className="text-amber-200 text-center px-6">
                File unavailable — this was stored on Railway disk and is gone after deploy.
                <br />
                Ask the user to re-upload.
              </p>
            ) : isImage(current) ? (
              <img
                src={src}
                alt={formatDocType(current.documentType)}
                className="max-w-full max-h-full object-contain rounded"
              />
            ) : (
              <iframe
                title={formatDocType(current.documentType)}
                src={src}
                className="w-full h-full bg-white rounded"
              />
            )}
          </div>

          {total > 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow flex items-center justify-center"
              aria-label="Next document"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {src && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-right">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
