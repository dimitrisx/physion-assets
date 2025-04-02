/**
 * A terrain generator that uses Perlin noise-like algorithms to generate a smooth terrain.
 */
class TerrainGenerator {

	// Define some Property Descriptors (PD) for our properties
	// These descriptors are mainly used by the UI to better present to the user the available
	// options of this script.

	static PD_width = { path: "width", defaultValue: 320, min: 10, step: 10 };
	static PD_segments = { path: "segments", defaultValue: 160, min: 2, step: 10 };
	static PD_amplitude = { path: "amplitude", defaultValue: 5, min: 0, step: 1 };
	static PD_frequency = { path: "frequency", defaultValue: 0.05, min: 0.01, max: 1, step: 0.01 };
	static PD_octaves = { path: "octaves", defaultValue: 3, min: 1, max: 8, step: 1 };
	static PD_persistence = { path: "persistence", defaultValue: 0.5, min: 0, max: 0.8, step: 0.1 };

	constructor(width, segments, amplitude, frequency, octaves, persistence) {
		this.width = width !== undefined ? width : 320;
		this.segments = segments !== undefined ? segments : 160;
		this.amplitude = amplitude !== undefined ? amplitude: 5;
		this.frequency = frequency !== undefined ? frequency : 0.05;
		this.octaves = octaves !== undefined ? octaves : 3;
		this.persistence = persistence !== undefined ? persistence: 0.5

		this._seed = Math.floor(Math.random() * 1000);
	}

	create(scene, position) {
		position = position || { x: 0, y: 0 };

		const points = this.generateTerrain();

		// To make a closed shape, add points at the bottom.
		points.push({ x: this.width, y: 0 });
		points.push({ x: 0, y: 0 });

		const res = physion.utils.PolygonHelper.processPolygon(points, { clean: true });

		// Use PolygonNode to create the terrain
		const terrain = new physion.PolygonNode([res.polygon]);
		terrain.setPosition(position);
		terrain.bodyType = "static";
		terrain.fillColor = 0xADAD99;
		terrain.friction = 0.5;
		scene.addChild(terrain);
	}

	// Random function with seed
	random(x) {
		const y = Math.sin(this._seed + x) * 10000;
		return y - Math.floor(y);
	}

	// Smooth interpolation (cosine)
	cosineInterpolation(a, b, t) {
		const ft = t * Math.PI;
		const f = (1 - Math.cos(ft)) * 0.5;
		return a * (1 - f) + b * f;
	}

	// Noise function
	noise(x) {
		const intX = Math.floor(x);
		const fracX = x - intX;

		const v1 = this.random(intX);
		const v2 = this.random(intX + 1);

		return this.cosineInterpolation(v1, v2, fracX);
	}

	// Perlin noise-like function for smoother terrain
	perlinNoise(x) {
		let total = 0;
		let frequency = this.frequency;
		let amplitude = this.amplitude;

		for (let i = 0; i < this.octaves; i++) {
			total += this.noise(x * frequency) * amplitude;
			amplitude *= this.persistence;
			frequency *= 2;
		}

		return total;
	}

	// Generate a terrain as an array of points
	generateTerrain() {
		const points = [];
		const stepSize = this.width / this.segments;

		for (let i = 0; i <= this.segments; i++) {
			const x = i * stepSize;
			const baselineHeight = 0;
			const y = baselineHeight + this.perlinNoise(i);
			points.push({ x, y });
		}

		return points;
	}
}
