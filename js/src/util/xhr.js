export default function xhr(url) {
	let r = new window.XMLHttpRequest();
	r.responseType = "arraybuffer";
	r.open("get", url, true);
	r.send();

	return new Promise((resolve, reject) => {
		r.addEventListener("load", e => resolve(e.target));
		r.addEventListener("error", reject);
	});	
}
