import { AssetMimeType } from "./ types";

export const ASSETS_DIR = "Assets";
export const INDEX_JSON = "index.json";
export const META_EXTENSION = "meta.json";

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types

export const EXT_TO_MIME_TYPE: Record<string, AssetMimeType> = {
	"webp": "image/webp",
	"png": "image/png",
	"js": "text/javascript",
};
