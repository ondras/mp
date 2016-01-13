import * as keyboard from "./keyboard.js";

let registry = {};

export function register(command, keys, func) {
	registry[command] = {
		func: func,
		enabled: true
	};

	function wrap() {
		if (isEnabled(command)) {
			execute(command);
			return true;
		} else {
			return false;
		}
	}
	[].concat(keys || []).forEach(key => keyboard.register(wrap, key));

	return command;
}

export function enable(command) {
	Object.keys(registry).filter(function(c) {
		return c.match(command);
	}).forEach(function(c) {
		registry[c].enabled = true;
	});
}

export function disable(command) {
	Object.keys(registry).filter(function(c) {
		return c.match(command);
	}).forEach(function(c) {
		registry[c].enabled = false;
	});
}

export function isEnabled(command) {
	return registry[command].enabled;
}

export function execute(command) {
	if (!isEnabled(command)) { return; }
	return registry[command].func(command);
}
