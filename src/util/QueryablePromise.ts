
// This is for a future async version of Shrewd

// interface QueryablePromiseStatus<T> {
// 	_finished: boolean;
// 	_value?: T | PromiseLike<T>;
// }

// class QueryablePromise<T> extends Promise<T> {
// 	constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
// 		let status: QueryablePromiseStatus<T> = {
// 			_finished: false,
// 			_value: undefined
// 		};
// 		super((resolve, reject) => {
// 			status._finished = false;
// 			status._value = undefined;
// 			executor(
// 				value => {
// 					status._finished = true;
// 					status._value = value;
// 					resolve(value);
// 				},
// 				reason => {
// 					status._finished = true;
// 					reject(reason);
// 				}
// 			);
// 		});
// 		this._status = status;
// 	}

// 	private _status: QueryablePromiseStatus<T>;

// 	public get finished(): boolean {
// 		return this._status._finished;
// 	}

// 	public get value(): T | PromiseLike<T> | undefined {
// 		return this._status._value;
// 	}
// }
