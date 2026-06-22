<?php
$version = '20260218'; // Fallback
$gitRefPath = '.git/refs/heads/main';
if (file_exists($gitRefPath)) {
    $version = trim(file_get_contents($gitRefPath));
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Generator | qr.krets.com</title>
    <meta name="description" content="A simple, privacy-focused QR code generator. Generate vCards, Wi-Fi, and URL QR codes entirely in your browser.">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://qr.krets.com/">
    <meta property="og:title" content="QR Code Generator | qr.krets.com">
    <meta property="og:description" content="Generate custom QR codes for vCards, Wi-Fi networks, and URLs. No server-side processing, fully private.">
    <meta property="og:image" content="https://qr.krets.com/og-image.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://qr.krets.com/">
    <meta property="twitter:title" content="QR Code Generator | qr.krets.com">
    <meta property="twitter:description" content="Generate custom QR codes for vCards, Wi-Fi networks, and URLs. No server-side processing, fully private.">
    <meta property="twitter:image" content="https://qr.krets.com/og-image.png">

    <link rel="stylesheet" href="style.css?v=<?= $version ?>">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- LEFT PANEL: Title, Data Forms, Footer -->
        <aside class="left-panel">
            <header>
                <h1>qr.krets.com</h1>
            </header>

            <section class="controls-section">
                <div class="tabs">
                    <button class="tab-btn active" data-tab="vcard">vCard</button>
                    <button class="tab-btn" data-tab="url">URL</button>
                    <button class="tab-btn" data-tab="wifi">Wi-Fi</button>
                    <button class="tab-btn" data-tab="raw">Raw</button>
                    <button class="tab-btn" data-tab="scanner">Scanner</button>
                </div>

                <div class="tab-content">
                    <!-- vCard Tab -->
                    <div id="tab-vcard" class="tab-pane active">
                        
                        <!-- Name Group (Special Logic) -->
                        <div class="vcard-group" id="group-name">
                            <div class="group-header" title="Toggle visibility">Name</div>
                            <div class="group-content">
                                <div class="name-row-container" id="name-container">
                                    <!-- Hidden Inputs Helpers (UI) -->
                                    <div id="name-ui-overlay" class="name-ui-overlay"></div>

                                    <!-- Prefix -->
                                    <div class="name-field-wrapper hidden" id="wrap-prefix">
                                        <input type="text" id="vc-prefix" placeholder="Prefix">
                                    </div>
                                    
                                    <!-- First Name (Always Visible) -->
                                    <div class="name-field-wrapper" id="wrap-fn">
                                        <input type="text" id="vc-fn" placeholder="First Name">
                                    </div>

                                    <!-- Middle Name -->
                                    <div class="name-field-wrapper hidden" id="wrap-mn">
                                        <input type="text" id="vc-mn" placeholder="Middle">
                                    </div>

                                    <!-- Last Name (Always Visible) -->
                                    <div class="name-field-wrapper" id="wrap-ln">
                                        <input type="text" id="vc-ln" placeholder="Last Name">
                                    </div>

                                    <!-- Suffix -->
                                    <div class="name-field-wrapper hidden" id="wrap-suffix">
                                        <input type="text" id="vc-suffix" placeholder="Suffix">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Nickname Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">Nickname</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="text" id="vc-nickname" placeholder="Nickname">
                                </div>
                            </div>
                        </div>

                        <!-- Role/Org Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">Title & Organization</div>
                            <div class="group-content">
                                <div class="field-row">
                                    <div class="field" style="flex: 1;">
                                        <input type="text" id="vc-title" placeholder="Job Title / Role">
                                    </div>
                                    <div class="field" style="flex: 2;">
                                        <input type="text" id="vc-org" placeholder="Company / Organization">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Email Group -->
                        <div class="vcard-group">
                            <div class="group-header">Email</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="email" id="vc-email" placeholder="example@email.com">
                                </div>
                            </div>
                        </div>

                        <!-- Mobile Phone Group -->
                        <div class="vcard-group">
                            <div class="group-header">Mobile Phone</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="tel" id="vc-tel-m" placeholder="+1 234 567 8900">
                                </div>
                            </div>
                        </div>

                        <!-- Work Phone Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">Work Phone</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="tel" id="vc-tel-w" placeholder="Work Phone">
                                </div>
                            </div>
                        </div>

                        <!-- Fax Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">Fax</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="tel" id="vc-fax" placeholder="Fax Number">
                                </div>
                            </div>
                        </div>

                        <!-- URL Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">URL</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="url" id="vc-web" placeholder="https://your-website.com">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Address Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">Address</div>
                            <div class="group-content">
                                <div class="field">
                                    <label for="vc-adr" style="font-size: 0.75rem;">Street</label>
                                    <input type="text" id="vc-adr">
                                </div>
                                <div class="field-row compact-gap">
                                    <div class="field" style="flex: 1;">
                                        <label for="vc-zip" style="font-size: 0.75rem;">Zip</label>
                                        <input type="text" id="vc-zip">
                                    </div>
                                    <div class="field" style="flex: 2;">
                                        <label for="vc-city" style="font-size: 0.75rem;">City</label>
                                        <input type="text" id="vc-city">
                                    </div>
                                </div>
                                <div class="field-row compact-gap">
                                    <div class="field" style="flex: 1;">
                                        <label for="vc-state" style="font-size: 0.75rem;">State</label>
                                        <input type="text" id="vc-state">
                                    </div>
                                    <div class="field" style="flex: 1;">
                                        <label for="vc-country" style="font-size: 0.75rem;">Country</label>
                                        <input type="text" id="vc-country">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Birthday Group -->
                        <div class="vcard-group collapsed">
                            <div class="group-header">Birthday</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="date" id="vc-bday">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- URL Tab -->
                    <div id="tab-url" class="tab-pane">
                        <div class="field">
                            <label for="url-input">Website URL</label>
                            <input type="url" id="url-input" placeholder="https://qr.krets.com">
                        </div>
                    </div>

                    <!-- Wi-Fi Tab -->
                    <div id="tab-wifi" class="tab-pane">
                        <div class="field-row">
                            <div class="field" style="flex: 3;">
                                <label for="wifi-ssid">Network Name (SSID)</label>
                                <input type="text" id="wifi-ssid" placeholder="BER Airport Free Airport Wi-Fi">
                            </div>
                            <div class="field checkbox-field" style="flex: 1;">
                                <label>
                                    <input type="checkbox" id="wifi-hidden"> Hidden
                                </label>
                            </div>
                        </div>
                        <div class="field-row">
                            <div class="field" style="flex: 2;">
                                <label for="wifi-pass">Password</label>
                                <input type="password" id="wifi-pass">
                            </div>
                            <div class="field" style="flex: 1;">
                                <label for="wifi-enc">Type</label>
                                <select id="wifi-enc">
                                    <option value="WPA">WPA</option>
                                    <option value="WEP">WEP</option>
                                    <option value="nopass">None</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Raw Tab -->
                    <div id="tab-raw" class="tab-pane">
                        <div class="field">
                            <label for="raw-data">Raw Data Content</label>
                            <textarea id="raw-data" rows="8"></textarea>
                        </div>
                    </div>

                    <!-- Scanner Tab -->
                    <div id="tab-scanner" class="tab-pane">
                        <div class="scanner-upload-zone" id="drop-zone">
                            <p><strong>Drag & Drop QR Image</strong><br>or click to upload</p>
                            <p style="margin-top: 1rem; font-size: 0.75rem; line-height: 1.4; color: var(--muted-text);">
                                Images generated by this site store style choices in metadata. 
                                Settings will be restored if you upload an original image file.
                            </p>
                            <input type="file" id="qr-input-file" accept="image/*" style="display: none;">
                        </div>
                        <div id="scanner-result" class="scanner-result" style="display: none;">
                            <label>Decoded Content:</label>
                            <textarea id="decoded-text" readonly rows="8"></textarea>
                            <button id="copy-decoded" class="secondary-btn">Copy to Clipboard</button>
                        </div>
                    </div>
                </div>
            </section>

            <footer class="app-footer">
                <p>See a bug or just want to chat? Submit a request via <a href="https://github.com/krets/qr/issues" target="_blank" style="color: inherit; text-decoration: underline;">GitHub Issues</a>.</p>
            </footer>
        </aside>

        <!-- RIGHT PANEL: Preview & Visual Settings -->
        <main class="right-panel">
            <div class="canvas-wrapper">
                <canvas id="qr-canvas"></canvas>
            </div>
            
            <div class="actions">
                <div class="download-group">
                    <button id="download-btn" class="primary-btn">Download PNG</button>
                    <select id="download-scale" title="Export Scale">
                        <option value="1">1x (Screen)</option>
                        <option value="2">2x (Print - Low)</option>
                        <option value="4" selected>4x (Print - Med)</option>
                        <option value="8">8x (Print - High)</option>
                        <option value="12">12x (Print - Ultra)</option>
                        <option value="16">16x (Print - Vector-like)</option>
                    </select>
                </div>
            </div>

            <!-- Visual Settings Group -->
            <section class="visual-settings">
                
                <!-- Appearance Group -->
                <div class="settings-group">
                    <h3>Appearance</h3>
                    
                    <!-- Row 1: Colors, Padding, Size -->
                    <div class="field-row compact-row" style="align-items: flex-end;">
                        <div class="field" style="flex: 0 0 auto;">
                            <label for="color-fg">Color</label>
                            <input type="color" id="color-fg" class="square-color-input" value="#000000" title="Foreground">
                        </div>
                        <div class="field" style="flex: 0 0 auto;">
                            <label for="color-bg">BG</label>
                            <input type="color" id="color-bg" class="square-color-input" value="#ffffff" title="Background">
                        </div>
                        <div class="field">
                            <label for="qr-padding">Padding</label>
                            <input type="number" id="qr-padding" value="0" min="0" step="4" style="width: 60px;">
                        </div>
                        <div class="field">
                            <label for="qr-size">Dot Size</label>
                            <input type="number" id="qr-size" value="15" min="1" max="50" style="width: 60px;">
                        </div>
                    </div>

                    <!-- Row 2: Shapes & Correction -->
                    <div class="field-row compact-row">
                        <div class="field">
                            <label for="shape-finder">Finder Shape</label>
                            <select id="shape-finder">
                                <option value="square">Square</option>
                                <option value="dots">Circle</option>
                                <option value="rounded">Rounded</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="shape-module">Dot Shape</label>
                            <select id="shape-module">
                                <option value="square">Square</option>
                                <option value="dots">Dots</option>
                                <option value="rounded">Rounded</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="qr-error">Correction</label>
                            <select id="qr-error">
                                <option value="L">Low (7%)</option>
                                <option value="M" selected>Med (15%)</option>
                                <option value="Q">Quart (25%)</option>
                                <option value="H">High (30%)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Labels Group -->
                <div class="settings-group">
                    <h3>Labels</h3>
                    
                    <!-- Font Datalist -->
                    <datalist id="font-list">
                        <option value="sans-serif">Sans-Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="Segoe UI Symbol">Segoe UI Symbol</option>
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                    </datalist>

                    <!-- Top Label -->
                    <div class="label-compact">
                        <input type="text" id="label-top-text" class="label-text-input" placeholder="Top Label Text">
                        <div class="label-controls">
                            <input type="color" id="label-top-color" value="#000000" title="Color">
                            <select id="label-top-align" title="Alignment">
                                <option value="center">Center</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                            </select>
                            <input type="text" id="label-top-font" list="font-list" placeholder="Font" value="sans-serif" class="font-input">
                            <input type="number" id="label-top-size" value="20" min="8" max="100" title="Font Size" style="width: 55px;" placeholder="Size">
                        </div>
                    </div>

                    <!-- Bottom Label -->
                    <div class="label-compact">
                        <input type="text" id="label-bottom-text" class="label-text-input" placeholder="Bottom Label Text">
                        <div class="label-controls">
                            <input type="color" id="label-bottom-color" value="#000000" title="Color">
                            <select id="label-bottom-align" title="Alignment">
                                <option value="center">Center</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                            </select>
                            <input type="text" id="label-bottom-font" list="font-list" placeholder="Font" value="sans-serif" class="font-input">
                            <input type="number" id="label-bottom-size" value="20" min="8" max="100" title="Font Size" style="width: 55px;" placeholder="Size">
                        </div>
                    </div>
                </div>

                <!-- Logo Group -->
                <div class="settings-group">
                    <h3>Logo Overlay</h3>
                    <div class="logo-upload-container">
                        <div class="logo-upload-zone" id="logo-drop-zone">
                            <span id="logo-placeholder-text">Click, Drag, or Paste Logo Image</span>
                            <img id="logo-preview-thumbnail" style="display: none; max-height: 48px; border-radius: 4px; border: 1px solid var(--border-color);" />
                            <input type="file" id="logo-file-input" accept="image/*" style="display: none;">
                        </div>
                        <button type="button" id="logo-remove-btn" class="secondary-btn danger-btn" style="display: none; margin-top: 0.5rem; padding: 0.3rem 0.6rem; font-size: 0.8rem; width: 100%;">Remove Logo</button>
                    </div>
                    <div class="field-row compact-row" style="margin-top: 0.75rem;">
                        <div class="field">
                            <label for="logo-size">Size (%)</label>
                            <input type="number" id="logo-size" value="20" min="10" max="35" style="width: 60px;">
                        </div>
                        <div class="field">
                            <label for="logo-shape">BG Shape</label>
                            <select id="logo-shape">
                                <option value="none">None</option>
                                <option value="square">Square</option>
                                <option value="circle">Circle</option>
                                <option value="rounded">Rounded</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="logo-padding">Padding</label>
                            <input type="number" id="logo-padding" value="4" min="0" max="25" style="width: 60px;">
                        </div>
                    </div>
                    <div id="logo-warning" class="logo-warning-box" style="display: none; margin-top: 0.5rem; color: #dc3545; font-size: 0.75rem; font-weight: 500;">
                        ⚠️ Error Correction "High" is recommended for active logos to ensure scanability.
                    </div>
                </div>
            </section>
        </main>
    </div>
    <script src="app.js?v=<?= $version ?>"></script>
</body>
</html>
