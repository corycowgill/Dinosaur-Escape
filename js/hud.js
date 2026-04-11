window.DE = window.DE || {};

DE.HUD = {
    bannerTimeout: null,

    updateScore: function(score) { document.getElementById('score').textContent = score; },
    updateWave: function(num) { document.getElementById('wave-num').textContent = num; },
    updateCash: function(cash) { document.getElementById('cash').textContent = cash; },

    updateSpeed: function(speed) {
        var el = document.getElementById('speed-display');
        if (el) el.textContent = speed + 'x';
    },

    updateLives: function(lives, maxLives) {
        var bar = document.getElementById('lives-bar');
        var html = '<span style="color:#fff;font-weight:bold;margin-right:4px;">Lives:</span>';
        for (var i = 0; i < maxLives; i++)
            html += '<div class="life-icon' + (i >= lives ? ' lost' : '') + '"></div>';
        bar.innerHTML = html;
    },

    showWaveBanner: function(text) {
        var banner = document.getElementById('wave-banner');
        banner.textContent = text;
        banner.style.opacity = '1';
        if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(function() { banner.style.opacity = '0'; }, 2500);
    },

    updateWavePreview: function(waveInfo) {
        var el = document.getElementById('wave-preview');
        if (!el || !waveInfo || waveInfo.length === 0) {
            if (el) el.style.display = 'none';
            return;
        }
        var html = '<div class="wp-title">Next Wave:</div>';
        for (var i = 0; i < waveInfo.length; i++) {
            var info = waveInfo[i];
            var dType = DE.DINO_TYPES[info.type];
            var name = dType ? dType.name : info.type;
            html += '<div class="wp-row"><span class="wp-type">' + name + '</span><span class="wp-count">x' + info.count + '</span></div>';
        }
        el.innerHTML = html;
        el.style.display = 'block';
    },

    showStartScreen: function() { document.getElementById('start-screen').style.display = 'flex'; },
    hideStartScreen: function() { document.getElementById('start-screen').style.display = 'none'; },

    showHUD: function() {
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('trap-bar').style.display = 'flex';
    },
    hideHUD: function() {
        document.getElementById('hud').style.display = 'none';
        document.getElementById('trap-bar').style.display = 'none';
    },

    showPause: function() { document.getElementById('pause-screen').style.display = 'flex'; },
    hidePause: function() { document.getElementById('pause-screen').style.display = 'none'; },

    showGameOver: function(score, wave, stats) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-wave').textContent = wave;
        if (stats) {
            document.getElementById('stat-kills').textContent = stats.kills || 0;
            document.getElementById('stat-traps').textContent = stats.trapsPlaced || 0;
            document.getElementById('stat-cash').textContent = stats.totalCashEarned || 0;
            document.getElementById('stat-escaped').textContent = stats.escaped || 0;
        }
        document.getElementById('game-over-screen').style.display = 'flex';
        var wp = document.getElementById('wave-preview');
        if (wp) wp.style.display = 'none';
    },
    hideGameOver: function() { document.getElementById('game-over-screen').style.display = 'none'; },

    highlightTrapButton: function(index) {
        var btns = document.querySelectorAll('.trap-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('selected', i === index);
    },

    buildTrapBar: function() {
        var bar = document.getElementById('trap-bar');
        bar.innerHTML = '';
        for (var i = 0; i < DE.TRAP_TYPES.length; i++) {
            var t = DE.TRAP_TYPES[i];
            var btn = document.createElement('div');
            btn.className = 'trap-btn' + (i === 0 ? ' selected' : '');
            btn.dataset.index = i;
            // Tooltip with stats
            var tooltip = '<div class="trap-tooltip"><div class="tt-name">' + t.name + '</div>' +
                '<div class="tt-desc">' + t.description + '</div>' +
                '<div class="tt-stat">Damage: ' + t.damage + ' | Range: ' + t.range + '</div>' +
                '<div class="tt-stat">Cooldown: ' + (t.cooldown || 0) + 's</div>';
            if (t.stunDuration) tooltip += '<div class="tt-stat">Stun: ' + t.stunDuration + 's</div>';
            if (t.dotDuration) tooltip += '<div class="tt-stat">DoT: ' + t.dotDamage + '/s for ' + t.dotDuration + 's</div>';
            if (t.chainCount) tooltip += '<div class="tt-stat">Chain: ' + t.chainCount + ' targets</div>';
            tooltip += '</div>';
            btn.innerHTML = '<div class="icon">' + t.icon + '</div><div class="name">' + t.name +
                '</div><div class="cost">$' + t.cost + '</div><div class="key">[' + t.keyBind + ']</div>' + tooltip;
            bar.appendChild(btn);
        }
    }
};
