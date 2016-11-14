let pkg = null;
let win = null;

let xhr = new XMLHttpRequest();
xhr.open("get", "package.json", true);
xhr.send();
xhr.addEventListener("load", e => {
	pkg = JSON.parse(e.target.responseText);
});

function openPlayer(argv) {
	let features = {
		width: pkg.window.width,
		height: pkg.window.height
	}
	
	features = Object.keys(features)
		.map(key => `${key}=${features[key]}`)
		.join(",");
	
	let search = argv.map(encodeURIComponent).join("&");
	let url = `${pkg.main}?${search}`;
	win = window.open(url, "_blank", features);
}

function sendMessage(argv) {
	let data = {
		command: "control",
		argv
	};
	win.postMessage(data, "*");
}	

function getArgv() {
	if (document.querySelector("#type-url").checked) {
		let value = document.querySelector("#input-url").value;
		if (value) { return [value]; }
	}
	
	if (document.querySelector("#type-file").checked) {
		let input = document.querySelector("#input-file");
		return Array.from(input.files).map(f => URL.createObjectURL(f));
	}
	return [];
}

document.querySelector("button").addEventListener("click", e => {
	let argv = getArgv();

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

setInterval(() => {
	document.querySelector("button").innerHTML = win && !win.closed ? "Update the playlist!" : "Launch the player!";
}, 100);

if (!window.AudioContext) {
	alert("This browser does not support AudioContext, so the app is not going to work at all.")
}
