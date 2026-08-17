import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const statusColors = {
  active: 'bg-amber-100 text-amber-800',
  found: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, fromDate, toDate]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    api
      .get('/admin/alerts', { params })
      .then(({ data }) => {
        setAlerts(data.alerts || []);
        setPagination(data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load alerts'))
      .finally(() => setLoading(false));
  }, [page, statusFilter, search, fromDate, toDate]);

  async function updateStatus(alertId, status) {
    setUpdating(alertId);
    try {
      await api.put(`/admin/alerts/${alertId}/status`, { status });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status } : a))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(null);
    }
  }

  async function deleteAlert(alertId) {
    if (
      !window.confirm(
        'Permanently delete this alert and its photos, public chat, and related notifications? This cannot be undone.'
      )
    ) {
      return;
    }
    setDeleting(alertId);
    try {
      await api.delete(`/admin/alerts/${alertId}`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setPagination((p) => ({
        ...p,
        total: Math.max(0, (p.total || 0) - 1),
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  const { total, totalPages } = pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stolen car alerts — update status or delete permanently
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-200">
          <input
            type="search"
            placeholder="Search by plate, make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 w-64 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="found">Found</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">From</span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">To</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </label>
        </div>

        {error && <p className="p-4 text-red-600 text-sm">{error}</p>}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No alerts match your filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reporter</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {a.carMake} {a.carModel}
                          {a.carYear && ` (${a.carYear})`}
                        </span>
                        <br />
                        <span className="text-gray-500">{a.licensePlate}</span>
                      </td>
                      <td className="py-3 px-4">
                        {a.reporter ? (
                          <Link to={`/users/${a.reporter.id}`} className="text-primary hover:underline">
                            {a.reporter.email}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[a.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-2 items-start">
                          {a.status === 'active' && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateStatus(a.id, 'found')}
                                disabled={updating === a.id || deleting === a.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {updating === a.id ? '…' : 'Mark found'}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(a.id, 'cancelled')}
                                disabled={updating === a.id || deleting === a.id}
                                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteAlert(a.id)}
                            disabled={updating === a.id || deleting === a.id}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleting === a.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
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
                  <span className="px-3 py-1 text-sm">
                    Page {page} of {totalPages}
                  </span>
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
