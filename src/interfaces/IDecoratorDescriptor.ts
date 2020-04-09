interface IDecoratorDescriptor {
	/**
	 * The PropertyKey for identifying this DecoratedMemeber.
	 * For an ObservableProperty, this is the name of the property.
	 * For a ComputedProperty or ReactiveMethod, the key is the same as the name,
	 * so as to distinguish the member from different prototype.
	 */
	$key: PropertyKey;

	/** Readable member name, in the format of [Class.MemberName]. */
	$name: string;

	/** The constructor used for this memeber. */
	$constructor: IDecoratedMemberConstructor;

	/** Options for this DecoratedMember. */
	$option?: IDecoratorOptions<any>;

	/** The original method defined on the prototype. */
	$method?: Function;
}