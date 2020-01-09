const {app, BrowserWindow} = require("electron");
const pkg = require("./package.json");
let mainWindow = null;

let lock = app.requestSingleInstanceLock();
if (lock) {
	app.on("window-all-closed", () => {
		if (process.platform != "darwin") { app.quit(); }
	});

	app.on("ready", () => {
		let options = {
			width: pkg.window.width,
			height: pkg.window.height,
			icon: `${__dirname}/icon.png`,
			webPreferences: {
				nodeIntegration: true
			}
		}
		mainWindow = new BrowserWindow(options);
		mainWindow.setMenu(null);
		mainWindow.loadURL(`file://${__dirname}/${pkg.main}`);
	});

	app.on("second-instance", (event, commandLine, workingDirectory) => {
		if (!mainWindow) { return; }
	
		if (mainWindow.isMinimized()) { mainWindow.restore(); }
		mainWindow.focus();
	
		let baseURI = `file://${workingDirectory}/`;
		mainWindow.webContents.send("open", commandLine.slice(2), baseURI);
	});
} else {
	app.quit();
}
