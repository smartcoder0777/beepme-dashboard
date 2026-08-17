import { useEffect, useState } from 'react';
import api from '../api/client';

const KNOWN_KEYS = [
  { key: 'ALERT_RADIUS_KM', label: 'Alert radius (km)', type: 'number' },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/settings')
      .then(({ data }) => {
        const s = data.settings || {};
        setSettings(s);
        setForm(
          KNOWN_KEYS.reduce((acc, { key }) => {
            acc[key] = s[key] !== undefined && s[key] !== null ? String(s[key]) : '';
            return acc;
          }, {})
        );
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      for (const { key, type } of KNOWN_KEYS) {
        const value = form[key];
        if (value === '' || value === undefined) continue;
        await api.post('/admin/settings', {
          key,
          value: value,
          dataType: type,
        });
      }
      const { data } = await api.get('/admin/settings');
      setSettings(data.settings || {});
      setForm(
        KNOWN_KEYS.reduce((acc, { key }) => {
          acc[key] = (data.settings || {})[key] !== undefined && (data.settings || {})[key] !== null
            ? String((data.settings || {})[key])
            : '';
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-500">Loading settings...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">System settings</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {KNOWN_KEYS.map(({ key, label, type }) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={key}
                type={type === 'number' ? 'number' : 'text'}
                value={form[key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary text-white px-4 py-2 font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
