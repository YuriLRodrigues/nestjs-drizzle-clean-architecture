import { Module, ValidationPipe } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core'

import { CryptographyModule } from '@infra/cryptography/cryptography.module'

import { AuthGuard } from './auth/auth.guard'
import { RolesGuard } from './auth/roles.guard'
import { HealthController } from './controllers/health/health.controller'
import { IdentityHttpModule } from './controllers/identity/identity-http.module'
import { TasksHttpModule } from './controllers/tasks/tasks-http.module'
import { HttpErrorFilter } from './errors/http-error.filter'

/**
 * The HTTP edge. Guards, filter and pipe are registered here (not in `main.ts`) so the e2e app gets exactly the
 * same behaviour. Guards run in this order: AuthGuard, then RolesGuard.
 */
@Module({
  imports: [CryptographyModule, IdentityHttpModule, TasksHttpModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
  ],
})
export class HttpModule {}
