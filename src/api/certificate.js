const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function importCertificates(certList) {
    const response = await fetch(`${API_BASE}/certificates/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certList),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导入失败');
    }
    return response.json();
}

export async function fetchCertificate(certNo) {
    const response = await fetch(`${API_BASE}/certificates/${certNo.trim()}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('查询失败');
    }
    return response.json();
}