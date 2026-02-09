import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function formatDocType(str) {
  if (!str) return 'Document';
  return str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function KYCPending() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [rejectDoc, setRejectDoc] = useState(null);

  function load() {
    setLoading(true);
    api
      .get('/kyc/admin/pending')
      .then(({ data }) => setUsers(data.users || []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function allPendingDocs(u) {
    const fromUser = (u.kycDocuments || []).filter((d) => d.verificationStatus === 'pending');
    const fromVehicles = (u.vehicles || []).flatMap((v) => (v.documents || []).filter((d) => d.verificationStatus === 'pending'));
    return [...fromUser, ...fromVehicles];
  }

  async function verify(documentId, status, rejectionReason) {
    setVerifying(documentId);
    try {
      await api.post(`/kyc/admin/verify/${documentId}`, { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined });
      setRejectDoc(null);
      setRejectReason((r) => ({ ...r, [documentId]: '' }));
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-40 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
        {error}
      </div>
    );
  }

  const totalPending = users.reduce((acc, u) => acc + allPendingDocs(u).length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">KYC Pending</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalPending === 0
              ? 'No documents awaiting verification'
              : `${totalPending} document${totalPending !== 1 ? 's' : ''} from ${users.filter((u) => allPendingDocs(u).length > 0).length} user${users.filter((u) => allPendingDocs(u).length > 0).length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {users.length === 0 || totalPending === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No pending verifications</p>
          <p className="text-sm text-gray-500 mt-1">New KYC submissions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {users.map((u) => {
            const docs = allPendingDocs(u);
            if (docs.length === 0) return null;
            const initial = (u.fullName || u.email || '?').charAt(0).toUpperCase();
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/users/${u.id}`}
                        className="font-medium text-gray-900 hover:text-primary transition-colors truncate block"
                      >
                        {u.email}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{u.fullName || 'No name'}</p>
                      {u.phone && <p className="text-xs text-gray-500 truncate">{u.phone}</p>}
                    </div>
                    <Link
                      to={`/users/${u.id}`}
                      className="text-sm font-medium text-primary hover:text-primary-600 shrink-0"
                    >
                      View profile →
                    </Link>
                  </div>
                  {(u.vehicles && u.vehicles.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Vehicles</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                        {u.vehicles.map((v) => (
                          <span key={v.id} className="bg-white px-2 py-1 rounded border border-gray-200">
                            {[v.make, v.model, v.year].filter(Boolean).join(' ')} — {v.licensePlate || 'No plate'}
                            {v.vin && ` · VIN: ${v.vin}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <ul className="divide-y divide-gray-100">
                  {docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 shrink-0">
                          {formatDocType(doc.documentType)}
                        </span>
                        {doc.createdAt && (
                          <span className="text-xs text-gray-500 shrink-0">
                            Uploaded {new Date(doc.createdAt).toLocaleString()}
                          </span>
                        )}
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl.startsWith('http') ? doc.documentUrl : `/${doc.documentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary-600 font-medium inline-flex items-center gap-1 shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View file
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        {rejectDoc === doc.id ? (
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <input
                              type="text"
                              placeholder="Rejection reason (required)"
                              value={rejectReason[doc.id] || ''}
                              onChange={(e) => setRejectReason((r) => ({ ...r, [doc.id]: e.target.value }))}
                              className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => verify(doc.id, 'rejected', rejectReason[doc.id] || 'Not provided')}
                                disabled={verifying === doc.id}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {verifying === doc.id ? 'Submitting…' : 'Submit reject'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectDoc(null)}
                                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => verify(doc.id, 'approved')}
                              disabled={verifying === doc.id}
                              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {verifying === doc.id ? 'Processing…' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectDoc(doc.id)}
                              disabled={verifying === doc.id}
                              className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
