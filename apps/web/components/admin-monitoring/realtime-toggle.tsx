'use client'

import * as React from 'react'
import { Radio, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function RealtimeToggle({
  mode,
  onModeChange,
  connected,
}: {
  mode: 'off' | 'sse' | 'ws'
  onModeChange: (mode: 'off' | 'sse' | 'ws') => void
  connected: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="rounded-full">
        {connected ? (
          <span className="inline-flex items-center gap-1">
            <Wifi className="h-3.5 w-3.5" />
            Live Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <WifiOff className="h-3.5 w-3.5" />
            Offline
          </span>
        )}
      </Badge>

      <Button variant={mode === 'off' ? 'default' : 'outline'} size="sm" onClick={() => onModeChange('off')}>
        Off
      </Button>
      <Button variant={mode === 'sse' ? 'default' : 'outline'} size="sm" onClick={() => onModeChange('sse')}>
        <Radio className="mr-2 h-4 w-4" />
        SSE
      </Button>
      <Button variant={mode === 'ws' ? 'default' : 'outline'} size="sm" onClick={() => onModeChange('ws')}>
        WebSocket
      </Button>
    </div>
  )
}
