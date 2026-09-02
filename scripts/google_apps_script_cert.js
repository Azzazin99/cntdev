/**
 * Google Apps Script for 2-Way Sync Certificate Database
 * วางโค้ดนี้ใน Extensions > Apps Script ของ Google Sheet เกียรติบัตร
 * แล้วกด Deploy > New Deployment > Web App (Execute as: Me, Who has access: Anyone)
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var rowObj = { _row: i + 1 }; // เก็บ index แถวจริงใน Sheet เพื่อใช้อ้างอิงตอน Update/Delete
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = String(data[i][j] || "").trim();
    }
    // ตรวจสอบว่ามีชื่อหรือไม่
    if (rowObj.name || rowObj['ชื่อ-สกุล'] || rowObj['ชื่อ']) {
      // Normalize keys standard
      rowObj.name = rowObj.name || rowObj['ชื่อ-สกุล'] || rowObj['ชื่อ'] || "";
      rowObj.course = rowObj.course || rowObj['หลักสูตร'] || "-";
      rowObj.year = rowObj.year || rowObj['ปี'] || rowObj['ปีการศึกษา'] || "";
      rowObj.type = rowObj.type || rowObj['ประเภท'] || "-";
      rowObj.link = rowObj.link || rowObj['ลิงก์'] || rowObj['link'] || "";
      rows.push(rowObj);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action; // 'add', 'update', 'delete', 'batchAdd'
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Header standard: name, course, year, type, link
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    
    // Helper to find header index
    function getColIdx(names) {
      for (var k = 0; k < names.length; k++) {
        var idx = headers.indexOf(names[k]);
        if (idx !== -1) return idx + 1;
      }
      return -1;
    }
    
    var colName = getColIdx(['name', 'ชื่อ-สกุล', 'ชื่อ']);
    var colCourse = getColIdx(['course', 'หลักสูตร']);
    var colYear = getColIdx(['year', 'ปี', 'ปีการศึกษา']);
    var colType = getColIdx(['type', 'ประเภท']);
    var colLink = getColIdx(['link', 'ลิงก์', 'เอกสาร']);
    
    // If headers missing, create standard headers in row 1
    if (colName === -1 || headers.length === 0) {
      sheet.getRange(1, 1, 1, 5).setValues([['name', 'course', 'year', 'type', 'link']]);
      colName = 1; colCourse = 2; colYear = 3; colType = 4; colLink = 5;
    }

    if (action === 'add') {
      var item = contents.item;
      sheet.appendRow([
        item.name || '',
        item.course || '',
        item.year || '',
        item.type || '',
        item.link || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Added successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'batchAdd') {
      var items = contents.items || [];
      if (items.length > 0) {
        var rowsToAdd = items.map(function(item) {
          return [item.name || '', item.course || '', item.year || '', item.type || '', item.link || ''];
        });
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, 5).setValues(rowsToAdd);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: items.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'update') {
      var rowIndex = contents.row; // 1-based row index
      var item = contents.item;
      if (rowIndex && rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
        if (colName > 0) sheet.getRange(rowIndex, colName).setValue(item.name || '');
        if (colCourse > 0) sheet.getRange(rowIndex, colCourse).setValue(item.course || '');
        if (colYear > 0) sheet.getRange(rowIndex, colYear).setValue(item.year || '');
        if (colType > 0) sheet.getRange(rowIndex, colType).setValue(item.type || '');
        if (colLink > 0) sheet.getRange(rowIndex, colLink).setValue(item.link || '');
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Updated" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid row index" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'delete') {
      var rowIndex = contents.row;
      if (rowIndex && rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Deleted" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid row index" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
