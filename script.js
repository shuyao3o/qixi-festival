const BRUSH_SIZE = 30;     
const BRUSH_SPACING = 12;  

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ☁️ Supabase 初始化
    // ==========================================
    const SUPABASE_URL = 'https://cttkxodilojsmjvqdeia.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_HEcjCbGyFVUqFZ1r_321ng_Zf3gIlya';
    let _supabase = null;
    try { _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
    catch (err) { console.log(err); }

    // ④ 默认兜底文字扩充至 20 条
    let cloudTexts = [
        "愿姐妹自由独立","岁岁常欢愉","万事胜意","山高水长","长乐未央","平安喜乐",
        "愿你被温柔以待","岁月静好","繁花似锦","心想事成","春风得意","花好月圆",
        "步步生莲","吉祥如意","百福具臻","岁岁平安","前程似锦","喜乐安康",
        "笑口常开","福寿绵长"
    ];

    const canvasContainer = document.querySelector('.canvas-container');
    const canvas = document.getElementById('drawingBoard');
    const ctx = canvas.getContext('2d');
    const templateImage = document.getElementById('templateImage');

    let tracingStep = 1;
    let isFinished = false;
    let isDrawing = false;
    let lastPoint = null;
    let nushuDict = {};
    let userMapping = [];
    const brushImg = new Image();
    brushImg.src = 'assets/brush.png';

    for (let i = 1; i <= 5; i++) { let img = new Image(); img.src = `assets/${i}.png`; }

    // =========================================
    // 工具函数
    // =========================================
    function switchPhase(fromId, toId, callback) {
        const fromEl = document.getElementById(fromId);
        const toEl   = document.getElementById(toId);
        fromEl.style.opacity = '0';
        setTimeout(() => {
            fromEl.classList.remove('active'); fromEl.classList.add('hidden');
            toEl.classList.remove('hidden');   toEl.classList.add('active');
            toEl.offsetHeight;
            toEl.style.opacity = '1';
            if (callback) callback();
        }, 800);
    }

    function buildNushuHtml(text) {
        let html = '';
        for (let char of text) {
            html += nushuDict[char]
                ? `<span>${nushuDict[char]}</span>`
                : `<span class="fang-nushu">${char}</span>`;
        }
        return html;
    }
    function buildChineseHtml(text) {
        let html = '';
        for (let char of text) html += `<span>${char}</span>`;
        return html;
    }

    // =========================================
    // 字典加载
    // =========================================
    const HINT_TEXT = "以指画线，描红穿针，练习秦彻女书写法。";
    function renderHintTitle() {
        let html = '';
        for (let char of HINT_TEXT) {
            if (char === '，' || char === '。') {
                html += `<div class="char-group punct"><div class="zh">${char}</div></div>`;
            } else {
                const nsChar = nushuDict[char];
                html += nsChar
                    ? `<div class="char-group"><div class="ns">${nsChar}</div><div class="zh">${char}</div></div>`
                    : `<div class="char-group"><div class="ns fang-nushu">${char}</div><div class="zh">${char}</div></div>`;
            }
        }
        document.getElementById('hintContainer').innerHTML = html;
    }
    function renderQincheNushu() {
        const qin = nushuDict['秦'] || '秦'; const che = nushuDict['彻'] || '彻';
        const qC = nushuDict['秦'] ? '' : 'class="fang-nushu"';
        const cC = nushuDict['彻'] ? '' : 'class="fang-nushu"';
        document.getElementById('qincheNushu').innerHTML =
            `<span ${qC}>${qin}</span><span ${cC}>${che}</span>`;
    }

    fetch('assets/data.csv').then(res => res.text()).then(data => {
        data.split('\n').forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 3) {
                const ns = parts[0].trim();
                parts[2].trim().split('').forEach(char => nushuDict[char] = ns);
            }
        });
        renderHintTitle(); renderQincheNushu();
    });

    // =========================================
    // 描红画板
    // =========================================
    document.getElementById('enterBtn').addEventListener('click', () => {
        switchPhase('phase0', 'phase1', () => {
            if (canvasContainer.offsetWidth > 0) {
                canvas.width  = canvasContainer.getBoundingClientRect().width;
                canvas.height = canvasContainer.getBoundingClientRect().height;
            }
        });
    });

    window.addEventListener('resize', () => {
        if (canvasContainer.offsetWidth > 0) {
            canvas.width  = canvasContainer.getBoundingClientRect().width;
            canvas.height = canvasContainer.getBoundingClientRect().height;
        }
    });

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const isTouch = !!e.touches;
        const clientX = isTouch ? e.touches[0].clientX : (e.clientX || e.pageX);
        const clientY = isTouch ? e.touches[0].clientY : (e.clientY || e.pageY);
        return { x: clientX - r.left, y: clientY - r.top - (isTouch ? 35 : 0) };
    }

    function drawStroke(e) {
        if (!isDrawing || isFinished) return;
        const cur = getPos(e);
        const dist  = Math.hypot(cur.x - lastPoint.x, cur.y - lastPoint.y);
        const angle = Math.atan2(cur.y - lastPoint.y, cur.x - lastPoint.x);
        if (dist >= BRUSH_SPACING) {
            for (let i = 0; i < dist; i += BRUSH_SPACING) {
                ctx.drawImage(brushImg,
                    lastPoint.x + Math.cos(angle)*i - BRUSH_SIZE/2,
                    lastPoint.y + Math.sin(angle)*i - BRUSH_SIZE/2,
                    BRUSH_SIZE, BRUSH_SIZE);
            }
            lastPoint = cur;
        }
    }

    canvas.addEventListener('mousedown',  e => { if (!isFinished) { isDrawing = true; lastPoint = getPos(e); } });
    canvas.addEventListener('mousemove',  drawStroke);
    canvas.addEventListener('mouseup',    () => isDrawing = false);
    canvas.addEventListener('touchstart', e => { if (!isFinished) { isDrawing = true; lastPoint = getPos(e); } });
    canvas.addEventListener('touchmove',  drawStroke);
    canvas.addEventListener('touchend',   () => isDrawing = false);

    document.getElementById('clearBtn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isFinished = false;
        templateImage.style.opacity = '0.4';
    });

    // =========================================
    // 粒子特效
    // =========================================
    let particles = [];
    const COLORS = ['233,224,206','135,177,166','234,211,128','211,135,96','75,69,66'];
    function startParticleAnimation(onComplete) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        particles = [];
        for (let y = 0; y < canvas.height; y += 3) {
            for (let x = 0; x < canvas.width; x += 3) {
                if (data[(y * canvas.width + x) * 4 + 3] > 50) {
                    particles.push({
                        x, y,
                        vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
                        life: 1 + Math.random()*0.5,
                        history: [],
                        colorRGB: COLORS[Math.floor(Math.random()*COLORS.length)]
                    });
                }
            }
        }
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            particles.forEach(p => {
                if (p.life > 0) {
                    alive = true;
                    p.history.push({ x: p.x, y: p.y });
                    if (p.history.length > 12) p.history.shift();
                    p.x += p.vx; p.y += p.vy; p.life -= 0.015;
                    if (p.history.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(p.history[0].x, p.history[0].y);
                        for (let i = 1; i < p.history.length; i++) ctx.lineTo(p.history[i].x, p.history[i].y);
                        ctx.strokeStyle = `rgba(${p.colorRGB}, ${p.life})`;
                        ctx.lineWidth = 1.5 * p.life; ctx.lineCap = 'round'; ctx.stroke();
                    }
                }
            });
            if (alive) requestAnimationFrame(render);
            else if (onComplete) onComplete();
        }
        render();
    }

    // =========================================
    // 两步描红逻辑
    // =========================================
    document.getElementById('checkBtn').addEventListener('click', () => {
        let count = 0;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) { if (data[i] > 20) count++; }

        if (count > 4000) {
            isFinished = true;
            document.getElementById('tracingBtnGroup').classList.add('hidden');
            templateImage.style.opacity = '0';

            if (tracingStep === 1) {
                startParticleAnimation(() => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    templateImage.src = 'assets/template2.png';
                    setTimeout(() => {
                        templateImage.style.opacity = '0.4';
                        document.getElementById('tracingBtnGroup').classList.remove('hidden');
                        isFinished = false;
                        tracingStep = 2;
                    }, 300);
                });
            } else {
                startParticleAnimation(() => switchPhase('phase1', 'phase2'));
            }
        } else {
            alert("还不够完整哦，请再描绘一下他的名字吧~");
        }
    });

    // =========================================
    // 署名与女书转换
    // =========================================
    const nameInput   = document.getElementById('nameInput');
    const mappingArea = document.getElementById('mappingArea');
    nameInput.addEventListener('input', () => {
        mappingArea.innerHTML = '';
        document.getElementById('generateBtn').classList.add('hidden');
        document.getElementById('convertBtn').classList.remove('hidden');
    });

    document.getElementById('convertBtn').addEventListener('click', () => {
        const text = nameInput.value.trim();
        userMapping = []; mappingArea.innerHTML = '';
        if (!text) return alert('请先输入名字哦');
        document.getElementById('convertBtn').classList.add('hidden');
        document.getElementById('generateBtn').classList.remove('hidden');

        text.split('').forEach((char, index) => {
            const nsChar  = nushuDict[char];
            const nsClass = nsChar ? 'map-ns' : 'map-ns fang-nushu';
            let statusHtml;
            if (nsChar) {
                userMapping[index] = { displayNs: nsChar, displayZh: char, isFallback: false };
                statusHtml = `<span style="color:#9d2933;font-size:12px;">已匹配</span>`;
            } else {
                userMapping[index] = { displayNs: char, displayZh: char, isFallback: true };
                statusHtml = `<button class="replace-btn" onclick="askHomophone(${index},'${char}')">换同音字</button> <button class="keep-btn" onclick="keepOriginal(${index},'${char}')">保留原字</button>`;
            }
            mappingArea.innerHTML += `<div class="map-row"><div class="map-char">${char}</div><div class="${nsClass}" id="ns-${index}">${nsChar||char}</div><div class="map-action" id="action-${index}">${statusHtml}</div></div>`;
        });
    });

    window.askHomophone = function(index, oChar) {
        const iChar = prompt(`请输入 "${oChar}" 的一个同音字：`);
        if (iChar && nushuDict[iChar[0]]) {
            userMapping[index] = { displayNs: nushuDict[iChar[0]], displayZh: oChar, isFallback: false };
            document.getElementById(`ns-${index}`).className = 'map-ns';
            document.getElementById(`ns-${index}`).innerText = nushuDict[iChar[0]];
            document.getElementById(`action-${index}`).innerHTML = `<span style="color:#9d2933;font-size:12px;">已用「${iChar[0]}」女书</span>`;
        } else if (iChar) alert(`字典中也没有 "${iChar[0]}"`);
    };
    window.keepOriginal = function(index, char) {
        userMapping[index] = { displayNs: char, displayZh: char, isFallback: true };
        document.getElementById(`ns-${index}`).className = 'map-ns fang-nushu';
        document.getElementById(`ns-${index}`).innerText = char;
        document.getElementById(`action-${index}`).innerHTML = `<span style="color:#425066;font-size:12px;">已保留</span>`;
    };

    document.getElementById('generateBtn').addEventListener('click', () => {
        let zhHtml = '', nsHtml = '';
        userMapping.forEach(item => {
            zhHtml += `<span>${item.displayZh}</span>`;
            nsHtml += `<span ${item.isFallback ? 'class="fang-nushu"' : ''}>${item.displayNs}</span>`;
        });
        document.getElementById('chineseOutput').innerHTML = zhHtml;
        document.getElementById('nushuOutput').innerHTML   = nsHtml;
        switchPhase('phase2', 'phase3');
    });

    // =========================================
    // 拆解动画
    // =========================================
    document.getElementById('deconstructBtn').addEventListener('click', () => {
        document.getElementById('deconstructBtn').classList.add('hidden');
        const bg = document.getElementById('posterBg');
        let frame = 1; bg.src = `assets/${frame}.png`;
        const timer = setInterval(() => {
            frame++; bg.src = `assets/${frame}.png`;
            if (frame >= 5) { clearInterval(timer); document.getElementById('goBlessingBtn').classList.remove('hidden'); }
        }, 1000);
    });

    // =========================================
    // ② 寄语预览：汉字 + 女书双列实时更新
    // =========================================
    const blessInput = document.getElementById('blessingInput');
    blessInput.addEventListener('input', () => {
        const text = blessInput.value.trim();
        document.getElementById('blessingNushuCol').innerHTML = buildNushuHtml(text);
        document.getElementById('blessingZhCol').innerHTML   = buildChineseHtml(text);
    });

    // =========================================
    // ④ 进入 phase4：立即开始流动 + 抓取云端寄语
    //    随机5条 + 最新20条，合并去重，总池扩展
    // =========================================
    document.getElementById('goBlessingBtn').addEventListener('click', () => {
        switchPhase('phase3', 'phase4', () => {
            // 进入页面后立即开始播放已有寄语
            startBackgroundFlow();
            // 同时异步抓取云端数据
            fetchCloudBlessings();
        });
    });

    // 背景流动定时器句柄，方便后续清理
    let bgFlowTimer = null;

    function startBackgroundFlow() {
        // 先立即生成一批，错开时间，不等待定时器
        const initialCount = 5;
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => spawnRandomOther(), i * 600);
        }
        // 之后每 2.5 秒持续补充
        bgFlowTimer = setInterval(spawnRandomOther, 2500);
    }

    function spawnRandomOther() {
        if (cloudTexts.length === 0) return;
        const text = cloudTexts[Math.floor(Math.random() * cloudTexts.length)];
        spawnFlowText(text, false);
    }

    async function fetchCloudBlessings() {
        if (!_supabase) return;
        try {
            // 最新 20 条
            const { data: latest } = await _supabase
                .from('blessings')
                .select('content')
                .order('created_at', { ascending: false })
                .limit(20);

            // 随机 5 条：用 postgres 的 random() 排序
            const { data: random } = await _supabase
                .from('blessings')
                .select('content')
                .order('random()')          // supabase JS v2 支持此语法
                .limit(5);

            const combined = [...(latest || []), ...(random || [])];
            if (combined.length > 0) {
                // 去重
                const seen = new Set();
                const deduped = combined
                    .map(item => item.content)
                    .filter(c => c && !seen.has(c) && seen.add(c));
                if (deduped.length > 0) cloudTexts = deduped;
            }
        } catch (err) { console.log(err); }
    }

    // =========================================
    // 寄出按钮
    // =========================================
    document.getElementById('sendBlessingBtn').addEventListener('click', async () => {
        const text = blessInput.value.trim();
        if (!text) return alert("请先留下祝福哦");

        // 隐藏输入区和寄出按钮
        const inputArea = document.getElementById('blessingInputArea');
        const sendBtn   = document.getElementById('sendBlessingBtn');
        inputArea.style.opacity = '0';
        sendBtn.style.opacity   = '0';
        setTimeout(() => {
            inputArea.style.display = 'none';
            sendBtn.style.display   = 'none';
        }, 1000);

        // 背景河流显现
        document.getElementById('riverBg').style.opacity = '1';

        // ⑤ 用户寄语：三阶段水滴汇入动画
        spawnUserText(text);

        // 保存到数据库
        if (_supabase) {
            try { await _supabase.from('blessings').insert([{ content: text }]); }
            catch (e) { console.log(e); }
        }
    });

    // =========================================
    // ⑤ 用户寄语三阶段动画：水滴 → 扩散 → 汇入河流
    // =========================================
    function spawnUserText(text) {
        const container = document.getElementById('waterFlowContainer');
        const appEl     = document.getElementById('app');
        const appRect   = appEl.getBoundingClientRect();

        const flowEl = document.createElement('div');
        flowEl.className = 'flowing-item flow-user flow-user-drop';
        flowEl.innerHTML = buildNushuHtml(text);
        // 初始固定在中心底部
        flowEl.style.left = '50%';
        flowEl.style.top  = '88%';
        container.appendChild(flowEl);

        // 阶段一结束后触发涟漪 + 扩散
        flowEl.addEventListener('animationend', function onDrop(e) {
            if (e.animationName !== 'userDrop') return;
            flowEl.removeEventListener('animationend', onDrop);

            // 触发 SVG 涟漪
            spawnRipple(appRect);

            // 切换到扩散动画
            flowEl.classList.remove('flow-user-drop');
            flowEl.classList.add('flow-user-spread');

            // 扩散结束后汇入河流
            flowEl.addEventListener('animationend', function onSpread(e2) {
                if (e2.animationName !== 'userSpread') return;
                flowEl.removeEventListener('animationend', onSpread);

                // 随机偏移落点，模拟水滴汇入河流后散开
                const targetLeft = 20 + Math.random() * 60; // 20%~80%
                flowEl.style.left = targetLeft + '%';
                flowEl.style.transform = 'translateX(-50%)';

                flowEl.classList.remove('flow-user-spread');
                flowEl.classList.add('flow-user-merge');

                flowEl.addEventListener('animationend', function onMerge(e3) {
                    if (e3.animationName !== 'userMergeUp') return;
                    flowEl.removeEventListener('animationend', onMerge);
                    flowEl.remove();
                });
            });
        });

        // 点击切换女书/汉字显示
        let isZh = false;
        flowEl.addEventListener('click', () => {
            isZh = !isZh;
            flowEl.innerHTML = isZh ? buildChineseHtml(text) : buildNushuHtml(text);
            flowEl.classList.toggle('flowing-zh', isZh);
        });
    }

    // ⑤ SVG 涟漪：在用户寄语落点处绘制扩散圆环
    function spawnRipple(appRect) {
        const svg = document.getElementById('rippleOverlay');
        // 涟漪中心：屏幕中央，top 约 64%
        const cx = appRect.width  * 0.5;
        const cy = appRect.height * 0.64;

        // 生成 3 圈错开的涟漪
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx);
                circle.setAttribute('cy', cy);
                circle.setAttribute('r',  '4');
                circle.classList.add('ripple-circle');
                svg.appendChild(circle);
                // 动画结束后移除
                circle.addEventListener('animationend', () => circle.remove());
            }, i * 300);
        }
    }

    // =========================================
    // 普通他人寄语流动（非用户自己的）
    // =========================================
    function spawnFlowText(text, isUser) {
        if (isUser) { spawnUserText(text); return; }

        const flowEl = document.createElement('div');
        flowEl.className = 'flowing-item flow-other';
        flowEl.innerHTML = buildNushuHtml(text);
        flowEl.style.left = (15 + Math.random() * 70) + '%';

        let isZh = false;
        flowEl.addEventListener('click', () => {
            isZh = !isZh;
            flowEl.innerHTML = isZh ? buildChineseHtml(text) : buildNushuHtml(text);
            flowEl.classList.toggle('flowing-zh', isZh);
        });

        document.getElementById('waterFlowContainer').appendChild(flowEl);
        setTimeout(() => flowEl.remove(), 26000);
    }
});
