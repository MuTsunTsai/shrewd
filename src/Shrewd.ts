// Level 0
/// <reference path="class/Error.ts" />
/// <reference path="core/Core.ts" />
/// <reference path="core/Decorators.ts" />
/// <reference path="core/ShrewdObject.ts" />
/// <reference path="class/Observable.ts" />
/// <reference path="util/HiddenProperty.ts" />

// Level 1
/// <reference path="class/Observer.ts" />

// Level 2
/// <reference path="components/DecoratedMember.ts" />

// Level 3
/// <reference path="components/ComputedProperty.ts" />
/// <reference path="components/ObservableProperty.ts" />
/// <reference path="components/ReactiveMethod.ts" />

const Shrewd = {
	SetupError,

	observable: Decorators.$observable,
	computed: Decorators.$computed,
	reactive: Decorators.$reactive,

	commit: Core.$commit
};