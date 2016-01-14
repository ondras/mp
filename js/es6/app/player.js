import Spectrum from "vis/spectrum.js";
import Psyco from "vis/psyco.js";
import * as command from "util/command.js";

export const audio = new window.Audio();
const ctx = new window.AudioContext();
const source = ctx.createMediaElementSource(audio);
source.connect(ctx.destination);

const visuals = {
	spectrum: new Spectrum(ctx),
	psyco: new Psyco(ctx)
}

command.register("player:play", null, () => audio.play());
command.register("player:pause", null, () => audio.pause());
command.register("player:toggle", "space", () => {
	audio.paused ? audio.play() : audio.pause();
});

export function play(url) {
	command.disable("player:");
	audio.src = url.href;
	audio.play();
}

let visual = null;

export function setVisual(name) {
	let parent = document.querySelector(".analyser"); // FIXME
	parent.innerHTML = "";

	if (visual) {
		visual.stop();
		let oldAudioNode = visual.getAudioNode();
		source.disconnect(oldAudioNode);
		oldAudioNode.disconnect(ctx.destination);
	} else {
		source.disconnect(ctx.destination);
	}
	
	visual = visuals[name];
	
	if (visual) {
		let audioNode = visual.getAudioNode();
		audioNode.connect(ctx.destination);
		source.connect(audioNode);
		parent.appendChild(visual.getNode());
		visual.start();
	} else {
		source.connect(ctx.destination);
	}
}

audio.addEventListener("ended", e => {
	console.log("[e] ended");
});

audio.addEventListener("error", e => {
	console.log("[e] error", e);
});

audio.addEventListener("loadedmetadata", e => {
	console.log("[e] loaded metadata");
	command.enable("player:toggle");
});

audio.addEventListener("playing", e => {
	console.log("[e] playing");
	command.disable("player:play");
	command.enable("player:pause");
	visual && visual.start();
});

audio.addEventListener("pause", e => {
	console.log("[e] pause");
	command.disable("player:pause");
	command.enable("player:play");
	visual && visual.stop();
});
