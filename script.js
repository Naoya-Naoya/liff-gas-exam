// GAS WebアプリURL
const gasUrl = "https://script.google.com/macros/s/AKfycbyAfBnuRrW_iiZJO0Q9dQkQjAvDV03Ha4LTEKDkbcvlGdO5GXRG1Isg78YpcKG1STf8/exec";

// グローバル変数
let userProfile = null;
let questions = [];
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let totalAnswerCount = 0;
let isAnswerSubmitted = false;
let currentScreen = 'loading';
let selectedBrand = null;
let userBrand = null;
let isBrandChecked = false;
let userAuthType = 'User'; // デフォルトはUser

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
    document.getElementById('brandSelectScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';

    // プログレスバーの表示制御
    const progressSection = document.getElementById('progressSection');
    if (screenName === 'quiz' || screenName === 'completion') {
        progressSection.style.display = '';
    } else {
        progressSection.style.display = 'none';
    }

    // 画面ごとの表示
    if (screenName === 'loading') {
        document.getElementById('loadingScreen').style.display = 'block';
    } else if (screenName === 'error') {
        document.getElementById('errorScreen').style.display = 'block';
    } else if (screenName === 'quiz') {
        document.getElementById('quizScreen').style.display = 'block';
    } else if (screenName === 'completion') {
        document.getElementById('completionScreen').style.display = 'block';
    } else if (screenName === 'brandSelect') {
        document.getElementById('brandSelectScreen').style.display = 'block';
    } else if (screenName === 'dashboard') {
        document.getElementById('dashboard').style.display = 'block';
    }
    currentScreen = screenName;
}

// ブランド選択画面の表示
function showBrandSelectScreen() {
    showScreen('none');
    document.getElementById('brandSelectScreen').style.display = 'block';
}

// ブランド選択画面の非表示
function hideBrandSelectScreen() {
    document.getElementById('brandSelectScreen').style.display = 'none';
}

// ユーザーアクションログをGASに送信
async function sendUserActionLog(actionType, extra = {}) {
    if (!userProfile || !gasUrl) return;
    const params = new URLSearchParams({
        action: 'saveActionLog',
        userId: userProfile.userId,
        userName: userProfile.displayName,
        actionType: actionType,
        timestamp: new Date().toISOString(),
        ...extra
    });
    try {
        await fetch(`${gasUrl}?${params}`, { method: 'GET', redirect: 'follow' });
    } catch (e) {
        console.warn('アクションログ送信失敗:', e);
    }
}

// ダッシュボード画面の表示
function showDashboard(status) {
    try {
        hideAllScreens();
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userManagementScreen').style.display = 'none';
        console.log('[DEBUG] showDashboard開始', status);
        // 画面表示状態を確認
        console.log('[DEBUG] loadingScreen display:', document.getElementById('loadingScreen').style.display);
        console.log('[DEBUG] dashboard display:', document.getElementById('dashboard').style.display);
        console.log('[DEBUG] errorScreen display:', document.getElementById('errorScreen').style.display);
        console.log('[DEBUG] quizScreen display:', document.getElementById('quizScreen').style.display);
        console.log('[DEBUG] completionScreen display:', document.getElementById('completionScreen').style.display);
        console.log('[DEBUG] brandSelectScreen display:', document.getElementById('brandSelectScreen').style.display);
        // todayStatus
        const todayStatusElem = document.getElementById('todayStatus');
        if (todayStatusElem) {
            todayStatusElem.textContent = `สำเร็จวันนี้: ${status.todayCount} ครั้ง / เป้า 3 ครั้ง`;
            console.log('[DEBUG] todayStatusセット', todayStatusElem.textContent);
        } else {
            console.warn('[DEBUG] todayStatus要素が見つかりません');
        }
        // monthStatus
        const monthStatusElem = document.getElementById('monthStatus');
        if (monthStatusElem) {
            monthStatusElem.textContent = `จำนวนวันสำเร็จเป้าในเดือนนี้: ${status.monthStatus} วัน / เป้า 20 วัน`;
            console.log('[DEBUG] monthStatusセット', monthStatusElem.textContent);
        } else {
            console.warn('[DEBUG] monthStatus要素が見つかりません');
        }
        // 星マーク
        console.log('[DEBUG] updateStarDisplay呼び出し直前', status.todayCount);
        updateStarDisplay(status.todayCount);
        console.log('[DEBUG] updateStarDisplay呼び出し直後');
        // 進捗バー
        const progressBar = document.getElementById('dashboardProgressBar');
        if (progressBar) {
            const percent = Math.min(100, Math.round((status.monthStatus / 20) * 100));
            progressBar.style.width = percent + '%';
            console.log('[DEBUG] 進捗バー更新', percent + '%');
        } else {
            console.warn('[DEBUG] dashboardProgressBar要素が見つかりません');
        }
        // チャート
        if (status.clearsByDay) {
            console.log('[DEBUG] チャート描画', status.clearsByDay);
            drawDashboardChart(status.clearsByDay);
        } else {
            console.log('[DEBUG] チャートデータなし、空で描画');
            drawDashboardChart({});
        }
        // 直近履歴
        const recentList = document.getElementById('recentClears');
        if (recentList) {
            recentList.innerHTML = '';
            if (Array.isArray(status.recent)) {
                status.recent.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `${item.dateTime}　${item.accuracy}%`;
                    recentList.appendChild(li);
                });
                console.log('[DEBUG] recent履歴セット', status.recent);
            } else {
                console.log('[DEBUG] status.recentが配列ではありません:', status.recent);
            }
        } else {
            console.warn('[DEBUG] recentClears要素が見つかりません');
        }
        // クイズスタートボタン
        const startQuizBtn = document.getElementById('startQuizBtn');
        if (startQuizBtn) {
            startQuizBtn.onclick = onStartQuiz;
            console.log('[DEBUG] startQuizBtnイベントバインド');
        } else {
            console.warn('[DEBUG] startQuizBtn要素が見つかりません');
        }
        console.log('[DEBUG] showDashboard終了');
    } catch (e) {
        console.error('[DEBUG] showDashboardでエラー:', e, status);
        showError('ダッシュボード表示エラー: ' + (e && e.message ? e.message : e));
    }
}

// 星マークの表示を更新
function updateStarDisplay(todayCount) {
    const starContainer = document.getElementById('starContainer');
    if (!starContainer) {
        console.warn('[DEBUG] starContainer要素が見つかりません');
        return;
    }
    const stars = starContainer.querySelectorAll('.star');
    const maxStars = Math.max(3, todayCount); // 3回以上にも対応
    console.log('[DEBUG] 星マーク: 既存', stars.length, '必要', maxStars);

    // 星の数を調整（必要に応じて追加）
    let loopCount = 0;
    while (starContainer.querySelectorAll('.star').length < maxStars) {
        const newStar = document.createElement('span');
        newStar.className = 'star empty';
        newStar.textContent = '☆';
        starContainer.appendChild(newStar);
        loopCount++;
        if (loopCount > 10) {
            console.error('[DEBUG] 星追加ループ異常終了');
            break;
        }
    }
    console.log('[DEBUG] 星追加ループ終了');

    // 星の状態を更新
    const updatedStars = starContainer.querySelectorAll('.star');
    updatedStars.forEach((star, index) => {
        if (index < todayCount) {
            star.className = 'star achieved';
        } else {
            star.className = 'star empty';
        }
    });
    console.log('[DEBUG] 星状態更新完了');
}

// 月間ノルマ達成日数の推移を棒グラフで描画
function drawDashboardChart(clearsByDay) {
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;
    
    // canvasの実際の表示サイズを取得
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // canvasの描画サイズを表示サイズに合わせる
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // データ整形: 日付順で最大31日分
    const days = Object.keys(clearsByDay).sort();
    const data = days.map(day => clearsByDay[day]);
    
    // 棒グラフ描画
    const w = canvas.width;
    const h = canvas.height;
    const barW = Math.max(6, Math.floor(w / Math.max(10, days.length || 10)));
    const maxVal = Math.max(3, ...data);
    
    ctx.save();
    ctx.font = '10px sans-serif';
    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(0, h-20); ctx.lineTo(w, h-20); ctx.stroke();
    
    // 棒
    data.forEach((val, i) => {
        const x = i * barW + 10;
        const y = h-20 - (val / maxVal) * (h-35);
        ctx.fillStyle = val >= 3 ? '#4caf50' : '#bdbdbd';
        ctx.fillRect(x, y, barW-2, h-20-y);
        
        // 日付ラベル
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        if (days.length <= 10 || i % 3 === 0) {
            ctx.fillText(days[i].slice(-2), x+barW/2, h-6);
        }
    });
    
    // 目標線
    ctx.strokeStyle = '#ff9800';
    const yGoal = h-20 - (3 / maxVal) * (h-35);
    ctx.beginPath();
    ctx.moveTo(0, yGoal); ctx.lineTo(w, yGoal); ctx.stroke();
    ctx.restore();
}

// ブランド選択画面の表示
function showBrandSelectScreenForFirst() {
    hideAllScreens();
    console.log('ブランド選択画面表示');
    document.getElementById('brandSelectScreen').style.display = 'block';
}

// ブランド保存API
async function saveUserBrand(brand) {
    if (!userProfile || !brand) return;
    await fetch(`${gasUrl}?action=saveBrand&userId=${encodeURIComponent(userProfile.userId)}&displayName=${encodeURIComponent(userProfile.displayName)}&pictureUrl=${encodeURIComponent(userProfile.pictureUrl)}&brand=${encodeURIComponent(brand)}`);
    userBrand = brand;
}

// ブランド取得API
async function fetchUserBrand() {
    if (!userProfile) return '';
    const res = await fetch(`${gasUrl}?action=getBrand&userId=${encodeURIComponent(userProfile.userId)}`);
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        return data.brand || '';
    } else {
        const text = await res.text();
        throw new Error(text);
    }
}

// ユーザーステータス取得API
async function fetchUserStatus() {
    if (!userProfile) return null;
    const res = await fetch(`${gasUrl}?action=getUserStatus&userId=${encodeURIComponent(userProfile.userId)}`);
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        userAuthType = data.auth || 'User'; // ここでグローバル変数に保存
        return data;
    } else {
        const text = await res.text();
        throw new Error(text);
    }
}

// クイズスタートボタンイベント
async function onStartQuiz() {
    console.log('onStartQuiz呼び出し', userBrand);
    if (!userBrand) {
        showBrandSelectScreenForFirst();
        return;
    }
    hideAllScreens();
    document.getElementById('quizScreen').style.display = 'block';
    try {
        await startQuiz();
    } catch (e) {
        showError('クイズ開始エラー: ' + (e && e.message ? e.message : e));
    }
}

// LIFF初期化
async function initializeLiff() {
    try {
        updateProgress(20, 'กำลังเชื่อมต่อ LIFF...');
        console.log('[DEBUG] LIFF初期化開始');
        await liff.init({ liffId: "2007507724-jxmBZwP0" });
        console.log('[DEBUG] liff.init完了', liff.isLoggedIn());
        updateProgress(40, 'LIFF เชื่อมต่อสำเร็จ');
        
        if (!liff.isLoggedIn()) {
            updateProgress(50, 'กำลังเข้าสู่ระบบ...');
            console.log('[DEBUG] liff.isLoggedIn() == false, liff.login()呼び出し');
            liff.login();
            return;
        }
        
        // プロフィール取得
        console.log('[DEBUG] liff.getProfile呼び出し');
        userProfile = await liff.getProfile();
        console.log('[DEBUG] liff.getProfile完了', userProfile);
        updateProgress(60, 'กำลังโหลดข้อมูลผู้ใช้...');

        // ログイン情報をGASに記録
        try {
            console.log('[DEBUG] GASへユーザープロフィール送信', gasUrl, userProfile);
            await fetch(`${gasUrl}?type=profileData&displayName=${encodeURIComponent(userProfile.displayName)}&userId=${encodeURIComponent(userProfile.userId)}&pictureUrl=${encodeURIComponent(userProfile.pictureUrl)}`,
                { method: 'GET', redirect: 'follow' });
            console.log('[DEBUG] GASへのユーザープロフィール送信完了');
        } catch (e) {
            console.warn('[DEBUG] ユーザー情報の記録に失敗:', e);
        }
        
        // ヘッダーにユーザー情報を表示
        updateHeaderUserInfo(userProfile.displayName, userProfile.pictureUrl);
        console.log('[DEBUG] ユーザー情報をヘッダーに反映');
        
        updateProgress(80, 'กำลังโหลดแบบทดสอบ...');
        
        // ログインアクションログ
        sendUserActionLog('login');
        console.log('[DEBUG] sendUserActionLog(login)呼び出し');
        
        // ブランド・ショップ取得
        console.log('[DEBUG] fetchUserStatus呼び出し');
        const status = await fetchUserStatus();
        console.log('[DEBUG] fetchUserStatus完了', status);
        userBrand = status.brand;
        const userShop = status.shop;
        isBrandChecked = true;
        if (!userBrand) {
            console.log('[DEBUG] ブランド未登録、ブランド選択画面へ');
            showBrandSelectScreenForFirst();
            return;
        }
        if (!userShop) {
            console.log('[DEBUG] ショップ未登録、ショップ選択画面へ');
            showShopSelectScreen(userBrand);
            return;
        }
        // ★ここでサイドメニュー初期化
        initializeMenu();
        showDashboard(status);
        
    } catch (e) {
        console.error('[DEBUG] LIFF initialization failed', e);
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
        // ブランド取得済みでなければ取得
        if (!userBrand && isBrandChecked === false) {
            userBrand = await fetchUserBrand();
            isBrandChecked = true;
        }
        const response = await fetch(`${gasUrl}?action=getQuestions`, {
            method: 'GET',
            redirect: 'follow'
        });
        const data = await response.json();
        const today = new Date();
        today.setHours(0,0,0,0);
        // デバッグ出力
        console.log('userBrand:', userBrand);
        console.log('取得したクイズデータ:', data);
        let filtered = data.filter(row => {
            const start = new Date(row.TermStart);
            const end = new Date(row.TermEnd);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            let brandMatch = true;
            if (userBrand && row.Brand) {
                brandMatch = row.Brand === userBrand;
                if (!brandMatch) {
                    console.log('ブランド不一致:', row.Brand, userBrand);
                }
            }
            const inDate = today >= start && today <= end;
            if (!inDate) {
                console.log('日付範囲外:', row.TermStart, row.TermEnd, today);
            }
            return inDate && brandMatch;
        });
        console.log('フィルタ後:', filtered);
        // 5問以上ならランダムで5問だけ抽出
        if (filtered.length > 5) {
            filtered = shuffleArray(filtered).slice(0, 5);
        }
        questions = filtered.map(row => {
            // 選択肢生成（Answer＋SelectionSet1～10からAnswerを含む5つをランダムで）
            const selections = [];
            for (let i = 1; i <= 10; i++) {
                const val = row[`SelectionSet${i}`];
                if (typeof val === 'string' && val.trim() !== '') selections.push(val.trim());
                else if (typeof val === 'number' && val !== '') selections.push(String(val));
            }
            const answerText = (typeof row.Answer === 'string') ? row.Answer.trim() : (typeof row.Answer === 'number' ? String(row.Answer) : '');
            if (!selections.includes(answerText)) {
                selections.push(answerText);
            }
            // allOptions: 重複なし全選択肢
            const allOptions = selections.filter((v, i, a) => a.indexOf(v) === i);
            // Answerを含む5つをランダムで選択
            let options = shuffleArray(allOptions);
            if (!options.includes(answerText)) options[0] = answerText;
            if (options.length > 5) {
                // Answerを必ず含めて4つランダム
                const filtered = options.filter(opt => opt !== answerText);
                options = shuffleArray(filtered).slice(0, 4);
                options.push(answerText);
                options = shuffleArray(options);
            }
            return {
                question: row.Question,
                options: options,
                correctAnswer: answerText,
                image: row.Image,
                allOptions: allOptions
            };
        });
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        totalAnswerCount = 0;
        sendUserActionLog('startQuiz', { brand: userBrand });
        updateProgress(100, 'พร้อมแล้ว!');
        setTimeout(() => {
            if (questions.length === 0) {
                showError('このブランドのクイズがありません。管理者に連絡してください。');
                return;
            }
            showScreen('quiz');
            showQuestion();
        }, 500);
    } catch (error) {
        console.error('Quiz start failed:', error);
        showError('ไม่สามารถโหลดแบบทดสอบได้: ' + (error && error.message ? error.message : error));
    }
}

// 問題表示
function showQuestion() {
    if (questions.length === 0) return;

    const question = questions[currentQuestionIndex];
    const questionArea = document.getElementById('questionArea');

    // 毎回全選択肢からランダムで4つ不正解を選び、正解と合わせてシャッフル
    const allOptions = question.allOptions || question.options;
    const correct = question.correctAnswer;
    const incorrects = allOptions.filter(opt => opt !== correct);
    const selectedIncorrects = shuffleArray(incorrects).slice(0, 4);
    const displayOptions = shuffleArray([correct, ...selectedIncorrects]);

    // 選択肢のHTMLを生成
    const optionsHtml = displayOptions.map(option => {
        const optionStr = String(option);
        const escapedOption = optionStr.replace(/'/g, "\\'");
        return `<button class="option-button" onclick="selectAnswer('${escapedOption}')">${optionStr}</button>`;
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
    const isCorrect = String(selectedAnswer) === String(question.correctAnswer);
    totalAnswerCount++;
    const feedbackElement = document.getElementById('feedback');
    if (isCorrect) {
        feedbackElement.className = 'feedback correct show';
        feedbackElement.textContent = 'ถูกต้อง!';
        correctAnswersCount++;
        // GASに回答データを送信（オプション）
        if (userProfile && gasUrl) {
            sendAnswerToGAS(selectedAnswer, isCorrect);
        }
        // 正解以外の選択肢を非表示にする
        const buttons = document.querySelectorAll('.option-button');
        buttons.forEach(button => {
            if (String(button.textContent) !== String(selectedAnswer)) {
                button.style.display = 'none';
            } else {
                button.disabled = true;
                button.classList.add('correct');
            }
        });
        document.getElementById('nextButton').style.display = 'block';
    } else {
        // 不正解時は選択肢を再生成して再表示
        feedbackElement.className = 'feedback incorrect show';
        feedbackElement.textContent = '不正解です。もう一度選んでください';
        // 毎回全選択肢からランダムで4つ不正解を選び、正解と合わせてシャッフル
        const allOptions = question.allOptions || question.options;
        const correct = question.correctAnswer;
        const incorrects = allOptions.filter(opt => opt !== correct);
        const selectedIncorrects = shuffleArray(incorrects).slice(0, 4);
        const newOptions = shuffleArray([correct, ...selectedIncorrects]);
        // optionsには再生成した選択肢を一時的に格納（次回のため）
        questions[currentQuestionIndex].options = allOptions;
        setTimeout(() => {
            showQuestion();
        }, 1200);
        if (userProfile && gasUrl) {
            sendAnswerToGAS(selectedAnswer, false); // 不正解も必ず送信
        }
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
    
    const percentage = totalAnswerCount > 0 ? Math.round((correctAnswersCount / totalAnswerCount) * 100) : 0;
    const completionText = document.getElementById('completionText');
    completionText.innerHTML = `
        คุณตอบถูก ${correctAnswersCount} ข้อ จากทั้งหมด ${questions.length} ข้อ<br>
        คะแนน: ${percentage}%<br>
        เยี่ยมมาก!
    `;

    // GASに完了データを送信（オプション）
    if (userProfile && gasUrl) {
        sendCompletionToGAS(percentage);
    }
}

// クイズ再開
function restartQuiz() {
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    totalAnswerCount = 0;
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
async function sendCompletionToGAS(accuracy) {
    try {
        const params = new URLSearchParams({
            action: 'saveCompletion',
            userId: userProfile.userId,
            userName: userProfile.displayName,
            completedAt: new Date().toISOString(),
            correctAnswersCount: correctAnswersCount,
            totalQuestions: questions.length,
            totalAnswerCount: totalAnswerCount,
            accuracy: accuracy,
            showScreen: 'completion'
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

    // ブランド選択ボタンのイベント
    const lmBtn = document.getElementById('brandLM');
    const haBtn = document.getElementById('brandHA');
    if (lmBtn && haBtn) {
        lmBtn.addEventListener('click', async function() {
            await saveUserBrand('LM');
            userBrand = 'LM';
            console.log('ブランドLM選択、ダッシュボードへ');
            const status = await fetchUserStatus();
            showDashboard(status);
        });
        haBtn.addEventListener('click', async function() {
            await saveUserBrand('HA');
            userBrand = 'HA';
            console.log('ブランドHA選択、ダッシュボードへ');
            const status = await fetchUserStatus();
            showDashboard(status);
        });
    }
});

// ページ離脱時のアクションログ
window.addEventListener('beforeunload', function() {
    sendUserActionLog('leavePage', { currentScreen, currentQuestionIndex });
});

function hideAllScreens() {
    document.getElementById('brandSelectScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('completionScreen').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

// completion画面からダッシュボードに戻る
function showDashboardFromCompletion() {
    hideAllScreens();
    document.getElementById('loadingScreen').style.display = 'block';
    // ユーザーステータスを再取得してダッシュボードを表示
    fetchUserStatus().then(status => {
        showDashboard(status);
    }).catch(e => {
        showError('ダッシュボード表示エラー: ' + (e && e.message ? e.message : e));
    });
}

// サイドメニューの動的生成
function renderSideMenu() {
    const sideMenuNav = document.querySelector('.side-menu-nav');
    if (!sideMenuNav) return;
    let html = '<ul class="menu-items">';
    // ユーザー共通メニュー
    html += '<li><a href="#" class="menu-item" data-action="dashboard">ダッシュボード</a></li>';
    html += '<li><a href="#" class="menu-item" data-action="total-status">Total Status</a></li>';
    // User管理・管理者専用メニューはAdminのみ
    if (userAuthType === 'Admin') {
        html += '<li><a href="#" class="menu-item" data-action="user-management">User管理</a></li>';
        html += '<li><a href="#" class="menu-item" data-action="settings">設定</a></li>';
        html += '<li><a href="#" class="menu-item" data-action="help">ヘルプ</a></li>';
        html += '<li><a href="#" class="menu-item" data-action="about">アプリについて</a></li>';
        html += '<li><a href="#" class="menu-item" data-action="notifications">通知設定</a></li>';
        html += '<li><a href="#" class="menu-item" data-action="privacy">プライバシー</a></li>';
        html += '<li><a href="#" class="menu-item" data-action="terms">利用規約</a></li>';
    }
    html += '<li><a href="#" class="menu-item" data-action="logout">ログアウト</a></li>';
    html += '</ul>';
    sideMenuNav.innerHTML = html;
}

// バーガーメニュー機能
function initializeMenu() {
    const burgerMenuBtn = document.getElementById('burgerMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    // サイドメニューを権限ごとに描画
    renderSideMenu();

    // メニューアイテムのクリックイベント再バインド
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.getAttribute('data-action');
            handleMenuAction(action);
            closeMenu();
        });
    });

    // バーガーメニューボタンのクリックイベント
    if (burgerMenuBtn) {
        burgerMenuBtn.addEventListener('click', () => {
            openMenu();
        });
    }

    // 閉じるボタンのクリックイベント
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', () => {
            closeMenu();
        });
    }

    // オーバーレイのクリックイベント
    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            closeMenu();
        });
    }

    // ESCキーでメニューを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
}

// メニューを開く
function openMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const burgerMenuBtn = document.getElementById('burgerMenuBtn');
    
    if (sideMenu) {
        sideMenu.classList.add('open');
    }
    
    if (menuOverlay) {
        menuOverlay.classList.add('show');
    }
    
    // バーガーアイコンを非表示
    if (burgerMenuBtn) {
        burgerMenuBtn.style.display = 'none';
    }
    // スクロールを無効化
    document.body.style.overflow = 'hidden';
}

// メニューを閉じる
function closeMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const burgerMenuBtn = document.getElementById('burgerMenuBtn');
    
    if (sideMenu) {
        sideMenu.classList.remove('open');
    }
    
    if (menuOverlay) {
        menuOverlay.classList.remove('show');
    }
    
    // バーガーアイコンを再表示
    if (burgerMenuBtn) {
        burgerMenuBtn.style.display = '';
    }
    // スクロールを有効化
    document.body.style.overflow = '';
}

// メニューアクションの処理
function handleMenuAction(action) {
    console.log('メニューアクション:', action);
    
    switch (action) {
        case 'dashboard':
            // ダッシュボードに戻る
            if (currentScreen !== 'dashboard') {
                hideAllScreens();
                document.getElementById('loadingScreen').style.display = 'block';
                fetchUserStatus().then(status => {
                    showDashboard(status);
                }).catch(error => {
                    console.error('ダッシュボード表示エラー:', error);
                    showError('ダッシュボードの表示に失敗しました');
                });
            }
            break;
            
        case 'total-status':
            // Total Status画面を表示（実装予定）
            alert('Total Status機能は準備中です');
            break;
            
        case 'user-management':
            // User管理画面を表示
            showUserManagementScreen();
            break;
            
        case 'settings':
            // 設定画面を表示（実装予定）
            alert('設定機能は準備中です');
            break;
            
        case 'help':
            // ヘルプ画面を表示（実装予定）
            alert('ヘルプ機能は準備中です');
            break;
            
        case 'about':
            // アプリについて画面を表示（実装予定）
            alert('アプリについて機能は準備中です');
            break;
            
        case 'notifications':
            // 通知設定画面を表示（実装予定）
            alert('通知設定機能は準備中です');
            break;
            
        case 'privacy':
            // プライバシー画面を表示（実装予定）
            alert('プライバシー機能は準備中です');
            break;
            
        case 'terms':
            // 利用規約画面を表示（実装予定）
            alert('利用規約機能は準備中です');
            break;
            
        case 'logout':
            // ログアウト処理
            if (window.liff) {
                liff.logout();
            }
            location.reload();
            break;
            
        default:
            console.log('未実装のメニューアクション:', action);
            break;
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeLiff();
    // メニュー機能の初期化は、ユーザー情報取得後に呼ぶ
});

// ショップ選択画面の表示
function showShopSelectScreen(brand) {
    hideAllScreens();
    const shopScreen = document.getElementById('shopSelectScreen');
    const shopOptionsDiv = document.getElementById('shopOptions');
    shopOptionsDiv.innerHTML = '<div class="loading">ショップ一覧を取得中...</div>';
    shopScreen.style.display = 'block';
    // GASからショップリスト取得
    fetch(`${gasUrl}?action=getShops&brand=${encodeURIComponent(brand)}`)
        .then(res => res.json())
        .then(shops => {
            shopOptionsDiv.innerHTML = '';
            if (!shops.length) {
                shopOptionsDiv.innerHTML = '<div>該当ブランドのショップがありません</div>';
                return;
            }
            shops.forEach(shop => {
                const btn = document.createElement('button');
                btn.className = 'shop-option-btn';
                btn.textContent = shop.FullName || shop.ShortName;
                btn.onclick = async () => {
                    await saveUserShop(shop.ShortName);
                    shopScreen.style.display = 'none';
                    // ステータス取得しダッシュボードへ
                    const status = await fetchUserStatus();
                    initializeMenu();
                    showDashboard(status);
                };
                shopOptionsDiv.appendChild(btn);
            });
        })
        .catch(() => {
            shopOptionsDiv.innerHTML = '<div>ショップ取得エラー</div>';
        });
}

// ショップ保存API
async function saveUserShop(shopShortName) {
    if (!userProfile || !shopShortName) return;
    await fetch(`${gasUrl}?action=saveShop&userId=${encodeURIComponent(userProfile.userId)}&displayName=${encodeURIComponent(userProfile.displayName)}&pictureUrl=${encodeURIComponent(userProfile.pictureUrl)}&shopShortName=${encodeURIComponent(shopShortName)}`);
}

// ブランド選択後の処理を修正
function setupBrandSelectEvents() {
    document.getElementById('brandLM').onclick = async function() {
        await saveUserBrand('LM');
        userBrand = 'LM';
        showShopSelectScreen('LM');
    };
    document.getElementById('brandHA').onclick = async function() {
        await saveUserBrand('HA');
        userBrand = 'HA';
        showShopSelectScreen('HA');
    };
}

// 初期化時にブランド選択イベントをセット
window.addEventListener('DOMContentLoaded', setupBrandSelectEvents);

// User管理画面の表示処理
async function showUserManagementScreen() {
    // すべての画面を非表示
    hideAllScreens();
    // User管理画面だけ表示
    document.getElementById('userManagementScreen').style.display = 'block';
    // ユーザー一覧取得
    const userListContainer = document.getElementById('userListContainer');
    userListContainer.innerHTML = '<div class="loading">ユーザー一覧を取得中...</div>';
    try {
        const res = await fetch(`${gasUrl}?action=getUsersByBrand&brand=${encodeURIComponent(userBrand)}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });
        const users = await res.json();
        if (!Array.isArray(users) || users.length === 0) {
            userListContainer.innerHTML = '<div>ユーザーが見つかりません</div>';
            return;
        }
        let html = '<table class="user-list-table">';
        html += '<tr><th>アバター</th><th>名前</th><th>Brand</th><th>Shop</th><th>Auth</th><th>操作</th></tr>';
        users.forEach(user => {
            html += `<tr>` +
                `<td><img src="${user.pictureUrl || 'https://placehold.co/60x60/4CAF50/FFFFFF?text=U'}" alt="avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;"></td>` +
                `<td>${user.displayName || ''}</td>` +
                `<td>${user.brand || ''}</td>` +
                `<td>${user.shop || ''}</td>` +
                `<td>${user.auth || ''}</td>` +
                `<td><button class="edit-user-btn" data-userid="${user.userId}">編集</button></td>` +
                `</tr>`;
        });
        html += '</table>';
        userListContainer.innerHTML = html;
        // 編集ボタンのイベント
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.onclick = function() {
                const userId = btn.getAttribute('data-userid');
                const user = users.find(u => u.userId === userId);
                if (!user) return;
                showUserEditOverlay(user);
            };
        });
    } catch (e) {
        userListContainer.innerHTML = '<div>ユーザー一覧の取得に失敗しました<br>' + e + '</div>';
    }
}

// ユーザー編集オーバーレイの表示
async function showUserEditOverlay(user) {
    const overlay = document.getElementById('userEditOverlay');
    overlay.style.display = 'flex';
    document.getElementById('editUserAvatar').src = user.pictureUrl || 'https://placehold.co/60x60/4CAF50/FFFFFF?text=U';
    document.getElementById('editUserName').textContent = user.displayName || '';
    document.getElementById('editUserBrand').value = user.brand || '';
    // Shop選択肢を取得
    const shopSelect = document.getElementById('editUserShop');
    shopSelect.innerHTML = '<option value="">取得中...</option>';
    try {
        const res = await fetch(`${gasUrl}?action=getShops&brand=${encodeURIComponent(user.brand)}`);
        const shops = await res.json();
        shopSelect.innerHTML = '';
        shops.forEach(shop => {
            const opt = document.createElement('option');
            opt.value = shop.ShortName;
            opt.textContent = shop.FullName || shop.ShortName;
            if (shop.ShortName === user.shop) opt.selected = true;
            shopSelect.appendChild(opt);
        });
    } catch {
        shopSelect.innerHTML = '<option value="">取得失敗</option>';
    }
    document.getElementById('editUserAuth').value = user.auth || 'User';
    document.getElementById('userEditCancelBtn').onclick = () => {
        overlay.style.display = 'none';
    };
    // submitイベントの重複バインド防止
    const form = document.getElementById('userEditForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const newShop = document.getElementById('editUserShop').value;
        const newAuth = document.getElementById('editUserAuth').value;
        const newBrand = user.brand;
        try {
            const res = await fetch(`${gasUrl}?action=updateUserProfile&userId=${encodeURIComponent(user.userId)}&displayName=${encodeURIComponent(user.displayName)}&pictureUrl=${encodeURIComponent(user.pictureUrl)}&brand=${encodeURIComponent(newBrand)}&shop=${encodeURIComponent(newShop)}&auth=${encodeURIComponent(newAuth)}`, {
                method: 'GET',
                mode: 'cors',
                redirect: 'follow'
            });
            const text = await res.text();
            if (!text.includes('SUCCESS')) {
                alert('保存に失敗しました: ' + text);
                return;
            }
            overlay.style.display = 'none';
            showUserManagementScreen();
        } catch (err) {
            alert('保存エラー: ' + err.message);
        }
    });
}
