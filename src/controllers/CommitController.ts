
class CommitController {

	/** Notified, to-be-rendered {@link Observer}s. */
	private static readonly _queue: Set<Observer> = new Set();

	public static $flush(): void {
		Global.$pushState({ $isCommitting: true });
		while(CommitController._queue.size > 0) {
			for(let ob of CommitController._queue) Observer.$render(ob, true);
		}
		Observer.$clearPending();
		Global.$restore();
	}

	public static $dequeue(observer: Observer): void {
		CommitController._queue.delete(observer);
	}

	public static $enqueue(observer: Observer): void {
		// There's no need to add rendering Observers again.
		if(!observer.$isRendering) {
			CommitController._queue.add(observer);
		}
		AutoCommitController.$setup();
	}
}
