import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    threads: [
      {
        id: 1,
        sender: 'Dr. Sarah Johnson',
        time: '2:15 PM',
        subject: 'Dataset Approval Request',
        preview: 'Please review the Clinical_SDOH_v5 dataset...',
        unread: 2,
        category: 'DATASET_REQUEST',
        status: 'Open',
        priority: 'Normal',
        assetName: 'Clinical_SDOH_v5 Dataset',
      },
    ],
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ ok: true, thread: { id: Date.now(), ...body } }, { status: 201 });
}
