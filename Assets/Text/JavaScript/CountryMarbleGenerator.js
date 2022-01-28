/**
 * Creates country marbles
 * Uses https://restcountries.com/ for getting the list of countries (for a given region) 
 * and https://github.com/HatScripts/circle-flags to get the SVG for each country flag.
 */
class CountryMarbleGenerator {

	// Define some Property Descriptors (PD) for our properties
	// These descriptors are mainly used by the UI to better present to the user the available
	// options of this script.

	static PD_region = {
		path: "region",
		editor: "Select",
		selectOptions: [
			{ value: "africa", label: "Africa" },
			{ value: "americas", label: "Americas" },
			{ value: "asia", label: "Asia" },
			{ value: "europe", label: "Europe" },
			{ value: "oceania", label: "Oceania" },
		],
		defaultValue: "europe",
	};
	static PD_marbleRadius = { path: "marbleRadius", defaultValue: 0.25, min: 0.05 };
	static PD_marbleFriction = { path: "marbleFriction", defaultValue: 0.1, min: 0, max: 1, step: 0.01 };
	static PD_marbleRestitution = { path: "marbleRestitution", defaultValue: 0.6, min: 0, max: 1, step: 0.01 };

	/**
	 * Creates a CountryMarbleGenerator.
	 * 
	 * All parameters are optional.
	 * The main reason for having constructor parameters in the first place is to allow us to easily
	 * test the script directly from the console.
	 * 
	 * @param {*} region The region for which country marbles will be created (defaults to "europe")
	 * @param {*} marbleRadius The radius of each marble (defaults to 0.25)
	 * @param {*} marbleFriction The friction of each marble (defaults to 0.1)
	 * @param {*} marbleRestitution The restitution of each marble (defaults to 0.6)
	 */
	constructor(region, marbleRadius, marbleFriction, marbleRestitution) {
		this.region = region || CountryMarbleGenerator.PD_region.defaultValue;
		this.marbleRadius = marbleRadius || CountryMarbleGenerator.PD_marbleRadius.defaultValue;
		this.marbleFriction = marbleFriction || CountryMarbleGenerator.PD_marbleFriction.defaultValue;
		this.marbleRestitution = marbleRestitution || CountryMarbleGenerator.PD_marbleRestitution.defaultValue;
	}

	/**
	 * This is the main "entry point" of our script.
	 * When this script is drag'n'dropped onto the editor, this method will be automatically called with the current
	 * scene and the drop position.
	 * @param {*} scene 
	 * @param {*} position 
	 */
	async create(scene, position) {

		position = position || { x: 0, y: 0 };

		// Fetch country data
		const response = await fetch("https://restcountries.com/v3.1/region/" + this.region);
		const countries = await response.json();

		// Define some helper variables
		const n = countries.length;
		const r = this.marbleRadius;
		const diam = 2 * r;

		const gridSize = Math.ceil(Math.sqrt(n));
		const columns = gridSize;
		const rows = Math.ceil(n / gridSize);
		const W = columns * diam;
		const H = rows * diam;

		const startX = position.x - W / 2 + diam / 2;
		const startY = position.y - H / 2 + diam / 2;
		const endX = position.x + W / 2 - diam / 2;
		const endY = position.y + H / 2 - diam / 2;

		// Create our country marbles in a nested for loop
		let index = 0;
		for (let y = startY; y <= endY; y += diam) {
			for (let x = startX; x <= endX; x += diam) {
				if (index < n) {
					const marble = await this.createCountryMarble(countries[index], x, y, r);
					scene.addChild(marble);
					index++;
				}
			}
		}
	}

	async createCountryMarble(country, x, y, r) {
		const flagUrl = "https://hatscripts.github.io/circle-flags/flags/" + country.cca2.toLocaleLowerCase() + ".svg";
		await physion.utils.preloadTexture(flagUrl);

		const marble = new physion.CircleNode(r);
		marble.initNode(x, y);
		marble.name = country.name.common;
		marble.friction = this.marbleFriction;
		marble.restitution = this.marbleRestitution;
		marble.drawLine = false;
		marble.lineWidth = 0;
		marble.fillTextureUrl = flagUrl;
		marble.autoAdjustFillTexture();
		return marble;
	}
}
