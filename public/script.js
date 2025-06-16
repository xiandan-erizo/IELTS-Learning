class WordDictationApp {
    constructor() {
        this.currentSession = null;
        this.words = [];
        this.currentWordIndex = 0;
        this.correctCount = 0;
        this.totalAttempts = 0;
        this.currentWord = '';
        this.isAnswerShown = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeVoices();
        this.showMainMenu();
    }

    initializeElements() {
        // Sections
        this.mainMenu = document.getElementById('mainMenu');
        this.statsSection = document.getElementById('statsSection');
        this.historySection = document.getElementById('historySection');
        this.dictationSection = document.getElementById('dictationSection');
        this.resultSection = document.getElementById('resultSection');
        this.loading = document.getElementById('loading');

        // Main menu buttons
        this.startPracticeBtn = document.getElementById('startPracticeBtn');
        this.viewStatsBtn = document.getElementById('viewStatsBtn');
        this.viewHistoryBtn = document.getElementById('viewHistoryBtn');

        // Navigation buttons
        this.backFromStatsBtn = document.getElementById('backFromStatsBtn');
        this.backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
        this.exitPracticeBtn = document.getElementById('exitPracticeBtn');

        // Practice elements
        this.playButton = document.getElementById('playButton');
        this.replayButton = document.getElementById('replayButton');
        this.submitButton = document.getElementById('submitButton');
        this.showAnswerButton = document.getElementById('showAnswerButton');
        this.wordInput = document.getElementById('wordInput');
        this.inputFeedback = document.getElementById('inputFeedback');
        this.wordDisplay = document.getElementById('wordDisplay');
        this.currentWordDisplay = document.getElementById('currentWordDisplay');
        this.wordResult = document.getElementById('wordResult');

        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentAccuracy = document.getElementById('currentAccuracy');
        this.completedCount = document.getElementById('completedCount');
        this.remainingCount = document.getElementById('remainingCount');

        // Result elements
        this.finalAccuracy = document.getElementById('finalAccuracy');
        this.finalCorrect = document.getElementById('finalCorrect');
        this.finalTotal = document.getElementById('finalTotal');
        this.startNewPracticeBtn = document.getElementById('startNewPracticeBtn');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');

        // Stats elements
        this.totalSessions = document.getElementById('totalSessions');
        this.avgAccuracy = document.getElementById('avgAccuracy');
        this.totalWords = document.getElementById('totalWords');
        this.totalCorrect = document.getElementById('totalCorrect');

        // History
        this.historyList = document.getElementById('historyList');
    }

    bindEvents() {
        // Main menu
        this.startPracticeBtn.addEventListener('click', () => this.startPractice());
        this.viewStatsBtn.addEventListener('click', () => this.showStats());
        this.viewHistoryBtn.addEventListener('click', () => this.showHistory());

        // Navigation
        this.backFromStatsBtn.addEventListener('click', () => this.showMainMenu());
        this.backFromHistoryBtn.addEventListener('click', () => this.showMainMenu());
        this.exitPracticeBtn.addEventListener('click', () => this.showMainMenu());

        // Practice controls
        this.playButton.addEventListener('click', () => this.playCurrentWord());
        this.replayButton.addEventListener('click', () => this.playCurrentWord());
        this.submitButton.addEventListener('click', () => this.submitAnswer());
        this.showAnswerButton.addEventListener('click', () => this.showAnswer());

        // Input
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        this.wordInput.addEventListener('input', () => {
            this.clearFeedback();
            this.isAnswerShown = false;
            this.wordDisplay.style.display = 'none';
        });

        // Result actions
        this.startNewPracticeBtn.addEventListener('click', () => this.startPractice());
        this.backToMenuBtn.addEventListener('click', () => this.showMainMenu());
    }

    showSection(sectionElement) {
        const sections = [this.mainMenu, this.statsSection, this.historySection, 
                         this.dictationSection, this.resultSection];
        sections.forEach(section => section.style.display = 'none');
        sectionElement.style.display = 'block';
    }

    showMainMenu() {
        this.showSection(this.mainMenu);
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }

    async startPractice() {
        this.showLoading(true);
        try {
            const response = await fetch('/api/start-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to start session');
            }

            const data = await response.json();
            this.currentSession = data.sessionId;
            this.words = data.words;
            this.currentWordIndex = 0;
            this.correctCount = 0;
            this.totalAttempts = 0;
            
            this.showSection(this.dictationSection);
            this.nextWord();
        } catch (error) {
            console.error('Error starting practice:', error);
            alert('启动练习失败，请重试');
        } finally {
            this.showLoading(false);
        }
    }

    nextWord() {
        if (this.currentWordIndex >= this.words.length) {
            this.completePractice();
            return;
        }

        this.currentWord = this.words[this.currentWordIndex];
        this.isAnswerShown = false;
        this.wordInput.value = '';
        this.wordInput.focus();
        this.clearFeedback();
        this.wordDisplay.style.display = 'none';
        
        this.updateProgress();
        this.playCurrentWord();
    }

    playCurrentWord() {
        if (!this.currentWord) return;

        // 直接使用本地TTS，因为已经工作正常
        this.playWithLocalTTS();
    }

    playWithLocalTTS() {
        if (!('speechSynthesis' in window)) {
            alert('您的浏览器不支持语音播放功能');
            return;
        }

        // 清除之前的语音
        speechSynthesis.cancel();
        
        // 等待一小段时间再播放，避免冲突
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(this.currentWord);
            
            // 设置语音参数 - 优化为更清晰的发音
            utterance.rate = 0.6; // 更慢的语速，便于听清
            utterance.pitch = 1.0; // 标准音调
            utterance.volume = 1.0; // 最大音量
            utterance.lang = 'en-US'; // 美式英语
            
            // 使用预选的最佳语音
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }
            
            // 添加事件监听
            utterance.onstart = () => {
                console.log(`🔊 Playing: ${this.currentWord} with voice: ${utterance.voice?.name || 'default'}`);
                // 禁用播放按钮防止重复点击
                this.playButton.disabled = true;
                this.replayButton.disabled = true;
            };
            
            utterance.onend = () => {
                console.log('🔇 Speech ended');
                // 重新启用播放按钮
                this.playButton.disabled = false;
                this.replayButton.disabled = false;
            };
            
            utterance.onerror = (event) => {
                console.error('🚫 Speech error:', event.error);
                this.playButton.disabled = false;
                this.replayButton.disabled = false;
                
                // 如果是网络错误，提供提示
                if (event.error === 'network') {
                    alert('网络语音服务不可用，请检查网络连接或尝试刷新页面');
                } else {
                    alert(`语音播放出错: ${event.error}。建议刷新页面重试。`);
                }
            };

            // 开始播放
            speechSynthesis.speak(utterance);
            
        }, 100); // 100ms延迟
    }

    async submitAnswer() {
        const userInput = this.wordInput.value.trim().toLowerCase();
        const correctAnswer = this.currentWord.toLowerCase();
        const isCorrect = userInput === correctAnswer;

        if (!userInput) {
            this.showFeedback('请输入单词后再提交', 'feedback-incorrect');
            return;
        }

        this.totalAttempts++;
        if (isCorrect) {
            this.correctCount++;
            this.showFeedback('✓ 正确！', 'feedback-correct');
        } else {
            this.showFeedback(`✗ 错误。正确答案是: ${this.currentWord}`, 'feedback-incorrect');
        }

        // 保存答题记录
        try {
            await fetch('/api/submit-word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSession,
                    word: this.currentWord,
                    userInput: userInput,
                    isCorrect: isCorrect
                })
            });
        } catch (error) {
            console.error('Error submitting word:', error);
        }

        // 显示答案
        this.showAnswer();
        
        // 延迟进入下一个单词
        setTimeout(() => {
            this.currentWordIndex++;
            this.nextWord();
        }, 2000);
    }

    showAnswer() {
        this.isAnswerShown = true;
        this.currentWordDisplay.textContent = this.currentWord;
        this.wordDisplay.style.display = 'block';
        
        const userInput = this.wordInput.value.trim().toLowerCase();
        const isCorrect = userInput === this.currentWord.toLowerCase();
        
        if (isCorrect) {
            this.wordResult.textContent = '✓ 回答正确！';
            this.wordResult.className = 'word-result feedback-correct';
        } else {
            this.wordResult.textContent = `您的答案: ${userInput || '(未填写)'}`;
            this.wordResult.className = 'word-result feedback-incorrect';
        }
    }

    showFeedback(message, className) {
        this.inputFeedback.textContent = message;
        this.inputFeedback.className = `input-feedback ${className}`;
    }

    clearFeedback() {
        this.inputFeedback.textContent = '';
        this.inputFeedback.className = 'input-feedback';
    }

    updateProgress() {
        const progress = (this.currentWordIndex / this.words.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `${this.currentWordIndex} / ${this.words.length}`;
        
        const accuracy = this.totalAttempts > 0 ? (this.correctCount / this.totalAttempts * 100) : 0;
        this.currentAccuracy.textContent = `${Math.round(accuracy)}%`;
        this.completedCount.textContent = this.currentWordIndex;
        this.remainingCount.textContent = this.words.length - this.currentWordIndex;
    }

    async completePractice() {
        this.showLoading(true);
        try {
            const response = await fetch('/api/complete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSession
                })
            });

            if (!response.ok) {
                throw new Error('Failed to complete session');
            }

            const data = await response.json();
            
            // 显示结果
            this.finalAccuracy.textContent = `${Math.round(data.accuracyRate)}%`;
            this.finalCorrect.textContent = data.correct;
            this.finalTotal.textContent = data.total;
            
            this.showSection(this.resultSection);
        } catch (error) {
            console.error('Error completing practice:', error);
            alert('保存练习结果失败');
        } finally {
            this.showLoading(false);
        }
    }

    async showStats() {
        this.showLoading(true);
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            
            this.totalSessions.textContent = data.totalSessions;
            this.avgAccuracy.textContent = `${Math.round(data.averageAccuracy)}%`;
            this.totalWords.textContent = data.totalWordsPracticed;
            this.totalCorrect.textContent = data.totalCorrectWords;
            
            this.showSection(this.statsSection);
        } catch (error) {
            console.error('Error fetching stats:', error);
            alert('获取统计数据失败');
        } finally {
            this.showLoading(false);
        }
    }

    async showHistory() {
        this.showLoading(true);
        try {
            const response = await fetch('/api/recent-sessions');
            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }

            const data = await response.json();
            this.renderHistory(data);
            this.showSection(this.historySection);
        } catch (error) {
            console.error('Error fetching history:', error);
            alert('获取历史记录失败');
        } finally {
            this.showLoading(false);
        }
    }

    renderHistory(sessions) {
        if (!sessions || sessions.length === 0) {
            this.historyList.innerHTML = '<div style="text-align: center; color: #718096; padding: 40px;">暂无练习记录</div>';
            return;
        }

        this.historyList.innerHTML = sessions.map(session => {
            const date = new Date(session.completed_at).toLocaleString('zh-CN');
            const accuracy = Math.round(session.accuracy_rate);
            
            return `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-date">${date}</div>
                        <div class="history-stats">
                            ${session.correct_words} / ${session.total_words} 个单词
                        </div>
                    </div>
                    <div class="history-accuracy">${accuracy}%</div>
                </div>
            `;
        }).join('');
    }

    initializeVoices() {
        // 初始化语音系统
        if ('speechSynthesis' in window) {
            // 等待语音列表加载
            let voicesLoaded = false;
            
            const loadVoices = () => {
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0 && !voicesLoaded) {
                    voicesLoaded = true;
                    this.availableVoices = voices;
                    this.selectBestVoice();
                }
            };
            
            // 立即尝试加载
            loadVoices();
            
            // 监听语音变化事件
            speechSynthesis.onvoiceschanged = loadVoices;
            
            // 备用：延迟加载
            setTimeout(loadVoices, 1000);
        }
    }

    selectBestVoice() {
        if (!this.availableVoices) return null;
        
        console.log('Available voices:', this.availableVoices.map(v => `${v.name} (${v.lang})`));
        
        // 按优先级选择语音
        const priorities = [
            // 高质量在线语音
            (voice) => voice.name.includes('Google') && voice.lang.startsWith('en') && !voice.localService,
            // 系统高质量语音
            (voice) => voice.localService && voice.lang.startsWith('en') && 
                      (voice.name.includes('Alex') || voice.name.includes('Samantha') || 
                       voice.name.includes('Microsoft')),
            // 其他英语语音
            (voice) => voice.lang.startsWith('en'),
            // 任何语音
            (voice) => true
        ];
        
        for (const priority of priorities) {
            const voice = this.availableVoices.find(priority);
            if (voice) {
                this.selectedVoice = voice;
                console.log('Selected voice:', voice.name, voice.lang);
                return voice;
            }
        }
        
        return null;
    }
}

// 等待语音API加载
window.addEventListener('DOMContentLoaded', () => {
    // 预加载语音
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        
        // 某些浏览器需要用户交互后才能获取语音列表
        document.addEventListener('click', () => {
            speechSynthesis.getVoices();
        }, { once: true });
    }
    
    // 初始化应用
    new WordDictationApp();
});
