import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function Users() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState(searchParams.get('kycStatus') || '');
  const [blockedFilter, setBlockedFilter] = useState(searchParams.get('isBlocked') === 'true' ? 'true' : '');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [search, kycFilter, blockedFilter, dateFrom, dateTo, includeDeleted]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (search) params.search = search;
    if (kycFilter) params.kycStatus = kycFilter;
    if (blockedFilter) params.isBlocked = blockedFilter;
    if (dateFrom) params.createdAtFrom = dateFrom;
    if (dateTo) params.createdAtTo = dateTo;
    if (includeDeleted) params.includeDeleted = 'true';
    api
      .get('/admin/users', { params })
      .then(({ data }) => {
        setUsers(data.users || []);
        const pag = data.pagination;
        setTotal(pag ? pag.total : (data.users || []).length);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, kycFilter, blockedFilter, dateFrom, dateTo, includeDeleted]);

  async function toggleBlock(userId, isBlocked) {
    try {
      if (isBlocked) await api.post(`/admin/users/${userId}/unblock`);
      else await api.post(`/admin/users/${userId}/block`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: !isBlocked } : u))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Users</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-200">
          <input
            type="search"
            placeholder="Search by email, name, phone, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 w-64 text-sm"
          />
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All KYC</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={blockedFilter}
            onChange={(e) => setBlockedFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="true">Blocked</option>
            <option value="false">Not blocked</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="rounded border-gray-300"
            />
            Include deleted
          </label>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 shrink-0">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="text-gray-500 shrink-0">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error && <p className="p-4 text-red-600 text-sm">{error}</p>}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">KYC</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">{u.fullName || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          u.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          u.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.kycStatus || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.deletedAt ? <span className="text-gray-600 font-medium">Deleted</span> : u.isBlocked ? <span className="text-red-600 font-medium">Blocked</span> : 'Active'}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Link
                          to={`/users/${u.id}`}
                          className="text-primary hover:underline"
                        >
                          View
                        </Link>
                        {!u.deletedAt && (
                          <button
                            type="button"
                            onClick={() => toggleBlock(u.id, u.isBlocked)}
                            className="text-amber-600 hover:underline"
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">Total: {total}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
