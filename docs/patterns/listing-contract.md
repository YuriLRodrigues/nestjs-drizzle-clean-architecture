# Listing contract

Every list endpoint is paginated. Nothing returns an unbounded array.

## Request

| Param    | Rule                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------- |
| `page`   | integer, 1-based, default `1`                                                                            |
| `limit`  | integer, `1..100`, default `20`                                                                          |
| `search` | optional, max 100 characters, case-insensitive "contains"; the use case trims it and ignores a blank one |
| filters  | optional, named after the field (`status=DONE`), validated against the enum                              |

## Response

```json
{
  "results": [{ "id": "…", "title": "Buy milk" }],
  "meta": { "page": 1, "limit": 20, "totalItems": 42, "totalPages": 3 }
}
```

`totalPages` is `0` when there is nothing.

## Layers

- `core/pagination`: `PaginationParams`, `Paginated<T>`, `paginated(results, totalItems, params)`, `offsetOf(params)`.
- Repository: `findMany(params): Promise<Paginated<Entity>>`, ordered by `created_at desc, id desc`, with the count
  run with the same `where`.
- Use case: decides the scope (a user sees their own tasks, an admin sees all) and passes it to the repository.
- HTTP: the query DTO extends `PaginationQueryDto`; the response DTO has `results` and `meta: PaginationMetaDto`; the
  view model has a `toHttpPage()`.
