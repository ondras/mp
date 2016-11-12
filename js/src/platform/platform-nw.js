const gui = window.nwDispatcher.nwGui;

export const argv = gui.App.argv;

export function showDevTools() {
	gui.Window.get().showDevTools();
}

export function setFullscreen(fullscreen) {
	gui.Window.get().isFullscreen = fullscreen;
	return fullscreen;
}

export const baseURI = `file://${require("process").cwd()}/`;

export function onOpen(callback) {
	// FIXME cmdline is incorrectly handling spaces :/
	gui.App.on("open", cmdLine => { 
		let parts = cmdLine.split(/\s+/);
		let args = parts.slice(2);
		args = [args.join(" ")];
		callback(args, baseURI);
	});
}

export function globalShortcut(shortcut, cb) {
	let cfg = {
		key: shortcut,
		active: cb
	};
	let s = new gui.Shortcut(cfg);
	gui.App.registerGlobalHotKey(s);
}

export function resizeBy(dw, dh) {
	gui.Window.get().resizeBy(dw, dh);
}
