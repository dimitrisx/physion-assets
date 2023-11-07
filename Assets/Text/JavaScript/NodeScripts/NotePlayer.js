/**
 * This NodeScript will play a note when another object collides with it.
 * The note that is going to be played is defined by the other object's `userData.note` property.
 * The note can either be a frequency in hertz (like 440) or as “pitch-octave” notation (like "D#2").
 * If the note property is not defined then nothing happens.
 * The duration property (defined in the constructor) can either be in seconds, or as a tempo-relative value.
 */
class NotePlayer {

	constructor(node) {
		this.node = node;
		this.initialized = false;
		this.duration = "16n";
	}

	async initialize() {
		const Tone = await physion.utils.importTone();
		this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
	}

	update(delta) {
		if (!this.initialized) {
			this.initialize();
			this.initialized = true;
		}
	}

	onBeginContact(bodyNode, contact) {
		if (this.synth && contact.IsTouching()) {
			const note = bodyNode.userData.note;
			if (note) {
				this.synth.triggerAttackRelease(note, this.duration);
			}
		}
	}
}