import * as player from "player.js";
import * as playlist from "playlist.js";
import * as platform from "platform.js";
import * as command from "util/command.js";
import * as pubsub from "util/pubsub.js";

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
	dom.prev.disabled = !command.isEnabled("playlist:prev");
	dom.next.disabled = !command.isEnabled("playlist:next");
	dom.node.className = command.isEnabled("player:play") ? "paused" : "playing";
}

dom.prev.addEventListener("click", e => command.execute("playlist:prev"));
dom.next.addEventListener("click", e => command.execute("playlist:next"));
dom.pause.addEventListener("click", e => command.execute("player:pause"));
dom.play.addEventListener("click", e => command.execute("player:play"));

dom.repeat.addEventListener("click", e => {
	setRepeat((settings.repeat + 1) % repeatModes.length);
});

dom.visual.addEventListener("click", e => {
	setVisual((settings.visual + 1) % visualModes.length);
});

dom.playlist.addEventListener("click", e => {
	setPlaylist(!settings.playlist);
});

platform.globalShortcut("MediaPreviousTrack", () => command.execute("playlist:prev"));
platform.globalShortcut("MediaNextTrack", () => command.execute("playlist:next"));
platform.globalShortcut("MediaPlayPause", () => command.execute("player:toggle"));

pubsub.subscribe("command-enable", sync);
pubsub.subscribe("command-disable", sync);

sync();
setRepeat(0);
setPlaylist(true);
setVisual(0);
