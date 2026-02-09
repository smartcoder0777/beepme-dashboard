import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/statistics')
      .then(({ data }) => setStats(data.statistics || data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load statistics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading statistics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return null;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, to: '/users', color: 'bg-blue-500' },
    { label: 'Total Alerts', value: stats.totalAlerts ?? 0, to: '/alerts', color: 'bg-indigo-500' },
    { label: 'Active Alerts', value: stats.activeAlerts ?? 0, to: '/alerts?status=active', color: 'bg-amber-500' },
    { label: 'Resolved Alerts', value: stats.resolvedAlerts ?? 0, to: '/alerts', color: 'bg-green-500' },
    { label: 'Pending KYC', value: stats.pendingKYC ?? 0, to: '/kyc-pending', color: 'bg-orange-500' },
    { label: 'Blocked Users', value: stats.blockedUsers ?? 0, to: '/users?isBlocked=true', color: 'bg-red-500' },
  ];
  const userBreakdown = [
    { label: 'KYC Approved', value: stats.approvedKYC ?? 0 },
    { label: 'KYC Pending', value: stats.pendingKYC ?? 0 },
    { label: 'KYC Rejected', value: stats.rejectedKYC ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, to, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            {to ? (
              <Link to={to} className="block group">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1 group-hover:text-primary">{value}</p>
              </Link>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
              </>
            )}
            <div className={`mt-2 h-1 w-12 rounded ${color}`} />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-medium text-gray-900 mb-3">Users by KYC status</h2>
        <div className="flex flex-wrap gap-6">
          {userBreakdown.map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900">{value}</span>
              <span className="text-sm text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
