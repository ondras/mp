import * as keyboard from "./keyboard.js";
import * as command from "./command.js";

export default function register(name, keys, func) {
	command.register(name, func);
	[].concat(keys).forEach(function(key) {
		keyboard.register(name, key);
	});
}
