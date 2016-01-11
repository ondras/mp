"use strict";

var pkg = null;
var win = null;

var xhr = new XMLHttpRequest();
xhr.open("get", "package.json", true);
xhr.send();
xhr.addEventListener("load", function (e) {
	pkg = JSON.parse(e.target.responseText);
});

function openPlayer(argv) {
	var features = {
		width: pkg.window.width,
		height: pkg.window.height
	};

	features = Object.keys(features).map(function (key) {
		return key + "=" + features[key];
	}).join(",");

	var search = argv.map(encodeURIComponent).join("&");
	var url = pkg.main + "?" + search;
	win = window.open(url, "_blank", features);
}

function sendMessage(argv) {
	var data = {
		command: "control",
		argv: argv
	};
	win.postMessage(data, "*");
}

function getArgv() {
	var argv = [];

	if (document.querySelector("#type-url").checked) {
		var value = document.querySelector("#input-url").value;
		if (value) {
			argv.push(value);
		}
	}

	if (document.querySelector("#type-file").checked) {
		var input = document.querySelector("#input-file");
		argv = Array.from(input.files).map(function (f) {
			return URL.createObjectURL(f);
		});
	}

	return argv;
}

document.querySelector("button").addEventListener("click", function (e) {
	var argv = getArgv();

	if (!argv.length) {
		alert("You need to pick something to play.");
		return;
	}

	if (win && !win.closed) {
		sendMessage(argv);
	} else {
		openPlayer(argv);
	}
});

setInterval(function () {
	document.querySelector("button").innerHTML = win && !win.closed ? "Update the playlist!" : "Launch the player!";
}, 100);

if (!window.AudioContext) {
	alert("This browser does not support AudioContext, so the app is not going to work at all.");
}

