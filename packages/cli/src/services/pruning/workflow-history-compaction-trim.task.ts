import { SystemTask } from '@n8n/decorators';
import type { SystemTaskEffects, SystemTaskPlacement, SystemTaskSchedule } from '@n8n/decorators';

import { WorkflowHistoryCompactionService } from './workflow-history-compaction.service';

/**
 * Trims long-running workflow histories down to one version per time bucket,
 * so old histories keep their shape without keeping every auto-save.
 */
@SystemTask()
export class WorkflowHistoryCompactionTrimTask implements SystemTask {
	readonly name = 'workflow-history-compaction-trim';

	readonly schedule: SystemTaskSchedule = {
		kind: 'cron',
		cronExpression: '0 3 * * *',
		// `null` resolves to `GENERIC_TIMEZONE` at run time.
		timezone: null,
	};

	readonly effects: SystemTaskEffects = 'idempotent';

	readonly placement: SystemTaskPlacement = { scope: 'cluster', durable: true };

	constructor(private readonly compactionService: WorkflowHistoryCompactionService) {}

	async run(signal: AbortSignal): Promise<void> {
		await this.compactionService.trimLongRunningHistories(signal);
	}
}
