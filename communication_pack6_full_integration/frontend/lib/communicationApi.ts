const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
async function request(path:string, options:RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}) }});
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export const communicationApi = {
  inbox: (userId:string) => request(`/communication/inbox?userId=${userId}`),
  createThread: (payload:any) => request('/communication/threads', { method:'POST', body: JSON.stringify(payload)}),
  reply: (threadId:string, payload:any) => request(`/communication/threads/${threadId}/reply`, { method:'POST', body: JSON.stringify(payload)}),
  assetThreads: (type:string, id:string) => request(`/communication/assets/${type}/${id}/threads`),
  scheduleMeeting: (payload:any) => request('/meetings/schedule', { method:'POST', body: JSON.stringify(payload)}),
  respondInvite: (meetingId:string, payload:any) => request(`/meetings/${meetingId}/respond`, { method:'POST', body: JSON.stringify(payload)}),
  startMeeting: (meetingId:string, actor:any) => request(`/meetings/${meetingId}/start`, { method:'POST', body: JSON.stringify({actor})}),
  manageMeeting: (meetingId:string, action:string, actor:any) => request(`/meetings/${meetingId}/manage`, { method:'POST', body: JSON.stringify({action, actor})}),
};
