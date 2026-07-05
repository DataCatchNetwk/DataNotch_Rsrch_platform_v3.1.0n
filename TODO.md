# TODO - Supabase + Prisma DATABASE_URL update

## Step 1
Update local backend env: `apps/api/.env` with new `DATABASE_URL`.

## Step 2
Update Render environment variables so `DATABASE_URL` is the same.

## Step 3
Run prisma generate + dev for `@health-platform/server`.

## Step 4
Verify backend starts without Prisma `P1001` errors.

