import { createAuthClient } from 'better-auth/react';

import { nextCookies } from 'better-auth/next-js';

export const authClient = createAuthClient({
    baseURL: "http://localhost:9000",
    
});
