import * as fs from "fs";
import * as process from "process";
import { strict as assert } from "assert";

import * as types from "./ types";
import * as constants from "./constants";

// ================================================================================================
function updateIndex() {
	const assets: types.IAsset[] = [];
	processDirectory(constants.ASSETS_DIR, assets);

	const indexPath = constants.ASSETS_DIR + "/" + constants.INDEX_JSON;
	fs.writeFileSync(indexPath, JSON.stringify(assets, null, "\t"));
}

function processDirectory(dirPath: string, assets: types.IAsset[], metadata: any = {}) {

	// Check for directory metadata
	const dirName = dirPath.split("/").pop();
	const dirMetadataPath = `${dirPath}/_${dirName}.${constants.META_EXTENSION}`;
	if (fs.existsSync(dirMetadataPath)) {
		applyMetadata(metadata, dirMetadataPath);
	}

	const entries = fs.readdirSync(dirPath);
	const filteredEntries = entries.filter((e) => !e.endsWith(constants.META_EXTENSION) && !e.endsWith(constants.INDEX_JSON));
	for (const entry of filteredEntries) {
		const metadataCopy = Object.assign({}, metadata);
		const entryPath = `${dirPath}/${entry}`;
		const stat = fs.statSync(entryPath);
		if (stat.isDirectory()) {
			processDirectory(entryPath, assets, metadataCopy);
		} else {
			const asset = processFile(entryPath, metadataCopy);
			assets.push(asset);
		}
	}
}

function processFile(filePath: string, metadata: any): types.IAsset {
	const mimeType = getMimeType(filePath);
	assert(mimeType);

	return {
		path: filePath,
		mime: mimeType,
		tags: metadata.tags || undefined
	};
}

function applyMetadata(metadata: any, metadataPath: string) {
	const extraMetadata = JSON.parse(fs.readFileSync(metadataPath).toString());

	// Handle tags
	if (extraMetadata.tags) {
		if (metadata.tags === undefined) {
			metadata.tags = [...extraMetadata.tags];
		} else {
			metadata.tags = [...metadata.tags, ...extraMetadata.tags];
		}
		delete extraMetadata.tags;
	}

	Object.assign(metadata, extraMetadata);
}

function getMimeType(filePath: string) {
	const ext = filePath.split(".").pop();
	return ext ? constants.EXT_TO_MIME_TYPE[ext] : undefined;
}

// ================================================================================================
const args = process.argv.slice(2)
if (args.length !== 1) {
	console.log("Invalid syntax.");
	process.exit(-1);
} else {
	const command = args[0];
	switch (command) {
		case "updateIndex":
			updateIndex();
			break;
		default:
			console.log(`Invalid command ${command}`);
			process.exit(-1);
	}
}
