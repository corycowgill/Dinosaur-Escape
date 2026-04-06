window.DE = window.DE || {};

DE.HUD = {
    bannerTimeout: null,

    updateScore: function(score) {
        document.getElementById('score').textContent = score;
    },

    updateWave: function(num) {
        document.getElementById('wave-num').textContent = num;
    },

    updateCash: function(cash) {
        document.getElementById('cash').textContent = cash;
    },

    updateLives: function(lives, maxLives) {
        var bar = document.getElementById('lives-bar');
        var html = '<span style="color:#fff;font-weight:bold;margin-right:4px;">Lives:</span>';
        for (var i = 0; i < maxLives; i++) {
            html += '<div class="life-icon' + (i >= lives ? ' lost' : '') + '"></div>';
        }
        bar.innerHTML = html;
    },

    showWaveBanner: function(text) {
        var banner = document.getElementById('wave-banner');
        banner.textContent = text;
        banner.style.opacity = '1';
        if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(function() {
            banner.style.opacity = '0';
        }, 2500);
    },

    showStartScreen: function() {
        document.getElementById('start-screen').style.display = 'flex';
    },

    hideStartScreen: function() {
        document.getElementById('start-screen').style.display = 'none';
    },

    showHUD: function() {
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('trap-bar').style.display = 'flex';
    },

    hideHUD: function() {
        document.getElementById('hud').style.display = 'none';
        document.getElementById('trap-bar').style.display = 'none';
    },

    showGameOver: function(score, wave) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-wave').textContent = wave;
        document.getElementById('game-over-screen').style.display = 'flex';
    },

    hideGameOver: function() {
        document.getElementById('game-over-screen').style.display = 'none';
    },

    highlightTrapButton: function(index) {
        var btns = document.querySelectorAll('.trap-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('selected', i === index);
        }
    },

    buildTrapBar: function() {
        var bar = document.getElementById('trap-bar');
        bar.innerHTML = '';
        for (var i = 0; i < DE.TRAP_TYPES.length; i++) {
            var t = DE.TRAP_TYPES[i];
            var btn = document.createElement('div');
            btn.className = 'trap-btn' + (i === 0 ? ' selected' : '');
            btn.dataset.index = i;
            btn.innerHTML =
                '<div class="icon">' + t.icon + '</div>' +
                '<div class="name">' + t.name + '</div>' +
                '<div class="cost">$' + t.cost + '</div>' +
                '<div class="key">[' + t.keyBind + ']</div>';
            bar.appendChild(btn);
        }
    }
};
