const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://www.quentin-chirat.com/f1analytics/backend';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    let errDetail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      // Affiche le vrai message PHP si disponible
      if (body.message) errDetail = `${body.error}: ${body.message} (${body.file}:${body.line})`;
      else if (body.error) errDetail = body.error;
    } catch {}
    throw new Error(errDetail);
  }
  return res.json();
}

export const api = {
  getSeasons:          ()                          => apiFetch<any[]>('/seasons'),
  getSeason:           (year: number)              => apiFetch<any>(`/season/${year}`),
  getChampionship:     (year: number)              => apiFetch<any>(`/season/${year}/championship`),
  getRaces:            (year: number)              => apiFetch<any[]>(`/season/${year}/races`),
  getRace:             (year: number, round: number) => apiFetch<any>(`/race/${year}/${round}`),
  getSessions:         (year: number, round: number) => apiFetch<any[]>(`/race/${year}/${round}/sessions`),
  getSessionResults:   (id: number)               => apiFetch<any>(`/session/${id}/results`),
  getSessionStrategy:  (id: number)               => apiFetch<any>(`/session/${id}/strategy`),
  getDrivers:          ()                          => apiFetch<any[]>('/drivers'),
  getDriver:           (id: string)               => apiFetch<any>(`/driver/${id}`),
  getCircuits:         ()                          => apiFetch<any[]>('/circuits'),
  getCircuit:          (key: string)              => apiFetch<any>(`/circuit/${key}`),
  compare:             (drivers: string[], year: number) =>
    apiFetch<any>(`/compare?drivers=${drivers.join(',')}&year=${year}`),
  getSummary:          (sessionId: number)         =>
    apiFetch<any>('/summary', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) }),
  getTeams:           ()            => apiFetch<any[]>('/teams'),
  getTeam:            (id: string)  => apiFetch<any>(`/team/${id}`),
};
