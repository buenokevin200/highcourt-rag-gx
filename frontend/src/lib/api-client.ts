const API_BASE = '';

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de conexión' }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function login(username: string, password: string) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getMe() {
  return fetchApi('/auth/me');
}

export async function sendChat(query: string, conversationId?: string) {
  return fetchApi('/chat', {
    method: 'POST',
    body: JSON.stringify({ query, conversation_id: conversationId }),
  });
}

export async function getSettings() {
  return fetchApi('/settings');
}

export async function updateSettings(data: Record<string, unknown>) {
  return fetchApi('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function testConnection(data: { api_endpoint: string; api_key: string; llm_model: string }) {
  return fetchApi('/settings/test-connection', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDocuments() {
  return fetchApi('/documents');
}

export async function uploadDocument(formData: FormData) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/documents/upload`, {
    method: 'POST',
    body: formData,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al subir' }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function deleteDocument(id: number) {
  return fetchApi(`/documents/${id}`, { method: 'DELETE' });
}
