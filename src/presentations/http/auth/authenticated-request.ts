import type { Request } from 'express'

import type { Actor } from '@core/auth/actor'

/** Set by `AuthGuard` on every non-public route. */
export type AuthenticatedRequest = Request & { actor?: Actor }
