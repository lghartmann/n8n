import { mock } from 'vitest-mock-extended';

import { WorkflowHistoryCompactionTrimTask } from '../workflow-history-compaction-trim.task';
import type { WorkflowHistoryCompactionService } from '../workflow-history-compaction.service';

describe('WorkflowHistoryCompactionTrimTask', () => {
	let compactionService = mock<WorkflowHistoryCompactionService>();
	let task = new WorkflowHistoryCompactionTrimTask(compactionService);

	const setService = ({ trimmingEnabled = true } = {}) => {
		Object.defineProperty(compactionService, 'isTrimmingEnabled', { value: trimmingEnabled });
	};

	beforeEach(() => {
		compactionService = mock<WorkflowHistoryCompactionService>();
		task = new WorkflowHistoryCompactionTrimTask(compactionService);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should declare a daily cron in the instance timezone and run durably', () => {
		expect(task.name).toBe('workflow-history-compaction-trim');
		expect(task.schedule).toEqual({ kind: 'cron', cronExpression: '0 3 * * *', timezone: null });
		expect(task.effects).toBe('idempotent');
		expect(task.placement).toEqual({ scope: 'cluster', durable: true });
	});

	it('should trim on every run, handing the pass its abort signal', async () => {
		vi.setSystemTime(new Date(2026, 10, 10, 5, 0, 0));
		setService();
		const { signal } = new AbortController();

		await task.run(signal);

		expect(compactionService.trimLongRunningHistories).toHaveBeenCalledExactlyOnceWith(signal);
	});

	it('should not trim when the prune horizon is shorter than the trim window', async () => {
		setService({ trimmingEnabled: false });

		await task.run(new AbortController().signal);

		expect(compactionService.trimLongRunningHistories).not.toHaveBeenCalled();
	});
});
