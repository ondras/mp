let search = location.search.substring(1)

export const argv = (search ? search.split("&") : []).map(decodeURIComponent);

export function showDevTools() {}

export function setFullscreen(fullscreen) { return fullscreen; }

export const baseURI = document.baseURI;

export function onOpen(callback) {
	window.addEventListener("message", (e) => {
		if (e.data && e.data.command == "control") {
			callback(e.data.argv, baseURI);
		}
	});
}

export function globalShortcut(shortcut, cb) {}

export function resizeBy(dw, dh) {
	window.resizeBy(dw, dh);
}
