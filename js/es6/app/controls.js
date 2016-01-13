import * as player from "player.js";
import * as playlist from "playlist.js";
import * as platform from "platform.js";
import * as command from "util/command.js";

const document = window.document;

const repeatModes = ["N", "1", ""];
const repeatTitles = ["Repeat playlist", "Repeat song", "No repeat"];

const visualModes = ["spectrum", "psyco", ""];
const visualLabels = ["1", "2", ""];
const visualTitles = ["Spectrum analyser", "Visual Player 2.0 for DOS", "No visuals"];

let settings = {
	repeat: 0,
	playlist: true,
	visual: 0
}

let dom = {
	node: document.querySelector("#controls")
};
["prev", "next", "play", "pause", "repeat", "playlist", "visual"].forEach(name => {
	dom[name] = dom.node.querySelector(`.${name}`);
});

command.register("playpause", "space", () => {
	player.audio.paused ? player.audio.play() : player.audio.pause();
});

function setState(state) {
	dom.node.className = state;
}

function setPlaylist(state) {
	settings.playlist = state;
	dom.playlist.classList.toggle("on", state);
	dom.playlist.title = state ? "Playlist visible" : "Playlist hidden";
	playlist.setVisibility(state);
}

function setRepeat(index) {
	settings.repeat = index;
	let str = repeatModes[index];

	dom.repeat.classList.toggle("on", str != "");
	dom.repeat.querySelector("sub").innerHTML = str;
	playlist.setRepeat(str);
	
	dom.repeat.title = repeatTitles[index];
}

function setVisual(index) {
	settings.visual = index;
	let str = visualModes[index];

	dom.visual.classList.toggle("on", str != "");
	player.setVisual(str);
	dom.visual.querySelector("sub").innerHTML = visualLabels[index];
	
	dom.visual.title = visualTitles[index];
}

function sync() {
	dom.prev.disabled = !playlist.isEnabled("prev");
	dom.next.disabled = !playlist.isEnabled("next");
}

dom.prev.addEventListener("click", e => playlist.prev());
dom.next.addEventListener("click", e => playlist.next());
dom.pause.addEventListener("click", e => player.audio.pause());
dom.play.addEventListener("click", e => player.audio.play());

dom.repeat.addEventListener("click", e => {
	setRepeat((settings.repeat + 1) % repeatModes.length);
});

dom.visual.addEventListener("click", e => {
	setVisual((settings.visual + 1) % visualModes.length);
});

dom.playlist.addEventListener("click", e => {
	setPlaylist(!settings.playlist);
});

player.audio.addEventListener("playing", e => {
	setState("playing");
	sync();
});

player.audio.addEventListener("pause", e => {
	setState("paused");
});

platform.globalShortcut("MediaPreviousTrack", () => playlist.prev());
platform.globalShortcut("MediaNextTrack", () => playlist.next());
platform.globalShortcut("MediaPlayPause", () => player.audio.paused ? player.audio.play() : player.audio.pause());

setState("paused");
setRepeat(0);
setPlaylist(true);
setVisual(0);
