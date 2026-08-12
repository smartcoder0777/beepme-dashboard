import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { resolveAssetUrl } from '../config';
import { formatVehicleMakeModelYear } from '../utils/vehicleDisplay';

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
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [userAlerts, setUserAlerts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/users/${userId}`),
      api.get(`/kyc/admin/user/${userId}`).catch(() => ({ data: null })),
      api.get(`/admin/users/${userId}/alerts`).catch(() => ({ data: { alerts: [] } })),
    ])
      .then(([userRes, kycRes, alertsRes]) => {
        setUser(userRes.data.user);
        setKycStatus(userRes.data.user?.kycStatus || '');
        if (kycRes?.data) setKycInfo(kycRes.data);
        setUserAlerts(alertsRes?.data?.alerts || []);
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
      await api.post(`/admin/users/${userId}/block`, { reason: blockReason || undefined });
      setUser((u) => (u ? { ...u, isBlocked: true, blockReason: blockReason || null } : u));
      setShowBlockForm(false);
      setBlockReason('');
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
      setUser((u) => (u ? { ...u, isBlocked: false, blockReason: null } : u));
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
      await api.delete(`/admin/users/${userId}`, { data: { reason: deletionReason || undefined } });
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

  const vehicles = kycInfo?.user?.vehicles || [];
  const pendingVehicles = vehicles.filter((v) => v.verificationStatus === 'pending');

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
                disabled={!!user.deletedAt}
                className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-60"
              >
                <option value="not_submitted">Not submitted</option>
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
            <dt className="text-gray-500">Status</dt>
            <dd>
              {user.deletedAt ? (
                <span className="text-gray-600 font-medium">Deleted</span>
              ) : user.isBlocked ? (
                <span className="text-red-600 font-medium">Blocked</span>
              ) : (
                'Active'
              )}
            </dd>
            {user.blockReason && (
              <>
                <dt className="text-gray-500">Block reason</dt><dd className="text-gray-700">{user.blockReason}</dd>
              </>
            )}
            {user.deletedAt && (
              <>
                <dt className="text-gray-500">Deletion reason</dt><dd className="text-gray-700">{user.deletionReason || '—'}</dd>
              </>
            )}
          </dl>
        </div>

        {!user.deletedAt && (
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
                <>
                  {!showBlockForm ? (
                    <button
                      type="button"
                      disabled={actionLoading === 'block' || user.role === 'admin'}
                      onClick={() => setShowBlockForm(true)}
                      className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
                    >
                      Block
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-end gap-2">
                      <input
                        type="text"
                        placeholder="Block reason (optional)"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="rounded border border-gray-300 px-3 py-2 text-sm w-64"
                      />
                      <button
                        type="button"
                        disabled={actionLoading === 'block'}
                        onClick={handleBlock}
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm"
                      >
                        {actionLoading === 'block' ? '...' : 'Confirm block'}
                      </button>
                      <button type="button" onClick={() => { setShowBlockForm(false); setBlockReason(''); }} className="px-3 py-2 rounded border border-gray-400 text-sm">Cancel</button>
                    </div>
                  )}
                </>
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
                <p className="text-sm text-red-800 mb-2">Soft-delete this user? They will not be able to log in. Data is retained.</p>
                <input
                  type="text"
                  placeholder="Deletion reason (optional)"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="mb-2 w-full rounded border border-red-200 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading === 'delete'}
                    className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                  >
                    {actionLoading === 'delete' ? 'Deleting...' : 'Confirm delete'}
                  </button>
                  <button type="button" onClick={() => { setDeleteConfirm(false); setDeletionReason(''); }} className="px-3 py-1 rounded border border-gray-400 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-medium text-gray-900 mb-3">KYC documents</h2>
            <ul className="space-y-2 text-sm">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span>{doc.documentType || 'document'} — {doc.verificationStatus || 'pending'}</span>
                  {doc.documentUrl && (
                    <a href={resolveAssetUrl(doc.documentUrl)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-3">Vehicles</h2>
          {vehicles.length === 0 ? (
            <p className="text-sm text-gray-500">No vehicles registered</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {vehicles.map((v) => (
                <li key={v.id} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {formatVehicleMakeModelYear(v)} — {v.licensePlate || 'No plate'}
                      {v.vin && <span className="text-gray-500 font-normal ml-1">(VIN: {v.vin})</span>}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        v.verificationStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : v.verificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.verificationStatus === 'pending' ? 'Pending' : v.verificationStatus === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  {pendingVehicles.some((p) => p.id === v.id) && (
                    <p className="mt-1 text-amber-700 text-xs">Awaiting document verification</p>
                  )}
                  {(v.documents?.length > 0) && (
                    <ul className="mt-1.5 ml-3 text-gray-600 space-y-1">
                      {v.documents.map((d) => (
                        <li key={d.id} className="flex items-center gap-2">
                          <span>{d.documentType === 'car_insurance' ? 'Insurance' : d.documentType === 'vehicle_registration' ? 'Registration' : d.documentType}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${d.verificationStatus === 'approved' ? 'bg-green-100 text-green-700' : d.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {d.verificationStatus || 'pending'}
                          </span>
                          {d.documentUrl && (
                            <a href={resolveAssetUrl(d.documentUrl)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">View</a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-3">Alerts history</h2>
          {userAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">No alerts</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {userAlerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span>{a.carMake} {a.carModel} — {a.licensePlate}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${a.status === 'active' ? 'bg-amber-100 text-amber-800' : a.status === 'found' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                  <span className="text-gray-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
