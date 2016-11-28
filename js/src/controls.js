import * as platform from "platform.js";
import * as command from "util/command.js";
import * as pubsub from "util/pubsub.js";
import * as settings from "settings.js";

const document = window.document;
const dom = document.querySelector("#controls");

const repeatTitles = {
	"N": "Repeat playlist",
	"1": "Repeat song",
	"": "No repeat"
};

const visualTitles = {
	"spectrum": "Spectrum analyser", 
	"psyco": "Visual Player 2.0 for DOS",
	"": "No visuals"
}

const visualSubs = {
	"spectrum": "1", 
	"psyco": "2",
	"": ""
}

function sync(message, publisher, data) {
	let node;

	let repeat = settings.get("repeat");
	node = dom.querySelector("[data-command='settings:toggle-repeat']");
	node.classList.toggle("on", repeat != "");
	node.querySelector("sub").innerHTML = repeat;
	node.title = repeatTitles[repeat];

	let playlist = settings.get("playlist");
	node = dom.querySelector("[data-command='settings:toggle-playlist']");
	node.classList.toggle("on", playlist);
	node.title = (playlist ? "Playlist visible" : "Playlist hidden");

	let visual = settings.get("visual");
	node = dom.querySelector("[data-command='settings:toggle-visual']");
	node.classList.toggle("on", visual != "");
	node.querySelector("sub").innerHTML = visualSubs[visual];
	node.title = visualTitles[visual];
}

pubsub.subscribe("settings-change", sync);

platform.globalShortcut("MediaPreviousTrack", () => command.execute("playlist:prev"));
platform.globalShortcut("MediaNextTrack", () => command.execute("playlist:next"));
platform.globalShortcut("MediaPlayPause", () => command.execute("player:toggle"));

sync();