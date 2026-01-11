# Database Migrations

> This document is authoritative. Implementation must strictly conform to it.

Guide to setting up, managing, and updating the database schema with Prisma.

## Overview

Prisma provides two approaches for database changes:
- **`prisma db push`**: Quick schema sync for development
- **`prisma migrate`**: Production-ready migration system

## Initial Setup

### First-Time Database Creation

**1. Generate Prisma Client:**
```bash
npx prisma generate
```

This reads `prisma/schema.prisma` and generates TypeScript types and client.

**2. Create Database:**
```bash
npx prisma db push
```

This creates:
- `prisma/dev.db` (SQLite file)
- All tables defined in schema
- Indexes and constraints

**3. Verify:**
```bash
npx prisma studio
```

Opens GUI at [http://localhost:5555](http://localhost:5555) to view database.

### Environment Configuration

**DATABASE_URL in .env:**
```env
# SQLite (Development)
DATABASE_URL="file:./dev.db"

# PostgreSQL (Production)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

## Development Workflow

### Making Schema Changes

**1. Edit schema.prisma:**
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  // Add new field:
  phone String?
}
```

**2. Push changes:**
```bash
npx prisma db push
```

**3. Regenerate client:**
```bash
npx prisma generate
```

(Usually automatic with `db push`, but can run manually)

**4. Restart dev server:**
```bash
npm run dev
```

### Common Schema Changes

**Add Field:**
```prisma
model User {
  newField String? // Optional field (nullable)
}
```

**Add Required Field with Default:**
```prisma
model User {
  status String @default("active")
}
```

**Add Relationship:**
```prisma
model User {
  posts Post[]
}

model Post {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

**Add Index:**
```prisma
model JournalEntry {
  symbol String

  @@index([symbol])
}
```

### Reset Database

**⚠️ WARNING: Deletes all data**

```bash
npx prisma db push --force-reset
```

Use when:
- Schema conflicts can't be resolved
- Starting fresh in development
- Testing migrations

**Alternative: Delete and recreate:**
```bash
rm prisma/dev.db
npx prisma db push
```

## Production Migrations

### Migration System

For production, use proper migrations instead of `db push`.

**Benefits:**
- Version controlled
- Reversible
- Safe for production
- Team collaboration
- Audit trail

### Creating Migrations

**1. Make schema change:**
```prisma
model User {
  phone String? // New field
}
```

**2. Create migration:**
```bash
npx prisma migrate dev --name add_user_phone
```

This:
- Generates SQL migration file
- Applies migration to database
- Updates Prisma Client
- Creates `prisma/migrations/` folder

**3. Migration file created:**
```
prisma/migrations/
└── 20240115100000_add_user_phone/
    └── migration.sql
```

**migration.sql content:**
```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
```

### Applying Migrations

**Development:**
```bash
npx prisma migrate dev
```

Applies pending migrations and regenerates client.

**Production:**
```bash
npx prisma migrate deploy
```

Applies pending migrations only (no prompts, CI/CD friendly).

**Preview (dry run):**
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

Shows SQL that would be generated.

### Migration Status

**Check pending migrations:**
```bash
npx prisma migrate status
```

Output:
```
Database schema is up to date!
```

Or:
```
Following migrations have not yet been applied:
  20240115100000_add_user_phone
```

### Migration History

**View applied migrations:**
```sql
-- In Prisma Studio or database client
SELECT * FROM _prisma_migrations;
```

Shows:
- Migration name
- Applied timestamp
- Checksum
- Logs

## Common Migration Scenarios

### Adding Non-Nullable Field

**Problem:** Can't add required field to table with existing data.

**Solution 1: Two-step migration**
```prisma
// Step 1: Add as optional
model User {
  phone String?
}
```

```bash
npx prisma migrate dev --name add_phone_optional
```

Then update existing records, then:

```prisma
// Step 2: Make required
model User {
  phone String
}
```

```bash
npx prisma migrate dev --name make_phone_required
```

**Solution 2: Add with default**
```prisma
model User {
  phone String @default("000-000-0000")
}
```

### Renaming Fields

**Problem:** Prisma can't detect renames, treats as delete + add.

**Solution: Manual migration**

```bash
npx prisma migrate dev --create-only --name rename_user_name
```

Edit generated SQL:
```sql
-- Instead of DROP + ADD
ALTER TABLE "User" RENAME COLUMN "name" TO "fullName";
```

Then apply:
```bash
npx prisma migrate dev
```

### Removing Fields

**Safe removal:**
```prisma
// 1. Remove from schema
model User {
  // Removed: oldField String
}
```

```bash
npx prisma migrate dev --name remove_old_field
```

Migration will DROP column (data lost).

**Backup first if needed:**
```bash
npx prisma db execute --file backup.sql
```

### Changing Field Types

**Example: String to Int**

⚠️ Data loss possible

```prisma
model User {
  // Before: id String
  id Int @id @default(autoincrement())
}
```

Prisma creates DROP + ADD migration.

**Safe approach:**
1. Create new field
2. Migrate data
3. Remove old field

### Adding Relations

**Example:**
```prisma
model User {
  posts Post[]
}

model Post {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Migration creates:
- Foreign key constraint
- Index on userId
- Cascade delete rule

## Troubleshooting

### Migration Failed

**Error:** Migration failed to apply

**Check:**
1. Database connection
2. Permissions
3. Conflicting data
4. Schema syntax

**Resolve:**
```bash
npx prisma migrate resolve --rolled-back 20240115100000_name
```

Marks migration as rolled back, allowing retry.

### Drift Detected

**Error:** Database schema drifted from migrations

**Cause:** Manual changes to database

**Solution:**
```bash
npx prisma db push --force-reset
```

Or create migration to match:
```bash
npx prisma migrate dev
```

### Can't Connect to Database

**Check:**
- DATABASE_URL correct?
- Database server running?
- Network access?
- Credentials valid?

**Test connection:**
```bash
npx prisma db pull
```

Should introspect database.

### Migration Conflicts (Team)

**Scenario:** Two developers create migrations simultaneously

**Solution:**
1. Pull latest migrations from git
2. Reset local database
3. Apply all migrations in order
4. Recreate your migration if needed

```bash
git pull
npx prisma db push --force-reset
npx prisma migrate dev
```

## Best Practices

### Version Control

**Always commit:**
- `prisma/schema.prisma`
- `prisma/migrations/` directory
- `.env.example` (not `.env`)

**Never commit:**
- `prisma/dev.db` (local SQLite file)
- `.env` (contains secrets)

### Migration Naming

**Good names:**
```
add_user_phone_field
create_journal_table
add_strategies_user_index
rename_conversation_title
```

**Bad names:**
```
migration1
fix
update
changes
```

### Development vs Production

**Development:**
- Use `prisma db push` for quick iteration
- Reset database freely
- Experiment with schema

**Production:**
- Always use `prisma migrate`
- Never use `db push`
- Test migrations on staging first
- Backup before migrations

### Data Migrations

**For complex data transformations:**

1. Create empty migration:
```bash
npx prisma migrate dev --create-only --name migrate_data
```

2. Edit migration.sql:
```sql
-- Schema change
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;

-- Data migration
UPDATE "User" SET "fullName" = "firstName" || ' ' || "lastName";

-- Cleanup
ALTER TABLE "User" DROP COLUMN "firstName";
ALTER TABLE "User" DROP COLUMN "lastName";
```

3. Apply:
```bash
npx prisma migrate dev
```

### Backups

**Before major migrations:**

**SQLite:**
```bash
cp prisma/dev.db prisma/dev.db.backup
```

**PostgreSQL:**
```bash
pg_dump -h host -U user database > backup.sql
```

**Restore if needed:**
```bash
# SQLite
cp prisma/dev.db.backup prisma/dev.db

# PostgreSQL
psql -h host -U user database < backup.sql
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - run: npm run build
```

### Deployment Checklist

- [ ] Backup production database
- [ ] Test migration on staging
- [ ] Review migration SQL
- [ ] Check for breaking changes
- [ ] Plan rollback strategy
- [ ] Apply migration
- [ ] Verify application works
- [ ] Monitor for errors

## Prisma Studio

### Opening Studio

```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555)

### Features

- View all tables
- Browse records
- Edit data (development only!)
- Filter and search
- Inspect relationships

### Use Cases

- Verify migrations applied
- Check data integrity
- Debug issues
- Manual data fixes (dev only)
- Explore schema

## Schema Validation

### Check Schema

```bash
npx prisma validate
```

Validates:
- Syntax correctness
- Relation integrity
- Type compatibility
- Constraint validity

### Format Schema

```bash
npx prisma format
```

Auto-formats schema.prisma for consistency.

## Switching Databases

### SQLite to PostgreSQL

**1. Update DATABASE_URL:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

**2. Update provider:**
```prisma
datasource db {
  provider = "postgresql" // was "sqlite"
  url      = env("DATABASE_URL")
}
```

**3. Adjust schema if needed:**
- SQLite: `@default(cuid())`
- PostgreSQL: `@default(uuid())` or `@id @default(autoincrement())`

**4. Create migrations:**
```bash
npx prisma migrate dev --name init
```

**5. Migrate data:**
- Export from SQLite
- Transform as needed
- Import to PostgreSQL

### PostgreSQL to MySQL

Similar process, update provider to `"mysql"`.

## Emergency Procedures

### Completely Reset

**⚠️ DELETES ALL DATA**

```bash
# Delete database
rm prisma/dev.db

# Delete migrations
rm -rf prisma/migrations

# Recreate
npx prisma db push

# Or create initial migration
npx prisma migrate dev --name init
```

### Rollback Migration (Production)

**Not directly supported by Prisma**

**Manual rollback:**
1. Identify migration to rollback
2. Write reverse SQL
3. Execute reverse SQL
4. Mark migration as rolled back:
```bash
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

**Better approach:** Create new migration to reverse changes.

## Related Documentation

- [Schema Reference](./schema.md) - Complete schema documentation
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
