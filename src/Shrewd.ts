// Level 0
/// <reference path="core/Comparer.ts" />
/// <reference path="class/Observable.ts" />
/// <reference path="hook/DefaultHook.ts" />
/// <reference path="hook/VueHook.ts" />
/// <reference path="core/Core.ts" />
/// <reference path="core/Decorators.ts" />
/// <reference path="core/ShrewdObject.ts" />
/// <reference path="util/HiddenProperty.ts" />
/// <reference path="helpers/CollectionProxyHandler.ts" />

// Level 1
/// <reference path="class/Observer.ts" />
/// <reference path="helpers/Helper.ts" />

// Level 2
/// <reference path="components/DecoratedMember.ts" />
/// <reference path="helpers/ObjectHelper.ts" />
/// <reference path="helpers/SetHelper.ts" />
/// <reference path="helpers/MapHelper.ts" />

// Level 3
/// <reference path="components/ComputedProperty.ts" />
/// <reference path="components/ObservableProperty.ts" />
/// <reference path="components/ReactiveMethod.ts" />
/// <reference path="helpers/ArrayHelper.ts" />

interface Window {
	Vue?: any;
}

namespace Shrewd {
	export const shrewd = Decorators.$shrewd;
	export const symbol = $shrewdObject;
	export const commit = Core.$commit;
	export const terminate = Core.$terminate;
	export const initialize = Core.$initialize;
	export const hook = {
		default: DefaultHook,
		vue: VueHook
	};
	export const option = Core.$option;
	export const comparer = Comparer;
	export const debug = {
		trigger(target: any, key?: string) {
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

if(typeof window !== 'undefined' && window.Vue) {
	Core.$option.hook = new VueHook();
}
