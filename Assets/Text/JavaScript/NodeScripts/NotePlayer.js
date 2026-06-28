/**
 * Plays a musical note whenever another object touches this node, turning the scene into an
 * instrument.
 *
 * If the colliding object has a `userData.note` value (a frequency in hertz, e.g. 440, or
 * pitch-octave notation, e.g. "D#2"), that note is played instead of the default. This lets
 * different objects sound different notes when they hit the same node.
 *
 * Parameters:
 * - synthPreset: The instrument sound used for playback. (default: Kalimba)
 * - note: The fallback note to play when the colliding object doesn't specify its own.
 *   (default: C4)
 * - duration: How long the note plays, either as a tempo-relative musical value (e.g. "8n",
 *   "16n") or a number of seconds. (default: 16n)
 */
class NotePlayer {

	static PD_synthPreset = {
		path: "synthPreset",
		defaultValue: "Kalimba",
		editor: "Select",
		selectOptions: [
			{ value: "Sawtooth", label: "Sawtooth" },
			{ value: "ElectricHarpsicord", label: "Electric Harpsicord" },
			{ value: "Marimba", label: "Marimba" },
			{ value: "DigitalChime", label: "Digital Chime" },
			{ value: "Cello", label: "Cello" },
			{ value: "Kalimba", label: "Kalimba" },
			{ value: "Thinsaws", label: "Thinsaws" },
			{ value: "Pluck", label: "Pluck" },
			{ value: "Bah", label: "Bah" },
			{ value: "BassGuitar", label: "Bass Guitar" },
			{ value: "BrassCircuit", label: "Brass Circuit" },
			{ value: "Pianoetta", label: "Pianoetta" },
		],
	};
	static PD_note = {
		path: "note",
		defaultValue: "C4",
		editor: "Select",
		selectOptions: (() => {
			const pitches = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
			const options = [];
			for (let octave = 2; octave <= 5; octave++) { // 4 octaves
				for (const pitch of pitches) {
					const value = `${pitch}${octave}`;
					options.push({ value, label: value });
				}
			}
			return options;
		})(),
	};
	static PD_duration = {
		path: "duration",
		defaultValue: "16n",
		editor: "Select",
		selectOptions: [
			{ value: "2n", label: "Half (2n)" },
			{ value: "4n", label: "Quarter (4n)" },
			{ value: "8n", label: "Eighth (8n)" },
			{ value: "16n", label: "Sixteenth (16n)" },
			{ value: "32n", label: "Thirty-second (32n)" },
			{ value: "64n", label: "Sixty-fourth (64n)" },
		],
	};

	constructor(node) {
		this.node = node;
		this._synthPreset = NotePlayer.PD_synthPreset.defaultValue;
		this.note = NotePlayer.PD_note.defaultValue;
		this.duration = NotePlayer.PD_duration.defaultValue;
		this.synth = null;

		this.initialize();
	}

	get synthPreset() { return this._synthPreset; }
	set synthPreset(v) {
		if (JSON.stringify(this._synthPreset) !== JSON.stringify(v)) {
			this._synthPreset = v;
			this.initialize();
		}
	}

	async initialize() {
		this.synth = await physion.utils.createSynth(this._synthPreset);
	}

	onBeginContact(bodyNode, contact) {
		if (this.synth && contact.IsTouching()) {
			const note = bodyNode.userData.note || this.note;
			this.synth.triggerAttackRelease(note, this.duration);
		}
	}
}