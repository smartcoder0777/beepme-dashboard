function isUnknownPlaceholder(value) {
  return String(value || '')
    .trim()
    .toLowerCase() === 'unknown';
}

/** Year + make/model, omitting stub "Unknown" values from unified KYC. */
export function formatVehicleMakeModelYear(vehicle) {
  if (!vehicle) return '';
  const year = vehicle.year != null && vehicle.year !== '' ? String(vehicle.year) : '';
  const make = String(vehicle.make || '').trim();
  const model = String(vehicle.model || '').trim();
  const mm = [make, model].filter((x) => x && !isUnknownPlaceholder(x));
  const parts = [];
  if (year) parts.push(year);
  if (mm.length) parts.push(mm.join(' '));
  else parts.push('Make/model not provided');
  return parts.join(' ');
}
