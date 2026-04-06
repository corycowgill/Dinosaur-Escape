window.DE = window.DE || {};

DE.WaveManager = {
    currentWave: 0,
    spawnQueue: [],
    waveActive: false,
    waveDelay: 0,
    betweenWaves: false,

    startWave: function(waveNum) {
        this.currentWave = waveNum;
        this.waveActive = true;
        this.betweenWaves = false;
        this.spawnQueue = [];

        var template = this.getWaveTemplate(waveNum);
        var spawnTime = 0;

        for (var g = 0; g < template.length; g++) {
            var group = template[g];
            for (var i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    time: spawnTime
                });
                spawnTime += group.delay;
            }
        }

        DE.HUD.updateWave(waveNum);
        DE.HUD.showWaveBanner('WAVE ' + waveNum);
        DE.Audio.playSound('waveStart');
    },

    getWaveTemplate: function(waveNum) {
        var idx = waveNum - 1;
        if (idx < DE.WAVE_TEMPLATES.length) {
            return DE.WAVE_TEMPLATES[idx];
        }
        // Generate procedural waves beyond templates
        return this.generateWave(waveNum);
    },

    generateWave: function(waveNum) {
        var template = [];
        var difficulty = waveNum - DE.WAVE_TEMPLATES.length;

        // Base compy swarm grows
        template.push({
            type: 'compy',
            count: 5 + Math.floor(difficulty * 1.5),
            delay: Math.max(0.3, 1.0 - difficulty * 0.05)
        });

        // Add velociraptors
        if (difficulty >= 1) {
            template.push({
                type: 'velociraptor',
                count: 3 + Math.floor(difficulty * 0.8),
                delay: Math.max(0.4, 0.8 - difficulty * 0.03)
            });
        }

        // Add dilophosaurus
        template.push({
            type: 'dilophosaurus',
            count: 2 + Math.floor(difficulty * 0.6),
            delay: 1.2
        });

        // Add triceratops
        if (difficulty >= 2) {
            template.push({
                type: 'triceratops',
                count: 1 + Math.floor(difficulty * 0.4),
                delay: 2.5
            });
        }

        // Boss every 5 waves
        if (waveNum % 5 === 0) {
            template.push({
                type: 'trex',
                count: Math.floor(waveNum / 10) + 1,
                delay: 4
            });
        }

        return template;
    },

    update: function(dt, dinoManager, scene) {
        if (this.betweenWaves) {
            this.waveDelay -= dt;
            if (this.waveDelay <= 0) {
                this.startWave(this.currentWave + 1);
            }
            return;
        }

        if (!this.waveActive) return;

        // Process spawn queue
        if (this.spawnQueue.length > 0) {
            this.spawnQueue[0].time -= dt;
            if (this.spawnQueue[0].time <= 0) {
                var spawn = this.spawnQueue.shift();
                dinoManager.spawnDino(spawn.type, scene);
            }
        }

        // Check wave completion
        if (this.spawnQueue.length === 0 && dinoManager.getAliveDinos().length === 0) {
            this.waveActive = false;
            this.betweenWaves = true;
            this.waveDelay = DE.CONFIG.WAVE_DELAY;

            // Bonus cash between waves
            var bonus = 20 + this.currentWave * 5;
            DE.Game.state.cash += bonus;
            DE.HUD.updateCash(DE.Game.state.cash);
            DE.HUD.showWaveBanner('WAVE ' + this.currentWave + ' CLEAR! +$' + bonus);
        }
    },

    reset: function() {
        this.currentWave = 0;
        this.spawnQueue = [];
        this.waveActive = false;
        this.betweenWaves = false;
        this.waveDelay = 0;
    }
};
