import * as player from "player.js";
import * as albumart from "util/albumart.js";
import xhr from "util/xhr.js";
import Waveform from "waveform.js";
import metadata from "metadata/metadata.js";
const document = window.document;

let dom = {
	node: document.querySelector("#info")
};
["waveform", "current", "time-played", "time-remaining", "metadata"].forEach(name => {
	dom[name] = dom.node.querySelector(`.${name}`);
});

function leadingZero(num) {
	return (num > 9 ? "" : "0") + num;
}

function formatTime(sec) {
	let s = leadingZero(sec % 60);
	sec = Math.floor(sec / 60);
	let m = leadingZero(sec % 60);
	sec = Math.floor(sec / 60);
	let h = sec;
	
	let parts = [m, s];
	if (h) { parts.unshift(h); }
	return parts.join(":");
}

function showTime(current, duration) {
	let frac = duration ? current / duration : 0;
	dom.current.style.left = `${100*frac}%`;
	
	dom["time-played"].innerHTML = formatTime(Math.round(current));
	dom["time-remaining"].innerHTML = `&minus;${formatTime(Math.round(duration)-Math.round(current))}`;
}

function readFile(url) {
	return xhr(url).then(r => r.response);
}

function showText(title, subtitle) {
	let h1 = dom.metadata.querySelector("h1");
	let h2 = dom.metadata.querySelector("h2");

	h1.innerHTML = "";
	h1.appendChild(document.createTextNode(title));
	h1.title = title;

	h2.innerHTML = "";
	h2.appendChild(document.createTextNode(subtitle));
	h2.title = subtitle;
}

function showMetadata(metadata) {
	let title = metadata && metadata.title || decodeURI(player.audio.src).match(/[^\/]*$/);

	let subtitle = [];
	let artist = metadata && (metadata.artist || metadata.albumartist);
	if (artist) { subtitle.push(artist); }
	if (metadata && metadata.album) { subtitle.push(metadata.album); }
	subtitle = subtitle.join(" · ");

	showText(title, subtitle);
	
	albumart.show(metadata.cover, player.audio.src);
}

player.audio.addEventListener("timeupdate", function(e) {
	showTime(e.target.currentTime, e.target.duration);
});

player.audio.addEventListener("error", function(e) {
	albumart.clear();
	showText("[audio error]", e.message || "");
});

player.audio.addEventListener("loadedmetadata", function(e) {
	albumart.clear();

	showTime(0, 0);
	dom.waveform.innerHTML = "";

	readFile(e.target.src).then(data => {
		let m = metadata(data);
		showMetadata(m);

		var options = {
			width: dom.waveform.offsetWidth,
			height: dom.waveform.offsetHeight
		}
		var w = new Waveform(data, options);
		dom.waveform.appendChild(w.getNode());
	});
});

dom.node.addEventListener("click", e => {
	var rect = dom.node.getBoundingClientRect();
	var left = e.clientX - rect.left;
	var frac = left / rect.width;
	player.audio.currentTime = frac * player.audio.duration;
});
