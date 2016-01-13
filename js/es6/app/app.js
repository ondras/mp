import * as platform from "platform.js";
import * as command from "util/command.js";
import xhr from "util/xhr.js";
import * as player from "player.js";
import * as playlist from "playlist.js";
import * as info from "info.js";
import * as controls from "controls.js";

command.register("devtools", "f12", () => {
	platform.showDevTools();
});

command.register("close", "esc", () => {
	window.close();
});

function isPlaylist(url) {
	return url.href.match(/\.m3u8?$/i);
}

function getPlaylist(url) {
	let encoding = url.href.match(/8$/) ? "utf-8" : "windows-1250";
	let decoder = new TextDecoder(encoding);

	return xhr(url.href).then(r => {
		let view = new DataView(r.response);
		let str = decoder.decode(view);
		let urls = str.split("\n")
			.map(row => row.replace(/#.*/, ""))
			.filter(row => row.match(/\S/))
			.map(s => new window.URL(s, url));
		return urls;
	});
}

function playFile(url) {
	if (isPlaylist(url)) {
		return getPlaylist(url).then(urls => Promise.all(urls.map(playFile)));
	} else {
		return playSong(url);
	}
}

function enqueueFile(url) {
	if (isPlaylist(url)) {
		return getPlaylist(url).then(urls => Promise.all(urls.map(enqueueFile)));
	} else {
		return enqueueSong(url);
	}
}

function playSong(url) {
	let promise = enqueueSong(url);
	if (!playlist.isEnabled("next")) { // only when first, FIXME detection stinks
		player.play(url);
	}
	return promise;
}

function enqueueSong(url) {
	playlist.add(url);
	return Promise.resolve();
}

function toURL(stuff, base) {
	return (stuff instanceof window.URL ? stuff : new window.URL(stuff, base));
}

function processCommand(command) {
	switch (command) {
		case "play": player.audio.play(); break;
		case "pause": player.audio.pause(); break;

		case "prev": playlist.prev(); break; 
		case "next": playlist.next(); break; 

		default: alert(`Unknown command '${command}'.`); break;
	}
}

function processArgs(args, baseURI) {
	let playlistCleared = false;
	let command = "p";
	
	args.forEach(arg => {
		if (arg.charAt(0) == "-") {
			command = arg.slice(1);
			return;
		}
		
		let url;
		switch (command) {
			case "p":
				url = toURL(arg, baseURI);
				if (!playlistCleared) {
					playlist.clear();
					playlistCleared = true;
					playFile(url);
				} else {
					enqueueFile(url);
				}
			break;
			
			case "q":
				url = toURL(arg, baseURI);
				enqueueFile(url);
			break;
			
			case "c":
				processCommand(arg);
			break;
			
			default:
				alert(`Unknown argument '${arg}' for command '${command}'.`);
			break;
		}
	});
}

platform.onOpen(processArgs);

if (platform.argv.length) {
	processArgs(platform.argv, platform.baseURI);
} else {
	alert("No arguments received, starting in dummy mode. Re-launch with more arguments or control a running instance to play something.");
}
