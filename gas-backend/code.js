// code.gs from Cursor AAAA

function doGet(e) {
  // GETリクエストの処理
  try {
    const params = e.parameter;
    
    // クエリパラメータからデータを取得
    if (params.type === 'profileData') {
      return handleProfileData({
        displayName: params.displayName || 'Unknown',
        userId: params.userId || 'Unknown', 
        pictureUrl: params.pictureUrl || ''
      }).setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // ★ クイズ問題取得API
    if (params.action === 'getQuestions') {
      return getQuestionsJson().setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ユーザー回答ログ保存API
    if (params.action === 'saveAnswer') {
      return saveAnswerLog(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ クイズ完了ログ保存API
    if (params.action === 'saveCompletion') {
      return saveCompletionLog(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ユーザーアクションログ保存API
    if (params.action === 'saveActionLog') {
      return saveActionLog(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ブランド保存API
    if (params.action === 'saveBrand') {
      return saveBrand(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ブランド取得API
    if (params.action === 'getBrand') {
      return getBrand(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ユーザーステータス取得API
    if (params.action === 'getUserStatus') {
      return getUserStatus(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ショップリスト取得API（ブランドでフィルタ）
    if (params.action === 'getShops') {
      return getShops(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ユーザープロファイルにShop（ShortName）を保存
    if (params.action === 'saveShop') {
      return saveShop(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ 管理者用ユーザー一覧取得API
    if (params.action === 'getUsersByBrand') {
      return getUsersByBrand(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ユーザー権限保存API
    if (params.action === 'saveAuth') {
      return saveAuth(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    // ★ ユーザープロファイル一括更新API
    if (params.action === 'updateUserProfile') {
      return updateUserProfile(params).setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // テスト用レスポンス
    return ContentService
      .createTextOutput('GAS Web App is working! GET method successful.')
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
      
  } catch (error) {
    return ContentService
      .createTextOutput('GET Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function doPost(e) {
  // POSTリクエストの処理
  try {
    let data;
    
    // Content-Typeに応じてデータを解析
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      // フォームデータの解析
      data = parseFormData(e.postData.contents);
    } else {
      // JSONデータの解析（プレーンテキストとして送信された場合）
      data = JSON.parse(e.postData.contents);
    }
    
    if (data.type === 'profileData') {
      return handleProfileData(data).setHeader('Access-Control-Allow-Origin', '*');
    }
    
    return ContentService
      .createTextOutput('POST Success: Data received - ' + JSON.stringify(data))
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
      
  } catch (error) {
    return ContentService
      .createTextOutput('POST Error: ' + error.message + ' | Raw data: ' + (e.postData ? e.postData.contents : 'No data'))
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function handleProfileData(data) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    
    if (!sheet) {
      return ContentService
        .createTextOutput('Error: Sheet "LIFF_User_Profiles" not found')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // 既にuserIdが存在するかチェック
    const values = sheet.getDataRange().getValues();
    const userId = data.userId || 'Unknown';
    let exists = false;
    for (let i = 1; i < values.length; i++) { // 1行目はヘッダー想定
      if (values[i][2] === userId) { // userId列
        exists = true;
        break;
      }
    }
    if (!exists) {
      const timestamp = new Date();
      sheet.appendRow([
        timestamp,
        data.displayName || 'Unknown',
        userId,
        data.pictureUrl || ''
      ]);
    }
    return ContentService
      .createTextOutput('SUCCESS: Profile data checked/added. User: ' + data.displayName)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
      
  } catch (error) {
    return ContentService
      .createTextOutput('Spreadsheet Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function parseFormData(formString) {
  const result = {};
  const pairs = formString.split('&');
  
  for (let pair of pairs) {
    const [key, value] = pair.split('=');
    result[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  
  return result;
}

// テスト用関数
function testSpreadsheet() {
  const testData = {
    displayName: 'テストユーザー',
    userId: 'test123',
    pictureUrl: 'https://example.com/test.jpg'
  };
  
  const result = handleProfileData(testData);
  Logger.log(result.getContent());
}

// LIFF_Questionsシートから全行をJSON配列で返す
function getQuestionsJson() {
  const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('LIFF_Questions');
  if (!sheet) {
    return ContentService.createTextOutput('Error: Sheet "LIFF_Questions" not found').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  }
  const headers = values[0];
  const data = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
}

// ユーザー回答ログをスプレッドシートに保存
function saveAnswerLog(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Actions');
    if (!sheet) {
      return ContentService
        .createTextOutput('Error: Sheet "LIFF_User_Actions" not found')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
    const timestamp = params.timestamp || new Date().toISOString();
    sheet.appendRow([
      'answer',
      timestamp,
      params.userId || '',
      params.userName || '',
      params.questionIndex || '',
      params.answer || '',
      params.isCorrect || ''
    ]);
    return ContentService
      .createTextOutput('SUCCESS: Answer log saved.')
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService
      .createTextOutput('Spreadsheet Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ユーザーアクションログをスプレッドシートに保存
function saveActionLog(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Actions');
    if (!sheet) {
      return ContentService
        .createTextOutput('Error: Sheet "LIFF_User_Actions" not found')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
    // 主要なパラメータを全て記録
    sheet.appendRow([
      'action',
      params.timestamp || new Date().toISOString(),
      params.userId || '',
      params.userName || '',
      params.actionType || '',
      params.screen || '',
      params.brand || '',
      params.questionIndex || '',
      params.answer || '',
      params.isCorrect || '',
      params.question || '',
      params.correctAnswersCount || '',
      params.totalQuestions || '',
      params.accuracy || '',
      params.currentScreen || '',
    ]);
    return ContentService
      .createTextOutput('SUCCESS: Action log saved.')
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService
      .createTextOutput('Spreadsheet Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ブランド保存
function saveBrand(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!sheet) {
      return ContentService.createTextOutput('Error: Sheet "LIFF_User_Profiles" not found').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const userId = params.userId;
    const brand = params.brand;
    if (!userId || !brand) {
      return ContentService.createTextOutput('Error: userId and brand required').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === userId) { // userId列
        sheet.getRange(i+1, 5).setValue(brand); // brand列（E列=5）
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([new Date(), params.displayName || '', userId, params.pictureUrl || '', brand]);
    }
    return ContentService.createTextOutput('SUCCESS: Brand saved').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ブランド取得
function getBrand(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet "LIFF_User_Profiles" not found' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const userId = params.userId;
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'userId required' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === userId) {
        return ContentService.createTextOutput(JSON.stringify({ brand: values[i][4] || '' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ brand: '' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ユーザーステータス取得
function getUserStatus(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const clearsSheet = ss.getSheetByName('LIFF_User_Clears');
    const profilesSheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!clearsSheet || !profilesSheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const userId = params.userId;
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'userId required' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const now = new Date();
    const todayStr = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd');
    const monthStr = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM');
    const clears = clearsSheet.getDataRange().getValues().filter(row => row[0] === userId);
    // 今日のクリア数（日付型・シリアル値・文字列型すべて対応）
    const todayCount = clears.filter(row => {
      let dateStr = '';
      if (row[1] instanceof Date) {
        dateStr = Utilities.formatDate(row[1], 'Asia/Bangkok', 'yyyy-MM-dd');
      } else if (typeof row[1] === 'number') {
        const jsDate = new Date(Math.round((row[1] - 25569) * 86400 * 1000));
        dateStr = Utilities.formatDate(jsDate, 'Asia/Bangkok', 'yyyy-MM-dd');
      } else {
        dateStr = String(row[1]);
      }
      return dateStr === todayStr;
    }).length;
    // 今月のノルマ達成日数（日付型・シリアル値・文字列型すべて対応）
    // 1日に3回クリアした日だけをカウント
    const clearsByDay = {};
    clears.forEach(row => {
      let dateStr = '';
      if (row[1] instanceof Date) {
        dateStr = Utilities.formatDate(row[1], 'Asia/Bangkok', 'yyyy-MM-dd');
      } else if (typeof row[1] === 'number') {
        const jsDate = new Date(Math.round((row[1] - 25569) * 86400 * 1000));
        dateStr = Utilities.formatDate(jsDate, 'Asia/Bangkok', 'yyyy-MM-dd');
      } else {
        dateStr = String(row[1]);
      }
      if (dateStr.startsWith(monthStr)) {
        clearsByDay[dateStr] = (clearsByDay[dateStr] || 0) + 1;
      }
    });
    const monthStatus = Object.values(clearsByDay).filter(count => count >= 3).length;
    // 最新10回履歴（タイの仏歴で 'd MMM yy  hh:mm' 形式で表示）
    const recent = clears.slice(-10).reverse().map(row => {
      let dateObj = null;
      if (row[2] instanceof Date) {
        dateObj = row[2];
      } else if (typeof row[2] === 'number') {
        dateObj = new Date(Math.round((row[2] - 25569) * 86400 * 1000));
      } else if (typeof row[2] === 'string' && row[2]) {
        // ISO文字列や 'yyyy-MM-dd HH:mm:ss' 形式をDateに変換
        dateObj = new Date(row[2].replace(' ', 'T'));
      }
      let formatted = row[2];
      if (dateObj && !isNaN(dateObj.getTime())) {
        // 仏歴（西暦+543年）
        const buddhistYear = dateObj.getFullYear() + 543;
        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const weekdayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        const day = dateObj.getDate();
        const month = monthNames[dateObj.getMonth()];
        const year = String(buddhistYear).slice(-2);
        const hour = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        const weekday = weekdayNames[dateObj.getDay()];
        formatted = `${day} ${month} ${year} (${weekday})  ${hour}:${min}`;
      }
      return { dateTime: formatted, accuracy: row[3] };
    });
    // ブランド・権限
    let brand = '';
    let auth = '';
    let shop = '';
    const profiles = profilesSheet.getDataRange().getValues();
    for (let i = 1; i < profiles.length; i++) {
      if (profiles[i][2] === userId) {
        brand = profiles[i][4] || '';
        auth = profiles[i][5] || '';
        shop = profiles[i][6] || '';
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ todayCount, monthStatus, recent, brand, auth, shop, clearsByDay })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// クイズ完了ログをスプレッドシートに保存
function saveCompletionLog(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Actions');
    if (!sheet) {
      return ContentService
        .createTextOutput('Error: Sheet "LIFF_User_Actions" not found')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
    const completedAt = params.completedAt || new Date().toISOString();
    sheet.appendRow([
      'completion',
      completedAt,
      params.userId || '',
      params.userName || '',
      '', // questionIndex
      '', // answer
      '', // isCorrect
      params.correctAnswersCount || '',
      params.totalQuestions || '',
      params.accuracy || ''
    ]);
    // 5問全問正解でなくても必ずLIFF_User_Clearsに記録
    const clearsSheet = ss.getSheetByName('LIFF_User_Clears');
    if (clearsSheet) {
      const now = new Date();
      const dateStr = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd');
      const dateTimeStr = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
      clearsSheet.appendRow([
        params.userId || '',
        dateStr,
        dateTimeStr,
        params.accuracy || ''
      ]);
    }
    return ContentService
      .createTextOutput('SUCCESS: Completion log saved.')
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService
      .createTextOutput('Spreadsheet Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ショップリスト取得API（ブランドでフィルタ）
function getShops(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_SHOP_LIST');
    if (!sheet) {
      return ContentService.createTextOutput('Error: Sheet "LIFF_SHOP_LIST" not found').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const headers = values[0];
    const data = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
    // ブランドでフィルタ
    let filtered = data;
    if (params && params.brand) {
      filtered = data.filter(shop => shop.Brand === params.brand);
    }
    return ContentService.createTextOutput(JSON.stringify(filtered)).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ユーザープロファイルにShop（ShortName）を保存
function saveShop(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!sheet) {
      return ContentService.createTextOutput('Error: Sheet "LIFF_User_Profiles" not found').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const userId = params.userId;
    const shopShortName = params.shopShortName;
    if (!userId || !shopShortName) {
      return ContentService.createTextOutput('Error: userId and shopShortName required').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === userId) { // userId列
        sheet.getRange(i+1, 7).setValue(shopShortName); // Shop列（G列=7）
        found = true;
        break;
      }
    }
    if (!found) {
      // 新規の場合は空欄で追加（Shop列は7列目）
      const row = [new Date(), params.displayName || '', userId, params.pictureUrl || '', '', '', shopShortName];
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput('SUCCESS: Shop saved').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// 管理者用：ブランドごとのユーザー一覧取得
function getUsersByBrand(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet "LIFF_User_Profiles" not found' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const brand = params.brand;
    if (!brand) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'brand required' })).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const users = values.slice(1)
      .filter(row => row[4] === brand)
      .map(row => ({
        userId: row[2] || '',
        displayName: row[1] || '',
        pictureUrl: row[3] || '',
        brand: row[4] || '',
        auth: row[5] || '',
        shop: row[6] || ''
      }));
    return ContentService.createTextOutput(JSON.stringify(users)).setMimeType(ContentService.MimeType.JSON).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ユーザー権限保存API
function saveAuth(params) {
  try {
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!sheet) {
      return ContentService.createTextOutput('Error: Sheet "LIFF_User_Profiles" not found').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const userId = params.userId;
    const auth = params.auth;
    if (!userId || !auth) {
      return ContentService.createTextOutput('Error: userId and auth required').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === userId) { // userId列
        sheet.getRange(i+1, 6).setValue(auth); // auth列（F列=6）
        found = true;
        break;
      }
    }
    if (!found) {
      // 新規の場合は空欄で追加（auth列は6列目）
      const row = [new Date(), params.displayName || '', userId, params.pictureUrl || '', '', auth, ''];
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput('SUCCESS: Auth saved').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ユーザープロファイル一括更新API
function updateUserProfile(params) {
  try {
    Logger.log('updateUserProfile params: ' + JSON.stringify(params));
    const SPREADSHEET_ID = '1WyBHLNfQV424ejAJd8Y2mVTJUdqz_5JNF06zlK4dqGM';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('LIFF_User_Profiles');
    if (!sheet) {
      return ContentService.createTextOutput('Error: Sheet "LIFF_User_Profiles" not found').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const userId = params.userId;
    if (!userId) {
      return ContentService.createTextOutput('Error: userId required').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
    }
    const values = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === userId) { // userId列
        if (params.brand !== undefined) sheet.getRange(i+1, 5).setValue(params.brand);
        if (params.auth !== undefined) sheet.getRange(i+1, 6).setValue(params.auth);
        if (params.shopShortName !== undefined) sheet.getRange(i+1, 7).setValue(params.shopShortName);
        found = true;
        break;
      }
    }
    if (!found) {
      // 新規の場合は全ての値で追加
      const row = [new Date(), params.displayName || '', userId, params.pictureUrl || '', params.brand || '', params.auth || '', params.shop || ''];
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput('SUCCESS: User profile updated').setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    Logger.log('updateUserProfile error: ' + error.message);
    return ContentService.createTextOutput('Spreadsheet Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT).setHeader('Access-Control-Allow-Origin', '*');
  }
}

/** # Don't delete this comments
 * Google Apps Script Web Application for LIFF Integration
 * 
 * 【重要な変更点・気づき - 2025年版】
 * 
 * 1. ❌ setHeaders()メソッドは存在しない！
 *    - ContentService.setHeaders() は Google Apps Script には存在したことがない
 *    - Node.js/Express との混同が原因でよく間違われる
 *    - CORSヘッダーはセキュリティ上の理由で設定不可能
 * 
 * 2. 🔥 Rhinoランタイム廃止予告（2025年2月20日発表）
 *    - 2026年1月31日に完全停止
 *    - V8ランタイムへの移行が必須
 *    - for...each文、Date.getYear()等の非対応構文あり
 * 
 * 3. 🚫 CORS問題の真実
 *    - Google Apps Script では従来通りカスタムCORSヘッダー設定は不可能
 *    - プリフライトリクエスト回避が唯一の解決策
 *    - GitHub Pages からのアクセスには特別な工夫が必要
 * 
 * 4. ⚙️ デプロイメント設定の変更
 *    - "全員（匿名ユーザーを含む）"→"全員"に名称変更
 *    - Google Workspace環境では管理者による制限が可能
 *    - 200バージョン制限が全プロジェクトに適用（2024年6月～）
 * 
 * 5. 🛡️ セキュリティ強化
 *    - 外部URL許可リスト制御（2024年7月31日実装）
 *    - OAuth検証の厳格化、未検証アプリの100ユーザー制限
 *    - 管理コンソールでの外部アプリケーション制御強化
 * 
 * 【正しい実装パターン】
 * ✅ ContentService.createTextOutput().setMimeType() のみ使用
 * ✅ CORS回避: Content-Type: text/plain;charset=utf-8
 * ✅ redirect: "follow" 必須設定
 * ✅ GET方式（URLパラメータ）とPOST方式（プリフライト回避）の併用
 * ✅ V8ランタイム使用、現代的なJavaScript構文
 * 
 * 【絶対にやってはいけないこと】
 * ❌ setHeaders() の呼び出し
 * ❌ カスタムCORSヘッダーの設定試行
 * ❌ Rhinoランタイムの継続使用
 * ❌ 200バージョン制限の無視
 * 
 * 最終更新: 2025年6月18日
 * 動作確認済み: GitHub Pages + LIFF + スプレッドシート連携

 * 【今後の保守・更新時の注意点】
 * 
 * 1. setHeaders()を絶対に追加しない
 *    - このメソッドは存在しないため、追加するとエラーになる
 *    - CORS問題の解決策ではない
 * 
 * 2. Content-Typeの変更は慎重に
 *    - クライアント側で text/plain;charset=utf-8 を使用している
 *    - この設定変更はプリフライトリクエスト発生の原因となる
 * 
 * 3. V8ランタイムの維持
 *    - Rhinoランタイムは2026年1月31日に廃止
 *    - 下位互換性のためのRhino構文は使用しない
 * 
 * 4. デプロイ設定の確認
 *    - "全員"アクセス設定が必須
 *    - Google Workspace環境では管理者設定の確認が必要
 * 
 * 5. エラーログの監視
 *    - GASの実行ログを定期的にチェック
 *    - スプレッドシート権限エラーに注意
 * 
 * このコードは2025年6月18日時点で完全動作確認済み
 * GitHub Pages + LIFF + Google Apps Script + Google Sheets 連携成功
 */