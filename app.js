/**
 * QR Code Generator - qr.krets.com
 * Vanilla JS Implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered successfully:', reg.scope))
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }

    // State management
    const defaultSettings = {
        errorCorrection: 'M',
        colorFg: '#000000',
        colorBg: '#ffffff',
        shapeModule: 'square',
        shapeFinder: 'square',
        padding: 0,
        moduleSize: 15,
        labelTop: { text: '', font: 'sans-serif', align: 'center', color: '#000000', size: 20 },
        labelBottom: { text: '', font: 'sans-serif', align: 'center', color: '#000000', size: 20 },
        overlayImage: null,
        logoSize: 20,
        logoShape: 'none',
        logoPadding: 4
    };

    const createDefaultTypeState = () => ({
        data: '',
        inputValues: {},
        settings: JSON.parse(JSON.stringify(defaultSettings))
    });

    const state = {
        activeTab: 'vcard',
        types: {
            vcard: createDefaultTypeState(),
            url: createDefaultTypeState(),
            wifi: createDefaultTypeState(),
            raw: createDefaultTypeState()
        },
        logoImageObject: null, // Keep in memory HTMLImageElement
        get settings() {
            const tab = (this.activeTab === 'scanner') ? 'vcard' : this.activeTab;
            return this.types[tab].settings;
        },
        set settings(val) {
            const tab = (this.activeTab === 'scanner') ? 'vcard' : this.activeTab;
            this.types[tab].settings = val;
        },
        get inputValues() {
            const tab = (this.activeTab === 'scanner') ? 'vcard' : this.activeTab;
            return this.types[tab].inputValues;
        },
        set inputValues(val) {
            const tab = (this.activeTab === 'scanner') ? 'vcard' : this.activeTab;
            this.types[tab].inputValues = val;
        },
        get data() {
            const tab = (this.activeTab === 'scanner') ? 'vcard' : this.activeTab;
            return this.types[tab].data;
        },
        set data(val) {
            const tab = (this.activeTab === 'scanner') ? 'vcard' : this.activeTab;
            this.types[tab].data = val;
        }
    };

    // DOM Elements
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const tabBtns = document.querySelectorAll('.type-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const downloadBtn = document.getElementById('download-btn');

    // Initialize
    init();

    function init() {
        setupTabs();
        setupStylingTabs();
        setupInputs();
        setupLogoOverlay();
        setupVCardUI(); // New UI Logic for vCard
        setupPasswordToggle();
        setupScanner();
        
        // 1. Try to load from LocalStorage
        const savedState = loadFromLocalStorage();
        
        if (savedState) {
            restoreState(savedState);
        } else {
            // 2. Set defaults ONLY if no save found
            const urlInput = document.getElementById('url-input');
            if (urlInput && !urlInput.value) {
                urlInput.value = 'https://qr.krets.com';
            }
            // Initial sync if no save
            syncAllInputsToState();
            updateDataFromInputs();
            updateQR();
        }

        // Check for shared contact via PWA Share Target
        checkForSharedVCard();
    }

    // --- vCard UI Logic ---
    function setupVCardUI() {
        // 1. Group Toggling (excluding group-name which is fixed)
        const groups = document.querySelectorAll('.vcard-group:not(#group-name)');
        groups.forEach(group => {
            const header = group.querySelector('.group-header');
            if (!header) return;

            header.addEventListener('click', () => {
                group.classList.toggle('collapsed');
                updateDataFromInputs(); // Re-generate data to include/exclude fields
                updateQR();
                saveToLocalStorage();
            });
        });
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem('qr_krets_state', JSON.stringify(state));
        } catch (e) {
            console.warn("Could not save to localStorage", e);
        }
    }

    function loadFromLocalStorage() {
        try {
            const json = localStorage.getItem('qr_krets_state');
            return json ? JSON.parse(json) : null;
        } catch (e) {
            console.warn("Could not load from localStorage", e);
            return null;
        }
    }

    function syncAllInputsToState() {
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(el => {
            if (el.id) {
                if (el.type === 'checkbox') {
                    state.inputValues[el.id] = el.checked;
                } else {
                    state.inputValues[el.id] = el.value;
                }
            }
        });
    }

    // --- Tab Logic ---
    function setupTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;
                state.activeTab = target;

                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`tab-${target}`).classList.add('active');

                // Load visual settings and input values from this tab's state
                restoreUIFromActiveTab();

                if (target !== 'raw' && target !== 'scanner') {
                    updateDataFromInputs();
                }
                
                if (target !== 'scanner') {
                    updateQR();
                }
                saveToLocalStorage();
            });
        });
    }

    // --- Styling Tabs Logic ---
    function setupStylingTabs() {
        const styleTabBtns = document.querySelectorAll('.style-tab-btn');
        const styleTabPanes = document.querySelectorAll('.style-tab-pane');

        styleTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.styleTab;
                styleTabBtns.forEach(b => b.classList.remove('active'));
                styleTabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const pane = document.getElementById(`style-tab-${target}`);
                if (pane) pane.classList.add('active');
            });
        });
    }

    // --- Input Binding ---
    function setupInputs() {
        // Handle all standard inputs
        const allInputs = document.querySelectorAll('input, select, textarea');
        
        allInputs.forEach(input => {
            const eventType = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
            
            input.addEventListener(eventType, debounce(() => {
                // 1. Sync to state
                if (input.id) {
                    state.inputValues[input.id] = (input.type === 'checkbox') ? input.checked : input.value;
                }

                // 2. Data Updates
                if (input.closest('.tab-pane') && state.activeTab !== 'scanner') {
                    if (state.activeTab === 'raw') {
                        state.data = document.getElementById('raw-data').value;
                    } else {
                        updateDataFromInputs();
                    }
                }
                
                // 3. Trigger Render & Save
                updateQR();
                saveToLocalStorage();
            }, 300));
        });

        // Mapping for specific settings inputs
        const stylingInputs = {
            'qr-error': 'errorCorrection',
            'color-bg': 'colorBg',
            'shape-module': 'shapeModule',
            'shape-finder': 'shapeFinder',
            'qr-padding': 'padding',
            'qr-size': 'moduleSize',
            'logo-size': 'logoSize',
            'logo-shape': 'logoShape',
            'logo-padding': 'logoPadding'
        };

        Object.entries(stylingInputs).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            const eventType = (el.tagName === 'SELECT') ? 'change' : 'input';
            el.addEventListener(eventType, debounce(() => {
                let val = el.value;
                if (key === 'padding' || key === 'moduleSize' || key === 'logoSize' || key === 'logoPadding') {
                    val = parseInt(val) || 0;
                }
                state.settings[key] = val;
                
                if (id === 'qr-error') {
                    updateLogoWarning(val, state.settings.overlayImage);
                }
                updateQR();
                saveToLocalStorage();
            }, 200));
        });

        // Color Sync Logic
        const fgInput = document.getElementById('color-fg');
        if (fgInput) {
            fgInput.addEventListener('input', debounce(() => {
                const newColor = fgInput.value;
                const oldColor = state.settings.colorFg;

                if (state.settings.labelTop.color === oldColor) {
                    state.settings.labelTop.color = newColor;
                    const el = document.getElementById('label-top-color');
                    if (el) el.value = newColor;
                }
                if (state.settings.labelBottom.color === oldColor) {
                    state.settings.labelBottom.color = newColor;
                    const el = document.getElementById('label-bottom-color');
                    if (el) el.value = newColor;
                }

                state.settings.colorFg = newColor;
                updateQR();
                saveToLocalStorage();
            }, 200));
        }

        // Label inputs
        const labelInputs = [
            { id: 'label-top-text', parent: 'labelTop', key: 'text' },
            { id: 'label-top-align', parent: 'labelTop', key: 'align' },
            { id: 'label-top-color', parent: 'labelTop', key: 'color' },
            { id: 'label-top-font', parent: 'labelTop', key: 'font' },
            { id: 'label-top-size', parent: 'labelTop', key: 'size' },
            { id: 'label-bottom-text', parent: 'labelBottom', key: 'text' },
            { id: 'label-bottom-align', parent: 'labelBottom', key: 'align' },
            { id: 'label-bottom-color', parent: 'labelBottom', key: 'color' },
            { id: 'label-bottom-font', parent: 'labelBottom', key: 'font' },
            { id: 'label-bottom-size', parent: 'labelBottom', key: 'size' }
        ];

        labelInputs.forEach(item => {
            const el = document.getElementById(item.id);
            if (!el) return;
            const eventType = (item.key === 'font' || item.key === 'text' || item.key === 'size') ? 'input' : 'change';
            
            el.addEventListener(eventType, debounce(() => {
                let val = el.value;
                if (item.key === 'size') val = parseInt(val) || 20;
                state.settings[item.parent][item.key] = val;
                updateQR();
                saveToLocalStorage();
            }, 200));
        });

        // Instant slider badge updates as dragging
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener('input', () => {
                updateSliderBadge(slider.id, slider.value);
            });
        });

        // Setup bidirectional number inputs
        const sliderNumInputs = document.querySelectorAll('.slider-num-input');
        sliderNumInputs.forEach(numInput => {
            const sliderId = numInput.id.replace('-num', '');
            const slider = document.getElementById(sliderId);
            if (!slider) return;

            numInput.addEventListener('input', () => {
                let val = parseInt(numInput.value);
                if (isNaN(val)) return; // Ignore empty values while typing
                
                // Set slider value, which automatically clamps to min/max
                slider.value = val;
                
                // Dispatch input event to range slider to update state & QR
                slider.dispatchEvent(new Event('input'));
            });

            numInput.addEventListener('blur', () => {
                let val = parseInt(numInput.value);
                const min = parseInt(numInput.min) || 0;
                const max = parseInt(numInput.max) || 100;
                if (isNaN(val)) {
                    val = min;
                } else if (val < min) {
                    val = min;
                } else if (val > max) {
                    val = max;
                }
                numInput.value = val;
                slider.value = val;
                slider.dispatchEvent(new Event('input'));
            });
        });

        downloadBtn.addEventListener('click', exportPNG);
    }

    function setupPasswordToggle() {
        const toggleBtn = document.getElementById('wifi-pass-toggle');
        const passInput = document.getElementById('wifi-pass');
        if (!toggleBtn || !passInput) return;

        toggleBtn.addEventListener('click', () => {
            if (passInput.type === 'password') {
                passInput.type = 'text';
                toggleBtn.textContent = 'Hide';
            } else {
                passInput.type = 'password';
                toggleBtn.textContent = 'Show';
            }
        });
    }

    function setupScanner() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('qr-input-file');
        const copyBtn = document.getElementById('copy-decoded');

        if (!dropZone) return;

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) handleScannerFile(files[0]);
        });

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) handleScannerFile(e.target.files[0]);
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const decodedText = document.getElementById('decoded-text');
                if (decodedText) {
                    decodedText.select();
                    document.execCommand('copy');
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy to Clipboard', 2000);
                }
            });
        }
    }

    function updateErrorHelpText(level) {
        // Optional: Update help text UI if exists
    }

    // --- Data Formatting ---
    function updateDataFromInputs() {
        let formattedData = '';

        if (state.activeTab === 'wifi') {
            const ssid = document.getElementById('wifi-ssid').value;
            const pass = document.getElementById('wifi-pass').value;
            const enc = document.getElementById('wifi-enc').value;
            const hidden = document.getElementById('wifi-hidden').checked;
            
            const escape = (s) => s.replace(/\\/g, '\\').replace(/;/g, '\;').replace(/:/g, '\:').replace(/,/g, '\,');
            
            if (enc === 'nopass') {
                formattedData = `WIFI:S:${escape(ssid)};T:nopass;H:${hidden};;`;
            } else {
                formattedData = `WIFI:S:${escape(ssid)};T:${enc};P:${escape(pass)};H:${hidden};;`;
            }

        } else if (state.activeTab === 'url') {
            let url = document.getElementById('url-input').value;
            
            if (!url) {
                url = 'https://qr.krets.com';
            } else {
                if (!url.match(/^[a-zA-Z]+:\/\//)) {
                    url = 'https://' + url;
                }
            }
            formattedData = url;

        } else if (state.activeTab === 'vcard') {
            // Helper to get value only if visible
            const getVal = (id) => {
                const el = document.getElementById(id);
                if (!el) return '';
                
                // Check if group is collapsed
                const group = el.closest('.vcard-group');
                if (group && group.classList.contains('collapsed')) return '';

                return el.value;
            };

            const pfx = getVal('vc-prefix');
            const fn = getVal('vc-fn');
            const mn = getVal('vc-mn');
            const ln = getVal('vc-ln');
            const sfx = getVal('vc-suffix');
            
            const nickname = getVal('vc-nickname');
            const org = getVal('vc-org');
            const title = getVal('vc-title');
            const email = getVal('vc-email');
            
            const telM = getVal('vc-tel-m');
            const telW = getVal('vc-tel-w');
            const fax = getVal('vc-fax');
            const website = getVal('vc-web');
            
            const adr = getVal('vc-adr');
            const zip = getVal('vc-zip');
            const city = getVal('vc-city');
            const stateCode = getVal('vc-state');
            const country = getVal('vc-country');
            
            const bday = getVal('vc-bday');

            const hasName = pfx || fn || mn || ln || sfx;
            const nStr = hasName ? `N:${ln};${fn};${mn};${pfx};${sfx}` : '';
            const fnStr = hasName ? `FN:${[pfx, fn, mn, ln, sfx].filter(Boolean).join(' ')}` : '';

            const adrString = (adr || zip || city || stateCode || country) 
                ? `ADR:;;${adr};${city};${stateCode};${zip};${country}` 
                : '';

            formattedData = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                nStr,
                fnStr,
                nickname ? `NICKNAME:${nickname}` : '',
                title ? `TITLE:${title}` : '',
                org ? `ORG:${org}` : '',
                email ? `EMAIL:${email}` : '',
                telM ? `TEL;TYPE=CELL,VOICE:${telM}` : '',
                telW ? `TEL;TYPE=WORK,VOICE:${telW}` : '',
                fax ? `TEL;TYPE=FAX:${fax}` : '',
                website ? `URL:${website}` : '',
                adrString,
                bday ? `BDAY:${bday}` : '',
                'END:VCARD'
            ].filter(Boolean).join('\n');
        }

        state.data = formattedData;
        const rawEl = document.getElementById('raw-data');
        if (rawEl) rawEl.value = formattedData;
    }

    // --- QR Core ---
    function updateQR() {
        if (!state.data) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        try {
            const qr = qrcode(0, state.settings.errorCorrection);
            qr.addData(state.data);
            qr.make();
            const moduleCount = qr.getModuleCount();
            renderCanvas(qr, moduleCount);
            updateDownloadScaleLabels(moduleCount);
        } catch (e) {
            console.error("QR Generation Error:", e);
        }
    }

    function updateDownloadScaleLabels(count) {
        const scaleSelect = document.getElementById('download-scale');
        if (!scaleSelect || !count) return;

        const cellSize = state.settings.moduleSize || 15;
        const baseMargin = cellSize * 2;
        const topFontSize = parseInt(state.settings.labelTop.size) || 20;
        const bottomFontSize = parseInt(state.settings.labelBottom.size) || 20;
        const userPadding = parseInt(state.settings.padding) || 0;
        
        const marginTop = state.settings.labelTop.text ? Math.max(baseMargin, topFontSize * 1.8) : baseMargin;
        const marginBottom = state.settings.labelBottom.text ? Math.max(baseMargin, bottomFontSize * 1.8) : baseMargin;
        const marginLeft = baseMargin;
        const marginRight = baseMargin;
        
        const size = count * cellSize;
        const baseWidth = size + marginLeft + marginRight + (userPadding * 2);
        const baseHeight = size + marginTop + marginBottom + (userPadding * 2);

        const options = scaleSelect.options;
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            const scale = parseInt(opt.value) || 1;
            const w = Math.round(baseWidth * scale);
            const h = Math.round(baseHeight * scale);
            
            let label = '';
            if (scale === 1) label = `1x (${w}x${h}px - Screen)`;
            else if (scale === 2) label = `2x (${w}x${h}px - Print Low)`;
            else if (scale === 4) label = `4x (${w}x${h}px - Print Med)`;
            else if (scale === 8) label = `8x (${w}x${h}px - Print High)`;
            else if (scale === 12) label = `12x (${w}x${h}px - Print Ultra)`;
            else if (scale === 16) label = `16x (${w}x${h}px - Vector-like)`;
            else label = `${scale}x (${w}x${h}px)`;
            
            opt.textContent = label;
        }
    }

    // --- Rendering Pipeline ---
    function renderCanvas(qr, count, targetCanvas = canvas, targetCtx = ctx, scale = 1) {
        const cellSize = state.settings.moduleSize || 15;
        const baseMargin = cellSize * 2; 
        
        const topFontSize = parseInt(state.settings.labelTop.size) || 20;
        const bottomFontSize = parseInt(state.settings.labelBottom.size) || 20;
        
        const userPadding = parseInt(state.settings.padding) || 0;
        
        const marginTop = state.settings.labelTop.text ? Math.max(baseMargin, topFontSize * 1.8) : baseMargin;
        const marginBottom = state.settings.labelBottom.text ? Math.max(baseMargin, bottomFontSize * 1.8) : baseMargin;
        const marginLeft = baseMargin;
        const marginRight = baseMargin;
        
        const size = count * cellSize;
        
        // Set canvas size scaled up
        targetCanvas.width = (size + marginLeft + marginRight + (userPadding * 2)) * scale;
        targetCanvas.height = (size + marginTop + marginBottom + (userPadding * 2)) * scale;

        // Scale context so all drawing operations are scaled automatically
        if (scale !== 1) {
            targetCtx.scale(scale, scale);
        }

        targetCtx.fillStyle = state.settings.colorBg;
        targetCtx.fillRect(0, 0, size + marginLeft + marginRight + (userPadding * 2), size + marginTop + marginBottom + (userPadding * 2));

        const startX = marginLeft + userPadding;
        const startY = marginTop + userPadding;

        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (!qr.isDark(r, c)) continue;

                const isFinder = (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
                if (isFinder) continue;

                // Skip drawing module if it's in the logo area!
                if (state.settings.overlayImage && isCellInLogoArea(r, c, count, state.settings.logoSize)) {
                    continue;
                }
                
                targetCtx.fillStyle = state.settings.colorFg;
                const x = startX + (c * cellSize);
                const y = startY + (r * cellSize);
                drawModule(targetCtx, x, y, cellSize, state.settings.shapeModule);
            }
        }

        drawFinderPattern(targetCtx, startX, startY, cellSize, 0, 0, state.settings.shapeFinder); 
        drawFinderPattern(targetCtx, startX + (count - 7) * cellSize, startY, cellSize, 0, 0, state.settings.shapeFinder); 
        drawFinderPattern(targetCtx, startX, startY + (count - 7) * cellSize, cellSize, 0, 0, state.settings.shapeFinder); 

        // Draw Logo Overlay
        if (state.logoImageObject) {
            const centerX = startX + (size / 2);
            const centerY = startY + (size / 2);
            const logoSizePercent = parseInt(state.settings.logoSize) || 20;
            const maxLogoSize = size * (logoSizePercent / 100);
            
            let logoW = maxLogoSize;
            let logoH = maxLogoSize;
            const imgAspect = state.logoImageObject.width / state.logoImageObject.height;
            if (imgAspect > 1) {
                logoH = maxLogoSize / imgAspect;
            } else {
                logoW = maxLogoSize * imgAspect;
            }

            // Draw background shape
            const logoBgShape = state.settings.logoShape || 'none';
            const logoPadding = parseInt(state.settings.logoPadding) || 4;
            const bgSize = maxLogoSize + logoPadding * 2;

            if (logoBgShape !== 'none') {
                targetCtx.fillStyle = state.settings.colorBg;
                targetCtx.beginPath();
                if (logoBgShape === 'circle') {
                    targetCtx.arc(centerX, centerY, bgSize / 2, 0, Math.PI * 2);
                } else if (logoBgShape === 'rounded') {
                    const radius = cellSize * 0.8;
                    targetCtx.roundRect(centerX - bgSize / 2, centerY - bgSize / 2, bgSize, bgSize, radius);
                } else { // square
                    targetCtx.rect(centerX - bgSize / 2, centerY - bgSize / 2, bgSize, bgSize);
                }
                targetCtx.fill();
            }

            // Draw the image logo
            targetCtx.drawImage(state.logoImageObject, centerX - logoW / 2, centerY - logoH / 2, logoW, logoH);
        }

        drawLabels(targetCanvas, targetCtx, startX, size, marginTop, marginBottom, userPadding);
    }

    function drawModule(targetCtx, x, y, size, shape) {
        targetCtx.beginPath();
        if (shape === 'dots') {
            targetCtx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
        } else if (shape === 'rounded') {
            const r = size * 0.35;
            targetCtx.roundRect(x + 0.5, y + 0.5, size - 1, size - 1, r);
        } else {
            targetCtx.rect(x, y, size, size);
        }
        targetCtx.fill();
    }

    function drawFinderPattern(targetCtx, x, y, cellSize, r, c, shape) {
        const size = cellSize * 7;
        const fg = state.settings.colorFg;
        const bg = state.settings.colorBg;

        targetCtx.fillStyle = fg;
        drawBox(targetCtx, x, y, size, cellSize, shape);

        targetCtx.fillStyle = bg;
        drawBox(targetCtx, x + cellSize, y + cellSize, cellSize * 5, cellSize, shape);

        targetCtx.fillStyle = fg;
        const coreSize = cellSize * 3;
        const coreOffset = cellSize * 2;
        if (shape === 'dots') {
            targetCtx.beginPath();
            targetCtx.arc(x + size / 2, y + size / 2, coreSize / 2, 0, Math.PI * 2);
            targetCtx.fill();
        } else if (shape === 'rounded') {
            targetCtx.beginPath();
            targetCtx.roundRect(x + coreOffset, y + coreOffset, coreSize, coreSize, cellSize * 0.8);
            targetCtx.fill();
        } else {
            targetCtx.fillRect(x + coreOffset, y + coreOffset, coreSize, coreSize);
        }
    }

    function drawBox(targetCtx, x, y, size, thickness, shape) {
        if (shape === 'dots') {
            targetCtx.beginPath();
            targetCtx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
            targetCtx.arc(x + size / 2, y + size / 2, (size / 2) - thickness, 0, Math.PI * 2, true);
            targetCtx.fill();
        } else if (shape === 'rounded') {
            targetCtx.beginPath();
            const rOuter = thickness * 1.5;
            const rInner = Math.max(0, rOuter - thickness);
            targetCtx.roundRect(x, y, size, size, rOuter);
            targetCtx.roundRect(x + thickness, y + thickness, size - thickness * 2, size - thickness * 2, rInner);
            targetCtx.fill('evenodd');
        } else {
            targetCtx.fillRect(x, y, size, size);
            const lastColor = targetCtx.fillStyle;
            targetCtx.fillStyle = state.settings.colorBg;
            targetCtx.fillRect(x + thickness, y + thickness, size - thickness * 2, size - thickness * 2);
            targetCtx.fillStyle = lastColor;
        }
    }

    function drawLabels(targetCanvas, targetCtx, startX, qrSize, marginTop, marginBottom, userPadding) {
        const unscaledWidth = qrSize + (state.settings.moduleSize * 4) + (userPadding * 2);
        const unscaledHeight = qrSize + marginTop + marginBottom + (userPadding * 2);
        const centerX = unscaledWidth / 2;
        
        const renderLabel = (labelState, yPos) => {
            if (!labelState.text) return;
            
            targetCtx.fillStyle = labelState.color;
            targetCtx.font = `bold ${labelState.size || 20}px "${labelState.font}", sans-serif`; 
            targetCtx.textBaseline = 'middle';

            let xPos = centerX;
            if (labelState.align === 'left') {
                xPos = startX; 
                targetCtx.textAlign = 'left';
            } else if (labelState.align === 'right') {
                xPos = startX + qrSize;
                targetCtx.textAlign = 'right';
            } else {
                targetCtx.textAlign = 'center';
            }
            
            targetCtx.fillText(labelState.text, xPos, yPos);
        };

        if (state.settings.labelTop.text) {
            renderLabel(state.settings.labelTop, userPadding + (marginTop / 2));
        }

        if (state.settings.labelBottom.text) {
            const y = unscaledHeight - userPadding - (marginBottom / 2);
            renderLabel(state.settings.labelBottom, y);
        }
    }

    function handleScannerFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                if (typeof jsQR === 'undefined') {
                    alert('QR Decoder library not loaded yet. Please try again in a moment.');
                    return;
                }

                let code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (!code) {
                    for (let i = 0; i < imageData.data.length; i += 4) {
                        imageData.data[i] = 255 - imageData.data[i];
                        imageData.data[i+1] = 255 - imageData.data[i+1];
                        imageData.data[i+2] = 255 - imageData.data[i+2];
                    }
                    code = jsQR(imageData.data, imageData.width, imageData.height);
                }

                const resultArea = document.getElementById('scanner-result');
                const decodedText = document.getElementById('decoded-text');

                readPNGMetadata(file, "App-State").then(jsonState => {
                    if (jsonState) {
                        try {
                            const loadedState = JSON.parse(jsonState);
                            restoreState(loadedState);
                            alert("QR Styling and Data restored! You can now edit this QR code.");
                            return; 
                        } catch (e) {
                            console.error("Failed to parse App-State", e);
                        }
                    }

                    if (code) {
                        resultArea.style.display = 'block';
                        decodedText.value = code.data;
                    } else {
                        readPNGMetadata(file, "Description").then(desc => {
                            if (desc) {
                                resultArea.style.display = 'block';
                                decodedText.value = desc + " (Recovered from file metadata)";
                            } else {
                                alert("Could not find a QR code in this image.");
                            }
                        });
                    }
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function readPNGMetadata(file, keyToFind) {
        return new Promise((resolve, reject) => {
            if (file.type !== 'image/png') {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const view = new DataView(e.target.result);
                    if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) {
                        resolve(null);
                        return;
                    }
                    let offset = 8;
                    while (offset < view.byteLength) {
                        const length = view.getUint32(offset);
                        const type = new TextDecoder().decode(new Uint8Array(e.target.result, offset + 4, 4));
                        if (type === 'tEXt') {
                            const data = new Uint8Array(e.target.result, offset + 8, length);
                            let nullIndex = -1;
                            for (let i = 0; i < data.length; i++) {
                                if (data[i] === 0) { nullIndex = i; break; }
                            }
                            if (nullIndex !== -1) {
                                const key = new TextDecoder().decode(data.subarray(0, nullIndex));
                                const value = new TextDecoder().decode(data.subarray(nullIndex + 1));
                                if (key === keyToFind) { resolve(value); return; }
                            }
                        }
                        offset += 4 + 4 + length + 4;
                    }
                    resolve(null);
                } catch (err) { resolve(null); }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function migrateState(loadedState) {
        if (!loadedState) return null;
        
        if (loadedState.types) {
            Object.keys(loadedState.types).forEach(type => {
                loadedState.types[type].settings = {
                    ...defaultSettings,
                    ...loadedState.types[type].settings
                };
            });
            return loadedState;
        }

        const newState = {
            activeTab: loadedState.activeTab || 'vcard',
            types: {
                vcard: createDefaultTypeState(),
                url: createDefaultTypeState(),
                wifi: createDefaultTypeState(),
                raw: createDefaultTypeState()
            }
        };

        const active = newState.activeTab;
        if (loadedState.settings) {
            newState.types[active].settings = {
                ...newState.types[active].settings,
                ...loadedState.settings
            };
        }
        if (loadedState.inputValues) {
            Object.entries(loadedState.inputValues).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el) {
                    const pane = el.closest('.tab-pane');
                    if (pane) {
                        const tabType = pane.id.replace('tab-', '');
                        if (newState.types[tabType]) {
                            newState.types[tabType].inputValues[id] = val;
                        }
                    } else {
                        newState.types[active].inputValues[id] = val;
                    }
                }
            });
        }
        
        return newState;
    }

    function restoreState(loadedState) {
        const migrated = migrateState(loadedState);
        if (!migrated) return;

        state.activeTab = migrated.activeTab || 'raw';
        Object.keys(migrated.types).forEach(type => {
            state.types[type] = migrated.types[type];
        });

        const tabBtn = document.querySelector(`.tab-btn[data-tab="${state.activeTab}"]`);
        if (tabBtn) {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            tabBtn.classList.add('active');
            const targetPane = document.getElementById(`tab-${state.activeTab}`);
            if (targetPane) targetPane.classList.add('active');
        }

        restoreUIFromActiveTab();

        if (state.activeTab !== 'raw') {
            updateDataFromInputs();
        } else {
            const rawEl = document.getElementById('raw-data');
            if (rawEl) state.data = rawEl.value;
        }

        updateQR();
        saveToLocalStorage();
    }

    function restoreUIFromActiveTab() {
        const active = getActiveType();
        const settings = state.types[active].settings;
        const inputVals = state.types[active].inputValues;

        setVal('color-fg', settings.colorFg);
        setVal('color-bg', settings.colorBg);
        setVal('qr-padding', settings.padding);
        setVal('qr-size', settings.moduleSize);
        setVal('shape-finder', settings.shapeFinder);
        setVal('shape-module', settings.shapeModule);
        setVal('qr-error', settings.errorCorrection);

        if (settings.labelTop) {
            setVal('label-top-text', settings.labelTop.text || '');
            setVal('label-top-color', settings.labelTop.color || '#000000');
            setVal('label-top-align', settings.labelTop.align || 'center');
            setVal('label-top-font', settings.labelTop.font || 'sans-serif');
            setVal('label-top-size', settings.labelTop.size || 20);
        }
        if (settings.labelBottom) {
            setVal('label-bottom-text', settings.labelBottom.text || '');
            setVal('label-bottom-color', settings.labelBottom.color || '#000000');
            setVal('label-bottom-align', settings.labelBottom.align || 'center');
            setVal('label-bottom-font', settings.labelBottom.font || 'sans-serif');
            setVal('label-bottom-size', settings.labelBottom.size || 20);
        }

        setVal('logo-size', settings.logoSize || 20);
        setVal('logo-shape', settings.logoShape || 'none');
        setVal('logo-padding', settings.logoPadding || 4);

        updateLogoPreviewAndImage(settings.overlayImage);

        const activePane = document.getElementById(`tab-${active}`);
        if (activePane) {
            const inputs = activePane.querySelectorAll('input, select, textarea');
            inputs.forEach(el => {
                if (el.id) {
                    const savedVal = inputVals[el.id];
                    if (savedVal !== undefined) {
                        if (el.type === 'checkbox') {
                            el.checked = savedVal;
                        } else {
                            el.value = savedVal;
                        }
                    } else {
                        // If it's URL input, set its default if DOM is empty
                        if (el.id === 'url-input' && !el.value) {
                            el.value = 'https://qr.krets.com';
                        }
                        // Sync current DOM value to state
                        inputVals[el.id] = el.type === 'checkbox' ? el.checked : el.value;
                    }
                    
                    const valStr = (el.value || '').toString();
                    if (valStr.trim() !== '') {
                        const wrapper = el.closest('.name-field-wrapper');
                        if (wrapper && wrapper.classList.contains('hidden')) {
                            wrapper.classList.remove('hidden');
                        }
                        const group = el.closest('.vcard-group');
                        if (group && group.classList.contains('collapsed')) {
                            group.classList.remove('collapsed');
                        }
                    }
                }
            });
        }
        
        updateLogoWarning(settings.errorCorrection, settings.overlayImage);
    }

    function updateLogoPreviewAndImage(overlayImage) {
        const thumbnail = document.getElementById('logo-preview-thumbnail');
        const placeholder = document.getElementById('logo-placeholder-text');
        const removeBtn = document.getElementById('logo-remove-btn');

        if (!thumbnail) return;

        if (overlayImage) {
            thumbnail.src = overlayImage;
            thumbnail.style.display = 'block';
            placeholder.style.display = 'none';
            removeBtn.style.display = 'block';

            if (!state.logoImageObject || state.logoImageObject.src !== overlayImage) {
                const img = new Image();
                img.onload = () => {
                    state.logoImageObject = img;
                    updateQR();
                };
                img.src = overlayImage;
            }
        } else {
            thumbnail.src = '';
            thumbnail.style.display = 'none';
            placeholder.style.display = 'block';
            removeBtn.style.display = 'none';
            state.logoImageObject = null;
        }
    }

    function handleLogoFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 512;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = w;
                tempCanvas.height = h;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, w, h);

                const base64 = tempCanvas.toDataURL('image/png');
                
                state.settings.overlayImage = base64;
                state.logoImageObject = img;

                updateLogoPreviewAndImage(base64);
                updateLogoWarning(state.settings.errorCorrection, base64);
                
                updateQR();
                saveToLocalStorage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function setupLogoOverlay() {
        const dropZone = document.getElementById('logo-drop-zone');
        const fileInput = document.getElementById('logo-file-input');
        const removeBtn = document.getElementById('logo-remove-btn');

        if (!dropZone) return;

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleLogoFile(e.target.files[0]);
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleLogoFile(files[0]);
            }
        });

        document.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    handleLogoFile(blob);
                    break;
                }
            }
        });

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering file upload dialog on container
            state.settings.overlayImage = null;
            state.logoImageObject = null;
            updateLogoPreviewAndImage(null);
            updateLogoWarning(state.settings.errorCorrection, null);
            updateQR();
            saveToLocalStorage();
        });
    }

    function updateLogoWarning(errorCorrection, overlayImage) {
        const warning = document.getElementById('logo-warning');
        if (!warning) return;
        if (overlayImage && errorCorrection === 'L') {
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }

    function getActiveType() {
        return (state.activeTab === 'scanner') ? 'vcard' : state.activeTab;
    }

    function isCellInLogoArea(r, c, count, logoSizePercent) {
        const maxLogoModules = count - 14; 
        let logoModules = Math.floor(count * (logoSizePercent / 100));
        if (logoModules % 2 !== count % 2) {
            logoModules = Math.max(1, logoModules - 1);
        }
        logoModules = Math.min(maxLogoModules, Math.max(3, logoModules));
        
        const centerStart = (count - logoModules) / 2;
        const centerEnd = centerStart + logoModules;
        
        return r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd;
    }

    function updateSliderBadge(id, val) {
        const badge = document.getElementById(`${id}-val`);
        if (badge) {
            badge.textContent = val;
        }
        const numInput = document.getElementById(`${id}-num`);
        if (numInput) {
            numInput.value = val;
        }
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = val;
            } else {
                el.value = val;
            }
            updateSliderBadge(id, val);
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function exportPNG() {
        const scaleSelect = document.getElementById('download-scale');
        const scale = parseInt(scaleSelect ? scaleSelect.value : 4) || 4;

        const hash = await simpleHash(state.data);
        const filename = `qr_${hash}.png`;

        try {
            const qr = qrcode(0, state.settings.errorCorrection);
            qr.addData(state.data);
            qr.make();
            const moduleCount = qr.getModuleCount();

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            renderCanvas(qr, moduleCount, tempCanvas, tempCtx, scale);

            tempCanvas.toBlob(async (blob) => {
                const appState = JSON.stringify(state);
                let newBlob = await addMetadataToPNG(blob, "Description", state.data);
                newBlob = await addMetadataToPNG(newBlob, "App-State", appState);
                const url = URL.createObjectURL(newBlob);
                const link = document.createElement('a');
                link.download = filename;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, 'image/png');
        } catch (e) {
            console.error("Failed to export PNG", e);
        }
    }

    async function addMetadataToPNG(blob, key, text) {
        const buffer = await blob.arrayBuffer();
        const data = new Uint8Array(buffer);
        const keyEncoded = new TextEncoder().encode(key);
        const textEncoded = new TextEncoder().encode(text);
        const chunkData = new Uint8Array(keyEncoded.length + 1 + textEncoded.length);
        chunkData.set(keyEncoded, 0);
        chunkData[keyEncoded.length] = 0;
        chunkData.set(textEncoded, keyEncoded.length + 1);
        const length = chunkData.length;
        const typeEncoded = new TextEncoder().encode("tEXt");
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) { if (c & 1) c = 0xedb88320 ^ (c >>> 1); else c = c >>> 1; }
            crcTable[n] = c;
        }
        function updateCrc(crc, buf) {
            let c = crc;
            for (let n = 0; n < buf.length; n++) { c = crcTable[(c ^ buf[n]) & 0xff] ^ (c >>> 8); }
            return c;
        }
        let crc = updateCrc(0xffffffff, typeEncoded);
        crc = updateCrc(crc, chunkData) ^ 0xffffffff;
        const fullChunk = new Uint8Array(4 + 4 + length + 4);
        const view = new DataView(fullChunk.buffer);
        view.setUint32(0, length, false);
        fullChunk.set(typeEncoded, 4);
        fullChunk.set(chunkData, 8);
        view.setUint32(8 + length, crc, false);
        const finalData = new Uint8Array(data.length + fullChunk.length);
        finalData.set(data.subarray(0, 33), 0);
        finalData.set(fullChunk, 33);
        finalData.set(data.subarray(33), 33 + fullChunk.length);
        return new Blob([finalData], { type: 'image/png' });
    }

    // --- PWA Share Target & vCard Parser Logic ---
    async function checkForSharedVCard() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('received-share')) {
            try {
                const cache = await caches.open('shared-vcard-cache');
                const response = await cache.match('/shared-vcard.vcf');
                if (response) {
                    const text = await response.text();
                    await cache.delete('/shared-vcard.vcf'); // Clear cache
                    
                    const vcardData = parseVCard(text);
                    populateVCardUI(vcardData);
                    
                    // Clean up URL query parameters
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (err) {
                console.error('Error retrieving shared contact:', err);
            }
        }
    }

    function parseVCard(text) {
        const lines = text.split(/\r?\n/);
        const data = {};
        const unescape = (val) => val.replace(/\\;/g, ';').replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            
            const keySection = line.substring(0, colonIndex).toUpperCase();
            const value = unescape(line.substring(colonIndex + 1));
            const key = keySection.split(';')[0];
            
            if (key === 'N') {
                const parts = value.split(';');
                data.ln = parts[0] || '';
                data.fn = parts[1] || '';
                data.mn = parts[2] || '';
                data.prefix = parts[3] || '';
                data.suffix = parts[4] || '';
            } else if (key === 'NICKNAME') {
                data.nickname = value;
            } else if (key === 'TITLE') {
                data.title = value;
            } else if (key === 'ORG') {
                data.org = value;
            } else if (key === 'EMAIL') {
                data.email = value;
            } else if (key === 'TEL') {
                const type = keySection.toLowerCase();
                if (type.includes('cell') || type.includes('mobile')) {
                    data.telM = value;
                } else if (type.includes('fax')) {
                    data.fax = value;
                } else if (type.includes('work')) {
                    data.telW = value;
                } else {
                    if (!data.telM) data.telM = value;
                    else if (!data.telW) data.telW = value;
                }
            } else if (key === 'URL') {
                data.website = value;
            } else if (key === 'ADR') {
                const parts = value.split(';');
                data.adr = parts[2] || '';
                data.city = parts[3] || '';
                data.state = parts[4] || '';
                data.zip = parts[5] || '';
                data.country = parts[6] || '';
            } else if (key === 'BDAY') {
                data.bday = value;
            }
        }
        return data;
    }

    function populateVCardUI(data) {
        const vcardTabBtn = document.querySelector('.tab-btn[data-tab="vcard"]');
        if (vcardTabBtn) {
            vcardTabBtn.click();
        }

        const mapping = {
            'vc-prefix': data.prefix,
            'vc-fn': data.fn,
            'vc-mn': data.mn,
            'vc-ln': data.ln,
            'vc-suffix': data.suffix,
            'vc-nickname': data.nickname,
            'vc-title': data.title,
            'vc-org': data.org,
            'vc-email': data.email,
            'vc-tel-m': data.telM,
            'vc-tel-w': data.telW,
            'vc-fax': data.fax,
            'vc-web': data.website,
            'vc-adr': data.adr,
            'vc-zip': data.zip,
            'vc-city': data.city,
            'vc-state': data.state,
            'vc-country': data.country,
            'vc-bday': data.bday
        };

        Object.entries(mapping).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = val || '';
            state.inputValues[id] = el.value;

            if (el.value.trim() !== '') {
                const group = el.closest('.vcard-group');
                if (group && group.classList.contains('collapsed')) {
                    group.classList.remove('collapsed');
                }
            }
        });

        updateDataFromInputs();
        updateQR();
        saveToLocalStorage();
    }

    async function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }
});