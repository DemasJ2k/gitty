import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save, Check, Eye, EyeOff, Key, Bell, Lock, TrendingUp, Database } from 'lucide-react';

const API_KEY_FIELDS = [
  'openaiApiKey',
  'anthropicApiKey',
  'polygonApiKey',
  'alphaVantageApiKey',
  'coinGeckoApiKey',
  'twelveDataApiKey',
  'coinbaseApiKey',
  'coinbaseApiSecret',
  'discordWebhookUrl',
  'telegramBotToken',
  'telegramChatId',
  'newsApiKey',
  'tradingViewWebhookSecret',
] as const;

type ApiKeyField = typeof API_KEY_FIELDS[number];

interface Settings {
  preferredProvider: string;
  anthropicModel: string;
  openaiModel: string;
  openaiApiKeySet: boolean;
  anthropicApiKeySet: boolean;
  polygonApiKeySet: boolean;
  alphaVantageApiKeySet: boolean;
  coinGeckoApiKeySet: boolean;
  twelveDataApiKeySet: boolean;
  coinbaseApiKeySet: boolean;
  coinbaseApiSecretSet: boolean;
  discordWebhookUrlSet: boolean;
  telegramBotTokenSet: boolean;
  telegramChatIdSet: boolean;
  newsApiKeySet: boolean;
  tradingViewWebhookSecretSet: boolean;
  preferredMarketDataProvider: string;
  defaultMarket: string;
  defaultTimeframe: string;
  riskPerTrade: number;
  emailNotifications: boolean;
  notificationEmail: string;
  notificationPhone: string;
}

interface ApiKeyUpdates {
  openaiApiKey?: string | null;
  anthropicApiKey?: string | null;
  polygonApiKey?: string | null;
  alphaVantageApiKey?: string | null;
  coinGeckoApiKey?: string | null;
  twelveDataApiKey?: string | null;
  coinbaseApiKey?: string | null;
  coinbaseApiSecret?: string | null;
  discordWebhookUrl?: string | null;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  newsApiKey?: string | null;
  tradingViewWebhookSecret?: string | null;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    preferredProvider: 'anthropic',
    anthropicModel: 'claude-sonnet-4-5',
    openaiModel: 'gpt-4o',
    openaiApiKeySet: false,
    anthropicApiKeySet: false,
    polygonApiKeySet: false,
    alphaVantageApiKeySet: false,
    coinGeckoApiKeySet: false,
    twelveDataApiKeySet: false,
    coinbaseApiKeySet: false,
    coinbaseApiSecretSet: false,
    discordWebhookUrlSet: false,
    telegramBotTokenSet: false,
    telegramChatIdSet: false,
    newsApiKeySet: false,
    tradingViewWebhookSecretSet: false,
    preferredMarketDataProvider: 'polygon',
    defaultMarket: 'Forex',
    defaultTimeframe: '1h',
    riskPerTrade: 1,
    emailNotifications: true,
    notificationEmail: '',
    notificationPhone: '',
  });
  
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<ApiKeyField, string>>({
    openaiApiKey: '',
    anthropicApiKey: '',
    polygonApiKey: '',
    alphaVantageApiKey: '',
    coinGeckoApiKey: '',
    twelveDataApiKey: '',
    coinbaseApiKey: '',
    coinbaseApiSecret: '',
    discordWebhookUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
    newsApiKey: '',
    tradingViewWebhookSecret: '',
  });
  
  const [apiKeyUpdates, setApiKeyUpdates] = useState<ApiKeyUpdates>({});
  const [pendingClears, setPendingClears] = useState<Set<ApiKeyField>>(new Set());
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchApi('/api/settings');
      if (data) {
        setSettings({
          preferredProvider: data.preferredProvider || 'anthropic',
          anthropicModel: data.anthropicModel || 'claude-sonnet-4-5',
          openaiModel: data.openaiModel || 'gpt-4o',
          openaiApiKeySet: data.openaiApiKeySet || false,
          anthropicApiKeySet: data.anthropicApiKeySet || false,
          polygonApiKeySet: data.polygonApiKeySet || false,
          alphaVantageApiKeySet: data.alphaVantageApiKeySet || false,
          coinGeckoApiKeySet: data.coinGeckoApiKeySet || false,
          twelveDataApiKeySet: data.twelveDataApiKeySet || false,
          coinbaseApiKeySet: data.coinbaseApiKeySet || false,
          coinbaseApiSecretSet: data.coinbaseApiSecretSet || false,
          discordWebhookUrlSet: data.discordWebhookUrlSet || false,
          telegramBotTokenSet: data.telegramBotTokenSet || false,
          telegramChatIdSet: data.telegramChatIdSet || false,
          newsApiKeySet: data.newsApiKeySet || false,
          tradingViewWebhookSecretSet: data.tradingViewWebhookSecretSet || false,
          preferredMarketDataProvider: data.preferredMarketDataProvider || 'polygon',
          defaultMarket: data.defaultMarket || 'Forex',
          defaultTimeframe: data.defaultTimeframe || '1h',
          riskPerTrade: data.riskPerTrade || 1,
          emailNotifications: data.emailNotifications ?? true,
          notificationEmail: data.notificationEmail || '',
          notificationPhone: data.notificationPhone || '',
        });
        setApiKeyInputs({
          openaiApiKey: '',
          anthropicApiKey: '',
          polygonApiKey: '',
          alphaVantageApiKey: '',
          coinGeckoApiKey: '',
          twelveDataApiKey: '',
          coinbaseApiKey: '',
          coinbaseApiSecret: '',
          discordWebhookUrl: '',
          telegramBotToken: '',
          telegramChatId: '',
          newsApiKey: '',
          tradingViewWebhookSecret: '',
        });
        setApiKeyUpdates({});
        setPendingClears(new Set());
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (pendingClears.size > 0) {
      const keyNames = Array.from(pendingClears).map(k => 
        k.replace('ApiKey', '').replace(/([A-Z])/g, ' $1').trim()
      );
      const confirmed = confirm(
        `You are about to remove the following API keys:\n\n${keyNames.join('\n')}\n\nAre you sure you want to proceed?`
      );
      if (!confirmed) {
        return;
      }
    }
    
    setSaving(true);
    try {
      const dataToSave: Record<string, any> = {
        preferredProvider: settings.preferredProvider,
        anthropicModel: settings.anthropicModel,
        openaiModel: settings.openaiModel,
        preferredMarketDataProvider: settings.preferredMarketDataProvider,
        defaultMarket: settings.defaultMarket,
        defaultTimeframe: settings.defaultTimeframe,
        riskPerTrade: settings.riskPerTrade,
        emailNotifications: settings.emailNotifications,
        notificationEmail: settings.notificationEmail,
        notificationPhone: settings.notificationPhone,
        ...apiKeyUpdates,
      };
      
      for (const keyToDelete of pendingClears) {
        dataToSave[keyToDelete] = '';
      }
      
      await fetchApi('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(dataToSave),
      });
      
      await loadSettings();
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await fetchApi('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordSaved(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleShowApiKey = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApiKeyChange = (keyName: ApiKeyField, value: string) => {
    setApiKeyInputs(prev => ({ ...prev, [keyName]: value }));
    if (value) {
      setApiKeyUpdates(prev => ({ ...prev, [keyName]: value }));
    } else {
      setApiKeyUpdates(prev => {
        const updated = { ...prev };
        delete updated[keyName as keyof ApiKeyUpdates];
        return updated;
      });
    }
  };

  const markKeyForClear = (keyName: ApiKeyField) => {
    setPendingClears(prev => new Set(prev).add(keyName));
  };

  const unmarkKeyForClear = (keyName: ApiKeyField) => {
    setPendingClears(prev => {
      const updated = new Set(prev);
      updated.delete(keyName);
      return updated;
    });
  };

  const ApiKeyInput = ({ 
    label, 
    keyName, 
    placeholder,
    helpText 
  }: { 
    label: string; 
    keyName: ApiKeyField;
    placeholder: string;
    helpText?: string;
  }) => {
    const setField = `${keyName}Set` as keyof Settings;
    const isSet = settings[setField] as boolean;
    const inputValue = apiKeyInputs[keyName];
    const hasPendingUpdate = keyName in apiKeyUpdates && apiKeyUpdates[keyName as keyof ApiKeyUpdates];
    const isPendingClear = pendingClears.has(keyName);
    
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium flex items-center gap-2">
          {label}
          {isSet && !isPendingClear && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Configured</span>
          )}
          {isPendingClear && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Will be cleared</span>
          )}
          {hasPendingUpdate && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Will be updated</span>
          )}
        </label>
        <div className="relative">
          <Input
            type={showApiKeys[keyName] ? 'text' : 'password'}
            value={inputValue}
            onChange={(e) => handleApiKeyChange(keyName, e.target.value)}
            placeholder={isSet && !isPendingClear ? 'Enter new key to replace existing' : placeholder}
            className="pr-20 font-mono text-sm"
            disabled={isPendingClear}
            data-testid={`input-${keyName}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {isPendingClear && (
              <button
                type="button"
                onClick={() => unmarkKeyForClear(keyName)}
                className="text-xs text-blue-500 hover:text-blue-700 px-1"
              >
                Undo
              </button>
            )}
            {isSet && !isPendingClear && (
              <button
                type="button"
                onClick={() => markKeyForClear(keyName)}
                className="text-xs text-red-500 hover:text-red-700 px-1"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleShowApiKey(keyName)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showApiKeys[keyName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const hasAnyAiApiKey = settings.openaiApiKeySet || settings.anthropicApiKeySet || 
    apiKeyUpdates.openaiApiKey || apiKeyUpdates.anthropicApiKey;

  return (
    <div className="p-6 space-y-6 max-w-3xl overflow-y-auto h-full" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your Trading AI platform preferences</p>
      </div>

      {!hasAnyAiApiKey && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">API Keys Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Please add your OpenAI or Anthropic API key below to use the AI chat features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Provider API Keys
          </CardTitle>
          <CardDescription>
            Enter your API keys for AI chat functionality. Keys are encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Preferred AI Provider</label>
            <select
              value={settings.preferredProvider}
              onChange={(e) => setSettings({ ...settings, preferredProvider: e.target.value })}
              className="w-full mt-1 border rounded-md p-2 bg-background"
              data-testid="select-provider"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ApiKeyInput
              label="Anthropic API Key"
              keyName="anthropicApiKey"
              placeholder="sk-ant-..."
              helpText="Get your key at console.anthropic.com"
            />
            <ApiKeyInput
              label="OpenAI API Key"
              keyName="openaiApiKey"
              placeholder="sk-..."
              helpText="Get your key at platform.openai.com"
            />
          </div>

          {settings.preferredProvider === 'anthropic' && (
            <div>
              <label className="text-sm font-medium">Anthropic Model</label>
              <select
                value={settings.anthropicModel}
                onChange={(e) => setSettings({ ...settings, anthropicModel: e.target.value })}
                className="w-full mt-1 border rounded-md p-2 bg-background"
                data-testid="select-anthropic-model"
              >
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="claude-opus-4-5">Claude Opus 4.5</option>
                <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
              </select>
            </div>
          )}

          {settings.preferredProvider === 'openai' && (
            <div>
              <label className="text-sm font-medium">OpenAI Model</label>
              <select
                value={settings.openaiModel}
                onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                className="w-full mt-1 border rounded-md p-2 bg-background"
                data-testid="select-openai-model"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Market Data Provider API Keys
          </CardTitle>
          <CardDescription>
            Enter your API keys for real-time market data. At least one provider is required for charts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Preferred Market Data Provider</label>
            <select
              value={settings.preferredMarketDataProvider}
              onChange={(e) => setSettings({ ...settings, preferredMarketDataProvider: e.target.value })}
              className="w-full mt-1 border rounded-md p-2 bg-background"
              data-testid="select-market-provider"
            >
              <option value="polygon">Polygon.io</option>
              <option value="alphaVantage">Alpha Vantage</option>
              <option value="coinGecko">CoinGecko (Crypto)</option>
              <option value="twelveData">Twelve Data</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ApiKeyInput
              label="Polygon.io API Key"
              keyName="polygonApiKey"
              placeholder="Your Polygon API key"
              helpText="Real-time data for stocks, forex, crypto"
            />
            <ApiKeyInput
              label="Alpha Vantage API Key"
              keyName="alphaVantageApiKey"
              placeholder="Your Alpha Vantage API key"
              helpText="Free tier: 5 calls/min for stocks"
            />
            <ApiKeyInput
              label="CoinGecko API Key"
              keyName="coinGeckoApiKey"
              placeholder="Your CoinGecko API key"
              helpText="Cryptocurrency market data"
            />
            <ApiKeyInput
              label="Twelve Data API Key"
              keyName="twelveDataApiKey"
              placeholder="Your Twelve Data API key"
              helpText="800 calls/day on free tier"
            />
            <ApiKeyInput
              label="Coinbase API Key"
              keyName="coinbaseApiKey"
              placeholder="Your Coinbase API key"
              helpText="Optional - public data works without key"
            />
            <ApiKeyInput
              label="Coinbase API Secret"
              keyName="coinbaseApiSecret"
              placeholder="Your Coinbase API secret"
              helpText="Required for private API access"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Integrations
          </CardTitle>
          <CardDescription>
            Connect Discord, Telegram, and TradingView for trade alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ApiKeyInput
              label="Discord Webhook URL"
              keyName="discordWebhookUrl"
              placeholder="https://discord.com/api/webhooks/..."
              helpText="Create a webhook in your Discord server settings"
            />
            <ApiKeyInput
              label="TradingView Webhook Secret"
              keyName="tradingViewWebhookSecret"
              placeholder="Your webhook secret for verification"
              helpText="Used to verify incoming TradingView alerts"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ApiKeyInput
              label="Telegram Bot Token"
              keyName="telegramBotToken"
              placeholder="123456:ABC-DEF..."
              helpText="Get from @BotFather on Telegram"
            />
            <ApiKeyInput
              label="Telegram Chat ID"
              keyName="telegramChatId"
              placeholder="Your chat ID or group ID"
              helpText="Use @userinfobot to find your chat ID"
            />
          </div>
          <div>
            <ApiKeyInput
              label="News API Key"
              keyName="newsApiKey"
              placeholder="Your NewsAPI.org API key"
              helpText="100 free requests/day for market news and sentiment"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trading Defaults
          </CardTitle>
          <CardDescription>Set your default trading preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Default Market</label>
              <select
                value={settings.defaultMarket}
                onChange={(e) => setSettings({ ...settings, defaultMarket: e.target.value })}
                className="w-full mt-1 border rounded-md p-2 bg-background"
                data-testid="select-market"
              >
                <option value="Forex">Forex</option>
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Metals">Metals</option>
                <option value="Futures">Futures</option>
                <option value="CFDs">CFDs</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Default Timeframe</label>
              <select
                value={settings.defaultTimeframe}
                onChange={(e) => setSettings({ ...settings, defaultTimeframe: e.target.value })}
                className="w-full mt-1 border rounded-md p-2 bg-background"
                data-testid="select-timeframe"
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">Daily</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Risk Per Trade (%)</label>
            <Input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.riskPerTrade}
              onChange={(e) => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) || 1 })}
              className="mt-1"
              data-testid="input-risk"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum percentage of account to risk on a single trade
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive alerts and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
              data-testid="checkbox-email-notifications"
            />
            <label htmlFor="emailNotifications" className="text-sm font-medium">
              Enable email notifications
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Notification Email</label>
              <Input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                placeholder="your@email.com"
                className="mt-1"
                data-testid="input-notification-email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number (SMS)</label>
              <Input
                type="tel"
                value={settings.notificationPhone}
                onChange={(e) => setSettings({ ...settings, notificationPhone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="mt-1"
                data-testid="input-notification-phone"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Current Password</label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter current password"
              className="mt-1"
              data-testid="input-current-password"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="mt-1"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="mt-1"
                data-testid="input-confirm-password"
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
          <Button 
            onClick={changePassword} 
            disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
            variant="outline"
            data-testid="button-change-password"
          >
            {passwordSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Password Changed!
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {savingPassword ? 'Changing...' : 'Change Password'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2 pb-6">
        <Button onClick={saveSettings} disabled={saving} data-testid="button-save">
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
