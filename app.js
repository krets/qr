/**
 * QR Code Generator - qr.krets.com
 * Vanilla JS Implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        activeTab: 'wifi',
        data: '',
        settings: {
            errorCorrection: 'M',
            colorFg: '#000000',
            colorBg: '#ffffff',
            shapeModule: 'square',
            shapeFinder: 'square',
            labelTop: { text: '', font: 'sans-serif', align: 'center', color: '#000000' },
            labelBottom: { text: '', font: 'sans-serif', align: 'center', color: '#000000' }
        }
    };

    // DOM Elements
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const downloadBtn = document.getElementById('download-btn');

    // Initialize
    init();

    function init() {
        // Set defaults in inputs
        document.getElementById('wifi-ssid').value = 'Krets-Guest';
        document.getElementById('label-top-text').value = 'SCAN ME';
        state.settings.labelTop.text = 'SCAN ME'; // Sync initial state

        setupTabs();
        setupInputs();
        updateDataFromInputs(); // This will set state.data and raw-data textarea
        updateQR(); // Initial render
    }


    // --- Tab Logic ---
    function setupTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;
                state.activeTab = target;

                // UI Update
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`tab-${target}`).classList.add('active');

                // Sync Raw data when switching
                if (target !== 'raw') {
                    updateDataFromInputs();
                }
                
                updateQR();
            });
        });
    }

    // --- Input Binding ---
    function setupInputs() {
        // Data inputs
        const allDataInputs = document.querySelectorAll('.tab-pane input, .tab-pane select, .tab-pane textarea');
        allDataInputs.forEach(input => {
            input.addEventListener('input', debounce(() => {
                if (state.activeTab !== 'raw') {
                    updateDataFromInputs();
                } else {
                    state.data = document.getElementById('raw-data').value;
                }
                updateQR();
            }, 300));
        });

        // Styling inputs
        const stylingInputs = {
            'qr-error': 'errorCorrection',
            // 'color-fg' handled separately for sync logic
            'color-bg': 'colorBg',
            'shape-module': 'shapeModule',
            'shape-finder': 'shapeFinder'
        };

        // Standard styling
        Object.entries(stylingInputs).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', debounce(() => {
                state.settings[key] = el.value;
                if (id === 'qr-error') updateErrorHelpText(el.value);
                updateQR();
            }, 200));
        });

        // Special handling for Foreground Color (Sync with Labels)
        const fgInput = document.getElementById('color-fg');
        if (fgInput) {
            fgInput.addEventListener('input', debounce(() => {
                const newColor = fgInput.value;
                const oldColor = state.settings.colorFg;

                // Sync labels if they matched the OLD foreground color
                if (state.settings.labelTop.color === oldColor) {
                    state.settings.labelTop.color = newColor;
                    document.getElementById('label-top-color').value = newColor;
                }
                if (state.settings.labelBottom.color === oldColor) {
                    state.settings.labelBottom.color = newColor;
                    document.getElementById('label-bottom-color').value = newColor;
                }

                state.settings.colorFg = newColor;
                updateQR();
            }, 200));
        }

        // Label inputs (Top/Bottom specific)
        const labelInputs = [
            { id: 'label-top-text', parent: 'labelTop', key: 'text' },
            { id: 'label-top-align', parent: 'labelTop', key: 'align' },
            { id: 'label-top-color', parent: 'labelTop', key: 'color' },
            { id: 'label-top-font', parent: 'labelTop', key: 'font' },
            { id: 'label-bottom-text', parent: 'labelBottom', key: 'text' },
            { id: 'label-bottom-align', parent: 'labelBottom', key: 'align' },
            { id: 'label-bottom-color', parent: 'labelBottom', key: 'color' },
            { id: 'label-bottom-font', parent: 'labelBottom', key: 'font' }
        ];

        labelInputs.forEach(item => {
            const el = document.getElementById(item.id);
            if (!el) return;
            // Listen to 'input' for text/color/select, 'change' for datalist text input
            const eventType = (item.key === 'font' || item.key === 'text') ? 'input' : 'change';
            
            el.addEventListener(eventType, debounce(() => {
                state.settings[item.parent][item.key] = el.value;
                updateQR();
            }, 200));
        });

        downloadBtn.addEventListener('click', exportPNG);
    }


    function updateErrorHelpText(level) {
        const helpText = document.querySelector('.help-text');
        const tips = {
            'L': 'Low (7%): Maximum data capacity, but least durable.',
            'M': 'Medium (15%): Good balance for most digital use.',
            'Q': 'Quartile (25%): Robust against minor damage or small icons.',
            'H': 'High (30%): Recommended for print or heavy custom styling.'
        };
        helpText.textContent = tips[level] || '';
    }

    // --- Data Formatting ---
    function updateDataFromInputs() {
        let formattedData = '';

        if (state.activeTab === 'wifi') {
            const ssid = document.getElementById('wifi-ssid').value;
            const pass = document.getElementById('wifi-pass').value;
            const enc = document.getElementById('wifi-enc').value;
            const hidden = document.getElementById('wifi-hidden').checked;
            
            // WIFI:S:<SSID>;T:<WEP|WPA|nopass>;P:<PASSWORD>;H:<true|false>;;
            const escape = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
            formattedData = `WIFI:S:${escape(ssid)};T:${enc};P:${escape(pass)};H:${hidden};;`;

        } else if (state.activeTab === 'url') {
            let url = document.getElementById('url-input').value;
            if (url && !url.match(/^[a-zA-Z]+:\/\//)) {
                url = 'https://' + url;
            }
            formattedData = url;

        } else if (state.activeTab === 'vcard') {
            const fn = document.getElementById('vc-fn').value;
            const ln = document.getElementById('vc-ln').value;
            const org = document.getElementById('vc-org').value;
            const title = document.getElementById('vc-title').value;
            const bday = document.getElementById('vc-bday').value;
            const telM = document.getElementById('vc-tel-m').value;
            const telW = document.getElementById('vc-tel-w').value;
            const email = document.getElementById('vc-email').value;
            const website = document.getElementById('vc-web').value;
            
            // Address parts
            const adr = document.getElementById('vc-adr').value; // Street
            const zip = document.getElementById('vc-zip').value;
            const city = document.getElementById('vc-city').value;
            const stateCode = document.getElementById('vc-state').value; // Region
            const country = document.getElementById('vc-country').value;

            // ADR format: ;;Street;City;Region;Zip;Country;
            const adrString = (adr || zip || city || stateCode || country) 
                ? `ADR:;;${adr};${city};${stateCode};${zip};${country}` 
                : '';

            formattedData = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                ln || fn ? `N:${ln};${fn};;;` : '',
                fn || ln ? `FN:${fn} ${ln}`.trim() : '',
                org ? `ORG:${org}` : '',
                title ? `TITLE:${title}` : '',
                bday ? `BDAY:${bday}` : '',
                telM ? `TEL;TYPE=CELL,VOICE:${telM}` : '',
                telW ? `TEL;TYPE=WORK,VOICE:${telW}` : '',
                email ? `EMAIL:${email}` : '',
                website ? `URL:${website}` : '',
                adrString,
                'END:VCARD'
            ].filter(Boolean).join('\n');
        }

        state.data = formattedData;
        document.getElementById('raw-data').value = formattedData;
    }

    // --- QR Core ---
    function updateQR() {
        if (!state.data) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        try {
            // 1. Calculate Matrix
            const qr = qrcode(0, state.settings.errorCorrection);
            qr.addData(state.data);
            qr.make();
            
            const moduleCount = qr.getModuleCount();
            renderCanvas(qr, moduleCount);
        } catch (e) {
            console.error("QR Generation Error:", e);
        }
    }

    // --- Rendering Pipeline ---
    function renderCanvas(qr, count) {
        const cellSize = 15;
        const baseMargin = 30; // Standard quiet zone
        const labelMargin = 60; // Larger margin to fit text
        
        // Determine margins based on label presence
        const marginTop = state.settings.labelTop.text ? labelMargin : baseMargin;
        const marginBottom = state.settings.labelBottom.text ? labelMargin : baseMargin;
        const marginLeft = baseMargin;
        const marginRight = baseMargin;
        
        const size = count * cellSize;
        canvas.width = size + marginLeft + marginRight;
        canvas.height = size + marginTop + marginBottom;

        // Draw Background
        ctx.fillStyle = state.settings.colorBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const startX = marginLeft;
        const startY = marginTop;

        // Draw Modules (skip finders)
        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                const isDark = qr.isDark(r, c);
                if (!isDark) continue;

                // Skip finders, we draw them separately for better styling
                const isFinder = (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
                if (isFinder) continue;
                
                ctx.fillStyle = state.settings.colorFg;
                const x = startX + (c * cellSize);
                const y = startY + (r * cellSize);
                drawModule(ctx, x, y, cellSize, state.settings.shapeModule);
            }
        }

        // Draw Finders
        drawFinderPattern(ctx, startX, startY, cellSize, 0, 0, state.settings.shapeFinder); // Top-Left
        drawFinderPattern(ctx, startX + (count - 7) * cellSize, startY, cellSize, 0, 0, state.settings.shapeFinder); // Top-Right
        drawFinderPattern(ctx, startX, startY + (count - 7) * cellSize, cellSize, 0, 0, state.settings.shapeFinder); // Bottom-Left

        // Draw Labels
        drawLabels(startX, size, marginTop, marginBottom);
    }

    function drawModule(ctx, x, y, size, shape) {
        ctx.beginPath();
        if (shape === 'dots') {
            ctx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
        } else if (shape === 'rounded') {
            const r = size * 0.35;
            ctx.roundRect(x + 0.5, y + 0.5, size - 1, size - 1, r);
        } else {
            ctx.rect(x, y, size, size);
        }
        ctx.fill();
    }

    function drawFinderPattern(ctx, x, y, cellSize, r, c, shape) {
        const size = cellSize * 7;
        const fg = state.settings.colorFg;
        const bg = state.settings.colorBg;

        // Outer Frame (7x7)
        ctx.fillStyle = fg;
        drawBox(ctx, x, y, size, cellSize, shape);

        // Inner Gap (5x5 white)
        ctx.fillStyle = bg;
        drawBox(ctx, x + cellSize, y + cellSize, cellSize * 5, cellSize, shape);

        // Inner Core (3x3)
        ctx.fillStyle = fg;
        const coreSize = cellSize * 3;
        const coreOffset = cellSize * 2;
        if (shape === 'dots') {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, coreSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'rounded') {
            ctx.beginPath();
            ctx.roundRect(x + coreOffset, y + coreOffset, coreSize, coreSize, cellSize * 0.8);
            ctx.fill();
        } else {
            ctx.fillRect(x + coreOffset, y + coreOffset, coreSize, coreSize);
        }
    }

    function drawBox(ctx, x, y, size, thickness, shape) {
        if (shape === 'dots') {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            ctx.arc(x + size / 2, y + size / 2, (size / 2) - thickness, 0, Math.PI * 2, true);
            ctx.fill();
        } else if (shape === 'rounded') {
            ctx.beginPath();
            const rOuter = thickness * 1.5;
            const rInner = Math.max(0, rOuter - thickness);
            ctx.roundRect(x, y, size, size, rOuter);
            ctx.roundRect(x + thickness, y + thickness, size - thickness * 2, size - thickness * 2, rInner);
            ctx.fill('evenodd');
        } else {
            ctx.fillRect(x, y, size, size);
            const lastColor = ctx.fillStyle;
            ctx.fillStyle = state.settings.colorBg;
            ctx.fillRect(x + thickness, y + thickness, size - thickness * 2, size - thickness * 2);
            ctx.fillStyle = lastColor;
        }
    }

    function drawLabels(startX, qrSize, marginTop, marginBottom) {
        const centerX = canvas.width / 2;
        
        // Helper to draw a single label
        const renderLabel = (labelState, yPos) => {
            if (!labelState.text) return;
            
            ctx.fillStyle = labelState.color;
            ctx.font = `bold 20px "${labelState.font}", sans-serif`; 
            ctx.textBaseline = 'middle';

            let xPos = centerX;
            if (labelState.align === 'left') {
                xPos = startX;
                ctx.textAlign = 'left';
            } else if (labelState.align === 'right') {
                xPos = startX + qrSize;
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'center';
            }
            
            ctx.fillText(labelState.text, xPos, yPos);
        };

        if (state.settings.labelTop.text) {
            renderLabel(state.settings.labelTop, marginTop / 2); // Center in top margin
        }

        if (state.settings.labelBottom.text) {
            const y = canvas.height - (marginBottom / 2); // Center in bottom margin
            renderLabel(state.settings.labelBottom, y);
        }
    }

    // --- Utils ---
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function exportPNG() {
        const hash = await simpleHash(state.data);
        const link = document.createElement('a');
        link.download = `qr_${hash}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    async function simpleHash(str) {
        // Simple non-cryptographic hash for filename
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }
});
