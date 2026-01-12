import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

interface PriceAlert {
  id: string;
  symbol: string;
  market: string;
  condition: 'above' | 'below' | 'crosses';
  targetPrice: number;
  currentPrice?: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  note?: string;
  createdAt: string;
}

interface PushStatus {
  enabled: boolean;
  subscribed: boolean;
  subscriptionCount: number;
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [formSymbol, setFormSymbol] = useState('');
  const [formMarket, setFormMarket] = useState('crypto');
  const [formCondition, setFormCondition] = useState<'above' | 'below' | 'crosses'>('above');
  const [formPrice, setFormPrice] = useState('');
  const [formNote, setFormNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAlerts();
    loadPushStatus();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await fetchApi('/api/alerts');
      setAlerts(data);
    } catch (err) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const loadPushStatus = async () => {
    try {
      const status = await fetchApi('/api/push/status');
      setPushStatus(status);
    } catch (err) {
      console.error('Failed to load push status:', err);
    }
  };

  const createAlert = async () => {
    if (!formSymbol || !formPrice) return;
    
    setIsCreating(true);
    try {
      const alert = await fetchApi('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: formSymbol.toUpperCase(),
          market: formMarket,
          condition: formCondition,
          targetPrice: parseFloat(formPrice),
          note: formNote || undefined,
        }),
      });
      setAlerts([alert, ...alerts]);
      setShowForm(false);
      setFormSymbol('');
      setFormPrice('');
      setFormNote('');
    } catch (err) {
      setError('Failed to create alert');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await fetchApi(`/api/alerts/${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      setError('Failed to delete alert');
    }
  };

  const toggleAlert = async (alert: PriceAlert) => {
    try {
      const updated = await fetchApi(`/api/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });
      setAlerts(alerts.map(a => a.id === alert.id ? updated : a));
    } catch (err) {
      setError('Failed to update alert');
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsSubscribing(true);
    try {
      const vapidResponse = await fetchApi('/api/push/vapid-key');
      const vapidPublicKey = vapidResponse.publicKey;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = subscription.toJSON();
      await fetchApi('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      await loadPushStatus();
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      setError('Failed to enable notifications. Please check browser permissions.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetchApi('/api/push/unsubscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      }
      await loadPushStatus();
    } catch (err) {
      setError('Failed to disable notifications');
    } finally {
      setIsSubscribing(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(8);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="alerts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Alerts</h1>
          <p className="text-muted-foreground">Get notified when prices hit your targets</p>
        </div>
        <div className="flex gap-2">
          {pushStatus && (
            <Button
              variant={pushStatus.subscribed ? 'default' : 'outline'}
              onClick={pushStatus.subscribed ? unsubscribeFromPush : subscribeToPush}
              disabled={isSubscribing || !pushStatus.enabled}
              data-testid="button-notifications"
            >
              {isSubscribing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : pushStatus.subscribed ? (
                <Bell className="h-4 w-4 mr-2" />
              ) : (
                <BellOff className="h-4 w-4 mr-2" />
              )}
              {pushStatus.subscribed ? 'Notifications On' : 'Enable Notifications'}
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} data-testid="button-add-alert">
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!pushStatus?.enabled && (
        <div className="p-4 bg-muted rounded-md text-sm">
          <p className="font-medium mb-1">Push Notifications Not Configured</p>
          <p className="text-muted-foreground">
            To receive browser notifications when alerts trigger, VAPID keys need to be configured. 
            Alerts will still be tracked and shown here.
          </p>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Price Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Symbol</label>
                <Input
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., BTCUSDT"
                  data-testid="input-alert-symbol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Market</label>
                <select
                  value={formMarket}
                  onChange={(e) => setFormMarket(e.target.value)}
                  className="w-full border rounded-md p-2 bg-background"
                  data-testid="select-alert-market"
                >
                  <option value="crypto">Crypto</option>
                  <option value="stocks">Stocks</option>
                  <option value="forex">Forex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value as 'above' | 'below' | 'crosses')}
                  className="w-full border rounded-md p-2 bg-background"
                  data-testid="select-alert-condition"
                >
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                  <option value="crosses">Price Crosses</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Price</label>
                <Input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  data-testid="input-alert-price"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Note (optional)</label>
              <Input
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Reminder note..."
                data-testid="input-alert-note"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createAlert} disabled={isCreating || !formSymbol || !formPrice} data-testid="button-create-alert">
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-alert">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No alerts yet</p>
              <p className="text-muted-foreground mb-4">Create your first price alert to get notified</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={alert.isTriggered ? 'border-green-500' : alert.isActive ? '' : 'opacity-50'}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      alert.condition === 'above' ? 'bg-green-100 dark:bg-green-900' : 
                      alert.condition === 'below' ? 'bg-red-100 dark:bg-red-900' : 
                      'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {alert.condition === 'above' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : alert.condition === 'below' ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <Bell className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{alert.symbol}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{alert.market}</span>
                        {alert.isTriggered && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Triggered</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.condition === 'above' ? 'Alert when above' : 
                         alert.condition === 'below' ? 'Alert when below' : 
                         'Alert when crosses'}{' '}
                        <span className="font-medium">${formatPrice(alert.targetPrice)}</span>
                      </p>
                      {alert.note && (
                        <p className="text-xs text-muted-foreground mt-1">{alert.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAlert(alert)}
                      data-testid={`button-toggle-${alert.id}`}
                    >
                      {alert.isActive ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-delete-${alert.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
