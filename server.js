const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 初始化数据库
const db = new sqlite3.Database('dictation.db');

// 创建表（如不存在）
db.serialize(() => {
    
    // 用户练习记录表
    db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE,
        unit_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_words INTEGER,
        correct_words INTEGER,
        accuracy_rate REAL,
        completed_at DATETIME
    )`);

    // 单词练习详情表
    db.run(`CREATE TABLE IF NOT EXISTS word_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        word TEXT,
        unit_name TEXT,
        user_input TEXT,
        is_correct BOOLEAN,
        attempts INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES user_sessions (session_id)
    )`);

    // 单词统计表
    db.run(`CREATE TABLE IF NOT EXISTS word_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        unit_name TEXT,
        total_attempts INTEGER DEFAULT 0,
        correct_attempts INTEGER DEFAULT 0,
        accuracy_rate REAL DEFAULT 0,
        last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(word, unit_name)
    )`);
    
    console.log('Database tables created successfully');
});

// 读取单词本并按单元分组
function loadWordsByUnits() {
    try {
        const data = fs.readFileSync('output.txt', 'utf8');
        const lines = data.split('\n');
        const units = [];
        let currentUnit = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('#')) {
                // 新单元开始
                if (currentUnit && currentUnit.words.length > 0) {
                    units.push(currentUnit);
                }
                currentUnit = {
                    name: trimmedLine.substring(1).trim(),
                    words: []
                };
            } else if (trimmedLine && currentUnit) {
                // 添加单词到当前单元
                currentUnit.words.push(trimmedLine);
            }
        }
        
        // 添加最后一个单元
        if (currentUnit && currentUnit.words.length > 0) {
            units.push(currentUnit);
        }
        
        return units;
    } catch (error) {
        console.error('Error loading words:', error);
        return [];
    }
}

// 获取所有单词（保留原有功能）
function loadWords() {
    const units = loadWordsByUnits();
    return units.flatMap(unit => unit.words);
}

// 生成会话ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 获取单词列表
app.get('/api/words', (req, res) => {
    const words = loadWords();
    res.json({ words: words.slice(0, 100) }); // 限制每次练习100个单词
});

// 开始新的练习会话
app.post('/api/start-session', (req, res) => {
    const { unitName } = req.body;
    const sessionId = generateSessionId();
    
    let words, totalWords, selectedUnitName;
    
    if (unitName) {
        // 按单元练习
        const units = loadWordsByUnits();
        const unit = units.find(u => u.name === unitName);
        
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        
        words = unit.words;
        totalWords = words.length;
        selectedUnitName = unit.name;
    } else {
        // 全部单词练习（保留原有功能）
        words = loadWords();
        totalWords = Math.min(words.length, 100);
        words = words.slice(0, totalWords);
        selectedUnitName = '全部单词';
    }
    
    db.run(
        'INSERT INTO user_sessions (session_id, unit_name, total_words) VALUES (?, ?, ?)',
        [sessionId, selectedUnitName, totalWords],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create session' });
            }
            res.json({ 
                sessionId, 
                totalWords,
                unitName: selectedUnitName,
                words
            });
        }
    );
});

// 提交单词答案
app.post('/api/submit-word', (req, res) => {
    const { sessionId, word, userInput, isCorrect, unitName } = req.body;
    
    if (!sessionId || !word || userInput === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 保存练习记录
    db.run(
        'INSERT INTO word_attempts (session_id, word, unit_name, user_input, is_correct) VALUES (?, ?, ?, ?, ?)',
        [sessionId, word, unitName, userInput, isCorrect],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save word attempt' });
            }
            
            // 更新单词统计
            updateWordStats(word, unitName, isCorrect);
            res.json({ success: true });
        }
    );
});

// 更新单词统计
function updateWordStats(word, unitName, isCorrect) {
    const query = `
        INSERT INTO word_stats (word, unit_name, total_attempts, correct_attempts, accuracy_rate, last_practiced)
        VALUES (?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(word, unit_name) DO UPDATE SET
            total_attempts = total_attempts + 1,
            correct_attempts = correct_attempts + ?,
            accuracy_rate = CAST(correct_attempts AS REAL) / total_attempts * 100,
            last_practiced = CURRENT_TIMESTAMP
    `;
    
    const correctIncrement = isCorrect ? 1 : 0;
    
    db.run(query, [word, unitName, correctIncrement, correctIncrement], (err) => {
        if (err) {
            console.error('Error updating word stats:', err);
        }
    });
}

// 完成练习会话
app.post('/api/complete-session', (req, res) => {
    const { sessionId } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    // 计算统计数据
    db.all(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct FROM word_attempts WHERE session_id = ?',
        [sessionId],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to calculate stats' });
            }

            const total = rows[0].total;
            const correct = rows[0].correct;
            const accuracyRate = total > 0 ? (correct / total) * 100 : 0;

            // 更新会话记录
            db.run(
                'UPDATE user_sessions SET correct_words = ?, accuracy_rate = ?, completed_at = CURRENT_TIMESTAMP WHERE session_id = ?',
                [correct, accuracyRate, sessionId],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to update session' });
                    }
                    
                    res.json({
                        total,
                        correct,
                        accuracyRate: Math.round(accuracyRate * 100) / 100
                    });
                }
            );
        }
    );
});

// 获取历史统计
app.get('/api/stats', (req, res) => {
    db.all(
        `SELECT 
            COUNT(*) as total_sessions,
            AVG(accuracy_rate) as avg_accuracy,
            SUM(total_words) as total_words_practiced,
            SUM(correct_words) as total_correct_words
        FROM user_sessions 
        WHERE completed_at IS NOT NULL`,
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to get stats' });
            }

            const stats = rows[0];
            res.json({
                totalSessions: stats.total_sessions || 0,
                averageAccuracy: Math.round((stats.avg_accuracy || 0) * 100) / 100,
                totalWordsPracticed: stats.total_words_practiced || 0,
                totalCorrectWords: stats.total_correct_words || 0
            });
        }
    );
});

// 获取最近的练习记录
app.get('/api/recent-sessions', (req, res) => {
    db.all(
        `SELECT 
            session_id,
            unit_name,
            total_words,
            correct_words,
            accuracy_rate,
            created_at,
            completed_at
        FROM user_sessions 
        WHERE completed_at IS NOT NULL
        ORDER BY completed_at DESC 
        LIMIT 10`,
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to get recent sessions' });
            }

            res.json(rows);
        }
    );
});

// 获取所有单元列表
app.get('/api/units', (req, res) => {
    const units = loadWordsByUnits();
    const unitList = units.map(unit => ({
        name: unit.name,
        wordCount: unit.words.length
    }));
    res.json({ units: unitList });
});

// 获取指定单元的单词
app.get('/api/units/:unitName/words', (req, res) => {
    const unitName = decodeURIComponent(req.params.unitName);
    const units = loadWordsByUnits();
    const unit = units.find(u => u.name === unitName);
    
    if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
    }
    
    res.json({ 
        unitName: unit.name,
        words: unit.words 
    });
});

// 获取单词统计
app.get('/api/word-stats', (req, res) => {
    const { unit, sortBy = 'accuracy', order = 'asc' } = req.query;
    
    let query = `
        SELECT 
            word,
            unit_name,
            total_attempts,
            correct_attempts,
            accuracy_rate,
            last_practiced
        FROM word_stats
    `;
    
    const params = [];
    
    if (unit) {
        query += ' WHERE unit_name = ?';
        params.push(unit);
    }
    
    // 排序
    const validSorts = ['word', 'accuracy_rate', 'total_attempts', 'last_practiced'];
    if (validSorts.includes(sortBy)) {
        query += ` ORDER BY ${sortBy} ${order === 'desc' ? 'DESC' : 'ASC'}`;
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to get word stats' });
        }
        
        res.json(rows);
    });
});

// 获取单元统计
app.get('/api/unit-stats', (req, res) => {
    const query = `
        SELECT 
            unit_name,
            COUNT(*) as total_words,
            AVG(accuracy_rate) as avg_accuracy,
            SUM(total_attempts) as total_attempts,
            MAX(last_practiced) as last_practiced
        FROM word_stats
        GROUP BY unit_name
        ORDER BY unit_name
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to get unit stats' });
        }
        
        res.json(rows);
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('单词听写练习系统已启动！');
});
