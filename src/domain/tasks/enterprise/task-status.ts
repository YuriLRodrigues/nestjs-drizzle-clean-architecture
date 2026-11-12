export const taskStatuses = ['PENDING', 'DONE'] as const

export type TaskStatus = (typeof taskStatuses)[number]
