import Spectrum from "vis/spectrum.js";
import Psyco from "vis/psyco.js";
import * as command from "util/command.js";
import * as settings from "settings.js";
import * as pubsub from "util/pubsub.js";

export const audio = new window.Audio();
const ctx = new window.AudioContext();
const source = ctx.createMediaElementSource(audio);
source.connect(ctx.destination);

const visuals = {
	spectrum: new Spectrum(ctx),
	psyco: new Psyco(ctx)
}
let currentVisual = null;

command.register("player:play", null, () => audio.play());
command.register("player:pause", null, () => audio.pause());
command.register("player:toggle", "space", () => {
	audio.paused ? audio.play() : audio.pause();
});
command.disable("player:");

export function play(url) {
	command.disable("player:");
	audio.src = url.href;
	audio.play();
}

function syncVisual() {
	let name = settings.get("visual");

	let parent = document.querySelector(".analyser"); // FIXME
	parent.innerHTML = "";

	if (currentVisual) {
		currentVisual.stop();
		let oldAudioNode = currentVisual.getAudioNode();
		source.disconnect(oldAudioNode);
		oldAudioNode.disconnect(ctx.destination);
	} else {
		source.disconnect(ctx.destination);
	}
	
	currentVisual = visuals[name] || null;
	
	if (currentVisual) {
		let audioNode = currentVisual.getAudioNode();
		audioNode.connect(ctx.destination);
		source.connect(audioNode);
		parent.appendChild(currentVisual.getNode());
		currentVisual.start();
	} else {
		source.connect(ctx.destination);
	}
}

function handleEvent(e) {
	console.log(`[e] ${e.type}`);

	switch (e.type) {
		case "loadedmetadata":
			command.enable("player:toggle");
		break;

		case "playing":
			command.disable("player:play");
			command.enable("player:pause");
			currentVisual && currentVisual.start();
		break;

		case "pause":
			command.disable("player:pause");
			command.enable("player:play");
			currentVisual && currentVisual.stop();
		break;
	}
}

let handler = {handleEvent};
audio.addEventListener("ended", handler);
audio.addEventListener("error", handler);
audio.addEventListener("loadedmetadata", handler);
audio.addEventListener("playing", handler);
audio.addEventListener("pause", handler);

function onSettingsChange(message, publisher, data) {
	if (data != "visual") { return; }
	syncVisual();
}

pubsub.subscribe("settings-change", onSettingsChange);

syncVisual();
