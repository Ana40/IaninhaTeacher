// Initialize Lucide icons
    lucide.createIcons();

    const TOPICS = [
      { icon:"briefcase", label:"Job Interviews", prompt:"Let's practice for a job interview in English. Ask me one common question and wait for my answer." },
      { icon:"plane", label:"Travel", prompt:"Let's practice travel English — airports, hotels, asking for directions. Create a scenario and start." },
      { icon:"coffee", label:"Daily Life", prompt:"Let's have a casual everyday conversation in English. Start naturally." },
      { icon:"mail", label:"Business Email", prompt:"Help me practice writing professional emails in English. Give me a situation to respond to." },
      { icon:"message-square", label:"Free Talk", prompt:"Let's have a free conversation so I can practice my English naturally. Start with something interesting." },
      { icon:"book-open", label:"Grammar Focus", prompt:"I want to improve my English grammar. Focus on common mistakes Brazilian Portuguese speakers make. Start with one topic." },
      { icon:"code", label:"Agile & Salesforce", prompt:"I am a Salesforce Developer. Let's practice English for an Agile environment. Act as my Scrum Master or Tech Lead and ask me for my Daily Stand-up update, blockages, or Sprint Planning status." },
      { icon:"monitor", label:"Tech & Work", prompt:"Let's practice English for the tech/IT workplace — meetings, presentations, messages. Start with a scenario." },
    ];

    const getSystemPrompt = () => `You are ${teacherName}, a warm, encouraging, and patient English conversation teacher. Your student is a Brazilian Portuguese speaker learning English.

Rules:
- Always respond in English
- If the student writes in Portuguese, understand it and reply in English
- Keep responses conversational (2-4 sentences unless explaining grammar)
- Correct mistakes SOFTLY — reuse the correct form naturally without embarrassing the student
- Occasionally include ONE grammar/vocabulary tip using exactly: [TIP: your tip here]
- Always ask a follow-up question to keep the conversation going
- Be warm, encouraging, and celebrate effort`;

    let groqKey = '', googleKey = '', openrouterKey = '';
    let customUrl = '', customModel = '', customKey = '';
    let messages = [];
    let isLoading = false, isRecording = false;
    let recognition = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let activeProvider = 'Groq';
    let teacherName = 'IAninha';

    // Voice Loading Logic for Chrome
    let systemVoices = [];
    function loadVoices() {
      if (window.speechSynthesis) {
        systemVoices = window.speechSynthesis.getVoices();
      }
    }
    if (window.speechSynthesis) {
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // Auto-resize textarea
    const msgInput = document.getElementById('msg-input');
    const sendBtn = document.getElementById('send-btn');
    
    msgInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
      if(this.value.trim().length > 0) {
        sendBtn.classList.add('active');
      } else {
        sendBtn.classList.remove('active');
      }
    });

    msgInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if(this.value.trim().length > 0) sendMessage();
      }
    });

    window.onload = () => {
      const sg = localStorage.getItem('ianinha_groq');
      const sk = localStorage.getItem('ianinha_google');
      const so = localStorage.getItem('ianinha_openrouter');
      const cu = localStorage.getItem('ianinha_custom_url');
      const cm = localStorage.getItem('ianinha_custom_model');
      const ck = localStorage.getItem('ianinha_custom_key');
      
      if (sg) document.getElementById('groq-key').value = sg;
      if (sk) document.getElementById('google-key').value = sk;
      if (so) document.getElementById('openrouter-key').value = so;
      if (cu) document.getElementById('custom-url').value = cu;
      if (cm) document.getElementById('custom-model').value = cm;
      if (ck) document.getElementById('custom-key').value = ck;
      buildTopics();
    };

    function startApp() {
      const teacherChoice = document.querySelector('input[name="teacher"]:checked').value;
      if (teacherChoice === 'iafred') {
        teacherName = 'IAfred';
        document.getElementById('active-teacher-img').src = './iafred.png';
      } else {
        teacherName = 'IAninha';
        document.getElementById('active-teacher-img').src = './ianinha.png';
      }
      
      document.getElementById('teacher-title-header').textContent = teacherName;
      document.getElementById('teacher-greeting').textContent = `Hi! I'm ${teacherName} 👋`;
      groqKey = document.getElementById('groq-key').value.trim();
      googleKey = document.getElementById('google-key').value.trim();
      openrouterKey = document.getElementById('openrouter-key').value.trim();
      customUrl = document.getElementById('custom-url').value.trim();
      customModel = document.getElementById('custom-model').value.trim();
      customKey = document.getElementById('custom-key').value.trim();
      
      if (!groqKey && !googleKey && !openrouterKey && !customUrl) {
        showToast('Please provide at least one API key or Custom URL to continue.');
        return;
      }
      
      localStorage.setItem('ianinha_groq', groqKey);
      localStorage.setItem('ianinha_google', googleKey);
      localStorage.setItem('ianinha_openrouter', openrouterKey);
      localStorage.setItem('ianinha_custom_url', customUrl);
      localStorage.setItem('ianinha_custom_model', customModel);
      localStorage.setItem('ianinha_custom_key', customKey);
      
      const modelSelector = document.getElementById('model-selector');
      modelSelector.innerHTML = '';
      
      if (customUrl && customModel) {
        const opt = document.createElement('option');
        opt.value = 'custom';
        opt.textContent = `⚙️ Customizado (Config): ${customModel}`;
        modelSelector.appendChild(opt);
      }
      if (openrouterKey) {
        const opt = document.createElement('option');
        opt.value = 'openrouter';
        opt.textContent = `🌐 OpenRouter (Llama 3.3)`;
        modelSelector.appendChild(opt);
      }
      if (groqKey) {
        const opt = document.createElement('option');
        opt.value = 'groq';
        opt.textContent = `⚡ Groq (GPT-OSS 120B)`;
        modelSelector.appendChild(opt);
      }
      if (googleKey) {
        const opt = document.createElement('option');
        opt.value = 'google';
        opt.textContent = `🔵 Google (Gemini 2.0)`;
        modelSelector.appendChild(opt);
      }
      
      if (modelSelector.options.length > 0) {
        modelSelector.selectedIndex = 0;
        activeProvider = modelSelector.value;
      } else {
        activeProvider = '';
      }
      
      document.getElementById('setup-screen').style.opacity = '0';
      setTimeout(() => {
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
      }, 400);
    }

    function buildTopics() {
      const grid = document.getElementById('topics-grid');
      grid.innerHTML = '';
      
      TOPICS.forEach(t => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.onclick = () => startChat(t.label, t.prompt);
        
        card.innerHTML = `
          <div class="topic-icon">
            <i data-lucide="${t.icon}"></i>
          </div>
          <span>${t.label}</span>
        `;
        grid.appendChild(card);
      });
      lucide.createIcons();
    }

    async function startChat(label, prompt) {
      document.getElementById('topics-section').style.display = 'none';
      document.getElementById('chat-section').style.display = 'flex';
      document.getElementById('topic-label').textContent = label;
      
      messages = [{ role:'user', content:prompt, hidden:true }];
      
      setStatus('Thinking...');
      showTyping();
      isLoading = true;
      
      try {
        const reply = await callAI(messages);
        messages.push({ role:'assistant', content:reply });
        appendMessage('assistant', reply);
        speak(stripTip(reply));
      } catch (e) {
        console.error('Error in startChat:', e);
        showToast(e.message || 'Unexpected error communicating with AI.');
      } finally {
        hideTyping();
        isLoading = false;
        setStatus('Ready to practice');
      }
    }

    async function sendMessage() {
      if (isLoading) return;
      const text = msgInput.value.trim();
      if (!text) return;
      
      msgInput.value = '';
      msgInput.style.height = 'auto';
      sendBtn.classList.remove('active');
      
      messages.push({ role:'user', content:text });
      appendMessage('user', text);
      
      isLoading = true;
      setStatus('Thinking...');
      showTyping();
      
      const history = messages.filter(m => !m.hidden).map(m => ({ role:m.role, content:m.content }));
      
      try {
        const reply = await callAI(history);
        messages.push({ role:'assistant', content:reply });
        appendMessage('assistant', reply);
        speak(stripTip(reply));
      } catch (e) {
        console.error('Error in sendMessage:', e);
        showToast(e.message || 'Unexpected error communicating with AI.');
      } finally {
        hideTyping();
        isLoading = false;
        setStatus('Ready to practice');
      }
    }

    function changeModel() {
      activeProvider = document.getElementById('model-selector').value;
    }

    async function callAI(history) {
      if (activeProvider === 'custom') {
        try { return await callCustom(history); } 
        catch(e) { throw new Error("Local/Custom API: " + e.message); }
      }
      if (activeProvider === 'openrouter') {
        try { return await callOpenRouter(history); } 
        catch(e) { throw new Error("OpenRouter: " + e.message); }
      }
      if (activeProvider === 'groq') {
        try { return await callGroq(history); } 
        catch(e) { throw new Error("Groq: " + e.message); }
      }
      if (activeProvider === 'google') {
        try { return await callGoogle(history); } 
        catch(e) { throw new Error("Google: " + e.message); }
      }
      throw new Error("No API selected or configured.");
    }

    async function handleApiError(res, defaultPrefix) {
      let errorMsg = `${defaultPrefix} HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody.error && errBody.error.message) errorMsg = errBody.error.message;
        else if (errBody.message) errorMsg = errBody.message;
      } catch(e) {}
      throw new Error(errorMsg);
    }

    async function callCustom(history) {
      const cleanHistory = history.map(m => ({ role: m.role, content: m.content }));
      const headers = { 'Content-Type': 'application/json' };
      if (customKey) headers['Authorization'] = `Bearer ${customKey}`;
      
      let finalUrl = customUrl.replace(/\/+$/, '');
      if (!finalUrl.endsWith('/chat/completions')) {
        if (!finalUrl.endsWith('/v1')) {
          finalUrl += '/v1';
        }
        finalUrl += '/chat/completions';
      }

      const res = await fetch(finalUrl, {
        method:'POST',
        headers: headers,
        body: JSON.stringify({ 
          model: customModel || 'llama3', 
          messages: [{ role:'system', content:getSystemPrompt() }, ...cleanHistory],
          temperature: 0.7 
        })
      });
      if (!res.ok) await handleApiError(res, 'Custom API Error:');
      const d = await res.json();
      return d.choices[0].message.content;
    }

    async function callGroq(history) {
      const cleanHistory = history.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${groqKey}` },
        body: JSON.stringify({ 
          model: 'openai/gpt-oss-120b', 
          messages: [{ role:'system', content:getSystemPrompt() }, ...cleanHistory],
          temperature: 0.7,
          max_completion_tokens: 8192
        })
      });
      if (!res.ok) await handleApiError(res, 'Groq API Error:');
      const d = await res.json();
      return d.choices[0].message.content;
    }

    async function callOpenRouter(history) {
      const cleanHistory = history.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:'POST',
        headers:{ 
          'Content-Type':'application/json', 
          'Authorization':`Bearer ${openrouterKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'IAninha Teacher'
        },
        body: JSON.stringify({ 
          model: 'meta-llama/llama-3.3-70b-instruct', 
          messages: [{ role:'system', content:getSystemPrompt() }, ...cleanHistory],
          temperature: 0.7 
        })
      });
      if (!res.ok) await handleApiError(res, 'OpenRouter API Error:');
      const d = await res.json();
      return d.choices[0].message.content;
    }

    async function callGoogle(history) {
      const contents = history.map(m => ({ 
        role: m.role === 'assistant' ? 'model' : 'user', 
        parts:[{ text: m.content }] 
      }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ 
          system_instruction:{ parts:[{ text:getSystemPrompt() }] }, 
          contents, 
          generationConfig:{ maxOutputTokens:600, temperature:0.7 } 
        })
      });
      if (!res.ok) await handleApiError(res, 'Google API Error:');
      const d = await res.json();
      return d.candidates[0].content.parts[0].text;
    }

    function appendMessage(role, content) {
      const msgs = document.getElementById('messages');
      const isUser = role === 'user';
      let mainText = content, tip = null;
      if (!isUser) {
        const m = content.match(/\[TIP:\s*(.*?)\]/s);
        if (m) {
          tip = m[1].trim();
          mainText = content.replace(/\[TIP:\s*.*?\]/s,'').trim();
        }
      }
      const group = document.createElement('div');
      group.className = `msg-group ${isUser ? 'user' : 'ai'}`;
      const av = document.createElement('div');
      av.className = 'msg-avatar';
      av.innerHTML = isUser ? '<i data-lucide="user"></i>' : '<i data-lucide="bot"></i>';
      const col = document.createElement('div');
      col.className = 'msg-content';
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = mainText;
      col.appendChild(bubble);
      if (tip) {
        const tipEl = document.createElement('div');
        tipEl.className = 'tip-box';
        tipEl.innerHTML = `<i data-lucide="lightbulb"></i><div class="tip-content">${tip}</div>`;
        col.appendChild(tipEl);
      }
      if (!isUser) {
        const actionRow = document.createElement('div');
        actionRow.className = 'action-row';
        const lb = document.createElement('button');
        lb.className = 'btn-small';
        lb.innerHTML = '<i data-lucide="volume-2"></i> Listen';
        lb.onclick = () => speak(mainText);
        actionRow.appendChild(lb);
        col.appendChild(actionRow);
      }
      group.appendChild(av);
      group.appendChild(col);
      msgs.appendChild(group);
      lucide.createIcons();
      scrollToBottom();
    }

    let typingEl = null;
    function showTyping() {
      if (typingEl) hideTyping();
      const msgs = document.getElementById('messages');
      const group = document.createElement('div');
      group.className = 'msg-group ai';
      group.id = 'typing-indicator-wrapper';
      group.innerHTML = `<div class="msg-avatar"><i data-lucide="bot"></i></div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
      msgs.appendChild(group);
      lucide.createIcons();
      typingEl = group;
      scrollToBottom();
    }
    
    function hideTyping() {
      if (typingEl) { typingEl.remove(); typingEl = null; }
      const oldTyping = document.querySelectorAll('#typing-indicator-wrapper');
      oldTyping.forEach(el => el.remove());
    }

    function scrollToBottom() {
      const msgs = document.getElementById('messages');
      msgs.scrollTop = msgs.scrollHeight;
    }

    async function speak(rawText) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      
      // Remove emojis and markdown formatting (*, _, ~, #) for cleaner TTS
      let cleanText = rawText
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/gu, '')
        .replace(/[*_~#]/g, '')
        .trim();
        
      if (!cleanText) return;
      
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.lang = 'en-US';
      
      // Try to reload voices just in case it was missed
      if (systemVoices.length === 0) loadVoices();
      
      let isFemale = (teacherName === 'IAninha');
      let selectedVoice = null;
      
      if (isFemale) {
        selectedVoice = systemVoices.find(v => v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('zira') || 
           v.name.toLowerCase().includes('samantha') || 
           v.name.toLowerCase().includes('victoria') || 
           v.name.toLowerCase().includes('jenny') || 
           v.name.includes('Google US English')));
           
        if (!selectedVoice) {
          selectedVoice = systemVoices.find(v => v.lang.startsWith('en') && 
            !v.name.toLowerCase().includes('david') && 
            !v.name.toLowerCase().includes('mark') && 
            !v.name.toLowerCase().includes('male'));
        }
      } else {
        const maleKeywords = ['male', 'david', 'mark', 'george', 'andrew', 'daniel', 'arthur', 'ryan', 'Google UK English Male'];
        selectedVoice = systemVoices.find(v => v.lang.startsWith('en') && 
           maleKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase())));
           
        if (!selectedVoice) {
          // Generic fallback for Android/Tablets where voice names lack 'male'
          selectedVoice = systemVoices.find(v => v.lang.startsWith('en') && 
            !v.name.toLowerCase().includes('zira') && 
            !v.name.toLowerCase().includes('samantha') && 
            !v.name.toLowerCase().includes('female'));
            
          // Lower pitch to simulate male voice since the device gave us a generic (usually female) voice
          utt.pitch = 0.6;
        }
      }
      
      if (!selectedVoice) selectedVoice = systemVoices.find(v => v.lang.startsWith('en')); // final fallback
      
      if (selectedVoice) {
        utt.voice = selectedVoice;
        utt.lang = selectedVoice.lang;
      }
      
      utt.onstart = () => document.getElementById('lily-avatar').classList.add('speaking');
      utt.onend = () => document.getElementById('lily-avatar').classList.remove('speaking');
      window.speechSynthesis.speak(utt);
    }

    function stripTip(t) { return t.replace(/\[TIP:\s*.*?\]/s,'').trim(); }

    function setRecordingState(state) {
      isRecording = state;
      const btn = document.getElementById('mic-btn');
      if (state) btn.classList.add('recording');
      else btn.classList.remove('recording');
      document.getElementById('mic-icon').setAttribute('data-lucide', state ? 'square' : 'mic');
      lucide.createIcons();
    }

    async function toggleMic() {
      if (isRecording) {
        if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
        else if (recognition) recognition.stop();
        return;
      }
      if (groqKey) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            setRecordingState(false);
            if (audioChunks.length === 0) return;
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            showTyping();
            try {
              const formData = new FormData();
              formData.append('file', audioBlob, 'audio.webm');
              formData.append('model', 'whisper-large-v3');
              formData.append('prompt', 'Transcribe the audio accurately. Do not repeat words. Ignore silence.');
              formData.append('temperature', '0');
              const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': `Bearer ${groqKey}` }, body: formData });
              const data = await res.json();
              
              if (data.text) { 
                let finalTxt = data.text.trim();
                // Basic cleanup for whisper repetitive hallucinations
                if (finalTxt.length > 50 && finalTxt.substring(0, 20) === finalTxt.substring(20, 40)) {
                   finalTxt = finalTxt.substring(0, finalTxt.length / 2); // just a simple fallback
                }
                const currentVal = msgInput.value ? msgInput.value + ' ' : '';
                msgInput.value = currentVal + finalTxt; 
                msgInput.dispatchEvent(new Event('input')); 
              }
            } catch (e) { showToast('Transcription failed.'); } finally { hideTyping(); }
          };
          mediaRecorder.start();
          setRecordingState(true);
          return;
        } catch(e) { console.warn('Mic error, trying SpeechRecognition', e); }
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        recognition = new SR();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        
        let finalTranscript = '';
        recognition.onstart = () => {
          setRecordingState(true);
          finalTranscript = msgInput.value ? msgInput.value + ' ' : '';
        };
        recognition.onend = () => setRecordingState(false);
        recognition.onresult = e => {
          let interimTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              finalTranscript += e.results[i][0].transcript;
            } else {
              interimTranscript += e.results[i][0].transcript;
            }
          }
          msgInput.value = finalTranscript + interimTranscript;
          msgInput.dispatchEvent(new Event('input'));
        };
        recognition.start();
      }
      lucide.createIcons();
      setStatus('Ready to practice');
    }

    function setStatus(t) {
      document.getElementById('status-text').textContent = t;
    }
    
    function showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-msg').textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    }
    
    function resetChat() {
      if(window.speechSynthesis) window.speechSynthesis.cancel();
      if(isRecording) toggleMic();
      messages = [];
      document.getElementById('messages').innerHTML = '';
      document.getElementById('chat-section').style.display = 'none';
      document.getElementById('topics-section').style.display = 'block';
      document.getElementById('app-screen').style.display = 'none';
      document.getElementById('setup-screen').style.display = 'flex';
      document.getElementById('setup-screen').style.opacity = '1';
      msgInput.value = '';
      msgInput.dispatchEvent(new Event('input'));
      setStatus('Ready to practice');
    }
