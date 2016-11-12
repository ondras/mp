const remote = require("remote");

export const argv = remote.process.argv.slice(2);

export function showDevTools() {
   	remote.getCurrentWindow().openDevTools();
}

export function setFullscreen(fullscreen) {
   	remote.getCurrentWindow().setFullScreen(fullscreen);
   	return fullscreen;
}

export const baseURI = `file://${require("process").cwd()}/`;

export function onOpen(callback) {
	require("electron").ipcRenderer.on("open", (event, args, baseURI) => callback(args, baseURI));
}

export function globalShortcut(shortcut, cb) {
	remote.globalShortcut.register(shortcut, cb);
}

export function resizeBy(dw, dh) {
	let w = remote.getCurrentWindow();
	let current = w.getSize();
	current[0] += dw;
	current[1] += dh;
	w.setSize(current[0], current[1]);
}
