let app = require("app");
let BrowserWindow = require("browser-window");
let pkg = require("./package.json");
let mainWindow = null;

let shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
	if (!mainWindow) { return; }

	if (mainWindow.isMinimized()) { mainWindow.restore(); }
	mainWindow.focus();

	let baseURI = `file://${workingDirectory}/`;
	mainWindow.webContents.send("open", commandLine.slice(2), baseURI);
});

if (shouldQuit) {
	app.quit();
} else {
	app.on("window-all-closed", () => {
		if (process.platform != "darwin") { app.quit(); }
	});

	app.on("ready", () => {
		let options = {
			width: pkg.window.width,
			height: pkg.window.height,
			icon: `${__dirname}/icon.png`
		}
		mainWindow = new BrowserWindow(options);
		mainWindow.setMenu(null);
		mainWindow.loadURL(`file://${__dirname}/${pkg.main}`);
	});
}
