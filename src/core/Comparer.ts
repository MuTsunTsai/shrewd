
namespace Comparer {

	export function array(oldValue: any[], newValue: any[]): boolean {
		if(!oldValue != !newValue) return false;
		if(oldValue == newValue) return true;
		if(oldValue.length != newValue.length) return false;
		for(let i = 0; i < oldValue.length; i++) {
			if(oldValue[i] !== newValue[i]) return false;
		}
		return true;
	}

	export function unorderedArray(oldValue: any[], newValue: any[]): boolean {
		if(!oldValue != !newValue) return false;
		if(oldValue == newValue) return true;
		if(oldValue.length != newValue.length) return false;
		for(let v of oldValue) if(!newValue.includes(v)) return false;
		return true;
	}
}
