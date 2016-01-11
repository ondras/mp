"use strict";

var app = require("app");
var BrowserWindow = require("browser-window");
var pkg = require("./package.json");
var mainWindow = null;

var shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
	if (!mainWindow) {
		return;
	}

	if (mainWindow.isMinimized()) {
		mainWindow.restore();
	}
	mainWindow.focus();

	var baseURI = "file://" + workingDirectory + "/";
	mainWindow.webContents.send("open", commandLine.slice(2), baseURI);
});

if (shouldQuit) {
	app.quit();
} else {
	app.on("window-all-closed", function () {
		if (process.platform != "darwin") {
			app.quit();
		}
	});

	app.on("ready", function () {
		var options = {
			width: pkg.window.width,
			height: pkg.window.height,
			icon: __dirname + "/icon.png"
		};
		mainWindow = new BrowserWindow(options);
		mainWindow.setMenu(null);
		mainWindow.loadURL("file://" + __dirname + "/" + pkg.main);
	});
}

