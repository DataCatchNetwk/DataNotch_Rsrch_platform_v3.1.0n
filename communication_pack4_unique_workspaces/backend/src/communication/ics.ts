function dt(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildIcs(meeting: { title: string; agenda?: string; startsAt: Date; endsAt?: Date; roomName?: string }) {
  const end = meeting.endsAt || new Date(meeting.startsAt.getTime() + 30 * 60 * 1000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Research Platform V3//Communication Pack 4//EN',
    'BEGIN:VEVENT',
    `UID:${meeting.title.replace(/\s+/g, '-').toLowerCase()}@research-platform-v3`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(meeting.startsAt)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:${meeting.agenda || 'Research Platform meeting'}`,
    `LOCATION:${meeting.roomName || 'R-ZOOMA / R-MEET'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
