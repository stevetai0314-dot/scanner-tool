const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const LOG_TAB = '掃描紀錄';

function doPost(e) {
  const items = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(LOG_TAB);
  items.forEach(item => {
    sheet.appendRow([item.date, item.time, item.code, item.batch]);
  });
  return ContentService.createTextOutput('OK');
}
