# Auth

## Every route is private by default

`AuthGuard` is registered globally (`APP_GUARD` in `presentations/http/http.module.ts`). It expects
`Authorization: Bearer <token>`, verifies the HS256 signature with `JWT_SECRET` and validates the payload
(`{ sub: uuid, role }`) with zod. Anything wrong is a 401 `HTTP.UNAUTHORIZED`.

Open a route with `@Public()`:

```ts
@Post()
@Public()
async handle(@Body() body: SignUpDto) { ... }
```

## Who is calling

```ts
async handle(@CurrentActor() actor: Actor) {
  await this.listTasks.execute({ actor, ... })
}
```

`Actor` is `{ id, role }`, from the verified token only, never from the body. Use cases receive it and decide with
policies (`canAccessTask`).

## Roles

```ts
@Get()
@Roles('ADMIN')
async handle() { ... }
```

`RolesGuard` runs after `AuthGuard`. A missing role is a 403 `HTTP.FORBIDDEN`. Roles are listed once, in
`core/auth/actor.ts` (`roles = ['USER', 'ADMIN']`), and the database enum is built from that list.

Prefer **ownership in the use case** (a policy) over roles on the route when the answer depends on the resource:
"admins see everything, users see their own" is a policy; "only admins can list users" is a role.

## Tokens

`POST /auth/sign-in` returns `{ accessToken }`, valid for `JWT_EXPIRES_IN_SECONDS`. The payload carries the role at
sign-in time: after changing someone's role, they must sign in again. There are no refresh tokens in the template.
