import { Module } from '@nestjs/common'

import { OnTaskCompleted } from './subscribers/on-task-completed.subscriber'

/** Every subscriber is a provider here, so it registers its handlers when the app boots. */
@Module({
  providers: [OnTaskCompleted],
})
export class EventsModule {}
