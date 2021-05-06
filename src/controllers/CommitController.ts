
class CommitController {

	/** Notified, to-be-rendered Observers. */
	private static readonly _queue: Set<Observer> = new Set();

	public static $flush() {
		Global.$pushState({ $isCommitting: true });
		while(CommitController._queue.size > 0) {
			for(let ob of CommitController._queue) Observer.$render(ob, true);
		}
		Observer.$clearPending();
		Global.$restore();
	}

	public static $dequeue(observer: Observer) {
		CommitController._queue.delete(observer);
	}

	public static $enqueue(observer: Observer) {
		// There's no need to add rendering Observers again.
		if(!observer.$isRendering) {
			CommitController._queue.add(observer);
		}
		AutoCommitController.$setup();
	}
}
