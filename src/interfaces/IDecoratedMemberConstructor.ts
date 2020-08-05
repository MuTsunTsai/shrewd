
interface IDecoratedMemberConstructor<T extends DecoratedMemeber = DecoratedMemeber> {
	new(target: IShrewdObjectParent, descriptor: IDecoratorDescriptor): T;
}