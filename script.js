document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
});

function generateQR() {
    const text = document.getElementById("qr-text").value;
    if (!text) {
        alert("Please enter some text or URL");
        return;
    }

    const size = parseInt(document.getElementById("qr-size").value);
    const color = document.getElementById("qr-color").value;
    const canvas = document.getElementById("qr-code");
    
    // Clear previous content
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate QR Code
    const qr = new QRious({
        element: canvas,
        value: text,
        size: size,
        foreground: color,
        background: 'white',
        padding: 10,
        level: 'H' // Highest error correction for overlay
    });

    const selectedOverlay = document.querySelector('.overlay-preview.selected');
    
    if (selectedOverlay) {
        const overlay = new Image();
        overlay.crossOrigin = "anonymous";
        overlay.src = selectedOverlay.src;
        
        overlay.onload = function() {
            const ctx = canvas.getContext('2d');
            
            // Create a white background in the center
            const overlaySize = size * 0.2;
            const x = (size - overlaySize) / 2;
            const y = (size - overlaySize) / 2;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, overlaySize, overlaySize);
            
            // Draw the overlay image
            ctx.drawImage(overlay, x, y, overlaySize, overlaySize);
            
            // Save to history and setup download
            finalizeQRCode(canvas, text, size, color);
        };
        
        overlay.onerror = function(e) {
            console.error('Error loading overlay:', e);
            finalizeQRCode(canvas, text, size, color);
        };
    } else {
        finalizeQRCode(canvas, text, size, color);
    }
}

function finalizeQRCode(canvas, text, size, color) {
    // Setup download button
    const downloadContainer = document.getElementById("download-container");
    downloadContainer.innerHTML = '';

    const downloadLink = document.createElement("a");
    downloadLink.href = canvas.toDataURL("image/png");
    downloadLink.download = `qrcode_${Date.now()}.png`;
    
    const downloadButton = document.createElement("button");
    downloadButton.className = "button button-success";
    downloadButton.innerHTML = '<i class="fas fa-download"></i> Download QR Code';
    downloadLink.appendChild(downloadButton);
    
    downloadContainer.appendChild(downloadLink);

    // Save to history
    saveToHistory(text, canvas.toDataURL(), size, color);
}

function saveToHistory(text, dataUrl, size, color) {
    let history = JSON.parse(localStorage.getItem('qrHistory') || '[]');
    history.unshift({
        text: text,
        dataUrl: dataUrl,
        size: size,
        color: color,
        date: new Date().toISOString()
    });
    
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    localStorage.setItem('qrHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = "";
    
    const history = JSON.parse(localStorage.getItem('qrHistory') || '[]');
    
    history.forEach((item, index) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        
        const date = new Date(item.date).toLocaleDateString();
        const time = new Date(item.date).toLocaleTimeString();
        
        historyItem.innerHTML = `
            <p class="history-text">${item.text}</p>
            <img src="${item.dataUrl}" alt="QR Code">
            <small style="color: #666;">Created: ${date} ${time}</small>
            <div class="history-actions">
                <a href="${item.dataUrl}" download="qrcode_${index}.png">
                    <button class="button button-success">Download</button>
                </a>
                <button class="button button-primary" onclick="regenerateQR('${item.text}', ${item.size}, '${item.color}')">
                    Edit
                </button>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function regenerateQR(text, size, color) {
    document.getElementById("qr-text").value = text;
    document.getElementById("qr-size").value = size;
    document.getElementById("qr-color").value = color;
    showSection('generator');
    generateQR();
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all history?")) {
        localStorage.removeItem('qrHistory');
        loadHistory();
    }
}

function showSection(section) {
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(section).style.display = 'block';
    document.querySelector(`.nav-tab[onclick="showSection('${section}')"]`).classList.add('active');
    
    if (section === 'history') {
        loadHistory();
    }
}

function selectOverlay(element) {
    document.querySelectorAll('.overlay-preview').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

function handleCustomOverlay(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'overlay-preview';
            img.setAttribute('data-platform', 'custom');
            img.onclick = function() { selectOverlay(this); };
            
            const customCategory = document.querySelector('.custom-upload');
            customCategory.insertAdjacentElement('beforebegin', img);
            selectOverlay(img);
        }
        reader.readAsDataURL(file);
    }
}

function selectColor(element) {
    document.querySelectorAll('.color-preset').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    const color = element.dataset.color;
    document.getElementById('qr-color').value = color;
    generateQR(); // Regenerate QR code with new color
}

function updateCustomColor(input) {
    document.querySelectorAll('.color-preset').forEach(el => el.classList.remove('selected'));
    generateQR(); // Regenerate QR code with new color
}