type MessageHandler = (data: any) => void;

interface WebSocketConfig {
  url: string;
  onMessage: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class RealtimeWebSocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private isManualClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;
    
    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.config.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.config.onMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (error) => {
        this.config.onError?.(error);
      };

      this.ws.onclose = () => {
        this.config.onDisconnect?.();
        if (!this.isManualClose && this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.config.reconnectInterval);
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createBinanceWebSocket(
  symbol: string,
  timeframe: string,
  onCandle: (candle: { time: number; open: number; high: number; low: number; close: number; volume: number }) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
): RealtimeWebSocket {
  const binanceSymbol = symbol.toLowerCase();
  const intervalMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  const interval = intervalMap[timeframe] || '1h';
  
  const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${interval}`;

  return new RealtimeWebSocket({
    url: wsUrl,
    onMessage: (data) => {
      if (data.e === 'kline' && data.k) {
        const k = data.k;
        onCandle({
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        });
      }
    },
    onConnect,
    onDisconnect,
  });
}
