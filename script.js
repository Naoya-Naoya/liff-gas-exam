// GAS WebアプリURL
const gasUrl = "https://script.google.com/macros/s/AKfycbyAfBnuRrW_iiZJO0Q9dQkQjAvDV03Ha4LTEKDkbcvlGdO5GXRG1Isg78YpcKG1STf8/exec";

// グローバル変数
let userProfile = null;
let questions = [];
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let isAnswerSubmitted = false;
let currentScreen = 'loading';

// プログレスバー更新
function updateProgress(percentage, text) {
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = text;
}

// ヘッダーユーザー情報更新
function updateHeaderUserInfo(name, avatarUrl) {
    document.getElementById('userName').textContent = name || 'ผู้ใช้';
    const avatarElement = document.getElementById('userAvatar');
    if (avatarUrl) {
        avatarElement.src = avatarUrl;
        avatarElement.onerror = () => {
            avatarElement.src = 'https://placehold.co/100x100/4CAF50/FFFFFF?text=U';
        };
    }
}

// 画面切り替え
function showScreen(screenName) {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('completionScreen').style.display = 'none';
    
    if (screenName === 'loading') {
        document.getElementById('loadingScreen').style.display = 'block';
    } else if (screenName === 'error') {
        document.getElementById('errorScreen').style.display = 'block';
    } else if (screenName === 'quiz') {
        document.getElementById('quizScreen').style.display = 'block';
    } else if (screenName === 'completion') {
        document.getElementById('completionScreen').style.display = 'block';
    }
    currentScreen = screenName;
}

// LIFF初期化
async function initializeLiff() {
    try {
        updateProgress(20, 'กำลังเชื่อมต่อ LIFF...');
        
        await liff.init({ liffId: "2007507724-jxmBZwP0" });
        updateProgress(40, 'LIFF เชื่อมต่อสำเร็จ');
        
        if (!liff.isLoggedIn()) {
            updateProgress(50, 'กำลังเข้าสู่ระบบ...');
            liff.login();
            return;
        }
        
        // プロフィール取得
        userProfile = await liff.getProfile();
        updateProgress(60, 'กำลังโหลดข้อมูลผู้ใช้...');

        // ログイン情報をGASに記録
        try {
            await fetch(`${gasUrl}?type=profileData&displayName=${encodeURIComponent(userProfile.displayName)}&userId=${encodeURIComponent(userProfile.userId)}&pictureUrl=${encodeURIComponent(userProfile.pictureUrl)}`,
                { method: 'GET', redirect: 'follow' });
        } catch (e) {
            console.warn('ユーザー情報の記録に失敗:', e);
        }
        
        // ヘッダーにユーザー情報を表示
        updateHeaderUserInfo(userProfile.displayName, userProfile.pictureUrl);
        
        updateProgress(80, 'กำลังโหลดแบบทดสอบ...');
        
        // クイズを開始
        await startQuiz();
        
    } catch (e) {
        console.error("LIFF initialization failed", e);
        showError('ไม่สามารถเชื่อมต่อ LIFF ได้: ' + e.message);
    }
}

// エラー表示
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    showScreen('error');
    updateProgress(0, 'เกิดข้อผิดพลาด');
}

// クイズ開始
async function startQuiz() {
    try {
        updateProgress(90, 'กำลังโหลดคำถาม...');

        // GASから問題データを取得
        const response = await fetch(`${gasUrl}?action=getQuestions`, {
            method: 'GET',
            redirect: 'follow'
        });
        const data = await response.json();
        const today = new Date();
        today.setHours(0,0,0,0);

        // 日付範囲内の問題のみ抽出
        questions = data.filter(row => {
            const start = new Date(row.TermStart);
            const end = new Date(row.TermEnd);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            return today >= start && today <= end;
        }).map(row => {
            // 選択肢生成（Answer＋SelectionSet1～10からAnswerを含む5つをランダムで）
            const selections = [];
            for (let i = 1; i <= 10; i++) {
                const val = row[`SelectionSet${i}`];
                if (val && val.trim() !== '') selections.push(val.trim());
            }
            if (!selections.includes(row.Answer.trim())) {
                selections.push(row.Answer.trim());
            }
            // Answerを含む5つをランダムで選択
            let options = shuffleArray(selections.filter((v, i, a) => a.indexOf(v) === i));
            if (!options.includes(row.Answer.trim())) options[0] = row.Answer.trim();
            if (options.length > 5) {
                // Answerを必ず含めて4つランダム
                const filtered = options.filter(opt => opt !== row.Answer.trim());
                options = shuffleArray(filtered).slice(0, 4);
                options.push(row.Answer.trim());
                options = shuffleArray(options);
            }
            return {
                question: row.Question,
                options: options,
                correctAnswer: row.Answer.trim(),
                image: row.Image
            };
        });

        currentQuestionIndex = 0;
        correctAnswersCount = 0;

        updateProgress(100, 'พร้อมแล้ว!');

        setTimeout(() => {
            showScreen('quiz');
            showQuestion();
        }, 500);

    } catch (error) {
        console.error('Quiz start failed:', error);
        showError('ไม่สามารถโหลดแบบทดสอบได้');
    }
}

// 問題表示
function showQuestion() {
    if (questions.length === 0) return;

    const question = questions[currentQuestionIndex];
    const questionArea = document.getElementById('questionArea');

    // 選択肢のHTMLを生成（毎回シャッフル）
    const optionsHtml = shuffleArray([...question.options]).map(option => {
        const escapedOption = option.replace(/'/g, "\\'");
        return `<button class="option-button" onclick="selectAnswer('${escapedOption}')">${option}</button>`;
    }).join('');

    questionArea.innerHTML = `
        <img class="question-image" src="${question.image}" alt="รูปคำถาม" onerror="this.onerror=null; this.src='https://placehold.co/400x200/CCCCCC/666666?text=Image+Not+Found';">
        <div class="question-text">${question.question}</div>
        <div class="options-container">
            ${optionsHtml}
        </div>
        <div class="feedback" id="feedback"></div>
        <button class="next-button" id="nextButton" onclick="nextQuestion()">ข้อถัดไป</button>
    `;

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    updateProgress(progress, `ข้อ ${currentQuestionIndex + 1} / ${questions.length}`);

    isAnswerSubmitted = false;
}

// 回答選択
function selectAnswer(selectedAnswer) {
    if (isAnswerSubmitted) return;
    isAnswerSubmitted = true;

    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;

    const buttons = document.querySelectorAll('.option-button');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === selectedAnswer) {
            button.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
    });

    const feedbackElement = document.getElementById('feedback');
    if (isCorrect) {
        feedbackElement.className = 'feedback correct show';
        feedbackElement.textContent = 'ถูกต้อง!';
        correctAnswersCount++;
        // GASに回答データを送信（オプション）
        if (userProfile && gasUrl) {
            sendAnswerToGAS(selectedAnswer, isCorrect);
        }
        document.getElementById('nextButton').style.display = 'block';
    } else {
        // 不正解時は選択肢を再生成して再表示
        feedbackElement.className = 'feedback incorrect show';
        feedbackElement.textContent = '不正解です。もう一度選んでください';
        // 選択肢を再生成
        const allOptions = [question.correctAnswer, ...question.options.filter(opt => opt !== question.correctAnswer)];
        let newOptions = shuffleArray(allOptions.filter((v, i, a) => a.indexOf(v) === i));
        if (!newOptions.includes(question.correctAnswer)) newOptions[0] = question.correctAnswer;
        if (newOptions.length > 5) {
            const filtered = newOptions.filter(opt => opt !== question.correctAnswer);
            newOptions = shuffleArray(filtered).slice(0, 4);
            newOptions.push(question.correctAnswer);
            newOptions = shuffleArray(newOptions);
        }
        questions[currentQuestionIndex].options = newOptions;
        setTimeout(() => {
            showQuestion();
        }, 1200);
    }
}

// 次の問題
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) {
        showCompletion();
    } else {
        showQuestion();
    }
}

// 完了画面
function showCompletion() {
    showScreen('completion');
    updateProgress(100, 'เสร็จสิ้น!');
    
    const percentage = Math.round((correctAnswersCount / questions.length) * 100);
    const completionText = document.getElementById('completionText');
    completionText.innerHTML = `
        คุณตอบถูก ${correctAnswersCount} ข้อ จากทั้งหมด ${questions.length} ข้อ<br>
        คะแนน: ${percentage}%<br>
        เยี่ยมมาก!
    `;

    // GASに完了データを送信（オプション）
    if (userProfile && gasUrl) {
        sendCompletionToGAS();
    }
}

// クイズ再開
function restartQuiz() {
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    startQuiz();
}

// GASに回答を送信
async function sendAnswerToGAS(answer, isCorrect) {
    try {
        const params = new URLSearchParams({
            action: 'saveAnswer',
            userId: userProfile.userId,
            userName: userProfile.displayName,
            questionIndex: currentQuestionIndex,
            answer: answer,
            isCorrect: isCorrect,
            timestamp: new Date().toISOString()
        });
        
        await fetch(`${gasUrl}?${params}`, {
            method: 'GET',
            redirect: 'follow'
        });
        
    } catch (error) {
        console.error('Failed to send answer to GAS:', error);
    }
}

// GASに完了データを送信
async function sendCompletionToGAS() {
    try {
        const params = new URLSearchParams({
            action: 'saveCompletion',
            userId: userProfile.userId,
            userName: userProfile.displayName,
            completedAt: new Date().toISOString(),
            correctAnswersCount: correctAnswersCount,
            totalQuestions: questions.length
        });
        
        await fetch(`${gasUrl}?${params}`, {
            method: 'GET',
            redirect: 'follow'
        });
        
    } catch (error) {
        console.error('Failed to send completion to GAS:', error);
    }
}

// 配列シャッフル
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// グローバル関数として定義
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('แอปพลิเคชันเริ่มทำงาน');
    showScreen('loading');
    updateProgress(10, 'กำลังเริ่มต้น...');
    
    // 少し遅延してからLIFF初期化
    setTimeout(() => {
        initializeLiff();
    }, 1000);
});
