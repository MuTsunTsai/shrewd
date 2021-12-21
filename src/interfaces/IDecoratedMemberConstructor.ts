import { DecoratedMember, IShrewdObjectParent, IDecoratorDescriptor } from "Index";

export interface IDecoratedMemberConstructor<T extends DecoratedMember = DecoratedMember> {
	new(target: IShrewdObjectParent, descriptor: IDecoratorDescriptor): T;
}
