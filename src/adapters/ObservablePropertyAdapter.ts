import { ObservableProperty, IDecoratedMemberConstructor, Adapter } from "Index";

export class ObservablePropertyAdapter extends Adapter<ObservableProperty> {

	protected get _constructor(): IDecoratedMemberConstructor<ObservableProperty> {
		return ObservableProperty;
	}
}
