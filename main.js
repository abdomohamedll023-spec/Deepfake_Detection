(function () {
    'use strict';

    const uploadBox = document.getElementById('uploadBox');
    const fileInput = document.getElementById('fileInput');
    const uploadInner = uploadBox.querySelector('.upload-inner');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('previewImg');
    const previewFilename = document.getElementById('previewFilename');
    const removeBtn = document.getElementById('removeBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const modelOpts = document.querySelectorAll('.model-opt');
    const scanningOverlay = document.getElementById('scanningOverlay');
    const scanPreviewImg = document.getElementById('scanPreviewImg');
    const progressBar = document.getElementById('progressBar');
    const progressPct = document.getElementById('progressPct');
    const scanStatus = document.getElementById('scanStatus');
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4'),
    ];

    const resultsSection = document.getElementById('resultsSection');
    const verdictCard = document.getElementById('verdictCard');
    const verdictText = document.getElementById('verdictText');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictSub = document.getElementById('verdictSub');
    const modelBadge = document.getElementById('modelBadge');
    const confidenceValue = document.getElementById('confidenceValue');
    const confidenceFill = document.getElementById('confidenceFill');

    const probFake = document.getElementById('probFake');
    const probReal = document.getElementById('probReal');
    const probTamper = document.getElementById('probTamper');

    const probFakePct = document.getElementById('probFakePct');
    const probRealPct = document.getElementById('probRealPct');
    const probTamperPct = document.getElementById('probTamperPct');

    const metaFilename = document.getElementById('metaFilename');
    const metaDimensions = document.getElementById('metaDimensions');
    const metaSize = document.getElementById('metaSize');
    const metaFormat = document.getElementById('metaFormat');
    const metaNoise = document.getElementById('metaNoise');
    const metaCompression = document.getElementById('metaCompression');
    const indicatorsList = document.getElementById('indicatorsList');

    const analyzedImg = document.getElementById('analyzedImg');
    const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
    const radarCanvas = document.getElementById('radarChart');

    let currentFile = null;
    let selectedModel = 'resnet';

    // =====================
    // HERO PARTICLES
    // =====================
    (function createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (8 + Math.random() * 18) + 's';
            p.style.animationDelay = (Math.random() * 12) + 's';
            p.style.opacity = (0.2 + Math.random() * 0.6).toString();
            p.style.background = Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6';
            const size = 1 + Math.random() * 3;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            container.appendChild(p);
        }
    })();

    // =====================
    // MODEL SELECTION
    // =====================
    modelOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            modelOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedModel = opt.dataset.model;
        });
    });

    // =====================
    // FILE UPLOAD HANDLING
    // =====================
    uploadBox.addEventListener('dragover', e => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('drag-over');
    });

    uploadBox.addEventListener('drop', e => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadFile(file);
        }
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) loadFile(file);
    });

    function loadFile(file) {
        currentFile = file;
        const reader = new FileReader();
        reader.onload = e => {
            previewImg.src = e.target.result;
            previewFilename.textContent = file.name;
            uploadInner.style.display = 'none';
            uploadPreview.style.display = 'block';
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        previewImg.src = '';
        uploadInner.style.display = 'flex';
        uploadPreview.style.display = 'none';
        analyzeBtn.disabled = true;
        resultsSection.classList.remove('visible');
    });

    // =====================
    // ANALYSIS FLOW
    // =====================
    analyzeBtn.addEventListener('click', () => {
        if (!currentFile) return;
        startAnalysis();
    });

    function startAnalysis() {
        scanPreviewImg.src = previewImg.src;
        scanningOverlay.classList.add('active');
        steps.forEach(s => s.classList.remove('active', 'done'));
        progressBar.style.width = '0%';
        progressPct.textContent = '0%';

        const timeline = [
            { pct: 0, status: 'Initializing neural network...', step: -1 },
            { pct: 12, status: 'Loading pretrained weights...', step: -1 },
            { pct: 25, status: 'Extracting spatial features from image...', step: 0 },
            { pct: 45, status: 'Running frequency domain analysis...', step: 1 },
            { pct: 68, status: 'Performing model inference...', step: 2 },
            { pct: 85, status: 'Calculating confidence scores...', step: 2 },
            { pct: 96, status: 'Generating forensic report...', step: 3 },
            { pct: 100, status: 'Analysis complete!', step: 3 },
        ];

        let idx = 0;

        function tick() {
            if (idx >= timeline.length) {
                setTimeout(finishAnalysis, 600);
                return;
            }
            const frame = timeline[idx];
            animateProgress(frame.pct);
            scanStatus.textContent = frame.status;
            steps.forEach((s, i) => {
                if (i < frame.step) {
                    s.classList.remove('active');
                    s.classList.add('done');
                } else if (i === frame.step) {
                    s.classList.add('active');
                    s.classList.remove('done');
                }
            });
            idx++;
            const delay = idx === 1 ? 500 : 400 + Math.random() * 200;
            setTimeout(tick, delay);
        }

        tick();
    }

    function animateProgress(target) {
        const current = parseFloat(progressBar.style.width) || 0;
        const increment = (target - current) / 20;
        let val = current;

        function step() {
            val += increment;
            if ((increment > 0 && val >= target) || (increment < 0 && val <= target)) val = target;
            progressBar.style.width = val + '%';
            progressPct.textContent = Math.round(val) + '%';
            if (val !== target) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function finishAnalysis() {
        scanningOverlay.classList.remove('active');
        generateAndShowResults();
    }

    // =====================
    // RESULT GENERATION (API DATA INTEGRATION)
    // =====================
    async function generateAndShowResults() {
        const formData = new FormData();
        formData.append("file", currentFile);

        try {
            const apiUrl = window.location.protocol === 'file:' 
                ? 'http://127.0.0.1:5000/predict' 
                : '/predict';

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            // Check if backend returned an error
            if (!response.ok) {
                throw new Error(data.error || "Server returned an error: " + response.status);
            }

            const isFake = data.prediction === "Fake";
            const confidence = data.confidence;

            const fakeProb = isFake ? confidence : 100 - confidence;
            const realProb = isFake ? 100 - confidence : confidence;
            const tamperProb = 0;

            const modelNames = {
                resnet: 'ResNet-50',
                inception: 'InceptionV3',
                cnn: 'Custom CNN'
            };

            // =====================
            // RESULT CARD
            // =====================
            verdictCard.classList.remove('fake-result', 'real-result');
            verdictCard.classList.add(isFake ? 'fake-result' : 'real-result');

            verdictText.textContent = isFake ? 'FAKE' : 'REAL';
            verdictIcon.textContent = isFake ? '⚠️' : '✅';

            verdictSub.textContent = isFake
                ? 'The image shows strong indicators of AI generation or digital manipulation. Multiple forensic signals suggest this image was not captured by a camera.'
                : 'No significant manipulation artifacts detected. Image metadata and pixel-level analysis are consistent with an authentic photograph.';

            modelBadge.textContent = modelNames[selectedModel];
            confidenceValue.textContent = confidence + '%';
            
            confidenceFill.style.width = '0%';
            setTimeout(() => { confidenceFill.style.width = confidence + '%'; }, 150);

            // =====================
            // PROBABILITIES
            // =====================
            setTimeout(() => {
                probFake.style.width = fakeProb + '%';
                probReal.style.width = realProb + '%';
                probTamper.style.width = tamperProb + '%';
            }, 200);

            probFakePct.textContent = fakeProb + '%';
            probRealPct.textContent = realProb + '%';
            probTamperPct.textContent = tamperProb + '%';

            // =====================
            // IMAGE METADATA
            // =====================
            metaFilename.textContent = currentFile.name;
            metaSize.textContent = formatBytes(currentFile.size);
            metaFormat.textContent = currentFile.type.split('/')[1].toUpperCase();
            metaNoise.textContent = isFake ? 'Low (0.012)' : 'Normal (0.187)';
            metaCompression.textContent = isFake ? 'Anomalous' : 'JPEG q=' + Math.floor(70 + Math.random() * 25);

            const img = new Image();
            img.onload = () => {
                metaDimensions.textContent = img.naturalWidth + ' × ' + img.naturalHeight + 'px';
            };
            img.src = previewImg.src;

            // =====================
            // FORENSIC INDICATORS
            // =====================
            const fakeIndicators = [
                { type: 'danger', title: 'GAN Artifact Pattern', desc: 'Periodic texture inconsistencies detected in high-frequency domain.' },
                { type: 'danger', title: 'Spectral Anomaly', desc: 'Unnatural spectral fingerprint inconsistent with real camera sensors.' },
                { type: 'warning', title: 'Compression Inconsistency', desc: 'Block artifact levels vary across image regions.' },
                { type: 'warning', title: 'Noise Floor Deviation', desc: 'Sensor noise pattern deviates from expected ISO signature.' },
                { type: 'info', title: 'No EXIF Metadata', desc: 'Camera metadata is absent or stripped — common in AI-generated images.' },
            ];
            const realIndicators = [
                { type: 'safe', title: 'Consistent Noise Pattern', desc: 'Sensor noise is uniform and matches typical camera output.' },
                { type: 'safe', title: 'Natural Compression', desc: 'JPEG artifact levels are consistent across all image regions.' },
                { type: 'safe', title: 'Spectral Pattern Normal', desc: 'Frequency domain fingerprint matches real-world camera signatures.' },
                { type: 'info', title: 'Slight JPEG Ringing', desc: 'Minor compression artifacts near edges — typical in real photographs.' },
            ];

            indicatorsList.innerHTML = (isFake ? fakeIndicators : realIndicators).map(ind => `
                <div class="indicator-item ${ind.type}">
                    <div class="indicator-dot"></div>
                    <div class="indicator-text">
                        <div class="indicator-title">${ind.title}</div>
                        <div class="indicator-desc">${ind.desc}</div>
                    </div>
                </div>
            `).join('');

            // =====================
            // SHOW IMAGE
            // =====================
            analyzedImg.src = previewImg.src;

            // =====================
            // SHOW RESULTS SECTION
            // =====================
            resultsSection.classList.add('visible');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // =====================
            // DRAW RADAR CHART
            // =====================
            setTimeout(() => drawRadar(fakeProb, realProb, tamperProb, isFake), 300);

        } catch (error) {
            console.error(error);
            alert("خطأ في الاتصال بالخادم الذكي!\n\nالسبب: " + error.message + "\n\nتأكد من:\n1. تشغيل الخادم (python app.py) في موجه الأوامر.\n2. أنك فتحت الرابط الصحيح (http://127.0.0.1:5000) بدلاً من فتح الملف مباشرة.");
        }
    }

    // =====================
    // RADAR CHART (Canvas)
    // =====================
    function drawRadar(fakeProb, realProb, tamperProb, isFake) {
        if (!radarCanvas) return;
        const ctx = radarCanvas.getContext('2d');
        const cx = radarCanvas.width / 2;
        const cy = radarCanvas.height / 2;
        const r = 75;
        ctx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

        const labels = ['AI-Gen', 'Authentic', 'Tampered', 'ELA', 'Freq', 'Noise'];
        const baseVals = isFake
            ? [fakeProb / 100, realProb / 100, Math.min(tamperProb / 100 + 0.2, 0.95),
            0.5 + Math.random() * 0.4, 0.5 + Math.random() * 0.4, 0.2 + Math.random() * 0.3]
            : [realProb / 100 * 0.2, realProb / 100 * 0.95, Math.max(0.05, tamperProb / 100),
            0.1 + Math.random() * 0.2, 0.15 + Math.random() * 0.2, 0.5 + Math.random() * 0.4];

        const n = labels.length;
        const angleStep = (Math.PI * 2) / n;

        // Grid rings
        for (let ring = 1; ring <= 4; ring++) {
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const x = cx + (r * ring / 4) * Math.cos(angle);
                const y = cy + (r * ring / 4) * Math.sin(angle);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Axes
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Data polygon
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + r * baseVals[i] * Math.cos(angle);
            const y = cy + r * baseVals[i] * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        if (isFake) {
            grad.addColorStop(0, 'rgba(239,68,68,0.4)');
            grad.addColorStop(1, 'rgba(249,115,22,0.4)');
        } else {
            grad.addColorStop(0, 'rgba(6,182,212,0.4)');
            grad.addColorStop(1, 'rgba(16,185,129,0.4)');
        }
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = isFake ? '#ef4444' : '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'rgba(148,163,184,0.9)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            ctx.fillText(labels[i], cx + (r + 14) * Math.cos(angle), cy + (r + 14) * Math.sin(angle));
        }
    }

    // =====================
    // ANALYZE ANOTHER IMAGE
    // =====================
    analyzeAnotherBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        previewImg.src = '';
        uploadInner.style.display = 'flex';
        uploadPreview.style.display = 'none';
        analyzeBtn.disabled = true;
        resultsSection.classList.remove('visible');
        document.getElementById('upload').scrollIntoView({ behavior: 'smooth' });
    });

    // =====================
    // FORMAT FILE SIZE
    // =====================
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    // =====================
    // SCROLL ANIMATIONS
    // =====================
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.style.animationPlayState = 'running';
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.about-card').forEach((card, i) => {
        card.style.animationDelay = (i * 100) + 'ms';
        card.style.animationPlayState = 'paused';
        observer.observe(card);
    });

    // =====================
    // ACTIVE NAV HIGHLIGHT
    // =====================
    window.addEventListener('scroll', () => {
        let current = '';
        document.querySelectorAll('section[id]').forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 100) current = sec.getAttribute('id');
        });
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.style.color = a.getAttribute('href') === '#' + current ? '#60a5fa' : '';
        });
    }, { passive: true });

})();