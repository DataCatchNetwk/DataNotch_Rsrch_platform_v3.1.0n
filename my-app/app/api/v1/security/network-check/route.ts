import { NextResponse } from 'next/server';

type ProviderResponse = {
  ip?: string;
  is_vpn?: boolean;
  vpn?: boolean;
  is_proxy?: boolean;
  proxy?: boolean;
  is_tor?: boolean;
  tor?: boolean;
  is_datacenter?: boolean;
  datacenter?: boolean;
  security?: {
    vpn?: boolean;
    proxy?: boolean;
    tor?: boolean;
    relay?: boolean;
    hosting?: boolean;
  };
};

function getClientIp(forwardedFor: string | null) {
  if (!forwardedFor) return null;
  return forwardedFor.split(',')[0]?.trim() || null;
}

function toBoolean(value: unknown) {
  return value === true;
}

export async function GET(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = getClientIp(forwardedFor);

  const endpoint = clientIp
    ? `https://api.ipapi.is?q=${encodeURIComponent(clientIp)}`
    : 'https://api.ipapi.is';

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          blocked: false,
          checked: false,
          reason: 'Network risk service unavailable.',
        },
        { status: 200 }
      );
    }

    const data = (await response.json()) as ProviderResponse;

    const vpn =
      toBoolean(data.is_vpn) ||
      toBoolean(data.vpn) ||
      toBoolean(data.security?.vpn) ||
      toBoolean(data.security?.relay);
    const proxy = toBoolean(data.is_proxy) || toBoolean(data.proxy) || toBoolean(data.security?.proxy);
    const tor = toBoolean(data.is_tor) || toBoolean(data.tor) || toBoolean(data.security?.tor);
    const datacenter =
      toBoolean(data.is_datacenter) || toBoolean(data.datacenter) || toBoolean(data.security?.hosting);

    const blocked = vpn || proxy || tor || datacenter;

    return NextResponse.json(
      {
        blocked,
        checked: true,
        ip: data.ip ?? clientIp,
        flags: { vpn, proxy, tor, datacenter },
        reason: blocked
          ? 'Access blocked: VPN/proxy/Tor or datacenter network detected. Please disconnect and try again.'
          : 'Network check passed.',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        blocked: false,
        checked: false,
        reason: 'Network risk check failed. Please try again.',
      },
      { status: 200 }
    );
  }
}
