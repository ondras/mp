const containers = ["moov", "udta", "meta", "ilst", "trak", "mdia"];

export function accepts(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	let str = data.getString(4, 8);
	return (str == "ftypM4A " || str == "ftypmp42");
}

export function decode(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	let offset = 0;

	while (offset < arrayBuffer.byteLength) {
		let size = data.getUint32(offset);
		let name = data.getString(offset+4, 4, "ascii");

		if (name == "ilst") {
			let view = new DataView(arrayBuffer, offset+8, size-8);
			return processIlstAtom(view);
		}

		if (containers.indexOf(name) > -1) {
			offset += 8;
			if (name == "meta") { offset += 4; }
		} else {
			offset += size;
		}
	}
}

function processIlstAtom(data) {
	let result = {};

	let offset = 0;
	while (offset < data.byteLength) {
		let size = data.getUint32(offset);
		let name = data.getString(offset+4, 4, "ascii");

		switch (name.toLowerCase()) {
			case "©alb":
				result.album = processDataAtom(data, offset+8); 
			break;

			case "©art":
				result.artist = processDataAtom(data, offset+8); 
			break;

			case "©nam":
				result.title = processDataAtom(data, offset+8);
			break;

			case "aart":
				result.albumartist = processDataAtom(data, offset+8);
			break;

			case "covr":
				result.cover = processDataAtom(data, offset+8);
			break;
		}
		offset += size;
	}

	return result;
}

function processDataAtom(data, offset) {
	let size = data.getUint32(offset);
	let name = data.getString(offset+4, 4, "ascii");

	let type = data.getUint32(offset + 8);

	offset += 16;
	size -= 16;

	switch (type) {
		case 1: // text
			return data.getString(offset, size);
		break;
		
		case 13: // jpeg
		case 14: // png
			let types = {13:"jpeg", 14:"png"};
			return {
				type: `image/${types[type]}`,
				data: data.buffer.slice(data.byteOffset + offset, data.byteOffset + offset + size) 
			}
		break;
	}
}
