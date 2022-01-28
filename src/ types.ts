export type AssetMimeType =
	"image/jpeg" |
	"image/png" |
	"image/webp" |
	"image/svg+xml" |
	"text/plain" |
	"text/javascript" |
	"text/csv" |
	"text/html";

export interface IAsset {
	path: string,
	mime: AssetMimeType,
	tags?: string[],
}
