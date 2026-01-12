import { storage } from './storage.js';
import { decrypt } from './encryption.js';

export async function sendDiscordAlert(userId, message, embedOptions = {}) {
  try {
    const settings = await storage.getUserSettings(userId);
    if (!settings?.discordWebhookUrl) {
      return { success: false, error: 'Discord webhook not configured' };
    }

    const webhookUrl = decrypt(settings.discordWebhookUrl);
    if (!webhookUrl) {
      return { success: false, error: 'Failed to decrypt Discord webhook URL' };
    }

    const payload = {
      content: message,
    };

    if (embedOptions.title || embedOptions.description) {
      payload.embeds = [{
        title: embedOptions.title || 'Trading Alert',
        description: embedOptions.description || message,
        color: embedOptions.color || 0x00ff00,
        timestamp: new Date().toISOString(),
        fields: embedOptions.fields || [],
      }];
      delete payload.content;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Discord API error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Discord alert error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTelegramAlert(userId, message, options = {}) {
  try {
    const settings = await storage.getUserSettings(userId);
    if (!settings?.telegramBotToken || !settings?.telegramChatId) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    const botToken = decrypt(settings.telegramBotToken);
    const chatId = decrypt(settings.telegramChatId);
    
    if (!botToken || !chatId) {
      return { success: false, error: 'Failed to decrypt Telegram credentials' };
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: options.parseMode || 'HTML',
      disable_notification: options.silent || false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!data.ok) {
      return { success: false, error: `Telegram API error: ${data.description}` };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    console.error('Telegram alert error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAlert(userId, message, options = {}) {
  const results = {
    discord: null,
    telegram: null,
  };

  const settings = await storage.getUserSettings(userId);
  
  if (settings?.discordWebhookUrl) {
    results.discord = await sendDiscordAlert(userId, message, options.discord || {});
  }

  if (settings?.telegramBotToken && settings?.telegramChatId) {
    results.telegram = await sendTelegramAlert(userId, message, options.telegram || {});
  }

  return results;
}

export async function fetchNews(apiKey, options = {}) {
  try {
    const query = options.query || 'stock market trading forex cryptocurrency';
    const pageSize = options.pageSize || 10;
    const sortBy = options.sortBy || 'publishedAt';
    
    const params = new URLSearchParams({
      q: query,
      pageSize: pageSize.toString(),
      sortBy,
      apiKey,
      language: 'en',
    });

    const url = `https://newsapi.org/v2/everything?${params}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      return { success: false, error: data.message || 'Failed to fetch news' };
    }

    return {
      success: true,
      articles: data.articles.map(article => ({
        title: article.title,
        description: article.description,
        source: article.source?.name,
        url: article.url,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
      })),
      totalResults: data.totalResults,
    };
  } catch (error) {
    console.error('News API error:', error);
    return { success: false, error: error.message };
  }
}

export function validateTradingViewWebhook(secret, providedSecret) {
  if (!secret || !providedSecret) return false;
  return secret === providedSecret;
}
