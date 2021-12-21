import { Observer ,InitializationController, TerminationController , $shrewdObject, Comparer, Core, Decorators , DefaultHook, VueHook , HiddenProperty } from "Index";

if(typeof window !== 'undefined' && window.Vue) {
	Core.$option.hook = new VueHook();
}

export const shrewd = Decorators.$shrewd;
export const symbol = $shrewdObject;
export const commit = Core.$commit;
export const terminate = TerminationController.$terminate;
export const initialize = InitializationController.$initialize;
export const hook = {
	default: DefaultHook,
	vue: VueHook
};
export const option = Core.$option;
export const comparer = Comparer;
export const debug = {
	trigger(target: unknown, key?: string) {
		if(target instanceof Object) {
			if(HiddenProperty.$has(target, $shrewdObject)) {
				let member = target[$shrewdObject].$getMember(key);
				if(!member) console.log("Member not found");
				else Observer.$debug(member);
			} else if(target instanceof Observer) {
				Observer.$debug(target);
			}
		}
	}
}
