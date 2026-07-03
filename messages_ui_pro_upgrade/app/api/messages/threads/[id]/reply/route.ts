import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json({
    ok: true,
    message: {
      id: Date.now(),
      threadId: Number(params.id),
      content: body.content,
      mode: body.mode ?? 'Message',
      createdAt: new Date().toISOString(),
    },
  }, { status: 201 });
}
