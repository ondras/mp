const shortcutAliases = {
	"MediaPreviousTrack": "MediaPrevTrack"
}

export const argv = nw.App.argv;
export const baseURI = `file://${require("process").cwd()}/`;

export function showDevTools() {
	nw.Window.get().showDevTools();
}

export function setFullscreen(fullscreen) {
	nw.Window.get().isFullscreen = fullscreen;
	return fullscreen;
}

export function onOpen(callback) {
	// FIXME cmdline is incorrectly handling spaces, also it is totally bogus :/
	nw.App.on("open", cmdLine => { 
		let parts = cmdLine.split(/\s+/);
		let args = parts.slice(2);
		args = [args.join(" ")];
		callback(args, baseURI);
	});
}

export function globalShortcut(shortcut, cb) {
	if (shortcut in shortcutAliases) { shortcut = shortcutAliases[shortcut]; }

	let cfg = {
		key: shortcut,
		active: cb
	};

	let s = new nw.Shortcut(cfg);
	nw.App.registerGlobalHotKey(s);
}

export function resizeBy(dw, dh) {
	nw.Window.get().resizeBy(dw, dh);
}
