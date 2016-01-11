var registry = {};

export function register(command, func) {
	registry[command] = {
		func: func,
		enabled: true
	};

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
	return registry[command].func();
}
