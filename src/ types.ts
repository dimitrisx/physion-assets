export type AssetMimeType =
	"image/jpeg" |
	"image/png" |
	"image/webp" |
	"image/svg+xml" |
	"text/plain" |
	"text/javascript" |
	"text/csv" |
	"text/html" |
	"audio/mpeg" |
	"audio/wav" |
	"font/otf" |
	"font/ttf" |
	"font/woff" |
	"font/woff2";

export interface IAsset {
	path: string,
	mime: AssetMimeType,
	tags?: string[],
}
