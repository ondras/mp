import xhr from "util/xhr.js";

const document = window.document;
const node = document.querySelector("#albumart");
const files = ["Cover.jpg", "cover.jpg", "Folder.jpg", "folder.jpg"];

function doShow(src) {
	node.style.backgroundImage = `url(${src})`;
}

function tryFile(url) {
	return xhr(url).then(r => {
		// for real http. file:// will reject the xhr instead
		if (r.status == 404) { throw new Error(); }
		return url;
	});
}

export function clear() {
	node.style.backgroundImage = "";
}

export function show(metadataCover, audioSrc) {
	if (metadataCover) {
		let mC = metadataCover;
		let src = URL.createObjectURL(new Blob([mC.data], {type:mC.type}));
		doShow(src);
		return;
	}
	
	let f = files.slice();
	let tryNext = () => {
		if (!f.length) { return; }
		try {
			let url = new window.URL(f.shift(), audioSrc);
			tryFile(url.href).then(doShow, tryNext);
		} catch (e) {
			tryNext();
		}
	}	
	tryNext();
}
