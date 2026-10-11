const headers = { 'x-requested-with': 'ucbar' };

export async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, {
    method, credentials: 'same-origin',
    headers: { ...headers, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; }
  return j;
}

export async function uploadFile(file, kind = 'image') {
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch('/api/admin/upload?kind=' + kind, { method: 'POST', headers, body: fd, credentials: 'same-origin' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Upload failed');
  return j.path;
}
