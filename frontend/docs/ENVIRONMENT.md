# Environment Configuration

This project uses environment variables for configuration management across different environments.

## Setup

1. Copy `.env.example` to `.env` for local development:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your local setup.

## Environment Variables

### API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_BASE_URL` | Base URL for the backend API | `http://localhost:8080` | ✅ |
| `REACT_APP_API_TIMEOUT` | Request timeout in milliseconds | `10000` | ❌ |

### Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_ENABLE_REACT_QUERY_DEVTOOLS` | Enable React Query DevTools | `true` | ❌ |
| `REACT_APP_ENABLE_API_LOGGING` | Enable detailed API request/response logging | `true` | ❌ |

### Hedera Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_HEDERA_NETWORK` | Hedera network (`testnet` or `mainnet`) | `testnet` | ❌ |
| `REACT_APP_HEDERA_MIRROR_NODE` | Hedera Mirror Node URL | `https://testnet.mirrornode.hedera.com` | ❌ |

### App Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_APP_NAME` | Application name | `Yieldera` | ❌ |
| `REACT_APP_VERSION` | Application version | `0.1.0` | ❌ |

## Environment Files

- `.env.example` - Template with all available variables
- `.env` - Local development configuration (not committed)
- `.env.production.example` - Template for production configuration
- `.env.production` - Production configuration (not committed)

## Usage

Environment variables are centralized in `src/config/env.ts` and can be imported and used throughout the application:

```typescript
import { env, isDevelopment, isProduction } from './config/env';

// Use configuration
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: env.API_TIMEOUT,
});

// Use helper functions
if (isDevelopment()) {
  console.log('Development mode');
}
```

## Validation

Environment variables are validated on application startup. If required variables are missing, the application will log an error message indicating which variables need to be set.

## Notes

- All React environment variables must be prefixed with `REACT_APP_`
- Environment files are loaded automatically by Create React App
- Values in environment files should not contain quotes unless the quotes are part of the value
- Boolean values should be strings: `"true"` or `"false"`
