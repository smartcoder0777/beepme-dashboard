import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [kycInfo, setKycInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/users/${userId}`),
      api.get(`/kyc/admin/user/${userId}`).catch(() => ({ data: null })),
    ])
      .then(([userRes, kycRes]) => {
        setUser(userRes.data.user);
        setKycStatus(userRes.data.user?.kycStatus || '');
        if (kycRes?.data) setKycInfo(kycRes.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleUpdateKyc() {
    if (!kycStatus || kycStatus === user?.kycStatus) return;
    setActionLoading('kyc');
    try {
      await api.put(`/admin/users/${userId}/kyc`, { kycStatus });
      setUser((u) => (u ? { ...u, kycStatus } : u));
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setActionLoading('');
    }
  }

  async function handleBlock() {
    setActionLoading('block');
    try {
      await api.post(`/admin/users/${userId}/block`);
      setUser((u) => (u ? { ...u, isBlocked: true } : u));
    } catch (err) {
      alert(err.response?.data?.error || 'Block failed');
    } finally {
      setActionLoading('');
    }
  }

  async function handleUnblock() {
    setActionLoading('unblock');
    try {
      await api.post(`/admin/users/${userId}/unblock`);
      setUser((u) => (u ? { ...u, isBlocked: false } : u));
    } catch (err) {
      alert(err.response?.data?.error || 'Unblock failed');
    } finally {
      setActionLoading('');
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setActionLoading('delete');
    try {
      await api.delete(`/admin/users/${userId}`);
      navigate('/users', { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
      setActionLoading('');
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (error || !user) return <div className="text-red-600">{error || 'User not found'}</div>;

  const documents = [
    ...(kycInfo?.user?.kycDocuments || []),
    ...(kycInfo?.user?.vehicles || []).flatMap((v) => v.documents || []),
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-4">
        <Link to="/users" className="text-primary hover:underline text-sm">← Back to Users</Link>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">User: {user.email}</h1>

      <div className="grid gap-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-3">Profile</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Email</dt><dd>{user.email}</dd>
            <dt className="text-gray-500">Full name</dt><dd>{user.fullName || '—'}</dd>
            <dt className="text-gray-500">KYC status</dt>
            <dd>
              <select
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="button"
                disabled={actionLoading === 'kyc' || kycStatus === user.kycStatus}
                onClick={handleUpdateKyc}
                className="ml-2 px-2 py-1 rounded bg-primary text-white text-sm disabled:opacity-50"
              >
                {actionLoading === 'kyc' ? 'Saving...' : 'Save'}
              </button>
            </dd>
            <dt className="text-gray-500">Status</dt><dd>{user.isBlocked ? <span className="text-red-600 font-medium">Blocked</span> : 'Active'}</dd>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-3">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {user.isBlocked ? (
              <button
                type="button"
                disabled={actionLoading === 'unblock'}
                onClick={handleUnblock}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === 'unblock' ? '...' : 'Unblock'}
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading === 'block' || user.role === 'admin'}
                onClick={handleBlock}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading === 'block' ? '...' : 'Block'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              disabled={user.role === 'admin'}
              className="px-4 py-2 rounded-lg border border-red-600 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Delete user
            </button>
          </div>
          {deleteConfirm && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 mb-2">Permanently delete this user? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                >
                  {actionLoading === 'delete' ? 'Deleting...' : 'Confirm delete'}
                </button>
                <button type="button" onClick={() => setDeleteConfirm(false)} className="px-3 py-1 rounded border border-gray-400 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-medium text-gray-900 mb-3">KYC documents</h2>
            <ul className="space-y-2 text-sm">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span>{doc.documentType || 'document'} — {doc.verificationStatus || 'pending'}</span>
                  {doc.documentUrl && (
                    <a href={doc.documentUrl.startsWith('http') ? doc.documentUrl : `/${doc.documentUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
