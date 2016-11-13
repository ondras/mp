import * as player from "player.js";
import * as playlist from "playlist.js";
import * as platform from "platform.js";
import * as command from "util/command.js";
import * as pubsub from "util/pubsub.js";

const document = window.document;
const dom = document.querySelector("#controls");

const repeatModes = [
	{value:"N", title:"Repeat playlist"},
	{value:"1", title:"Repeat song"},
	{value:"", title:"No repeat"}
];

const visualModes = [
	{value:"spectrum", label:"1", title:"Spectrum analyser"},
	{value:"psyco", label:"2", title:"Visual Player 2.0 for DOS"},
	{value:"", label:"", title:"No visuals"}
];

const settings = {
	repeat: 0,
	playlist: true,
	visual: 0
}

function setPlaylist(state) {
	let node = dom.querySelector("[data-command='settings:toggle-playlist']");

	settings.playlist = state;
	node.classList.toggle("on", state);
	node.title = state ? "Playlist visible" : "Playlist hidden";
	playlist.setVisibility(state);
}

function setRepeat(index) {
	let node = dom.querySelector("[data-command='settings:toggle-repeat']");

	settings.repeat = index;
	let str = repeatModes[index].value;

	node.classList.toggle("on", str != "");
	node.querySelector("sub").innerHTML = str;
	node.title = repeatModes[index].title;

	playlist.setRepeat(str);
	
}

function setVisual(index) {
	let node = dom.querySelector("[data-command='settings:toggle-visual']");

	settings.visual = index;
	let str = visualModes[index].value;

	node.classList.toggle("on", str != "");
	node.querySelector("sub").innerHTML = visualModes[index].label;
	node.title = visualModes[index].title;
	
	player.setVisual(str);
}

command.register("settings:toggle-repeat", null, () => {
	setRepeat((settings.repeat + 1) % repeatModes.length);
});

command.register("settings:toggle-visual", null, () => {
	setVisual((settings.visual + 1) % visualModes.length);
});

command.register("settings:toggle-playlist", null, () => {
	setPlaylist(!settings.playlist);
});

platform.globalShortcut("MediaPreviousTrack", () => command.execute("playlist:prev"));
platform.globalShortcut("MediaNextTrack", () => command.execute("playlist:next"));
platform.globalShortcut("MediaPlayPause", () => command.execute("player:toggle"));

setRepeat(0);
setPlaylist(true);
setVisual(0);
