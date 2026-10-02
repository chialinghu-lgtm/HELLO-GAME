/**
 * Classroom Toolbar & QR Code Integration
 * Automatically loaded by all classroom games.
 */
(function() {
    // 取得當前網址參數
    const urlParams = new URLSearchParams(window.location.search);
    let currentGroup = urlParams.get('group') || '';
    let currentTeam = urlParams.get('team') || '';
    let isMuted = localStorage.getItem('cr_game_muted') === 'true';

    // 判斷相對於首頁 index.html 的路徑
    const isInSubdir = window.location.pathname.includes('/games/');
    const homeUrl = isInSubdir ? '../index.html' : './index.html';

    function initClassroomToolbar() {
        // 建立懸浮工具列元素
        const bar = document.createElement('div');
        bar.className = 'classroom-toolbar';
        bar.id = 'classroomToolbar';

        // 組別標籤文字
        let badgeText = '👥 設定組別';
        let badgeClass = 'classroom-group-badge';
        if (currentGroup) {
            badgeText = `🎯 第 ${currentGroup} 組`;
        } else if (currentTeam === 'blue') {
            badgeText = `🔵 藍隊`;
            badgeClass += ' team-blue';
        } else if (currentTeam === 'red') {
            badgeText = `🔴 紅隊`;
            badgeClass += ' team-red';
        }

        bar.innerHTML = `
            <a href="${homeUrl}" class="classroom-btn" title="回遊戲大廳首頁">🏠 大廳</a>
            <button class="${badgeClass}" id="crGroupBadge" title="點擊切換組別">${badgeText}</button>
            <button class="classroom-btn" id="crQrBtn" title="顯示本遊戲 QR Code">📱 掃碼</button>
            <button class="classroom-btn" id="crMuteBtn" title="切換靜音">${isMuted ? '🔇 靜音' : '🔊 聲音'}</button>
        `;

        document.body.appendChild(bar);

        // 建立 QR Code 彈跳視窗
        const modal = document.createElement('div');
        modal.className = 'classroom-modal-overlay';
        modal.id = 'classroomModal';
        modal.innerHTML = `
            <div class="classroom-modal-card">
                <button class="classroom-modal-close" id="crModalClose">&times;</button>
                <h3 class="classroom-modal-title">📱 學生掃碼加入</h3>
                <div class="classroom-modal-sub">請學生以平板或手機掃描 QR Code 即刻加入遊戲</div>
                
                <div class="classroom-group-selector" id="crGroupSelector">
                    <button class="group-chip ${!currentGroup && !currentTeam ? 'active' : ''}" data-val="">通用連結</button>
                    <button class="group-chip ${currentGroup === '1' ? 'active' : ''}" data-group="1">第 1 組</button>
                    <button class="group-chip ${currentGroup === '2' ? 'active' : ''}" data-group="2">第 2 組</button>
                    <button class="group-chip ${currentGroup === '3' ? 'active' : ''}" data-group="3">第 3 組</button>
                    <button class="group-chip ${currentGroup === '4' ? 'active' : ''}" data-group="4">第 4 組</button>
                    <button class="group-chip ${currentGroup === '5' ? 'active' : ''}" data-group="5">第 5 組</button>
                    <button class="group-chip ${currentGroup === '6' ? 'active' : ''}" data-group="6">第 6 組</button>
                    <button class="group-chip ${currentTeam === 'blue' ? 'active' : ''}" data-team="blue">🔵 藍隊</button>
                    <button class="group-chip ${currentTeam === 'red' ? 'active' : ''}" data-team="red">🔴 紅隊</button>
                </div>

                ${window.location.protocol === 'file:' && !localStorage.getItem('custom_online_base_url') ? '<div style="background:#fff1f2; color:#9f1239; font-size:11px; padding:6px 10px; border-radius:8px; margin-bottom:10px; line-height:1.4;">💡 <b>本機預覽模式</b>：手機鏡頭無法存取個人電腦 C 槽檔案，掃描會顯示「找不到可用的資料」。發布到 GitHub Pages 後即為標準網址，手機掃碼即秒開！</div>' : ''}

                <div class="classroom-qr-box" id="crQrCodeContainer"></div>
                <div class="classroom-url-preview" id="crUrlPreview"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // 綁定事件
        document.getElementById('crGroupBadge').addEventListener('click', () => openModal(true));
        document.getElementById('crQrBtn').addEventListener('click', () => openModal(false));
        document.getElementById('crModalClose').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // 靜音切換
        const muteBtn = document.getElementById('crMuteBtn');
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            localStorage.setItem('cr_game_muted', isMuted ? 'true' : 'false');
            muteBtn.innerHTML = isMuted ? '🔇 靜音' : '🔊 聲音';
            applyMuteState(isMuted);
        });

        // 組別切換按鈕
        const chips = modal.querySelectorAll('.group-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                const g = chip.getAttribute('data-group');
                const t = chip.getAttribute('data-team');
                updateCurrentTarget(g, t);
            });
        });

        applyMuteState(isMuted);
    }

    let qrCodeInstance = null;

    function getCleanPageUrl(targetGroup, targetTeam) {
        let baseUrl = localStorage.getItem('custom_online_base_url');
        if (!baseUrl && window.location.protocol === 'file:') {
            baseUrl = 'https://chialinghu-lgtm.github.io/HELLO-GAME';
        }
        let url;
        if (baseUrl && baseUrl.trim().startsWith('http')) {
            baseUrl = baseUrl.trim().replace(/\/+$/, '');
            let currentPath = window.location.pathname;
            let match = currentPath.match(/(games\/[^/]+|[^\/]+\.html)$/);
            let pathSegment = match ? match[0] : '';
            url = new URL(pathSegment, baseUrl + '/');
        } else {
            url = new URL(window.location.href);
        }
        // 每次產生分享網址時重新整理參數，避免沿用舊設定
        url.search = '';
        if (targetGroup) url.searchParams.set('group', targetGroup);
        if (targetTeam) url.searchParams.set('team', targetTeam);

        // 讓各遊戲把老師目前的後台設定一起帶進 QR Code
        if (typeof window.getClassroomShareParams === 'function') {
            try {
                const gameParams = window.getClassroomShareParams() || {};
                Object.entries(gameParams).forEach(([key, value]) => {
                    if (value === undefined || value === null || value === '') return;
                    if (typeof value === 'object') value = JSON.stringify(value);
                    url.searchParams.set(key, String(value));
                });
            } catch (e) {
                console.warn('Unable to collect classroom share settings:', e);
            }
        }
        return url.toString();
    }

    function renderQRCode(targetUrl) {
        const container = document.getElementById('crQrCodeContainer');
        const preview = document.getElementById('crUrlPreview');
        if (!container) return;

        container.innerHTML = '';
        preview.innerText = targetUrl;

        if (window.QRCode) {
            try {
                qrCodeInstance = new window.QRCode(container, {
                    text: targetUrl,
                    width: 220,
                    height: 220,
                    colorDark: '#111827',
                    colorLight: '#ffffff',
                    // L 可容納較長的「老師設定」分享網址
                    correctLevel: window.QRCode.CorrectLevel.L
                });
                return;
            } catch (err) {
                console.warn('Local QRCode renderer failed; using online fallback.', err);
            }
        }

        // 本機 QR 模組失敗時的備援
        const img = document.createElement('img');
        img.width = 220;
        img.height = 220;
        img.alt = 'QR Code';
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(targetUrl);
        img.onerror = function () {
            container.innerHTML = '<p style="color:#c0392b;font-size:13px;line-height:1.5;text-align:center;">QR Code 暫時無法產生。<br>請使用下方「複製連結」分享網址。</p>';
        };
        container.appendChild(img);
    }

    function updateCurrentTarget(g, t) {
        currentGroup = g || '';
        currentTeam = t || '';
        const targetUrl = getCleanPageUrl(currentGroup, currentTeam);
        renderQRCode(targetUrl);

        // 更新徽章文字
        const badge = document.getElementById('crGroupBadge');
        if (badge) {
            badge.className = 'classroom-group-badge';
            if (currentGroup) {
                badge.innerText = `🎯 第 ${currentGroup} 組`;
            } else if (currentTeam === 'blue') {
                badge.innerText = `🔵 藍隊`;
                badge.classList.add('team-blue');
            } else if (currentTeam === 'red') {
                badge.innerText = `🔴 紅隊`;
                badge.classList.add('team-red');
            } else {
                badge.innerText = `👥 設定組別`;
            }
        }

        // 更新網址歷史（不刷新頁面）
        window.history.replaceState({}, '', targetUrl);
    }

    function openModal() {
        const modal = document.getElementById('classroomModal');
        if (!modal) return;
        modal.style.display = 'flex';
        renderQRCode(getCleanPageUrl(currentGroup, currentTeam));
    }

    function closeModal() {
        const modal = document.getElementById('classroomModal');
        if (modal) modal.style.display = 'none';
    }

    // 課堂靜音功能：攔截 Web Audio API
    function applyMuteState(muted) {
        window.isClassroomMuted = muted;
        if (window.audioCtx && window.audioCtx.state !== 'closed') {
            try {
                if (muted && window.audioCtx.suspend) window.audioCtx.suspend();
                else if (!muted && window.audioCtx.resume) window.audioCtx.resume();
            } catch(e) {}
        }
        if (window.AudioEngine && window.AudioEngine.ctx) {
            try {
                if (muted && window.AudioEngine.ctx.suspend) window.AudioEngine.ctx.suspend();
                else if (!muted && window.AudioEngine.ctx.resume) window.AudioEngine.ctx.resume();
            } catch(e) {}
        }
    }

    // 當 DOM 準備完成時初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClassroomToolbar);
    } else {
        initClassroomToolbar();
    }
})();
