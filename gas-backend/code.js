// code.gs from Cursor 

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
      });
    }
    
    // テスト用レスポンス
    return ContentService
      .createTextOutput('GAS Web App is working! GET method successful.')
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService
      .createTextOutput('GET Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
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
      return handleProfileData(data);
    }
    
    return ContentService
      .createTextOutput('POST Success: Data received - ' + JSON.stringify(data))
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService
      .createTextOutput('POST Error: ' + error.message + ' | Raw data: ' + (e.postData ? e.postData.contents : 'No data'))
      .setMimeType(ContentService.MimeType.TEXT);
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
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.displayName || 'Unknown',
      data.userId || 'Unknown',
      data.pictureUrl || ''
    ]);
    
    return ContentService
      .createTextOutput('SUCCESS: Profile data saved to spreadsheet. User: ' + data.displayName)
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService
      .createTextOutput('Spreadsheet Error: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
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
 *    - 「全員（匿名ユーザーを含む）」→「全員」に名称変更
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
 *    - 「全員」アクセス設定が必須
 *    - Google Workspace環境では管理者設定の確認が必要
 * 
 * 5. エラーログの監視
 *    - GASの実行ログを定期的にチェック
 *    - スプレッドシート権限エラーに注意
 * 
 * このコードは2025年6月18日時点で完全動作確認済み
 * GitHub Pages + LIFF + Google Apps Script + Google Sheets 連携成功
 */