import Spectrum from "vis/spectrum.js";
import Psyco from "vis/psyco.js";

export const audio = new window.Audio();
const ctx = new window.AudioContext();
const source = ctx.createMediaElementSource(audio);
source.connect(ctx.destination);

const visuals = {
	spectrum: new Spectrum(ctx),
	psyco: new Psyco(ctx)
}

export function play(url) {
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
});

audio.addEventListener("playing", e => {
	console.log("[e] playing");
	visual && visual.start();
});

audio.addEventListener("pause", e => {
	console.log("[e] pause");
	visual && visual.stop();
});
