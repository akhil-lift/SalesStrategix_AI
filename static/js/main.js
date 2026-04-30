document.addEventListener('DOMContentLoaded', () => {
    // Basic Elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const apiKeyInput = document.getElementById('api-key');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const keyStatus = document.getElementById('key-status');
    const fileUpload = document.getElementById('file-upload');
    const uploadStatus = document.getElementById('upload-status');
    const reindexBtn = document.getElementById('reindex-btn');
    const reindexStatus = document.getElementById('reindex-status');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const tooltip = document.getElementById('source-tooltip');
    const tooltipText = document.getElementById('tooltip-text');
    const micBtn = document.getElementById('mic-btn');
    const ttsToggle = document.getElementById('tts-toggle');
    const roleplayToggle = document.getElementById('roleplay-toggle');
    const exportBtn = document.getElementById('export-btn');
    const insightsBtn = document.getElementById('insights-btn');
    const snippetModal = document.getElementById('snippet-modal');
    const closeModal = document.getElementById('close-modal');
    const snippetContent = document.getElementById('snippet-content');
    const roleplayBadge = document.getElementById('roleplay-badge');
    const personaSelectorGroup = document.getElementById('persona-selector-group');
    const personaSelect = document.getElementById('persona-select');
    const battlecardBtn = document.getElementById('battlecard-btn');

    let ttsEnabled = true;
    const synth = window.speechSynthesis;
    const globalThemeSelect = document.getElementById('global-theme');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Load saved themes
    const savedTheme = localStorage.getItem('globalTheme') || 'midnight';
    const savedMode = localStorage.getItem('displayMode') || 'dark';
    
    document.body.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-mode', savedMode);
    
    if (globalThemeSelect) globalThemeSelect.value = savedTheme;
    if (darkModeToggle) darkModeToggle.checked = savedMode === 'dark';

    // Check API Key Status
    async function checkKeyStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            if (data.has_api_key) {
                keyStatus.textContent = '✅ API Key loaded from system';
                keyStatus.style.color = '#10b981';
                apiKeyInput.placeholder = '••••••••••••••••';
            }
        } catch (err) {
            console.error('Failed to check API status');
        }
    }
    checkKeyStatus();

    // --- VOICE SEARCH (Web Speech API) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            userInput.placeholder = "Listening...";
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                userInput.value = finalTranscript;
            } else if (interimTranscript) {
                userInput.value = interimTranscript;
            }

            userInput.style.height = 'auto';
            userInput.style.height = (userInput.scrollHeight) + 'px';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopRecording();
            userInput.placeholder = "Ask about objection handling, pricing, or negotiation...";
        };

        recognition.onend = () => {
            stopRecording();
            userInput.placeholder = "Ask about objection handling, pricing, or negotiation...";

            // Auto-send if voice input provided text
            if (userInput.value.trim().length > 0) {
                sendMessage();
            }
        };

        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                userInput.value = '';
                recognition.start();
            }
        });
    } else {
        micBtn.style.display = 'none';
        console.warn('Web Speech API is not supported in this browser.');
    }

    function stopRecording() {
        isRecording = false;
        micBtn.classList.remove('recording');
    }

    // --- ADVANCED UI EFFECTS ---

    // 1. Ripple Effect on Buttons
    const rippleButtons = document.querySelectorAll('.ripple-btn');
    rippleButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            let x = e.clientX - e.target.getBoundingClientRect().left;
            let y = e.clientY - e.target.getBoundingClientRect().top;
            let ripples = document.createElement('span');
            ripples.className = 'ripple';
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            this.appendChild(ripples);
            setTimeout(() => { ripples.remove() }, 600);
        });
    });

    // 2. 3D Tilt Effect on specific elements
    const appContainer = document.querySelector('.app-container');
    const tiltElements = document.querySelectorAll('.tilt-element');
    const cursorGlow = document.getElementById('cursor-glow');
    
    let ticking = false;
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Global App Perspective Tilt
                if (appContainer) {
                    const x = (window.innerWidth / 2 - mouseX) / 100; // More subtle
                    const y = (window.innerHeight / 2 - mouseY) / 100;
                    appContainer.style.transform = `perspective(2000px) rotateY(${-x}deg) rotateX(${y}deg)`;
                }

                // Cursor Glow Tracking
                if (cursorGlow) {
                    cursorGlow.style.left = mouseX + 'px';
                    cursorGlow.style.top = mouseY + 'px';
                }

                ticking = false;
            });
            ticking = true;
        }
    });

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / centerY * -10; 
            const tiltY = (x - centerX) / centerX * 10;

            el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });

    // 2.5 Cursor Glow Tracking logic moved into throttled mousemove above

    // 2.6 Magnetic Elements
    const magneticWraps = document.querySelectorAll('.magnetic-wrap');
    magneticWraps.forEach(wrap => {
        wrap.addEventListener('mousemove', (e) => {
            const rect = wrap.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            wrap.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        wrap.addEventListener('mouseleave', () => {
            wrap.style.transform = `translate(0, 0)`;
        });
    });

    // 3. Theme Selectors Logic
    if (globalThemeSelect) {
        globalThemeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            document.body.setAttribute('data-theme', val);
            localStorage.setItem('globalTheme', val);
        });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            const mode = e.target.checked ? 'dark' : 'light';
            document.body.setAttribute('data-mode', mode);
            localStorage.setItem('displayMode', mode);
        });
    }

    if (roleplayToggle) {
        roleplayToggle.addEventListener('change', (e) => {
            const isActive = e.target.checked;
            if (isActive) {
                document.body.classList.add('battle-mode');
                if (roleplayBadge) roleplayBadge.style.display = 'inline-block';
                if (personaSelectorGroup) personaSelectorGroup.style.display = 'block';
            } else {
                document.body.classList.remove('battle-mode');
                if (roleplayBadge) roleplayBadge.style.display = 'none';
                if (personaSelectorGroup) personaSelectorGroup.style.display = 'none';
            }
        });
    }

    // TTS Toggle Logic
    if (ttsToggle) {
        ttsToggle.addEventListener('click', () => {
            ttsEnabled = !ttsEnabled;
            if (!ttsEnabled) {
                synth.cancel();
                ttsToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                ttsToggle.style.opacity = '0.5';
            } else {
                ttsToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                ttsToggle.style.opacity = '1';
            }
        });
    }

    function speak(text) {
        if (!ttsEnabled || !synth) return;
        synth.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synth.speak(utterance);
    }

    // Export PDF Logic
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                alert("PDF library not loaded correctly.");
                return;
            }
            const doc = new jsPDF();
            
            // Add Logo/Header
            doc.setFontSize(22);
            doc.setTextColor(99, 102, 241); 
            doc.text("SalesStrategix AI - Sales Brief", 20, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);
            
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 32, 190, 32);
            
            let y = 42;
            const messages = chatContainer.querySelectorAll('.message');
            
            if (messages.length <= 1) {
                alert("No chat history to export!");
                return;
            }

            messages.forEach((msg) => {
                const isUser = msg.classList.contains('user-message');
                const role = isUser ? "USER" : "AI";
                const textEl = msg.querySelector('.msg-text');
                if (!textEl) return;
                
                const text = textEl.innerText;
                
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                // Role Label
                doc.setFont(undefined, 'bold');
                doc.setTextColor(isUser ? 79 : 99, isUser ? 70 : 102, isUser ? 229 : 241);
                doc.text(`${role}:`, 20, y);
                
                // Content
                doc.setFont(undefined, 'normal');
                doc.setTextColor(40, 40, 40);
                const splitText = doc.splitTextToSize(text, 160);
                doc.text(splitText, 20, y + 7);
                
                y += (splitText.length * 7) + 15;
            });
            
            doc.save(`SalesStrategix_Brief_${Date.now()}.pdf`);
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            snippetModal.classList.remove('show');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === snippetModal) {
            snippetModal.classList.remove('show');
        }
    });

    if (insightsBtn) {
        insightsBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                const stats = data.analytics;
                
                let statsHTML = `
                    <div style="margin-bottom: 25px;">
                        <h4 style="margin-bottom: 15px; color: var(--primary-color);"><i class="fa-solid fa-star"></i> Performance Scorecard</h4>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${renderScoreBar('Playbook Adherence', 85)}
                            ${renderScoreBar('Clarity of Value', 72)}
                            ${renderScoreBar('Objection Handling', 64)}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <h4 style="margin-bottom: 5px; color: var(--text-muted);">Topic Distribution</h4>
                `;
                
                for (const [key, value] of Object.entries(stats)) {
                    statsHTML += `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
                            <span style="font-weight: 600;">${key} Queries</span>
                            <span style="font-weight: 800; color: var(--primary-color); font-size: 1.1rem;">${value}</span>
                        </div>
                    `;
                }
                statsHTML += '</div>';
                
                openSnippet(statsHTML, true);
            } catch (err) {
                console.error('Failed to load insights');
            }
        });
    }

    function renderScoreBar(label, percent) {
        return `
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                    <span>${label}</span>
                    <span>${percent}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: linear-gradient(to right, var(--primary-color), var(--secondary-color)); border-radius: 3px;"></div>
                </div>
            </div>
        `;
    }

    if (battlecardBtn) {
        battlecardBtn.addEventListener('click', async () => {
            const loadingId = 'loading-' + Date.now();
            appendMessage('assistant', '<div class="spinner"></div> Generating Strategic Battlecard...', [], loadingId);
            
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: "Generate a strategic battlecard based on our playbooks.",
                        mode: 'battlecard'
                    })
                });
                const data = await res.json();
                document.getElementById(loadingId).remove();
                
                if (res.ok) {
                    openSnippet(data.answer);
                } else {
                    appendMessage('assistant', '❌ Error: ' + data.error);
                }
            } catch (err) {
                if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
                appendMessage('assistant', '❌ Failed to generate battlecard.');
            }
        });
    }

    function openSnippet(content, isHTML = false) {
        snippetContent.innerHTML = isHTML ? content : marked.parse(content);
        snippetModal.classList.add('show');
    }

    // --- CORE LOGIC ---

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value.trim() === '') {
            this.style.height = 'auto';
        }
    });

    // Handle Enter key (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Set API Key
    saveKeyBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) return;

        keyStatus.textContent = 'Saving...';
        keyStatus.className = 'status-text';

        try {
            const res = await fetch('/api/set_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: key })
            });
            const data = await res.json();

            if (res.ok) {
                keyStatus.textContent = '✅ ' + data.message;
            } else {
                keyStatus.textContent = '❌ ' + data.error;
                keyStatus.className = 'status-text error';
            }
        } catch (err) {
            keyStatus.textContent = '❌ Network error';
            keyStatus.className = 'status-text error';
        }

        setTimeout(() => keyStatus.textContent = '', 3000);
    });

    // Upload Files
    fileUpload.addEventListener('change', async () => {
        if (fileUpload.files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < fileUpload.files.length; i++) {
            formData.append('files', fileUpload.files[i]);
        }

        uploadStatus.textContent = 'Uploading...';
        uploadStatus.className = 'status-text';

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                uploadStatus.textContent = '✅ ' + data.message;
            } else {
                uploadStatus.textContent = '❌ ' + data.error;
                uploadStatus.className = 'status-text error';
            }
        } catch (err) {
            uploadStatus.textContent = '❌ Upload failed';
            uploadStatus.className = 'status-text error';
        }

        setTimeout(() => uploadStatus.textContent = '', 3000);
    });

    // Re-index
    reindexBtn.addEventListener('click', async () => {
        const originalContent = reindexBtn.innerHTML;
        reindexBtn.innerHTML = '<span class="btn-content"><div class="spinner"></div> Indexing...</span>';
        reindexBtn.disabled = true;
        reindexStatus.textContent = '';

        try {
            const res = await fetch('/api/reindex', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                reindexStatus.textContent = '✅ ' + data.message;
                reindexStatus.className = 'status-text';
            } else {
                reindexStatus.textContent = '❌ ' + data.error;
                reindexStatus.className = 'status-text error';
            }
        } catch (err) {
            reindexStatus.textContent = '❌ Indexing failed';
            reindexStatus.className = 'status-text error';
        }

        reindexBtn.innerHTML = originalContent;
        reindexBtn.disabled = false;
        setTimeout(() => reindexStatus.textContent = '', 5000);
    });

    // Clear Chat
    clearChatBtn.addEventListener('click', () => {
        const welcome = chatContainer.firstElementChild.cloneNode(true);
        // Reset animation class so it plays again
        welcome.classList.remove('message-enter');
        void welcome.offsetWidth; // trigger reflow

        chatContainer.innerHTML = '';
        chatContainer.appendChild(welcome);
    });

    // Send Message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Trigger Grid Pulse Effect
        const grid = document.querySelector('.grid-background');
        if (grid) {
            grid.style.animation = 'none';
            void grid.offsetWidth; // trigger reflow
            grid.style.animation = 'gridMove 20s linear infinite, gridPulse 1s ease-out';
        }

        // Add User Message
        appendMessage('user', text);
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Add Loading AI Message
        const loadingId = 'loading-' + Date.now();
        appendMessage('assistant', '<div class="spinner"></div> Assistant is thinking...', [], loadingId);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    mode: roleplayToggle && roleplayToggle.checked ? 'roleplay' : 'chat',
                    persona: personaSelect ? personaSelect.value : 'default'
                })
            });
            const data = await res.json();

            // Remove loading
            document.getElementById(loadingId).remove();

            if (res.ok) {
                // Trigger typing effect for the answer
                typeMessage('assistant', data.answer, data.sources || []);
            } else {
                appendMessage('assistant', '❌ Error: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            document.getElementById(loadingId).remove();
            appendMessage('assistant', '❌ Network error connecting to server.');
        }

        sendBtn.disabled = false;
    }

    function appendMessage(role, content, sources = [], id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message message-enter`;
        if (id) msgDiv.id = id;

        const icon = role === 'user' ? 'fa-user' : 'fa-robot';

        let sourcesHTML = '';
        if (sources.length > 0) {
            sourcesHTML = '<div class="sources-container">';
            sources.forEach((src, idx) => {
                const badgeId = `src-${Date.now()}-${idx}`;
                const name = typeof src === 'string' ? src : src.name;
                const content = typeof src === 'string' ? '' : src.content.replace(/"/g, '&quot;');
                sourcesHTML += `<div class="source-badge tilt-element" id="${badgeId}" data-source="${name}" data-content="${content}"><i class="fa-solid fa-tag"></i> Source ${idx + 1}</div>`;
            });
            sourcesHTML += '</div>';
        }

        const parsedContent = content.includes('spinner') ? content : marked.parse(content);

        if (role === 'assistant') {
            msgDiv.innerHTML = `
                <div class="message-avatar"><i class="fa-solid ${icon}"></i></div>
                <div class="message-content glowing-border-wrapper">
                    <div class="glowing-border-inner">
                        <div class="msg-text">${parsedContent}</div>
                        ${sourcesHTML}
                    </div>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="message-avatar"><i class="fa-solid ${icon}"></i></div>
                <div class="message-content">
                    <div class="msg-text">${parsedContent}</div>
                </div>
            `;
        }

        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (sources.length > 0) {
            setupSourceTooltips();
            // Re-bind tilt effect for new badges
            bindTiltEffect(msgDiv.querySelectorAll('.tilt-element'));
        }
    }

    // Typing Effect
    function typeMessage(role, text, sources) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message message-enter`;

        msgDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-content glowing-border-wrapper">
                <div class="glowing-border-inner">
                    <div class="msg-text typing-cursor"></div>
                </div>
            </div>
        `;

        chatContainer.appendChild(msgDiv);
        const textContainer = msgDiv.querySelector('.msg-text');

        let i = 0;
        const baseSpeed = 10;

        function type() {
            if (i < text.length) {
                const currentText = text.substring(0, i + 1);
                textContainer.innerHTML = marked.parse(currentText);
                i += 3;
                
                // Smart Scroll: Only auto-scroll if user is already at the bottom
                const isAtBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 100;
                if (isAtBottom) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
                
                // Organic typing: vary speed slightly
                const randomSpeed = baseSpeed + Math.random() * 15;
                setTimeout(type, randomSpeed);
            } else {
                textContainer.classList.remove('typing-cursor');
                textContainer.innerHTML = marked.parse(text);

                // Speak the response if TTS enabled
                speak(text);

                if (sources && sources.length > 0) {
                    const uniqueSources = [...new Set(sources)];
                    const srcContainer = document.createElement('div');
                    srcContainer.className = 'sources-container';

                    sources.forEach((src, idx) => {
                        const name = typeof src === 'string' ? src : src.name;
                        const content = typeof src === 'string' ? '' : src.content.replace(/"/g, '&quot;');
                        srcContainer.innerHTML += `<div class="source-badge tilt-element" data-source="${name}" data-content="${content}"><i class="fa-solid fa-tag"></i> Source ${idx + 1}</div>`;
                    });

                    msgDiv.querySelector('.glowing-border-inner').appendChild(srcContainer);
                    setupSourceTooltips();
                    bindTiltEffect(srcContainer.querySelectorAll('.tilt-element'));
                }
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }

        type();
    }

    // Tooltips
    function setupSourceTooltips() {
        const badges = document.querySelectorAll('.source-badge');

        badges.forEach(badge => {
            const newBadge = badge.cloneNode(true);
            badge.parentNode.replaceChild(newBadge, badge);

            newBadge.addEventListener('click', () => {
                const content = newBadge.getAttribute('data-content');
                if (content) openSnippet(content);
            });

            newBadge.addEventListener('mouseenter', (e) => {
                const sourceText = newBadge.getAttribute('data-source');
                const filename = sourceText.split('\\').pop().split('/').pop();

                tooltipText.textContent = filename;

                const rect = newBadge.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
                tooltip.classList.add('show');
            });

            newBadge.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });
        });
    }

    function bindTiltEffect(elements) {
        elements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const tiltX = (y - rect.height / 2) / (rect.height / 2) * -10;
                const tiltY = (x - rect.width / 2) / (rect.width / 2) * 10;
                el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            });
        });
    }
});
