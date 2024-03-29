import { IDecoratedMemberConstructor, IDecoratorOptions } from "Index";

export interface IDecoratorDescriptor {
	/** The constructor used for this member. */
	$constructor: IDecoratedMemberConstructor;

	/** Name of the parent class. */
	$class: string;

	/** Member name. */
	$key: PropertyKey;

	/** The original method defined on the prototype. */
	$method?: Function;

	/** Options for this {@link DecoratedMember}. */
	$option?: IDecoratorOptions;
}
