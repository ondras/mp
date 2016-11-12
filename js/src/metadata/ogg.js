export function accepts(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	return (data.getString(0, 4) == "OggS");
}

export function decode(arrayBuffer) {
	let data = new DataView(arrayBuffer);

	let page = readPage(data, 0);
	if (!page) { return null; }

	let comments = readPage(data, page.size, true);
	if (!comments) { return null; }

	return readComments(comments.data);
}

function readPage(data, offset, getData) {
	let page = {
		size: 0,
		data: null
	}

	let pageSegments = data.getUint8(offset + 26);
	if (!pageSegments) { return null; }
	let headerSize = 27 + pageSegments;

	page.size = headerSize;
	for (let i=0; i<pageSegments; i++) { page.size += data.getUint8(offset + 27 + i); }

	if (getData) {
		let length = headerSize + 1 + "vorbis".length;
		page.data = new DataView(data.buffer, data.byteOffset + offset + length, page.size - length);
	}

	return page;
}

function readComments(comments) {
	var result = {};

	let vendorLength = comments.getUint32(0, true);
	let commentListLength = comments.getUint32(4 + vendorLength, true);
	let offset = 8 + vendorLength;

	for (let i=0; i<commentListLength; i++) {
		let len = comments.getUint32(offset, true);
		let str = comments.getString(offset+4, len);

		let index = str.indexOf('=');
		let key = str.substring(0, index).toLowerCase();
		result[key] = str.substring(index+1);
		offset += 4 + len;
		
		if (offset >= comments.byteLength) { break; }
	}

	return result;
}
