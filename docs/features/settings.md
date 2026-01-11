# Settings
> This document is authoritative. Implementation must strictly conform to it.

Customize your Trading AI experience with user preferences, AI configuration, and trading defaults.

## Overview

Settings allow you to configure:
- **Profile Management**: Name and password
- **AI Preferences**: Default provider and models
- **Trading Defaults**: Market, timeframe, risk settings
- **System Preferences**: Theme, timezone
- **Notifications**: Email preferences (future)

All settings persist to database and apply across sessions.

## Profile Settings

### Display Name

**Purpose:**
- Personalize your account
- Show in UI (future: comments, sharing)
- Professional appearance

**Updating:**
1. Go to Settings → Profile
2. Enter new name in "Display Name" field
3. Click "Save Profile"

### Email Address

**Status:** Read-only (cannot be changed)

**Used For:**
- Account identification
- Login username
- Future: Email notifications

**To Change:**
- Contact administrator
- Or create new account

### Password Management

**Changing Password:**
1. Go to Settings → Profile → Change Password
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click "Save Profile"

**Password Requirements:**
- Minimum 8 characters
- Current password must be correct
- New passwords must match

**Security:**
- Passwords hashed with bcrypt
- Never stored in plain text
- Server-side validation

## AI Preferences

### Default AI Provider

**Options:**
- Claude (Anthropic)
- GPT (OpenAI)

**Purpose:**
- Sets default for new chat conversations
- Can override per-conversation
- Affects Chat feature only

**Choosing a Provider:**

**Claude (Anthropic):**
- Pros: Detailed explanations, nuanced analysis
- Cons: Slightly slower, can be verbose
- Best for: Learning, strategy development

**GPT (OpenAI):**
- Pros: Fast, concise, good for code/calculations
- Cons: May lack depth in complex topics
- Best for: Quick questions, technical queries

**Recommendation:** Start with Claude (Sonnet)

### Claude Model Selection

**Options:**

**Claude 3 Opus:**
- Most capable model
- Best for complex analysis
- Slower response time
- Higher cost per request

**Claude 3 Sonnet (Recommended):**
- Balanced performance
- Good quality/speed ratio
- Most cost-effective
- Suitable for most tasks

**Claude 3 Haiku:**
- Fastest responses
- Lower quality
- Very cost-effective
- Good for simple questions

**Setting:**
1. Go to Settings → AI Preferences
2. Select "Claude Model"
3. Choose Opus, Sonnet, or Haiku
4. Click "Save Settings"

### OpenAI Model Selection

**Options:**

**GPT-4 Turbo (Recommended):**
- Latest GPT-4 variant
- 128K context window
- Fast and capable
- Good balance

**GPT-4:**
- Stable, proven model
- 8K context window
- Reliable performance

**GPT-3.5 Turbo:**
- Fastest option
- Lower quality than GPT-4
- Very economical
- Good for simple tasks

**Setting:**
1. Go to Settings → AI Preferences
2. Select "OpenAI Model"
3. Choose model
4. Click "Save Settings"

## Trading Preferences

### Default Market

**Purpose:**
- Set preferred market for charts
- Auto-select in new journal entries
- Personalize experience

**Options:**
- Forex
- Cryptocurrency
- Stocks
- Metals

**Impact:**
- Charts page opens to this market
- Symbol search defaults to this market
- Journal entry forms pre-filled

**Setting:**
1. Go to Settings → Trading Preferences
2. Select "Default Market"
3. Choose market
4. Click "Save Settings"

### Default Chart Timeframe

**Purpose:**
- Set preferred timeframe for chart analysis
- Quick access to your trading style
- Consistency across sessions

**Options:**
- 1 Minute (1m)
- 5 Minutes (5m)
- 15 Minutes (15m)
- 1 Hour (1h)
- 4 Hours (4h)
- 1 Day (1d)

**Recommendations:**
- Scalping: 1m, 5m
- Day Trading: 5m, 15m, 1h
- Swing Trading: 1h, 4h, 1d
- Position Trading: 4h, 1d

**Setting:**
1. Go to Settings → Trading Preferences
2. Select "Default Chart Timeframe"
3. Choose timeframe
4. Click "Save Settings"

### Risk Per Trade

**Purpose:**
- Define default risk percentage
- Use in position size calculations
- Enforce risk management discipline

**Range:** 0.1% to 10%

**Recommendations:**
- Conservative: 0.5% - 1%
- Moderate: 1% - 2%
- Aggressive: 2% - 5%
- Very Aggressive: 5%+ (not recommended)

**Professional Standard:** 1-2% per trade

**Setting:**
1. Go to Settings → Trading Preferences
2. Enter "Risk Per Trade (%)"
3. Value between 0.1 and 10
4. Click "Save Settings"

**Usage:**
- Reference when calculating position sizes
- Reminder in trading decisions
- Future: Auto-calculate lot sizes

### Timezone

**Purpose:**
- Display times in your local timezone
- Accurate killzone identification
- Proper session timing

**Options:**
- UTC (Universal)
- Eastern Time (ET)
- Central Time (CT)
- Pacific Time (PT)
- London (GMT)
- Paris (CET)
- Tokyo (JST)
- Singapore (SGT)
- Custom (future)

**Impact:**
- All timestamps shown in selected timezone
- Chart session markers
- Journal entry times
- Economic calendar timing

**Setting:**
1. Go to Settings → Trading Preferences
2. Select "Timezone"
3. Choose your timezone
4. Click "Save Settings"

## System Preferences

### Theme (Future Feature)

**Planned Options:**
- Light mode
- Dark mode
- System (auto-detect)

**Current Status:**
- Light theme only
- Dark mode planned

### Email Notifications (Future Feature)

**Planned Notifications:**
- Daily performance summary
- Trade alerts
- News events
- System updates

**Current Status:**
- Field exists in settings
- Not yet functional
- Future implementation

## API Keys Configuration

**Note:** API keys configured via environment variables only.

**Required Keys:**
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

**Optional Keys:**
- `PINECONE_API_KEY`
- `POLYGON_API_KEY`

**Security:**
- Never stored in database
- Not editable via UI
- Server-side only
- Contact administrator to update

**Info Panel:**
- Settings page shows reminder
- Explains environment variable approach
- Links to documentation

## Saving Settings

### Save Process

**User Settings:**
1. Modify any setting in UI
2. Click "Save Settings" button
3. Settings validated server-side
4. Stored in database
5. Success toast notification
6. Applied immediately

**Profile Updates:**
1. Modify name or password
2. Click "Save Profile" button
3. Validation (password requirements)
4. Database update
5. Success toast notification

### Validation

**Server-Side Checks:**

**Preferred Provider:**
- Must be "anthropic" or "openai"
- Default: "anthropic"

**Theme:**
- Must be "light", "dark", or "system"
- Default: "system"

**Risk Per Trade:**
- Must be between 0.1 and 10.0
- Default: 1.0

**Password:**
- Minimum 8 characters
- Current password must match (if changing)
- Confirmation must match new password

### Persistence

**Database Storage:**
- UserSettings model per user
- Created on first save
- Updated on subsequent saves
- Loaded on login

**Session:**
- Settings loaded when accessing Settings page
- Applied across all features
- Persists across browser sessions
- Survives server restarts

## Default Settings

### First-Time Users

**Defaults:**
```
Preferred Provider: Anthropic
Claude Model: Claude 3 Sonnet
OpenAI Model: GPT-4 Turbo
Theme: System
Timezone: UTC
Default Market: Forex
Default Timeframe: 1h
Risk Per Trade: 1.0%
Email Notifications: true
```

**Customization:**
- Change immediately after signup
- Or use defaults and update later
- All settings optional

## API Integration

### Get Settings

```typescript
const response = await fetch('/api/settings');
const { settings, profile } = await response.json();

// settings format:
{
  preferredProvider: 'anthropic',
  anthropicModel: 'claude-3-sonnet-20240229',
  openaiModel: 'gpt-4-turbo-preview',
  theme: 'system',
  timezone: 'UTC',
  defaultMarket: 'forex',
  defaultTimeframe: '1h',
  riskPerTrade: 1.0,
  emailNotifications: true
}

// profile format:
{
  name: 'John Doe',
  email: 'john@example.com'
}
```

### Update Settings

```typescript
const response = await fetch('/api/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    preferredProvider: 'anthropic',
    defaultMarket: 'crypto',
    riskPerTrade: 2.0
  }),
});

const { settings } = await response.json();
```

### Update Profile

```typescript
const response = await fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    currentPassword: 'old-password', // if changing password
    newPassword: 'new-password'      // if changing password
  }),
});

const { success, user } = await response.json();
```

See [API Reference](../api-reference.md) for complete documentation.

## Tips & Best Practices

### AI Provider Selection

**Experiment:**
- Try both providers
- Same question to both
- Compare answers
- Find your preference

**Use Cases:**
- Complex analysis: Claude
- Quick questions: GPT
- Learning concepts: Claude
- Calculations: GPT

### Model Selection

**Cost vs Quality:**
- Opus/GPT-4: Best quality, higher cost
- Sonnet/GPT-4 Turbo: Balanced (recommended)
- Haiku/GPT-3.5: Economical, acceptable quality

**Switch Models:**
- Complex questions: Use higher-tier model
- Simple questions: Use lower-tier model
- Monitor API costs

### Risk Management

**Conservative Approach:**
- Start with 0.5% - 1% risk
- Increase gradually as profitable
- Never exceed 2% until proven

**Account Size Considerations:**
- Small account (<$1000): 1-2% okay
- Medium account ($1000-$10000): 1% recommended
- Large account (>$10000): 0.5-1%

### Timezone Settings

**Why It Matters:**
- ICT killzones are time-specific
- News events time-sensitive
- Session overlaps crucial

**Best Practice:**
- Set to your local timezone
- Or set to market timezone (London, NY)
- Be consistent

## Troubleshooting

### Settings Not Saving

**Check:**
1. All required fields valid?
2. Validation errors shown?
3. Network connection active?
4. Logged in?

**Solutions:**
- Fill all required fields
- Check for error messages
- Verify authentication
- Refresh page and retry

### Password Change Fails

**Common Errors:**

**"Current password incorrect"**
- Verify current password
- Caps lock off?
- Try password reset if forgotten

**"Passwords do not match"**
- Retype new password carefully
- Ensure confirmation matches

**"Password too short"**
- Minimum 8 characters
- Add more characters

### Settings Not Applied

**Symptoms:**
- Changed setting but no effect
- Features use old settings

**Solutions:**
- Refresh page
- Log out and log back in
- Clear browser cache
- Verify settings saved successfully

## Related Features

- [Chat](./chat.md) - Uses AI provider settings
- [Charts](./charts.md) - Uses default market and timeframe
- [Journal](./journal.md) - Uses default market and risk settings

## Future Enhancements

- **Dark Mode**: Full dark theme support
- **Email Notifications**: Configurable email alerts
- **Custom Timeframes**: Define your own timeframes
- **API Key Management**: Edit API keys in UI (admin only)
- **Export Settings**: Export/import settings JSON
- **Multiple Profiles**: Switch between trading profiles
- **Advanced Preferences**: More granular control
- **Appearance Customization**: Colors, fonts, layout
