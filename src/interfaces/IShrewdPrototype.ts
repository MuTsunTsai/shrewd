import { IDecoratorDescriptor } from "Index";

export const $shrewdDecorators = Symbol("Shrewd Decorators");

export interface IShrewdPrototype {
	[$shrewdDecorators]: IDecoratorDescriptor[];
}
