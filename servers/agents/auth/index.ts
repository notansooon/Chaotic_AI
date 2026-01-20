/**
 * Auth module exports
 */

export { auth, type Session, type User } from './auth.js';
export { authenticate, requireScopes, requireTier, rateLimit } from './middleware.js';
export {
    createApiKey,
    validateApiKey,
    listApiKeys,
    revokeApiKey,
    hasScope,
    type ApiKeyScope,
    DEFAULT_SCOPES,
    TIER_RATE_LIMITS,
} from './api-keys.js';
