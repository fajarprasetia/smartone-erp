# SmartOne ERP Deployment Guide

This guide explains how to deploy the SmartOne ERP application.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

## Deployment Options

### 1. Local Development (Port 3100)

This is suitable for local testing and development.

```bash
# Deploy using the local configuration
docker-compose -f docker-compose.local.yml up -d

# Or use the deployment script
./scripts/deploy.sh local
```

Access the application at: http://localhost:3100

### 2. Production Deployment

For production environments with Nginx as a reverse proxy.

```bash
# Deploy using the production configuration
docker-compose -f docker-compose.prod.yml up -d

# Or use the deployment script
./scripts/deploy.sh production
```

## Using the Deployment Script

We've included a deployment script to make the process easier:

```bash
# Make the script executable (if needed)
chmod +x scripts/deploy.sh

# Deploy locally (default)
./scripts/deploy.sh 

# Deploy to production
./scripts/deploy.sh production
```

## Environment Variables

The deployment uses these environment variables:

- `DATABASE_URL`: Connection string for PostgreSQL
- `NEXTAUTH_URL`: URL for NextAuth authentication
- `PORT`: The port inside the container (3000)
- `NODE_ENV`: Set to "production" for production deployment

## Docker Compose Files

- `docker-compose.yml`: Default configuration
- `docker-compose.local.yml`: Local development configuration with port 3100
- `docker-compose.prod.yml`: Production configuration with Nginx

## Database

The PostgreSQL database is configured with:
- Username: postgres
- Password: 0135
- Database: smartone_erp

## Troubleshooting

- **Database Connection Issues**: Ensure the database service is running with `docker-compose ps`.
- **Application Not Starting**: Check logs with `docker-compose logs -f app`.
- **Database Not Initializing**: Check database logs with `docker-compose logs -f db`.

## Maintenance

- **Stop the application**: `docker-compose -f [compose-file] down`
- **View logs**: `docker-compose -f [compose-file] logs -f`
- **Restart**: `docker-compose -f [compose-file] restart`
- **Full rebuild**: `docker-compose -f [compose-file] up -d --build`

## Manual Start (Non-Docker)

To start the application manually on port 3100:

```bash
# Development mode
pnpm dev:3100

# Production mode (after building)
pnpm build
pnpm start:3100
``` 