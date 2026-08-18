const BRUSH_SIZE = 30;     
const BRUSH_SPACING = 12;  

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // ☁️ Supabase 数据库初始化 (请重新填入)
    // ==========================================
    const SUPABASE_URL = '把这里换成你的_Project_URL';
    const SUPABASE_ANON_KEY = '把这里换成你的_anon_public_Key';
    
    let _supabase = null;
    try { _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (err) { console.log(err); }

    let cloudTexts = ["愿姐妹自由独立", "岁岁常欢愉", "万事胜意", "山高水长", "长乐未央", "平安喜乐"];

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

    for(let i = 1; i <= 5; i++) { let img = new Image(); img.src = `assets/${i}.png`; }

    function switchPhase(fromId, toId, callback) {
        const fromEl = document.getElementById(fromId); const toEl = document.getElementById(toId);
        fromEl.style.opacity = '0';
        setTimeout(() => {
            fromEl.classList.remove('active'); fromEl.classList.add('hidden');
            toEl.classList.remove('hidden'); toEl.classList.add('active');
            toEl.offsetHeight; toEl.style.opacity = '1';
            if(callback) callback();
        }, 800); 
    }

    function buildNushuHtml(text) {
        let html = '';
        for (let char of text) {
            if (nushuDict[char]) html += `<span>${nushuDict[char]}</span>`;
            else html += `<span class="fang-nushu">${char}</span>`;
        } return html;
    }
    function buildChineseHtml(text) {
        let html = '';
        for (let char of text) html += `<span>${char}</span>`;
        return html;
    }

    function renderHintTitle() {
        let html = '';
        for (let char of "以指画线，描红穿针，练习秦彻女书写法。") {
            if (char === '，' || char === '。') html += `<div class="char-group punct"><div class="zh">${char}</div></div>`;
            else {
                const nsChar = nushuDict[char];
                if (nsChar) html += `<div class="char-group"><div class="ns">${nsChar}</div><div class="zh">${char}</div></div>`;
                else html += `<div class="char-group"><div class="ns fang-nushu">${char}</div><div class="zh">${char}</div></div>`;
            }
        }
        document.getElementById('hintContainer').innerHTML = html;
    }
    
    // === 寄语页上方文字生成 ===
    function renderBlessingTitle() {
        let html = '';
        for (let char of "以女书寄女性") {
            const nsChar = nushuDict[char];
            if (nsChar) html += `<div class="char-group"><div class="ns">${nsChar}</div><div class="zh">${char}</div></div>`;
            else html += `<div class="char-group"><div class="ns fang-nushu">${char}</div><div class="zh">${char}</div></div>`;
        }
        document.getElementById('blessingHintContainer').innerHTML = html;
    }

    function renderQincheNushu() {
        const qin = nushuDict['秦'] || '秦'; const che = nushuDict['彻'] || '彻';
        const qinClass = nushuDict['秦'] ? '' : 'class="fang-nushu"'; const cheClass = nushuDict['彻'] ? '' : 'class="fang-nushu"';
        document.getElementById('qincheNushu').innerHTML = `<span ${qinClass}>${qin}</span><span ${cheClass}>${che}</span>`;
    }

    fetch('assets/data.csv').then(res => res.text()).then(data => {
        data.split('\n').forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 3) {
                const ns = parts[0].trim();
                parts[2].trim().split('').forEach(char => nushuDict[char] = ns);
            }
        });
        renderHintTitle(); renderBlessingTitle(); renderQincheNushu(); 
    });

    document.getElementById('enterBtn').addEventListener('click', () => {
        switchPhase('phase0', 'phase1', () => {
            if (canvasContainer.offsetWidth > 0) {
                canvas.width = canvasContainer.getBoundingClientRect().width;
                canvas.height = canvasContainer.getBoundingClientRect().height;
            }
        });
    });

    function getPos(e) { 
        const r = canvas.getBoundingClientRect(); const isTouch = !!e.touches; 
        const clientX = isTouch ? e.touches[0].clientX : (e.clientX || e.pageX);
        const clientY = isTouch ? e.touches[0].clientY : (e.clientY || e.pageY);
        const offsetY = isTouch ? 35 : 0;
        return { x: clientX - r.left, y: clientY - r.top - offsetY }; 
    }

    canvas.addEventListener('mousedown', e => { if(!isFinished) { isDrawing = true; lastPoint = getPos(e); }});
    canvas.addEventListener('mousemove', e => {
        if(!isDrawing || isFinished) return;
        const cur = getPos(e); const dist = Math.hypot(cur.x - lastPoint.x, cur.y - lastPoint.y); const angle = Math.atan2(cur.y - lastPoint.y, cur.x - lastPoint.x);
        if (dist >= BRUSH_SPACING) {
            for (let i = 0; i < dist; i += BRUSH_SPACING) ctx.drawImage(brushImg, lastPoint.x + Math.cos(angle)*i - BRUSH_SIZE/2, lastPoint.y + Math.sin(angle)*i - BRUSH_SIZE/2, BRUSH_SIZE, BRUSH_SIZE);
            lastPoint = cur;
        }
    });
    canvas.addEventListener('mouseup', () => isDrawing = false);
    
    canvas.addEventListener('touchstart', e => { if(!isFinished) { isDrawing = true; lastPoint = getPos(e); }});
    canvas.addEventListener('touchmove', e => {
        if(!isDrawing || isFinished) return;
        const cur = getPos(e); const dist = Math.hypot(cur.x - lastPoint.x, cur.y - lastPoint.y); const angle = Math.atan2(cur.y - lastPoint.y, cur.x - lastPoint.x);
        if (dist >= BRUSH_SPACING) {
            for (let i = 0; i < dist; i += BRUSH_SPACING) ctx.drawImage(brushImg, lastPoint.x + Math.cos(angle)*i - BRUSH_SIZE/2, lastPoint.y + Math.sin(angle)*i - BRUSH_SIZE/2, BRUSH_SIZE, BRUSH_SIZE);
            lastPoint = cur;
        }
    });
    canvas.addEventListener('touchend', () => isDrawing = false);

    document.getElementById('clearBtn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        isFinished = false; templateImage.style.opacity = '0.4'; 
    });

    let particles = [];
    const COLORS = ['233,224,206', '135,177,166', '234,211,128', '211,135,96', '75,69,66'];
    function startParticleAnimation(onComplete) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let y = 0; y < canvas.height; y += 3) {
            for (let x = 0; x < canvas.width; x += 3) {
                if (data[(y * canvas.width + x) * 4 + 3] > 50) particles.push({ x: x, y: y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 1+Math.random()*0.5, history: [], colorRGB: COLORS[Math.floor(Math.random()*COLORS.length)] });
            }
        }
        function renderParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); let alive = false;
            particles.forEach(p => {
                if (p.life > 0) {
                    alive = true; p.history.push({x: p.x, y: p.y});
                    if(p.history.length > 12) p.history.shift(); 
                    p.x += p.vx; p.y += p.vy; p.life -= 0.015; 
                    if (p.history.length > 1) {
                        ctx.beginPath(); ctx.moveTo(p.history[0].x, p.history[0].y);
                        for(let i=1; i<p.history.length; i++) ctx.lineTo(p.history[i].x, p.history[i].y);
                        ctx.strokeStyle = `rgba(${p.colorRGB}, ${p.life})`; ctx.lineWidth = 1.5 * p.life; ctx.lineCap = 'round'; ctx.stroke();
                    }
                }
            });
            if (alive) requestAnimationFrame(renderParticles); 
            else if(onComplete) onComplete();
        }
        renderParticles();
    }

    document.getElementById('checkBtn').addEventListener('click', () => {
        let count = 0; const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
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
                        isFinished = false; tracingStep = 2; 
                    }, 300);
                });
            } else {
                startParticleAnimation(() => switchPhase('phase1', 'phase2'));
            }
        } else alert("还不够完整哦，请再描绘一下他的名字吧~");
    });

    const nameInput = document.getElementById('nameInput');
    const mappingArea = document.getElementById('mappingArea');
    nameInput.addEventListener('input', () => { mappingArea.innerHTML = ''; document.getElementById('generateBtn').classList.add('hidden'); document.getElementById('convertBtn').classList.remove('hidden'); });

    document.getElementById('convertBtn').addEventListener('click', () => {
        const text = nameInput.value.trim();
        userMapping = []; mappingArea.innerHTML = '';
        if(!text) return alert('请先输入名字哦');
        document.getElementById('convertBtn').classList.add('hidden'); document.getElementById('generateBtn').classList.remove('hidden');

        text.split('').forEach((char, index) => {
            let nsChar = nushuDict[char];
            let statusHtml = '', nsClass = nsChar ? 'map-ns' : 'map-ns fang-nushu'; 
            if (nsChar) {
                userMapping[index] = { displayNs: nsChar, displayZh: char, isFallback: false };
                statusHtml = `<span style="color:#9d2933;font-size:12px;">已匹配</span>`;
            } else {
                userMapping[index] = { displayNs: char, displayZh: char, isFallback: true }; 
                statusHtml = `<button class="replace-btn" onclick="askHomophone(${index}, '${char}')">换同音字</button> <button class="keep-btn" onclick="keepOriginal(${index}, '${char}')">保留原字</button>`;
            }
            mappingArea.innerHTML += `<div class="map-row"><div class="map-char">${char}</div><div class="${nsClass}" id="ns-${index}">${nsChar||char}</div><div class="map-action" id="action-${index}">${statusHtml}</div></div>`;
        });
    });

    window.askHomophone = function(index, oChar) {
        const iChar = prompt(`请输入 "${oChar}" 的一个同音字：`);
        if (iChar) {
            if (nushuDict[iChar[0]]) {
                userMapping[index] = { displayNs: nushuDict[iChar[0]], displayZh: oChar, isFallback: false };
                document.getElementById(`ns-${index}`).className = 'map-ns'; document.getElementById(`ns-${index}`).innerText = nushuDict[iChar[0]];
                document.getElementById(`action-${index}`).innerHTML = `<span style="color:#9d2933;font-size:12px;">已用「${iChar[0]}」女书</span>`;
            } else alert(`字典中也没有 "${iChar[0]}"`);
        }
    };
    window.keepOriginal = function(index, char) {
        userMapping[index] = { displayNs: char, displayZh: char, isFallback: true };
        document.getElementById(`ns-${index}`).className = 'map-ns fang-nushu'; document.getElementById(`ns-${index}`).innerText = char;
        document.getElementById(`action-${index}`).innerHTML = `<span style="color:#425066;font-size:12px;">已保留</span>`;
    };

    document.getElementById('generateBtn').addEventListener('click', () => {
        let zhHtml = '', nsHtml = '';
        userMapping.forEach(item => {
            zhHtml += `<span>${item.displayZh}</span>`;
            nsHtml += `<span ${item.isFallback ? 'class="fang-nushu"' : ''}>${item.displayNs}</span>`;
        });
        document.getElementById('chineseOutput').innerHTML = zhHtml;
        document.getElementById('nushuOutput').innerHTML = nsHtml;
        switchPhase('phase2', 'phase3');
    });

    document.getElementById('deconstructBtn').addEventListener('click', () => {
        document.getElementById('deconstructBtn').classList.add('hidden');
        const bg = document.getElementById('posterBg');
        let frame = 1; bg.src = `assets/${frame}.png`; 
        const timer = setInterval(() => {
            frame++; bg.src = `assets/${frame}.png`;
            if (frame >= 5) { clearInterval(timer); document.getElementById('goBlessingBtn').classList.remove('hidden'); }
        }, 1000);
    });

    // === 6. 云端真实寄语与河流 ===
    let riverInterval;
    
    document.getElementById('goBlessingBtn').addEventListener('click', () => {
        switchPhase('phase3', 'phase4');
        fetchCloudBlessings().then(() => {
            // 用户尚未寄出前，长河已经开始流淌
            startRiverFlow();
        });
    });

    async function fetchCloudBlessings() {
        if(!_supabase) return;
        try {
            // 抓取 100 条：前20条为最新，剩下取5条随机
            const { data } = await _supabase.from('blessings').select('content').order('created_at', { ascending: false }).limit(100);
            if (data && data.length > 0) {
                const newest20 = data.slice(0, 20).map(item => item.content);
                const rest = data.slice(20);
                const random5 = rest.sort(() => 0.5 - Math.random()).slice(0, 5).map(item => item.content);
                cloudTexts = [...newest20, ...random5];
            }
        } catch(err) { console.log(err); }
    }

    function startRiverFlow() {
        riverInterval = setInterval(() => {
            // 保持同屏最多 20 条
            if (document.querySelectorAll('.flow-other').length < 20 && cloudTexts.length > 0) {
                let randomText = cloudTexts[Math.floor(Math.random() * cloudTexts.length)];
                spawnFlowText(randomText, false);
            }
        }, 1200); // 间隔短一点营造密集感
    }

    const blessInput = document.getElementById('blessingInput');
    const blessPreview = document.getElementById('blessingPreview');
    blessInput.addEventListener('input', () => { blessPreview.innerHTML = buildNushuHtml(blessInput.value.trim()); });

    document.getElementById('sendBlessingBtn').addEventListener('click', async () => {
        const text = blessInput.value.trim();
        if(!text) return alert("请先留下祝福哦");

        document.getElementById('blessingInputArea').style.opacity = '0';
        document.getElementById('sendBlessingBtn').style.opacity = '0';
        document.getElementById('blessingHintContainer').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('blessingInputArea').style.display = 'none';
            document.getElementById('sendBlessingBtn').style.display = 'none';
        }, 1000);

        // 🌊 核心动画：水流排开
        document.querySelectorAll('.flow-other').forEach(el => {
            const rect = el.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            if (rect.left < centerX) el.classList.add('push-left');
            else el.classList.add('push-right');
        });

        spawnFlowText(text, true);

        if(_supabase) {
            try { await _supabase.from('blessings').insert([{ content: text }]); } catch(e) { }
        }
    });

    function spawnFlowText(text, isUser) {
        const flowEl = document.createElement('div');
        flowEl.className = `flowing-item ${isUser ? 'flow-user' : 'flow-other'}`;
        flowEl.innerHTML = buildNushuHtml(text);
        
        if (!isUser) {
            // 限制左右范围，避免贴太紧边缘
            flowEl.style.left = (10 + Math.random() * 80) + '%';
        }

        let isZh = false;
        flowEl.addEventListener('click', () => {
            isZh = !isZh;
            if(isZh) { flowEl.classList.add('flowing-zh'); flowEl.innerHTML = buildChineseHtml(text); } 
            else { flowEl.classList.remove('flowing-zh'); flowEl.innerHTML = buildNushuHtml(text); }
        });
        document.getElementById('waterFlowContainer').appendChild(flowEl);
        setTimeout(() => flowEl.remove(), 29000);
    }
});
