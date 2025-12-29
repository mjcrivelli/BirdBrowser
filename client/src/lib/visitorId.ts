const VISITOR_ID_KEY = 'aves_toca_visitor_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  
  if (!visitorId) {
    visitorId = generateUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    console.log('New visitor ID created:', visitorId);
  }
  
  return visitorId;
}

export function clearVisitorId(): void {
  localStorage.removeItem(VISITOR_ID_KEY);
}
