# Troubleshooting Guide
> This document is authoritative. Implementation must strictly conform to it.

Common issues and solutions for the Trading AI platform.

## Installation Issues

### Issue: npm install fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Causes:**
- Conflicting package versions
- Corrupted npm cache
- Outdated npm version

**Solutions:**

1. **Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Update npm:**
```bash
npm install -g npm@latest
```

3. **Use legacy peer deps (temporary):**
```bash
npm install --legacy-peer-deps
```

---

### Issue: Prisma generation fails

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, push to database
npx prisma db push
```

---

## Build Errors

### Issue: TypeScript compilation errors

**Symptoms:**
```
Type error: Property 'X' does not exist on type 'Y'
```

**Solutions:**

1. **Clear Next.js cache:**
```bash
rm -rf .next
npm run build
```

2. **Check TypeScript version:**
```bash
npm list typescript
# Should be 5.x
```

3. **Regenerate types:**
```bash
npx prisma generate  # Regenerate Prisma types
```

---

### Issue: Build succeeds but runtime errors

**Symptoms:**
- Build completes successfully
- Application crashes when accessing pages
- "Module not found" errors

**Solution:**

Check for dynamic imports without proper error handling:

```typescript
// Bad
const Component = dynamic(() => import('./Component'));

// Good
const Component = dynamic(
  () => import('./Component'),
  { ssr: false, loading: () => <div>Loading...</div> }
);
```

---

## API Key Issues

### Issue: Anthropic API errors

**Symptoms:**
```
Error: Invalid API key
Status: 401
```

**Verification Steps:**

1. **Check .env file exists:**
```bash
ls -la .env  # Should exist in project root
```

2. **Verify key format:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
# Must start with 'sk-ant-api03-'
```

3. **Test key directly:**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":1024,"messages":[{"role":"user","content":"Hi"}]}'
```

4. **Restart dev server:**
```bash
# .env changes require restart
npm run dev
```

---

### Issue: OpenAI API errors

**Symptoms:**
```
Error: Incorrect API key provided
```

**Solution:**

1. **Verify key format:**
```env
OPENAI_API_KEY=sk-...
# Must start with 'sk-'
```

2. **Test key:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

3. **Check billing:**
- Visit [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
- Ensure active payment method
- Check usage limits

---

### Issue: Pinecone connection fails

**Symptoms:**
```
Error: Failed to connect to Pinecone
```

**Solutions:**

1. **Verify environment variables:**
```env
PINECONE_API_KEY=your-key
PINECONE_INDEX_NAME=trading-ai
```

2. **Check index exists:**
- Login to [Pinecone console](https://app.pinecone.io/)
- Verify index name matches `PINECONE_INDEX_NAME`
- Check index configuration:
  - Dimensions: 1536
  - Metric: cosine

3. **Create index if missing:**
```bash
# Via Pinecone console or API
curl -X POST https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "trading-ai",
    "dimension": 1536,
    "metric": "cosine"
  }'
```

4. **Graceful fallback:**
- Chat and knowledge search work without Pinecone
- Memory features disabled but app still functional

---

### Issue: Polygon API rate limit

**Symptoms:**
```
Error: Rate limit exceeded
Status: 429
```

**Solutions:**

1. **Free tier limits:**
- 5 requests per minute
- Implement caching (already built-in for 5 min)
- Reduce chart data requests

2. **Upgrade plan:**
- Visit [polygon.io/pricing](https://polygon.io/pricing)
- Starter plan: 100 requests/min

3. **Use cached data:**
- Chart data cached for 5 minutes
- Wait before requesting different symbols

---

## Database Issues

### Issue: Database locked error

**Symptoms:**
```
Error: SQLITE_BUSY: database is locked
```

**Cause:**
- Multiple processes accessing SQLite
- Prisma Studio open while running dev server

**Solution:**

1. **Close Prisma Studio:**
```bash
# Find and kill Prisma Studio process
lsof | grep dev.db
kill <PID>
```

2. **Use PostgreSQL for production:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

---

### Issue: Migration errors

**Symptoms:**
```
Error: Migration failed to apply
```

**Solution:**

1. **Reset database (development only):**
```bash
# WARNING: Deletes all data
npx prisma db push --force-reset
```

2. **Manual migration:**
```bash
npx prisma migrate dev --name fix
```

3. **Check schema syntax:**
- Verify `prisma/schema.prisma` is valid
- Run `npx prisma validate`

---

## Chat Issues

### Issue: Chat not streaming

**Symptoms:**
- Messages appear all at once
- No progressive loading

**Causes:**
- Browser doesn't support Server-Sent Events
- Response buffering enabled
- Network proxy issues

**Solutions:**

1. **Check browser console:**
```javascript
// Should see EventSource connection
console.log(typeof EventSource); // "function"
```

2. **Verify response headers:**
```typescript
// In api/chat/route.ts
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

3. **Disable proxy buffering:**
```nginx
# If using nginx
proxy_buffering off;
```

---

### Issue: Chat context not working

**Symptoms:**
- AI doesn't remember previous conversations
- No relevant context retrieved

**Diagnosis:**

1. **Check Pinecone connection:**
```bash
# Visit /api/memory/status
curl http://localhost:3006/api/memory/status
```

2. **Verify embeddings stored:**
- Check Pinecone console
- View "conversations" namespace
- Should see vectors after chatting

3. **Check logs:**
```bash
# Dev server console should show:
"Retrieved 5 similar contexts"
```

**Solution:**

If Pinecone not configured:
- Chat still works but without memory
- Configure Pinecone keys in .env
- Restart server

---

## Knowledge Base Issues

### Issue: Knowledge search returns no results

**Symptoms:**
- Search query returns empty results
- "No results found" message

**Solutions:**

1. **Index knowledge base:**
- Go to Knowledge page
- Click "Reindex" button
- Wait for completion

2. **Verify markdown files exist:**
```bash
ls knowledge-base/ict/*.md
ls knowledge-base/scalping/*.md
# Should list 13 files
```

3. **Check Pinecone namespace:**
- Login to Pinecone console
- Check "knowledge-base" namespace exists
- Should have ~150 vectors

4. **Fallback to keyword search:**
- Without Pinecone, uses local keyword search
- Less accurate but functional

---

### Issue: Knowledge base reindex fails

**Symptoms:**
```
Error: Failed to index knowledge base
```

**Solutions:**

1. **Check Pinecone quota:**
- Free tier: 100k vectors
- Check usage in console

2. **Verify OpenAI API:**
- Embeddings use OpenAI `text-embedding-3-small`
- Check `OPENAI_API_KEY` is valid

3. **Clear existing index:**
```bash
# Via API
curl -X DELETE http://localhost:3006/api/knowledge/index

# Then reindex
curl -X POST http://localhost:3006/api/knowledge/index
```

---

## Chart Issues

### Issue: Charts not loading

**Symptoms:**
- Empty chart container
- "Failed to load chart data" error

**Solutions:**

1. **Check Polygon API:**
```bash
# Test API directly
curl "https://api.polygon.io/v2/aggs/ticker/C:EURUSD/range/1/hour/2024-01-01/2024-01-15?apiKey=YOUR_KEY"
```

2. **Verify symbol format:**
- Forex: `C:EURUSD` (prefix with `C:`)
- Stocks: `AAPL`
- Crypto: `X:BTCUSD`

3. **Check browser console:**
```
Network tab → Filter by 'market/chart'
Check response status and data
```

4. **Fallback without Polygon:**
- Charts require Polygon API
- No alternative data source currently
- Configure API key to enable

---

### Issue: ICT patterns not showing

**Symptoms:**
- Chart loads but no pattern overlays
- Toggle buttons don't work

**Diagnosis:**

1. **Check component state:**
```typescript
// Should see in React DevTools
showOrderBlocks: true
showFVG: true
```

2. **Verify pattern detection:**
```bash
# Browser console should log:
"Detected 3 order blocks"
"Detected 2 fair value gaps"
```

**Solution:**

- Pattern detection runs client-side
- Requires sufficient candles (min 20)
- Try longer time range
- Check for console errors

---

## Authentication Issues

### Issue: Login fails with correct credentials

**Symptoms:**
```
Error: Invalid credentials
```

**Solutions:**

1. **Check password hash:**
```bash
# Via Prisma Studio
npx prisma studio
# View User table, verify password is hashed
```

2. **Verify NEXTAUTH_SECRET:**
```env
NEXTAUTH_SECRET=must-be-set
# Required for session encryption
```

3. **Check session:**
```typescript
// In browser console
document.cookie
// Should see 'next-auth.session-token'
```

4. **Reset password:**
```bash
# Via Prisma Studio or API
# Update user password with new bcrypt hash
```

---

### Issue: Session expires immediately

**Symptoms:**
- Logged in but redirected to login page
- Session cookie not persisting

**Solutions:**

1. **Check NEXTAUTH_URL:**
```env
NEXTAUTH_URL=http://localhost:3006
# Must match actual URL exactly
```

2. **Browser cookie settings:**
- Check if cookies enabled
- Disable "Block third-party cookies" for localhost

3. **HTTPS in production:**
```env
# Production requires HTTPS
NEXTAUTH_URL=https://your-domain.com
```

---

## Performance Issues

### Issue: Slow page loads

**Symptoms:**
- Pages take >3 seconds to load
- Sluggish interactions

**Solutions:**

1. **Check database queries:**
```bash
# Enable Prisma logging
# In prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query"]
}
```

2. **Optimize images:**
- Use Next.js Image component
- Compress images before upload

3. **Check bundle size:**
```bash
npm run build
# Check route bundle sizes
# Large routes: consider code splitting
```

---

### Issue: High memory usage

**Symptoms:**
```
FATAL ERROR: Reached heap limit
```

**Solutions:**

1. **Increase Node memory:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

2. **Check for memory leaks:**
- Use Chrome DevTools Memory Profiler
- Look for growing arrays/objects

3. **Database connection pooling:**
```typescript
// In lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

---

## Deployment Issues

### Issue: Vercel build fails

**Symptoms:**
```
Error: Build exceeded maximum duration
```

**Solutions:**

1. **Optimize build:**
```json
// next.config.js
module.exports = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};
```

2. **Check environment variables:**
- Add all `.env` vars to Vercel
- Verify `DATABASE_URL` points to production DB

3. **Use external database:**
```env
# Don't use SQLite in production
DATABASE_URL=postgresql://...
```

---

### Issue: Environment variables not working in production

**Symptoms:**
- API calls fail in production
- "API key not configured" errors

**Solution:**

1. **Add to Vercel:**
- Go to Project Settings → Environment Variables
- Add all keys from `.env`
- Redeploy

2. **Verify variable names:**
- Must match exactly: `ANTHROPIC_API_KEY`
- No typos or extra spaces

---

## Getting More Help

If your issue isn't listed here:

1. **Check Next.js docs:** [nextjs.org/docs](https://nextjs.org/docs)
2. **Check Prisma docs:** [prisma.io/docs](https://www.prisma.io/docs)
3. **Review logs:**
   - Development: Check terminal console
   - Production: Check Vercel logs or server logs
4. **Test in isolation:**
   - Create minimal reproduction
   - Test API endpoints directly with curl
5. **Check versions:**
   ```bash
   node --version  # Should be 18.17+
   npm --version
   npx next info
   ```

## Debug Checklist

When encountering any issue:

- [ ] Check `.env` file exists and is complete
- [ ] Restart dev server
- [ ] Clear `.next` folder
- [ ] Check browser console for errors
- [ ] Check server logs
- [ ] Verify API keys are valid
- [ ] Test API endpoints with curl
- [ ] Check database with Prisma Studio
- [ ] Review recent code changes
- [ ] Try in incognito mode (rules out browser extensions)
