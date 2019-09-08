
class BaseProxyHandler<T extends object> implements ProxyHandler<T> {
	
	public isExtensible(target: WrappedObservable<T>) {
		return false;
	}
}