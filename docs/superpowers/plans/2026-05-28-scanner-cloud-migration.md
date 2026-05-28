# 掃描槍系統雲端化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將倉庫離線掃描工具部署至 GitHub Pages，掃描結果同時輸出本地 CSV 與 Google Sheets，並補齊中越雙語。

**Architecture:** 純 HTML 靜態部署 GitHub Pages，匯出時以 `text/plain` POST 到 GAS Web App 寫入 Google Sheets，本地 CSV 下載行為不變。掃描時多存 `date` 欄位供 Sheets 使用。

**Tech Stack:** 純 HTML/JS、Google Apps Script、Google Sheets、GitHub Pages。無 npm、無 build step。

---

## 檔案結構

| 動作 | 路徑 | 說明 |
|------|------|------|
| 建立 | `index.html` | 主工具（從貼上的原始碼改） |
| 建立 | `Code.gs` | GAS 腳本本地備查 |
| 建立 | `.gitignore` | 排除雜檔 |

---

## Task 1：建立 Google Sheets（手動）

**Files:** 無本地檔案，全在 Google Sheets 操作

- [ ] **Step 1: 建立試算表**

  前往 https://sheets.google.com，建立空白試算表，命名「掃描紀錄系統」。

- [ ] **Step 2: 建立「掃描紀錄」Tab**

  預設 Sheet1 改名為 `掃描紀錄`，第 1 列填入標題：
  ```
  A1: 日期
  B1: 時間
  C1: 條碼內容
  D1: 匯出批次
  ```

- [ ] **Step 3: 複製 Sheets ID**

  從網址列複製 Sheets ID（`/d/` 和 `/edit` 之間那串），備用。

---

## Task 2：建立 GAS Web App（手動 + 本地備查檔）

**Files:**
- 建立：`Code.gs`

- [ ] **Step 1: 建立本地備查檔 Code.gs**

  內容如下：

  ```javascript
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
  ```

- [ ] **Step 2: 在 GAS 編輯器貼上並設定 SHEET_ID**

  Google Sheets → 擴充功能 → Apps Script → 貼上 Code.gs 內容 → 把 `PASTE_YOUR_SHEET_ID_HERE` 換成 Task 1 Step 3 的 ID → 儲存。

- [ ] **Step 3: 部署為 Web App**

  右上角「部署」→「新增部署作業」→ 類型「網頁應用程式」→ 執行身分「我」→ 存取權「所有人」→ 部署 → 複製 Web App URL 備用。

---

## Task 3：建立 index.html（完整改版）

**Files:**
- 建立：`index.html`
- 建立：`.gitignore`

- [ ] **Step 1: 建立 .gitignore**

  ```
  *.tmp
  *.dat
  .superpowers/
  ```

- [ ] **Step 2: 建立 index.html（完整內容）**

  建立 `index.html`，內容如下（GAS_URL 在 Task 4 填入）：

  ```html
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="theme-color" content="#1abc9c">
      <title>掃描槍作業系統 / Hệ thống quét mã vạch</title>
      <style>
          body { font-family: "Microsoft JhengHei", sans-serif; background: #2c3e50; color: #fff; padding: 40px; display: flex; flex-direction: column; align-items: center; margin: 0; }
          .card { background: #34495e; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 100%; max-width: 500px; text-align: center; }
          input { position: absolute; opacity: 0; pointer-events: none; }
          .status-box { font-size: 28px; color: #1abc9c; margin: 20px 0; padding: 20px; border: 3px solid #1abc9c; border-radius: 10px; background: #2c3e50; }
          .last-scanned { font-weight: bold; font-size: 1.4em; min-height: 2em; margin: 10px 0; }
          .btn-group { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
          button { padding: 15px 30px; font-size: 18px; cursor: pointer; border: none; border-radius: 8px; font-weight: bold; }
          .btn-save { background: #27ae60; color: white; }
          .btn-reset { background: #e74c3c; color: white; }
          #log-list { margin-top: 30px; width: 100%; text-align: left; background: #2c3e50; padding: 15px; border-radius: 8px; }
          .item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #3e5871; font-size: 18px; }
          .tip { color: #95a5a6; font-size: 14px; margin-top: 10px; }
      </style>
  </head>
  <body onclick="initAudio()">
      <div class="card">
          <h1>📦 掃描槍作業系統 / Hệ thống quét mã vạch</h1>
          <p class="tip">倉庫出貨掃描 / Quét xuất kho</p>

          <input type="text" id="barcodeInput" autofocus>

          <div class="status-box">
              累計數量 / Tổng số lượng：<span id="total-count">0</span> 件
          </div>

          <div id="last-code" class="last-scanned">點擊畫面後開始 / Nhấn màn hình để bắt đầu</div>

          <div id="log-list">
              <div id="logs"></div>
          </div>

          <div class="btn-group">
              <button class="btn-save" onclick="exportAll()">💾 匯出 + 同步雲端 / Xuất & đồng bộ</button>
              <button class="btn-reset" onclick="clearAll()">🗑️ 清空 / Xóa tất cả</button>
          </div>
      </div>

      <script>
          const GAS_URL = 'PASTE_YOUR_WEB_APP_URL_HERE'; // 部署後填入

          const input = document.getElementById('barcodeInput');
          const history = [];
          let audioCtx = null;

          function initAudio() {
              if (!audioCtx) {
                  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                  document.getElementById('last-code').innerText = '系統已就緒，請掃描 / Sẵn sàng, vui lòng quét';
              }
              input.focus();
          }

          function playTone(freq, type, duration) {
              if (!audioCtx) return;
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = type;
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + duration);
          }

          setInterval(() => input.focus(), 1000);

          input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  const code = input.value.trim();
                  if (code) processCode(code);
                  input.value = '';
              }
          });

          function processCode(code) {
              const isDuplicate = history.some(item => item.code === code);
              if (isDuplicate) {
                  playTone(150, 'square', 0.4);
                  document.getElementById('last-code').innerText = '⚠️ 重複 / Trùng lặp：' + code;
                  document.getElementById('last-code').style.color = '#e74c3c';
                  return;
              }
              playTone(880, 'sine', 0.15);
              const now = new Date();
              const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
              const dateStr = now.getFullYear() + '-' +
                  String(now.getMonth() + 1).padStart(2, '0') + '-' +
                  String(now.getDate()).padStart(2, '0');
              history.unshift({ code, time: timeStr, date: dateStr });
              document.getElementById('last-code').innerText = '✅ 已讀取 / Đã quét：' + code;
              document.getElementById('last-code').style.color = '#2ecc71';
              updateUI();
          }

          function updateUI() {
              document.getElementById('total-count').innerText = history.length;
              document.getElementById('logs').innerHTML = history.slice(0, 5).map(item => `
                  <div class="item">
                      <span>${item.code}</span>
                      <span style="color:#bdc3c7;font-size:14px">${item.time}</span>
                  </div>
              `).join('');
          }

          async function postToGAS(payload) {
              const statusEl = document.getElementById('last-code');
              try {
                  const res = await fetch(GAS_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                      statusEl.innerText = '✅ 已同步至雲端 / Đã đồng bộ lên đám mây';
                      statusEl.style.color = '#2ecc71';
                  } else {
                      statusEl.innerText = '⚠️ 雲端同步失敗 / Đồng bộ thất bại';
                      statusEl.style.color = '#e74c3c';
                  }
              } catch (err) {
                  statusEl.innerText = '⚠️ 雲端同步失敗 / Đồng bộ thất bại';
                  statusEl.style.color = '#e74c3c';
              }
          }

          async function exportAll() {
              if (history.length === 0) return;
              const now = new Date();
              const dateStr = now.getFullYear() + '-' +
                  String(now.getMonth() + 1).padStart(2, '0') + '-' +
                  String(now.getDate()).padStart(2, '0');
              const batchStr = dateStr + ' ' +
                  String(now.getHours()).padStart(2, '0') + ':' +
                  String(now.getMinutes()).padStart(2, '0');

              // 1. 下載 CSV
              let content = '﻿序號,日期,時間,條碼內容\n';
              [...history].reverse().forEach((item, index) => {
                  content += `${index + 1},${item.date},${item.time},"${item.code}"\n`;
              });
              const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = dateStr + '_掃描結果.csv';
              a.click();
              URL.revokeObjectURL(url);

              // 2. 同步 Google Sheets
              const payload = [...history].reverse().map((item, index) => ({
                  seq: index + 1,
                  date: item.date,
                  time: item.time,
                  code: item.code,
                  batch: batchStr
              }));
              await postToGAS(payload);
          }

          function clearAll() {
              if (confirm('確定要清空所有紀錄嗎？\nBạn có chắc muốn xóa tất cả?')) {
                  history.length = 0;
                  document.getElementById('last-code').innerText = '等待掃描... / Đang chờ quét...';
                  document.getElementById('last-code').style.color = '#fff';
                  updateUI();
              }
          }
      </script>
  </body>
  </html>
  ```

- [ ] **Step 3: 初始化 git 並建立第一個 commit**

  ```bash
  cd C:\Users\STEVE\Desktop\生管評估工具\BarCodeTools
  git init
  git config user.email "stevetai0314@gmail.com"
  git config user.name "Steve"
  git add index.html Code.gs .gitignore docs/
  git commit -m "init: scanner cloud tool"
  ```

---

## Task 4：填入 GAS URL 並部署 GitHub Pages

**Files:**
- 修改：`index.html` 第 1 行 script（GAS_URL）

- [ ] **Step 1: 填入 GAS_URL**

  在 `index.html` 找到：
  ```javascript
  const GAS_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
  ```
  換成 Task 2 Step 3 複製的 Web App URL。

- [ ] **Step 2: Commit**

  ```bash
  git add index.html
  git commit -m "config: set GAS Web App URL"
  ```

- [ ] **Step 3: 在 GitHub 建立新 repo 並推上去**

  ```bash
  gh repo create scanner-tool --public --description "倉庫掃描槍作業系統" --source=. --remote=origin --push
  ```

- [ ] **Step 4: 開啟 GitHub Pages**

  ```bash
  gh api repos/stevetai0314-dot/scanner-tool/pages -X POST --field "source[branch]=master" --field "source[path]=/"
  ```

- [ ] **Step 5: 確認網址可以開啟**

  等約 1 分鐘，前往：
  ```
  https://stevetai0314-dot.github.io/scanner-tool/
  ```

- [ ] **Step 6: 整合測試**

  1. 開啟網址 → 點畫面 → 出現「系統已就緒」✓
  2. 用鍵盤輸入條碼按 Enter → 計數跳 + 嗶聲 ✓
  3. 重複輸入同一條碼 → 出現重複警告 + 低音 ✓
  4. 按「匯出 + 同步雲端」→ CSV 下載 ✓ + Sheets 對照表出現資料 ✓ + 顯示同步成功 ✓
  5. 按清空 → confirm 雙語 → 清空 ✓

---

## 完成標準

- [ ] 有網址直接開，不需找 HTML 檔
- [ ] 掃描計數、重複偵測、音效行為與原本相同
- [ ] 匯出同時下載 CSV + 寫入 Sheets
- [ ] Sheets「掃描紀錄」Tab 有日期、時間、條碼內容、匯出批次
- [ ] 所有 UI 訊息中越雙語
