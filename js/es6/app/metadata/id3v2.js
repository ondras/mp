export function accepts(arrayBuffer) {
	let data = new DataView(arrayBuffer);
	return (data.getString(0, 3) == "ID3");
}

export function decode(arrayBuffer) {
	let headerLength = 10;
	let header = new DataView(arrayBuffer, 0, headerLength + 4); // space for extended header length
	let version = header.getUint8(3);
	let length = header.getUint32ss(6);

	let mask = header.getUint8(5);
	if (mask & 0x40) {
		let extendedLength = header.getUint32(headerLength);
		headerLength += extendedLength;
		length -= extendedLength;		
	}

	let data = new DataView(arrayBuffer, headerLength, length);
	return parse(data, version);
}

function getEncoding(byte) {
	switch (byte) {		
		case 0: return "iso-8859-1"; break;
		
		case 1:
		case 2: return "utf-16"; break;
		
		case 3:
		default: return "utf-8"; break;
	}
 }

function getStringArray(data) {
	let encoding = getEncoding(data.getUint8(0));
	return data.getString(1, data.byteLength-1, encoding)
			.replace(/\x00+$/, "")
			.split(/\x00/);
}

function getPicture(data) {
	let offset = 0;
	
	let encoding = getEncoding(data.getUint8(offset++));
	
	let mime = "";
	while (1) {
		let byte = data.getUint8(offset++);
		if (byte) {
			mime += String.fromCharCode(byte);
		} else {
			break;
		}
	}
	
	let type = data.getUint8(offset++);
	if (type != 3) { return null; } // 3 == front cover

	while (1) { // description
		let byte = data.getUint8(offset++);
		if (!byte) { break; }
	}
	
	if (encoding == "utf-16") { offset += 1; }

	let start = data.byteOffset + offset;
	let end = data.byteOffset + data.byteLength;
	return {
		type: mime,
		data: data.buffer.slice(start, end)
	}
}

function removeUnsync(data) {
	let readIndex = 0, writeIndex = 0;
	while (readIndex < data.byteLength-1) {
		if (readIndex != writeIndex) {
			data.setUint8(writeIndex, data.getUint8(readIndex));
		}
		readIndex++;
		writeIndex++;
		if (data.getUint8(readIndex-1) == 0xFF && data.getUint8(readIndex) == 0) { readIndex++; }
	}
	if (readIndex < data.byteLength) {
		data.setUint8(writeIndex++, data.getUint8(readIndex++));
	}
	return data.slice(0, writeIndex);
}

function parse(data, version) {
	let result = {};

	let offset = 0;
	while (offset < data.byteLength) {
		let id = data.getString(offset, 4);
		if (!id.charAt(0).match(/[A-Z]/)) { break; }

		let flags = data.getUint8(offset+9);
		let size = (version == 4 ? data.getUint32ss(offset+4) : data.getUint32(offset+4));
		
		offset += 10;
		let value = data.slice(offset, offset + size);

		
		if (flags & 3) { // unsynchronization
			value = removeUnsync(value);
		}
		
		if (flags & 1) { // "data length indicator"
			value = value.slice(4);
		}

		switch (id) {
			case "APIC": // picture
				let pic = getPicture(value);
				if (pic) { result.cover = pic; window.pic = pic;}
			break;
			case "TALB": // album
				result.album = getStringArray(value);
			break;
			case "TIT2": // title
				result.title = getStringArray(value);
			break;
			case "TPE1": // artist
				result.artist = getStringArray(value);
			break;
			case "TPE2": // album artist
				result.albumartist = getStringArray(value);
			break;

		}

		offset += size;
	}
	return result;
}
