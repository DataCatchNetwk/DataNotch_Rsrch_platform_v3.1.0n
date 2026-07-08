import type { Page, Request, Response } from '@playwright/test';

export interface CapturedApiCall {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  status: number | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseJson: unknown;
  durationMs: number | null;
  error: string | null;
}

/**
 * Attaches a one-shot interceptor for the researcher registration API call.
 * Returns a promise that resolves with the captured call details once the
 * response is received (or rejects after a timeout).
 */
export function captureRegistrationCall(
  page: Page,
  backendUrl: string,
  timeoutMs = 60_000,
): Promise<CapturedApiCall> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for registration API response after ${timeoutMs}ms`));
    }, timeoutMs);

    const captured: Partial<CapturedApiCall> = {
      url: '',
      method: '',
      requestHeaders: {},
      requestBody: null,
      status: null,
      responseHeaders: {},
      responseBody: null,
      responseJson: null,
      durationMs: null,
      error: null,
    };

    let startTime: number | null = null;

    const onRequest = (req: Request) => {
      const url = req.url();
      if (!url.includes('register-researcher-application')) return;
      captured.url = url;
      captured.method = req.method();
      captured.requestHeaders = req.headers();
      startTime = Date.now();
      // FormData bodies are not readable via Playwright's postData() for multipart,
      // but we record what we can.
      captured.requestBody = req.postData() ?? null;
    };

    const onResponse = async (res: Response) => {
      const url = res.url();
      if (!url.includes('register-researcher-application')) return;

      captured.status = res.status();
      captured.responseHeaders = res.headers();
      if (startTime !== null) {
        captured.durationMs = Date.now() - startTime;
      }

      try {
        const text = await res.text();
        captured.responseBody = text;
        try {
          captured.responseJson = JSON.parse(text);
        } catch {
          captured.responseJson = null;
        }
      } catch (err) {
        captured.error = err instanceof Error ? err.message : String(err);
      }

      clearTimeout(timer);
      page.off('request', onRequest);
      page.off('response', onResponse);
      resolve(captured as CapturedApiCall);
    };

    page.on('request', onRequest);
    page.on('response', onResponse);
  });
}

/**
 * Collects all browser console messages during a page interaction.
 */
export function collectConsoleMessages(page: Page): { messages: string[]; errors: string[] } {
  const messages: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    messages.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    const text = `[pageerror] ${err.message}`;
    messages.push(text);
    errors.push(text);
  });

  return { messages, errors };
}
