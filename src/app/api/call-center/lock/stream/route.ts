import { NextRequest } from 'next/server';
import { getAllLocks, lockEvents } from '@/lib/leadLocks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial locks immediately on client connection
      try {
        const initialData = `data: ${JSON.stringify({ locks: getAllLocks() })}\n\n`;
        controller.enqueue(encoder.encode(initialData));
      } catch (e) {
        console.error('SSE initial send error:', e);
      }

      // 2. Real-time broadcast listener
      const listener = (locks: any) => {
        try {
          const message = `data: ${JSON.stringify({ locks })}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          // Client disconnected
        }
      };

      lockEvents.on('locks_changed', listener);

      // Heartbeat ping every 15s to keep HTTP connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        lockEvents.off('locks_changed', listener);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
