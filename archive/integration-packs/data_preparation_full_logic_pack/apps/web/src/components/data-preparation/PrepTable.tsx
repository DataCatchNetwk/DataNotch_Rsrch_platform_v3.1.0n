'use client';

export function PrepTable({ rows }: { rows: Array<Record<string, any>> }) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>{headers.map((h) => <th key={h} className="px-4 py-3 uppercase">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {headers.map((h) => <td key={h} className="px-4 py-3">{String(row[h])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
