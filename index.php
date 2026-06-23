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
    <div class="main-container">
        <div class="columns-container">
            <!-- COLUMN 1: Tab Specific Details -->
            <main class="config-pane">
            <header>
                <h1 class="brand">qr.krets.com</h1>
            </header>

            <nav class="type-tabs">
                <div class="tabs">
                    <button class="tab-btn active" data-tab="vcard">vCard</button>
                    <button class="tab-btn" data-tab="url">URL</button>
                    <button class="tab-btn" data-tab="wifi">Wi-Fi</button>
                    <button class="tab-btn" data-tab="raw">Raw</button>
                    <button class="tab-btn" data-tab="scanner">Scanner</button>
                </div>
            </nav>

            <!-- Dynamic Input Card -->
            <section class="card data-input">
                <div class="tab-content">
                    <!-- vCard Tab -->
                    <div id="tab-vcard" class="tab-pane active">
                        
                        <!-- Prefix Group -->
                        <div class="vcard-group collapsed" id="group-prefix">
                            <div class="group-header">Prefix</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="text" id="vc-prefix" placeholder="Prefix (e.g. Mr., Dr.)">
                                </div>
                            </div>
                        </div>

                        <!-- Name Group (Always Visible) -->
                        <div class="vcard-group" id="group-name">
                            <div class="group-header">Name</div>
                            <div class="group-content">
                                <div class="field-row compact-gap">
                                    <div class="field" style="flex: 1.2;">
                                        <input type="text" id="vc-fn" placeholder="First Name">
                                    </div>
                                    <div class="field" style="flex: 0.8;">
                                        <input type="text" id="vc-mn" placeholder="Middle Name">
                                    </div>
                                    <div class="field" style="flex: 1.2;">
                                        <input type="text" id="vc-ln" placeholder="Last Name">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Suffix Group -->
                        <div class="vcard-group collapsed" id="group-suffix">
                            <div class="group-header">Suffix</div>
                            <div class="group-content">
                                <div class="field">
                                    <input type="text" id="vc-suffix" placeholder="Suffix (e.g. Jr., III)">
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
                                <div class="field-row compact-gap">
                                    <div class="field" style="flex: 1;">
                                        <input type="text" id="vc-title" placeholder="Job Title / Role">
                                    </div>
                                    <div class="field" style="flex: 1.5;">
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
                        <div class="field">
                            <label for="wifi-ssid">Network Name (SSID)</label>
                            <input type="text" id="wifi-ssid" placeholder="BER Airport Free Airport Wi-Fi">
                        </div>
                        <div class="field-row wifi-settings-row">
                            <div class="field" style="flex: 2;">
                                <label for="wifi-pass">Password</label>
                                <div class="password-wrapper">
                                    <input type="password" id="wifi-pass">
                                    <button type="button" id="wifi-pass-toggle" class="password-toggle-btn">Show</button>
                                </div>
                            </div>
                            <div class="field" style="flex: 1.2;">
                                <label for="wifi-enc">Type</label>
                                <select id="wifi-enc">
                                    <option value="WPA">WPA</option>
                                    <option value="WEP">WEP</option>
                                    <option value="nopass">None</option>
                                </select>
                            </div>
                            <div class="field checkbox-field-container">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="wifi-hidden"> Hidden
                                </label>
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
        </main>

        <!-- COLUMN 2: Everything Else (Preview & Styling Panels) -->
        <aside class="preview-pane">
            <div class="sticky-preview-block">
                <div class="qr-preview-wrapper">
                    <canvas id="qr-canvas"></canvas>
                </div>
                <div class="action-row">
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
            </div>

            <!-- Customization Card -->
            <section class="card styling-card">
                <h2>Customization</h2>
                <nav class="style-tabs">
                    <div class="tabs">
                        <button type="button" class="style-tab-btn active" data-style-tab="appearance">Appearance</button>
                        <button type="button" class="style-tab-btn" data-style-tab="logo">Logo</button>
                        <button type="button" class="style-tab-btn" data-style-tab="labels">Labels</button>
                    </div>
                </nav>

                <div class="style-tab-content">
                    <!-- Appearance Tab -->
                    <div id="style-tab-appearance" class="style-tab-pane active">
                        <div class="field-row compact-gap" style="margin-bottom: 1rem;">
                            <div class="field" style="flex: 0 0 auto;">
                                <label for="color-fg">Color</label>
                                <input type="color" id="color-fg" class="square-color-input" value="#000000" title="Foreground">
                            </div>
                            <div class="field" style="flex: 0 0 auto;">
                                <label for="color-bg">BG</label>
                                <input type="color" id="color-bg" class="square-color-input" value="#ffffff" title="Background">
                            </div>
                            <div class="field" style="flex: 1;">
                                <label for="shape-finder">Finder Shape</label>
                                <select id="shape-finder">
                                    <option value="square">Square</option>
                                    <option value="dots">Circle</option>
                                    <option value="rounded">Rounded</option>
                                </select>
                            </div>
                            <div class="field" style="flex: 1;">
                                <label for="shape-module">Dot Shape</label>
                                <select id="shape-module">
                                    <option value="square">Square</option>
                                    <option value="dots">Dots</option>
                                    <option value="rounded">Rounded</option>
                                </select>
                            </div>
                        </div>

                        <div class="field-row compact-gap" style="margin-bottom: 1rem;">
                            <div class="field" style="flex: 1;">
                                <div class="slider-label-row">
                                    <label for="qr-size">Dot Size</label>
                                    <div class="slider-val-container">
                                        <input type="number" id="qr-size-num" min="5" max="40" value="15" class="slider-num-input">
                                        <span class="unit">px</span>
                                    </div>
                                </div>
                                <input type="range" id="qr-size" class="slider-input" value="15" min="5" max="40" step="1">
                            </div>
                            <div class="field" style="flex: 1;">
                                <div class="slider-label-row">
                                    <label for="qr-padding">Padding</label>
                                    <div class="slider-val-container">
                                        <input type="number" id="qr-padding-num" min="0" max="80" value="0" class="slider-num-input">
                                        <span class="unit">px</span>
                                    </div>
                                </div>
                                <input type="range" id="qr-padding" class="slider-input" value="0" min="0" max="80" step="4">
                            </div>
                        </div>

                        <div class="field">
                            <label for="qr-error">Error Correction</label>
                            <select id="qr-error">
                                <option value="L">Low (7%)</option>
                                <option value="M" selected>Med (15%)</option>
                                <option value="Q">Quart (25%)</option>
                                <option value="H">High (30%)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Logo Overlay Tab -->
                    <div id="style-tab-logo" class="style-tab-pane">
                        <div class="logo-grid">
                            <div class="logo-upload-container">
                                <div class="logo-upload-zone" id="logo-drop-zone">
                                    <span id="logo-placeholder-text">Click, Drag, or Paste Logo Image</span>
                                    <img id="logo-preview-thumbnail" style="display: none; max-height: 48px; border-radius: 4px; border: 1px solid var(--border-color);" />
                                    <input type="file" id="logo-file-input" accept="image/*" style="display: none;">
                                </div>
                                <button type="button" id="logo-remove-btn" class="secondary-btn danger-btn" style="display: none; margin-top: 0.5rem; padding: 0.3rem 0.6rem; font-size: 0.8rem; width: 100%;">Remove Logo</button>
                            </div>
                            <div class="logo-settings">
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
                                    <div class="slider-label-row">
                                        <label for="logo-size">Logo Size</label>
                                        <div class="slider-val-container">
                                            <input type="number" id="logo-size-num" min="10" max="35" value="20" class="slider-num-input">
                                            <span class="unit">%</span>
                                        </div>
                                    </div>
                                    <input type="range" id="logo-size" class="slider-input" value="20" min="10" max="35" step="1">
                                </div>

                                <div class="field">
                                    <div class="slider-label-row">
                                        <label for="logo-padding">Padding</label>
                                        <div class="slider-val-container">
                                            <input type="number" id="logo-padding-num" min="0" max="25" value="4" class="slider-num-input">
                                            <span class="unit">px</span>
                                        </div>
                                    </div>
                                    <input type="range" id="logo-padding" class="slider-input" value="4" min="0" max="25" step="1">
                                </div>
                            </div>
                        </div>
                        <div id="logo-warning" class="logo-warning-box" style="display: none; margin-top: 0.5rem; color: #dc3545; font-size: 0.75rem; font-weight: 500;">
                            ⚠️ Error Correction "High" is recommended for active logos to ensure scanability.
                        </div>
                    </div>

                    <!-- Labels Tab -->
                    <div id="style-tab-labels" class="style-tab-pane">
                        <datalist id="font-list">
                            <option value="sans-serif">Sans-Serif</option>
                            <option value="serif">Serif</option>
                            <option value="monospace">Monospace</option>
                            <option value="Segoe UI Symbol">Segoe UI Symbol</option>
                            <option value="Arial">Arial</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Courier New">Courier New</option>
                        </datalist>

                        <div class="labels-grid">
                            <!-- Top Label -->
                            <div class="label-section">
                                <h4>Top Label</h4>
                                <div class="field">
                                    <input type="text" id="label-top-text" class="label-text-input" placeholder="Top Label Text">
                                </div>
                                <div class="field-row font-styling-row">
                                    <div class="field color-field">
                                        <label>Color</label>
                                        <input type="color" id="label-top-color" value="#000000" class="compact-color-picker">
                                    </div>
                                    <div class="field align-field" style="flex: 1.2;">
                                        <label>Align</label>
                                        <select id="label-top-align">
                                            <option value="center">Center</option>
                                            <option value="left">Left</option>
                                            <option value="right">Right</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="field" style="margin-top: 0.5rem;">
                                    <label>Font Family</label>
                                    <input type="text" id="label-top-font" list="font-list" placeholder="Font" value="sans-serif">
                                </div>
                                <div class="field">
                                    <div class="slider-label-row">
                                        <label for="label-top-size">Font Size</label>
                                        <div class="slider-val-container">
                                            <input type="number" id="label-top-size-num" min="8" max="60" value="20" class="slider-num-input">
                                            <span class="unit">px</span>
                                        </div>
                                    </div>
                                    <input type="range" id="label-top-size" class="slider-input" value="20" min="8" max="60" step="1">
                                </div>
                            </div>

                            <!-- Bottom Label -->
                            <div class="label-section">
                                <h4>Bottom Label</h4>
                                <div class="field">
                                    <input type="text" id="label-bottom-text" class="label-text-input" placeholder="Bottom Label Text">
                                </div>
                                <div class="field-row font-styling-row">
                                    <div class="field color-field">
                                        <label>Color</label>
                                        <input type="color" id="label-bottom-color" value="#000000" class="compact-color-picker">
                                    </div>
                                    <div class="field align-field" style="flex: 1.2;">
                                        <label>Align</label>
                                        <select id="label-bottom-align">
                                            <option value="center">Center</option>
                                            <option value="left">Left</option>
                                            <option value="right">Right</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="field" style="margin-top: 0.5rem;">
                                    <label>Font Family</label>
                                    <input type="text" id="label-bottom-font" list="font-list" placeholder="Font" value="sans-serif">
                                </div>
                                <div class="field">
                                    <div class="slider-label-row">
                                        <label for="label-bottom-size">Font Size</label>
                                        <div class="slider-val-container">
                                            <input type="number" id="label-bottom-size-num" min="8" max="60" value="20" class="slider-num-input">
                                            <span class="unit">px</span>
                                        </div>
                                    </div>
                                    <input type="range" id="label-bottom-size" class="slider-input" value="20" min="8" max="60" step="1">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </aside>

    </div> <!-- Close columns-container -->

    <footer class="app-footer">
        <p>See a bug or just want to chat? Submit a request via <a href="https://github.com/krets/qr/issues" target="_blank" style="color: inherit; text-decoration: underline;">GitHub Issues</a>.</p>
    </footer>

</div> <!-- Close main-container -->
<script src="app.js?v=<?= $version ?>"></script>
</body>
</html>
