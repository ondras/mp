export function accepts(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	return (data.getString(arrayBuffer.byteLength-128, 3) == "TAG");
}

export function decode(arrayBuffer) {
	let data = new DataView(arrayBuffer, arrayBuffer.byteLength-125);

	let encoding = "windows-1252";
	let offset = 0;
	let result = {};
	["title", "artist", "album"].forEach(name => {
		let str = data.getString(offset, 30, encoding);
		offset += 30;
		if (str) { result[name] = str; }
	});

	return result;
}
