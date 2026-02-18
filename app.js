/**
 * QR Code Generator - qr.krets.com
 * Vanilla JS Implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        activeTab: 'vcard',
        data: '',
        inputValues: {},
        settings: {
            errorCorrection: 'M',
            colorFg: '#000000',
            colorBg: '#ffffff',
            shapeModule: 'square',
            shapeFinder: 'square',
            padding: 0,
            moduleSize: 15,
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
        setupTabs();
        setupInputs();
        setupVCardUI(); // New UI Logic for vCard
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
    }

    // --- vCard UI Logic ---
    function setupVCardUI() {
        // 1. Group Toggling
        const groups = document.querySelectorAll('.vcard-group');
        groups.forEach(group => {
            const header = group.querySelector('.group-header');
            if (!header) return;

            header.addEventListener('click', () => {
                group.classList.toggle('collapsed');
                updateDataFromInputs(); // Re-generate data to include/exclude fields
                updateQR();
            });
        });

        // 2. Name Row "Add Field" Logic
        const container = document.getElementById('name-container');
        if (!container) return;

        // Elements
        const wrapPrefix = document.getElementById('wrap-prefix');
        const wrapFn = document.getElementById('wrap-fn');
        const wrapMn = document.getElementById('wrap-mn');
        const wrapLn = document.getElementById('wrap-ln');
        const wrapSuffix = document.getElementById('wrap-suffix');
        const uiOverlay = document.getElementById('name-ui-overlay');
        let hideTimeout;

        // Create Buttons dynamically
        const btnPrefix = createAddBtn('Add Prefix', () => showField(wrapPrefix, btnPrefix));
        const btnMiddle = createAddBtn('Add Middle', () => showField(wrapMn, btnMiddle));
        const btnSuffix = createAddBtn('Add Suffix', () => showField(wrapSuffix, btnSuffix));
        const divider = document.createElement('div');
        divider.className = 'name-divider-line';

        uiOverlay.appendChild(btnPrefix);
        uiOverlay.appendChild(btnMiddle);
        uiOverlay.appendChild(btnSuffix);
        uiOverlay.appendChild(divider);

        // Hover Logic
        container.addEventListener('mousemove', (e) => {
            clearTimeout(hideTimeout); // Cancel pending hide
            
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            // Get positions of visible main fields
            const rectFn = wrapFn.getBoundingClientRect();
            const rectLn = wrapLn.getBoundingClientRect();

            // Offsets relative to container
            const fnLeft = rectFn.left - rect.left;
            const fnRight = rectFn.right - rect.left;
            const lnLeft = rectLn.left - rect.left;
            const lnRight = rectLn.right - rect.left;

            // Reset only if we are moving to a new zone, but let's just recalculate
            // Actually, we should only hide if we are NOT in a zone
            let inZone = false;

            // 1. Left of FN -> Prefix
            if (!isVisible(wrapPrefix) && x >= fnLeft && x <= fnLeft + (rectFn.width * 0.3)) {
                showAddUI(btnPrefix, divider, fnLeft);
                inZone = true;
            }
            // 2. Right of FN or Left of LN -> Middle
            else if (!isVisible(wrapMn) && x >= fnRight - (rectFn.width * 0.3) && x <= lnLeft + (rectLn.width * 0.3)) {
                const midX = (fnRight + lnLeft) / 2;
                const targetX = (lnLeft - fnRight < 10) ? fnRight : midX;
                showAddUI(btnMiddle, divider, targetX);
                inZone = true;
            }
            // 3. Right of LN -> Suffix
            else if (!isVisible(wrapSuffix) && x >= lnRight - (rectLn.width * 0.3) && x <= lnRight) {
                showAddUI(btnSuffix, divider, lnRight);
                inZone = true;
            }

            if (!inZone) {
                // If not in a trigger zone, we might be moving towards the button
                // But we don't want to hide immediately if we are ON the button
                // The button has pointer-events: auto when visible, so it captures mouse events?
                // Actually, the button is inside uiOverlay inside container, so mousemove bubbles.
                // We can check if e.target is a button.
                if (e.target.classList.contains('name-adder-btn')) {
                    // Do nothing, keep visible
                } else {
                    // We are in container but not in zone. Hide after short delay?
                    // Or hide immediately? User said "mouseout happens before button is touched".
                    // If we hide immediately here, the user can't reach the button if it's slightly offset.
                    // But our CSS update put the button inside the padding area which is part of container.
                    // So mousemove should still fire.
                    hideAllAddUI(); 
                }
            }
        });

        container.addEventListener('mouseleave', () => {
            // Delay hiding to allow moving to button if it was somehow outside (it shouldn't be now)
            // But good for UX anyway
            hideTimeout = setTimeout(() => {
                hideAllAddUI();
            }, 300);
        });
        
        // Also keep visible if hovering the button itself (extra safety if button moves outside)
        [btnPrefix, btnMiddle, btnSuffix].forEach(btn => {
             btn.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
             btn.addEventListener('mouseleave', () => {
                 hideTimeout = setTimeout(() => hideAllAddUI(), 300);
             });
        });

        function createAddBtn(text, onClick) {
            const btn = document.createElement('div');
            btn.className = 'name-adder-btn';
            btn.textContent = text;
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent trigger from firing again immediately
                onClick();
            });
            return btn;
        }

        function showField(wrapper, btn) {
            wrapper.classList.remove('hidden');
            // Hide specific button UI immediately
            btn.classList.remove('visible');
            divider.classList.remove('visible');
            updateDataFromInputs();
            updateQR();
        }

        function isVisible(el) {
            return !el.classList.contains('hidden');
        }

        function showAddUI(btn, line, xPos) {
            // Hide others first
            [btnPrefix, btnMiddle, btnSuffix].forEach(b => {
                if (b !== btn) b.classList.remove('visible');
            });
            
            btn.classList.add('visible');
            line.classList.add('visible');
            
            // Position Line
            line.style.left = `${xPos}px`;
            
            // Position Button (Centered above line)
            btn.style.left = `${xPos}px`;
            btn.style.transform = `translateX(-50%) translateY(0)`;
        }

        function hideAllAddUI() {
            [btnPrefix, btnMiddle, btnSuffix].forEach(b => {
                b.classList.remove('visible');
                b.style.transform = `translateX(-50%) translateY(5px)`;
            });
            divider.classList.remove('visible');
        }
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
            'qr-size': 'moduleSize'
        };

        Object.entries(stylingInputs).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', debounce(() => {
                let val = el.value;
                if (key === 'padding' || key === 'moduleSize') val = parseInt(val) || 0;
                state.settings[key] = val;
                
                if (id === 'qr-error') updateErrorHelpText(el.value);
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
            { id: 'label-bottom-text', parent: 'labelBottom', key: 'text' },
            { id: 'label-bottom-align', parent: 'labelBottom', key: 'align' },
            { id: 'label-bottom-color', parent: 'labelBottom', key: 'color' },
            { id: 'label-bottom-font', parent: 'labelBottom', key: 'font' }
        ];

        labelInputs.forEach(item => {
            const el = document.getElementById(item.id);
            if (!el) return;
            const eventType = (item.key === 'font' || item.key === 'text') ? 'input' : 'change';
            
            el.addEventListener(eventType, debounce(() => {
                state.settings[item.parent][item.key] = el.value;
                updateQR();
                saveToLocalStorage();
            }, 200));
        });

        downloadBtn.addEventListener('click', exportPNG);
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
                
                // 1. Check if group is collapsed
                const group = el.closest('.vcard-group');
                if (group && group.classList.contains('collapsed')) return '';

                // 2. Check if specific field wrapper is hidden (Name fields)
                const wrapper = el.closest('.name-field-wrapper');
                if (wrapper && wrapper.classList.contains('hidden')) return '';

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
        } catch (e) {
            console.error("QR Generation Error:", e);
        }
    }

    // --- Rendering Pipeline ---
    function renderCanvas(qr, count) {
        const cellSize = state.settings.moduleSize || 15;
        const baseMargin = cellSize * 2; 
        const labelMargin = cellSize * 4; 
        
        const userPadding = parseInt(state.settings.padding) || 0;
        
        const marginTop = state.settings.labelTop.text ? labelMargin : baseMargin;
        const marginBottom = state.settings.labelBottom.text ? labelMargin : baseMargin;
        const marginLeft = baseMargin;
        const marginRight = baseMargin;
        
        const size = count * cellSize;
        
        canvas.width = size + marginLeft + marginRight + (userPadding * 2);
        canvas.height = size + marginTop + marginBottom + (userPadding * 2);

        ctx.fillStyle = state.settings.colorBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const startX = marginLeft + userPadding;
        const startY = marginTop + userPadding;

        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (!qr.isDark(r, c)) continue;

                const isFinder = (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
                if (isFinder) continue;
                
                ctx.fillStyle = state.settings.colorFg;
                const x = startX + (c * cellSize);
                const y = startY + (r * cellSize);
                drawModule(ctx, x, y, cellSize, state.settings.shapeModule);
            }
        }

        drawFinderPattern(ctx, startX, startY, cellSize, 0, 0, state.settings.shapeFinder); 
        drawFinderPattern(ctx, startX + (count - 7) * cellSize, startY, cellSize, 0, 0, state.settings.shapeFinder); 
        drawFinderPattern(ctx, startX, startY + (count - 7) * cellSize, cellSize, 0, 0, state.settings.shapeFinder); 

        drawLabels(startX, size, marginTop, marginBottom, userPadding);
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

        ctx.fillStyle = fg;
        drawBox(ctx, x, y, size, cellSize, shape);

        ctx.fillStyle = bg;
        drawBox(ctx, x + cellSize, y + cellSize, cellSize * 5, cellSize, shape);

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

    function drawLabels(startX, qrSize, marginTop, marginBottom, userPadding) {
        const centerX = canvas.width / 2;
        
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
            renderLabel(state.settings.labelTop, userPadding + (marginTop / 2));
        }

        if (state.settings.labelBottom.text) {
            const y = canvas.height - userPadding - (marginBottom / 2);
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

    function restoreState(loadedState) {
        state.activeTab = loadedState.activeTab || 'raw';
        // We do NOT overwrite active data immediately; we let updateDataFromInputs regenerate it 
        // from the restored inputs to ensure consistency.
        
        // Merge settings
        state.settings = { ...state.settings, ...loadedState.settings };
        if (loadedState.settings.labelTop) state.settings.labelTop = { ...loadedState.settings.labelTop };
        if (loadedState.settings.labelBottom) state.settings.labelBottom = { ...loadedState.settings.labelBottom };

        const newValues = loadedState.inputValues || {};

        Object.entries(newValues).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) {
                // Determine if we should restore this field
                const parentTab = el.closest('.tab-pane');
                let shouldRestore = false;

                if (!parentTab) {
                    // Global setting (not in a tab) -> Always restore
                    shouldRestore = true;
                } else if (parentTab.id === `tab-${state.activeTab}`) {
                    // Input belongs to the active tab of the loaded QR -> Restore
                    shouldRestore = true;
                }

                if (shouldRestore) {
                    if (el.type === 'checkbox') {
                        el.checked = val;
                    } else {
                        el.value = val;
                    }
                    // Sync to current state
                    state.inputValues[id] = val;

                    // UI Logic: Auto-expand groups and unhide name fields if they have content
                    if (val && val.toString().trim() !== '') {
                        // 1. Unhide Name Fields
                        const wrapper = el.closest('.name-field-wrapper');
                        if (wrapper && wrapper.classList.contains('hidden')) {
                            wrapper.classList.remove('hidden');
                        }

                        // 2. Expand Groups
                        const group = el.closest('.vcard-group');
                        if (group && group.classList.contains('collapsed')) {
                            group.classList.remove('collapsed');
                        }
                    }
                }
            }
        });

        // Restore Settings UI (Redundant for inputs covered above, but ensures selects/color inputs are caught if ID didn't match inputValues key somehow, though it should)
        setVal('qr-error', state.settings.errorCorrection);
        setVal('color-fg', state.settings.colorFg);
        setVal('color-bg', state.settings.colorBg);
        setVal('shape-module', state.settings.shapeModule);
        setVal('shape-finder', state.settings.shapeFinder);
        setVal('qr-padding', state.settings.padding); 
        setVal('qr-size', state.settings.moduleSize);

        if (state.settings.labelTop) {
            setVal('label-top-text', state.settings.labelTop.text);
            setVal('label-top-align', state.settings.labelTop.align);
            setVal('label-top-color', state.settings.labelTop.color);
            setVal('label-top-font', state.settings.labelTop.font);
        }
        
        if (state.settings.labelBottom) {
            setVal('label-bottom-text', state.settings.labelBottom.text);
            setVal('label-bottom-align', state.settings.labelBottom.align);
            setVal('label-bottom-color', state.settings.labelBottom.color);
            setVal('label-bottom-font', state.settings.labelBottom.font);
        }

        // Switch Tab
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${state.activeTab}"]`);
        if (tabBtn) tabBtn.click();
        
        // Regenerate Data and QR
        if (state.activeTab !== 'raw') {
            updateDataFromInputs();
        } else {
            // For Raw tab, we must ensure state.data is set from the restored textarea
            state.data = document.getElementById('raw-data').value;
        }
        updateQR();
        saveToLocalStorage(); // Persist the restored state immediately
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function exportPNG() {
        const hash = await simpleHash(state.data);
        const filename = `qr_${hash}.png`;
        canvas.toBlob(async (blob) => {
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