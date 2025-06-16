class WordDictationApp {
    constructor() {
        this.currentSession = null;
        this.words = [];
        this.currentWordIndex = 0;
        this.correctCount = 0;
        this.totalAttempts = 0;
        this.currentWord = '';
        this.currentUnit = null;
        this.selectedUnitName = '';
        this.isAnswerShown = false;
        
        // 移动端优化
        this.initMobileOptimizations();
        
        this.initializeElements();
        this.bindEvents();
        this.initializeVoices();
        this.showMainMenu();
    }

    initMobileOptimizations() {
        // 检测移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            // 移动端特殊处理
            document.body.classList.add('mobile');
            
            // 防止页面滚动
            document.addEventListener('touchmove', (e) => {
                if (e.target.closest('.unit-list, .history-list, .word-stats-list')) {
                    return; // 允许列表滚动
                }
                e.preventDefault();
            }, { passive: false });
            
            // 优化输入框体验
            document.addEventListener('focusin', (e) => {
                if (e.target.id === 'wordInput') {
                    // 延迟滚动，等待键盘弹出
                    setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            });
            
            // 添加触觉反馈（如果支持）
            if ('vibrate' in navigator) {
                this.addHapticFeedback();
            }
        }
    }

    addHapticFeedback() {
        // 为按钮添加触觉反馈
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .play-button, .unit-item')) {
                navigator.vibrate(10); // 轻微震动
            }
        });
    }

    initializeElements() {
        // Sections
        this.mainMenu = document.getElementById('mainMenu');
        this.statsSection = document.getElementById('statsSection');
        this.historySection = document.getElementById('historySection');
        this.unitSelection = document.getElementById('unitSelection');
        this.wordStatsSection = document.getElementById('wordStatsSection');
        this.dictationSection = document.getElementById('dictationSection');
        this.resultSection = document.getElementById('resultSection');
        this.loading = document.getElementById('loading');

        // Main menu buttons
        this.startPracticeBtn = document.getElementById('startPracticeBtn');
        this.viewStatsBtn = document.getElementById('viewStatsBtn');
        this.viewHistoryBtn = document.getElementById('viewHistoryBtn');
        this.selectUnitBtn = document.getElementById('selectUnitBtn');
        this.wordStatsBtn = document.getElementById('wordStatsBtn');

        // Navigation buttons
        this.backFromStatsBtn = document.getElementById('backFromStatsBtn');
        this.backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
        this.backFromUnitBtn = document.getElementById('backFromUnitBtn');
        this.backFromWordStatsBtn = document.getElementById('backFromWordStatsBtn');
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

        // Unit selection elements
        this.unitList = document.getElementById('unitList');
        this.practiceAllBtn = document.getElementById('practiceAllBtn');

        // Word stats elements
        this.unitStatsList = document.getElementById('unitStatsList');
        this.wordStatsList = document.getElementById('wordStatsList');
        this.unitFilter = document.getElementById('unitFilter');
        this.sortBy = document.getElementById('sortBy');
        this.sortOrder = document.getElementById('sortOrder');
        this.refreshStatsBtn = document.getElementById('refreshStatsBtn');
    }

    bindEvents() {
        // Main menu
        this.startPracticeBtn.addEventListener('click', () => this.startPractice());
        this.viewStatsBtn.addEventListener('click', () => this.showStats());
        this.viewHistoryBtn.addEventListener('click', () => this.showHistory());
        this.selectUnitBtn.addEventListener('click', () => this.showUnitSelection());
        this.wordStatsBtn.addEventListener('click', () => this.showWordStats());

        // Navigation
        this.backFromStatsBtn.addEventListener('click', () => this.showMainMenu());
        this.backFromHistoryBtn.addEventListener('click', () => this.showMainMenu());
        this.backFromUnitBtn.addEventListener('click', () => this.showMainMenu());
        this.backFromWordStatsBtn.addEventListener('click', () => this.showMainMenu());
        this.exitPracticeBtn.addEventListener('click', () => this.showMainMenu());

        // Unit selection
        this.practiceAllBtn.addEventListener('click', () => this.startPractice());

        // Word stats
        this.refreshStatsBtn.addEventListener('click', () => this.loadWordStats());
        this.unitFilter.addEventListener('change', () => this.loadWordStats());
        this.sortBy.addEventListener('change', () => this.loadWordStats());
        this.sortOrder.addEventListener('change', () => this.loadWordStats());

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
                         this.unitSelection, this.wordStatsSection, this.dictationSection, 
                         this.resultSection];
        sections.forEach(section => section.style.display = 'none');
        sectionElement.style.display = 'block';
    }

    showMainMenu() {
        this.showSection(this.mainMenu);
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
    }

    async startPractice(unitName) {
        this.showLoading(true);
        try {
            const response = await fetch('/api/start-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitName: unitName || this.selectedUnitName })
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

    async playCurrentWord() {
        if (!this.currentWord) return;

        // 尝试从在线词典获取音频
        const played = await this.playWithOnlineAudio();
        if (!played) {
            // 若获取失败则回退到浏览器内置TTS
            this.playWithLocalTTS();
        }
    }

    async playWithOnlineAudio() {
        const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${this.currentWord}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            const phonetics = data[0]?.phonetics || [];
            const entry = phonetics.find(p => p.audio);
            if (!entry || !entry.audio) return false;

            const audio = new Audio(entry.audio);
            return await new Promise(resolve => {
                this.playButton.disabled = true;
                this.replayButton.disabled = true;

                audio.onended = () => {
                    this.playButton.disabled = false;
                    this.replayButton.disabled = false;
                    resolve(true);
                };

                audio.onerror = () => {
                    this.playButton.disabled = false;
                    this.replayButton.disabled = false;
                    resolve(false);
                };

                audio.play().catch(() => resolve(false));
            });
        } catch (err) {
            console.error('Online audio fetch failed', err);
            return false;
        }
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
                    unitName: this.selectedUnitName,
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
                            单元: ${session.unit_name || '全部单词'}<br>
                            ${session.correct_words} / ${session.total_words} 个单词
                        </div>
                    </div>
                    <div class="history-accuracy">${accuracy}%</div>
                </div>
            `;
        }).join('');
    }

    async showUnitSelection() {
        this.showLoading(true);
        try {
            const response = await fetch('/api/units');
            if (!response.ok) {
                throw new Error('Failed to fetch units');
            }

            const data = await response.json();
            this.renderUnitList(data.units);
            this.showSection(this.unitSelection);
        } catch (error) {
            console.error('Error fetching units:', error);
            alert('获取单元列表失败');
        } finally {
            this.showLoading(false);
        }
    }

    renderUnitList(units) {
        if (!units || units.length === 0) {
            this.unitList.innerHTML = '<div style="text-align: center; color: #718096; padding: 40px;">暂无可用单元</div>';
            return;
        }

        this.unitList.innerHTML = units.map(unit => `
            <div class="unit-item" data-unit-name="${unit.name}">
                <div class="unit-info">
                    <div class="unit-name">${unit.name}</div>
                    <div class="unit-word-count">${unit.wordCount} 个单词</div>
                </div>
                <button class="btn btn-primary btn-small" onclick="app.startUnitPractice('${unit.name}')">
                    开始练习
                </button>
            </div>
        `).join('');
    }

    async startUnitPractice(unitName) {
        this.selectedUnitName = unitName;
        this.startPractice(unitName);
    }

    async showWordStats() {
        this.showLoading(true);
        try {
            await Promise.all([
                this.loadUnitStats(),
                this.loadWordStats(),
                this.loadUnitsForFilter()
            ]);
            this.showSection(this.wordStatsSection);
        } catch (error) {
            console.error('Error loading word stats:', error);
            alert('获取统计数据失败');
        } finally {
            this.showLoading(false);
        }
    }

    async loadUnitStats() {
        const response = await fetch('/api/unit-stats');
        if (!response.ok) {
            throw new Error('Failed to fetch unit stats');
        }

        const data = await response.json();
        this.renderUnitStats(data);
    }

    renderUnitStats(unitStats) {
        if (!unitStats || unitStats.length === 0) {
            this.unitStatsList.innerHTML = '<div style="text-align: center; color: #718096;">暂无统计数据</div>';
            return;
        }

        this.unitStatsList.innerHTML = unitStats.map(unit => `
            <div class="unit-stat-item">
                <div class="unit-stat-name">${unit.unit_name}</div>
                <div class="unit-stat-details">
                    平均正确率: ${Math.round(unit.avg_accuracy || 0)}%<br>
                    练习单词数: ${unit.total_words}<br>
                    总练习次数: ${unit.total_attempts}<br>
                    最近练习: ${unit.last_practiced ? new Date(unit.last_practiced).toLocaleDateString('zh-CN') : '未练习'}
                </div>
            </div>
        `).join('');
    }

    async loadWordStats() {
        const unit = this.unitFilter.value;
        const sortBy = this.sortBy.value;
        const order = this.sortOrder.value;
        
        const params = new URLSearchParams();
        if (unit) params.append('unit', unit);
        params.append('sortBy', sortBy);
        params.append('order', order);

        const response = await fetch(`/api/word-stats?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch word stats');
        }

        const data = await response.json();
        this.renderWordStats(data);
    }

    renderWordStats(wordStats) {
        if (!wordStats || wordStats.length === 0) {
            this.wordStatsList.innerHTML = '<div style="text-align: center; color: #718096; padding: 20px;">暂无统计数据</div>';
            return;
        }

        const header = `
            <div class="word-stats-header">
                <div>单词</div>
                <div>正确率</div>
                <div>练习次数</div>
                <div>正确次数</div>
                <div>最近练习</div>
            </div>
        `;

        const items = wordStats.map(word => {
            const accuracy = Math.round(word.accuracy_rate || 0);
            let accuracyClass = 'medium';
            if (accuracy >= 80) accuracyClass = 'high';
            else if (accuracy < 60) accuracyClass = 'low';

            return `
                <div class="word-stat-item">
                    <div class="word-stat-word">${word.word}</div>
                    <div class="word-stat-accuracy ${accuracyClass}">${accuracy}%</div>
                    <div class="word-stat-attempts">${word.total_attempts}</div>
                    <div class="word-stat-attempts">${word.correct_attempts}</div>
                    <div class="word-stat-date">${new Date(word.last_practiced).toLocaleDateString('zh-CN')}</div>
                </div>
            `;
        }).join('');

        this.wordStatsList.innerHTML = header + items;
    }

    async loadUnitsForFilter() {
        const response = await fetch('/api/units');
        if (!response.ok) {
            throw new Error('Failed to fetch units');
        }

        const data = await response.json();
        this.unitFilter.innerHTML = '<option value="">所有单元</option>' + 
            data.units.map(unit => `<option value="${unit.name}">${unit.name}</option>`).join('');
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
    window.app = new WordDictationApp();
});
