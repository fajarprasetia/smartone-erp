# SmartOne ERP Deployment Guide

This guide explains how to deploy the SmartOne ERP application.

## Prerequisites

- Node.js (v18 or newer)
- PostgreSQL database
- pnpm package manager (`npm install -g pnpm`)
- Git (to clone the repository)

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smartone_erp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables by creating a `.env.local` file:
   ```
   DATABASE_URL=postgresql://postgres:0135@localhost:5432/smartone_erp
   NEXTAUTH_URL=http://localhost:9000
   NEXTAUTH_SECRET=your-secure-secret-key
   ```

4. Initialize the database:
   ```bash
   pnpm prisma migrate dev
   pnpm db:seed
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

   Access the application at: http://localhost:9000

## Production Deployment

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables by creating a `.env.production` file:
   ```
   DATABASE_URL=postgresql://postgres:0135@localhost:5432/smartone_erp
   NEXTAUTH_URL=https://erp.smartone.id
   NEXTAUTH_SECRET=your-secure-secret-key
   NODE_ENV=production
   ```

3. Build the application:
   ```bash
   pnpm build
   ```

4. Start the production server:
   ```bash
   pnpm start
   ```

   The application will be available at http://localhost:9000

## Using a Process Manager (Optional)

For production deployments, you might want to use a process manager to ensure your application stays running. Some options include:

- [PM2](https://pm2.keymetrics.io/)
- [Forever](https://github.com/foreversd/forever)
- [Systemd](https://systemd.io/) (Linux systems)

You can also use a platform like [Vercel](https://vercel.com/) for hosting Next.js applications with minimal configuration.

## Database

The PostgreSQL database is configured with:
- Username: postgres
- Password: 0135
- Database: smartone_erp

You can create the database manually:
```bash
psql -U postgres
CREATE DATABASE smartone_erp;
\q
```

## Troubleshooting

- **Database Connection Issues**: Ensure the PostgreSQL service is running with `systemctl status postgresql`.
- **Application Not Starting**: Check the application logs.
- **Port Already in Use**: Check if port 9000 is already in use with `lsof -i :9000` and kill any process using it.

## Regular Maintenance

- Database backup:
  ```bash
  pg_dump -U postgres smartone_erp > backup_$(date +%Y%m%d).sql
  ```

- Application update:
  ```bash
  git pull
  pnpm install
  pnpm build
  pnpm start
  ``` 