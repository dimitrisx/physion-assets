/**
 * NotePlayer is a NodeScript component that plays a musical note when another object 
 * collides with it. 
 * 
 * Behavior:
 * - When another object begins contact with this node, a musical note is triggered.
 * - The note is read from the colliding object's `userData.note` property, if defined.
 *   - The note can be given as a frequency in hertz (e.g., 440) or as pitch-octave notation (e.g., "D#2").
 *   - If not provided, a default note ("C4") is used instead.
 * - The duration the note plays is determined by the duration property, which can be:
 *   - A value in seconds (e.g., "0.5")
 *   - A tempo-relative musical value (e.g., "8n", "16n")
 * 
 * Configuration:
 * - synthPreset: Defines the sound used for playback. Defaults to "Kalimba".
 *   Available presets include:
 *     Sawtooth, ElectricHarpsicord, Marimba, DigitalChime, Cello, Kalimba,
 *     Thinsaws, Pluck, Bah, BassGuitar, BrassCircuit, Pianoetta
 * - note: The fallback note to play if the other object doesn't specify one.
 * - duration: The amount of time the note is played.
 * 
 */
class NotePlayer {

	constructor(node) {
		this.node = node;
		this.initialized = false;
		this.synthPreset = "Kalimba";
		this.note = "C4";
		this.duration = "16n";
	}

	async initialize() {
		this.synth = await physion.utils.createSynth(this.synthPreset);
	}

	update(delta) {
		if (!this.initialized) {
			this.initialize();
			this.initialized = true;
		}
	}

	onBeginContact(bodyNode, contact) {
		if (this.synth && contact.IsTouching()) {
			const note = bodyNode.userData.note || this.note;
			this.synth.triggerAttackRelease(note, this.duration);
		}
	}
}