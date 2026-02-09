import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

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

  if (loading) return <div className="text-gray-500">Loading pending KYC...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">KYC Pending</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending verifications.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((u) => {
              const docs = allPendingDocs(u);
              if (docs.length === 0) return null;
              return (
                <div key={u.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/users/${u.id}`} className="font-medium text-primary hover:underline">
                      {u.email}
                    </Link>
                    <span className="text-sm text-gray-500">{u.fullName || '—'}</span>
                  </div>
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-gray-700">{doc.documentType || 'document'}</span>
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl.startsWith('http') ? doc.documentUrl : `/${doc.documentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View file
                          </a>
                        )}
                        {rejectDoc === doc.id ? (
                          <span className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Rejection reason"
                              value={rejectReason[doc.id] || ''}
                              onChange={(e) => setRejectReason((r) => ({ ...r, [doc.id]: e.target.value }))}
                              className="rounded border border-gray-300 px-2 py-1 w-48"
                            />
                            <button
                              type="button"
                              onClick={() => verify(doc.id, 'rejected', rejectReason[doc.id] || 'Not provided')}
                              disabled={verifying === doc.id}
                              className="px-2 py-1 rounded bg-red-600 text-white text-xs"
                            >
                              Submit reject
                            </button>
                            <button type="button" onClick={() => setRejectDoc(null)} className="text-gray-500 text-xs">Cancel</button>
                          </span>
                        ) : (
                          <span className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => verify(doc.id, 'approved')}
                              disabled={verifying === doc.id}
                              className="px-2 py-1 rounded bg-green-600 text-white text-xs disabled:opacity-50"
                            >
                              {verifying === doc.id ? '...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectDoc(doc.id)}
                              disabled={verifying === doc.id}
                              className="px-2 py-1 rounded border border-red-600 text-red-600 text-xs"
                            >
                              Reject
                            </button>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
