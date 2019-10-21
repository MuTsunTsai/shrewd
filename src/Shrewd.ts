// Level 0
/// <reference path="class/Observable.ts" />
/// <reference path="hook/DefaultHook.ts" />
/// <reference path="hook/VueHook.ts" />
/// <reference path="core/Core.ts" />
/// <reference path="core/Decorators.ts" />
/// <reference path="core/ShrewdObject.ts" />
/// <reference path="util/HiddenProperty.ts" />
/// <reference path="helpers/BaseProxyHandler.ts" />

// Level 1
/// <reference path="class/Observer.ts" />
/// <reference path="helpers/Helper.ts" />
/// <reference path="helpers/CollectionProxyHandler.ts" />

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

const Shrewd = {
	shrewd: Decorators.$shrewd,
	decorate: null,
	symbol: $shrewdObject,

	commit: Core.$commit,
	construct: Core.$construct,
	terminate: Core.$terminate,

	hook: {
		default: DefaultHook,
		vue: VueHook
	},

	option: Core.$option,
};

if(typeof window !== 'undefined' && window.Vue) {
	Core.$option.hook = new VueHook();
}