import * as keyboard from "./keyboard.js";
import * as command from "./command.js";

export default function register(name, keys, func) {
	command.register(name, func);
	function wrap() {
		if (command.isEnabled(name)) {
			command.execute(name);
			return true;
		} else {
			return false;
		}
	}
	[].concat(keys).forEach(key => keyboard.register(wrap, key));
}
