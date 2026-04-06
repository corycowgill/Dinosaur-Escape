window.DE = window.DE || {};

DE.Audio = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    musicInterval: null,
    musicPlaying: false,
    noteIndex: 0,

    // Pentatonic scale notes for fun jungle-ish music
    bassNotes: [65.41, 73.42, 82.41, 98.00, 110.00, 130.81, 146.83, 164.81],
    melodyNotes: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
    chordProg: [0, 0, 3, 3, 5, 5, 3, 3, 2, 2, 4, 4, 0, 0, 1, 1],

    init: function() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        var compressor = this.ctx.createDynamicsCompressor();
        compressor.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(compressor);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.25;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.6;
        this.sfxGain.connect(this.masterGain);
    },

    playNote: function(freq, duration, type, gainNode, volume, delay) {
        if (!this.ctx) return;
        var t = this.ctx.currentTime + (delay || 0);
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type || 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume || 0.15, t + 0.02);
        gain.gain.linearRampToValueAtTime(volume * 0.6 || 0.09, t + duration * 0.6);
        gain.gain.linearRampToValueAtTime(0, t + duration);
        osc.connect(gain);
        gain.connect(gainNode || this.musicGain);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    },

    startMusic: function() {
        if (this.musicPlaying) return;
        this.musicPlaying = true;
        this.noteIndex = 0;
        var self = this;

        this.musicInterval = setInterval(function() {
            if (!self.ctx) return;
            var ci = self.chordProg[self.noteIndex % self.chordProg.length];

            // Bass
            self.playNote(self.bassNotes[ci], 0.35, 'triangle', self.musicGain, 0.18);
            // Bass octave
            self.playNote(self.bassNotes[ci] * 0.5, 0.35, 'sine', self.musicGain, 0.12);

            // Melody - pick a note from pentatonic
            var melIdx = (ci + Math.floor(self.noteIndex / 2)) % self.melodyNotes.length;
            self.playNote(self.melodyNotes[melIdx], 0.2, 'square', self.musicGain, 0.06, 0);

            // Off-beat higher note
            if (self.noteIndex % 2 === 0) {
                var mel2 = (melIdx + 2) % self.melodyNotes.length;
                self.playNote(self.melodyNotes[mel2], 0.15, 'sine', self.musicGain, 0.05, 0.18);
            }

            // Percussion - noise-like clicks
            if (self.noteIndex % 4 === 0) {
                self.playNote(100, 0.05, 'sawtooth', self.musicGain, 0.1);
            }
            if (self.noteIndex % 2 === 1) {
                self.playNote(800, 0.03, 'square', self.musicGain, 0.04);
            }

            self.noteIndex++;
        }, 350);
    },

    stopMusic: function() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    },

    playSound: function(name) {
        if (!this.ctx) return;
        switch (name) {
            case 'place':
                this.playNote(440, 0.1, 'sine', this.sfxGain, 0.3);
                this.playNote(660, 0.1, 'sine', this.sfxGain, 0.2, 0.05);
                break;
            case 'hit':
                this.playNote(200, 0.15, 'sawtooth', this.sfxGain, 0.25);
                break;
            case 'stun':
                this.playNote(300, 0.2, 'square', this.sfxGain, 0.15);
                this.playNote(450, 0.15, 'square', this.sfxGain, 0.1, 0.1);
                break;
            case 'escape':
                this.playNote(400, 0.15, 'sawtooth', this.sfxGain, 0.3);
                this.playNote(300, 0.15, 'sawtooth', this.sfxGain, 0.3, 0.1);
                this.playNote(200, 0.2, 'sawtooth', this.sfxGain, 0.3, 0.2);
                break;
            case 'kill':
                this.playNote(500, 0.08, 'sine', this.sfxGain, 0.25);
                this.playNote(700, 0.08, 'sine', this.sfxGain, 0.2, 0.06);
                this.playNote(900, 0.12, 'sine', this.sfxGain, 0.15, 0.12);
                break;
            case 'waveStart':
                for (var i = 0; i < 4; i++) {
                    this.playNote(300 + i * 100, 0.15, 'triangle', this.sfxGain, 0.2, i * 0.12);
                }
                break;
            case 'gameOver':
                this.playNote(400, 0.3, 'sawtooth', this.sfxGain, 0.4);
                this.playNote(300, 0.3, 'sawtooth', this.sfxGain, 0.35, 0.25);
                this.playNote(200, 0.4, 'sawtooth', this.sfxGain, 0.3, 0.5);
                this.playNote(150, 0.6, 'sawtooth', this.sfxGain, 0.3, 0.75);
                break;
            case 'error':
                this.playNote(200, 0.15, 'square', this.sfxGain, 0.2);
                this.playNote(150, 0.15, 'square', this.sfxGain, 0.2, 0.1);
                break;
        }
    },

    setVolume: function(v) {
        if (this.masterGain) this.masterGain.gain.value = v;
    }
};
