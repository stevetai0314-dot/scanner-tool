# 掃描槍作業系統雲端化設計 spec

**日期:** 2026-05-28  
**專案:** 倉庫掃描工具 — 地端 → 雲端遷移

---

## 背景與目標

現有工具為單一 HTML 離線掃描計數器，掃完只能匯出 CSV 再手動傳給需要資料的部門。目標是掛上 GitHub Pages 有網址可開，掃描結果同時寫入 Google Sheets，通知部門直接看 Sheets，不需傳檔案。

---

## 使用情境

- 使用者：倉庫出貨人員（單一）
- 設備：有掃描槍的電腦或手機
- 流程：掃描 → 確認無誤 → 按匯出 → 本地 CSV + Sheets 同時完成 → 通知相關部門看 Sheets

---

## 架構

```
[GitHub Pages HTML]
    │
    │  [使用者掃描條碼，結果存在 scannedData 陣列]
    │
    └─ 按「匯出」按鈕
        ├─ 下載本地 CSV（不變）
        └─ POST (text/plain) → [GAS doPost] → append → Google Sheets
                                                  顯示 ✅ 已同步 / ⚠️ 同步失敗
```

---

## Google Sheets 結構

**單一 Sheets 檔，單一 Tab：掃描紀錄**

| 欄位 | 說明 |
|------|------|
| 日期 | YYYY-MM-DD（掃描當天） |
| 時間 | HH:MM:SS（單筆掃描時間） |
| 條碼內容 | 原始條碼字串 |
| 匯出批次 | 按匯出當下的時間戳記（YYYY-MM-DD HH:MM）用來識別同一批資料 |

每次匯出把所有 scannedData 整包 POST，GAS 逐筆 appendRow。

---

## GAS Web App

部署設定：**Execute as: Me / Anyone can access**

### doPost()
- 接收 `e.postData.contents`（JSON 字串）
- 解析後逐筆 `appendRow` 到「掃描紀錄」Tab
- 欄位：日期、時間、條碼內容、匯出批次

---

## HTML 修改項目

### 新增
- `GAS_URL` 常數（部署後填入）
- `postToGAS(data)` 函式：`fetch` + `method: POST` + `headers: text/plain`
- 匯出成功/失敗狀態顯示在 status-box

### 修改
- `exportCSV()` 改名為 `exportAll()`，在下載 CSV 後呼叫 `postToGAS`
- 按鈕文字改為雙語

### 雙語補齊（中文 / Tiếng Việt）

| 位置 | 中文 | 越文 |
|------|------|------|
| 頁面標題 | 離線掃描系統 | Hệ thống quét mã |
| 副標題 | 倉庫出貨掃描 | Quét xuất kho |
| 累計數量 | 累計數量 | Tổng số lượng |
| 初始提示 | 點擊畫面後開始 | Nhấn màn hình để bắt đầu |
| 就緒提示 | 系統已就緒，請掃描 | Sẵn sàng, vui lòng quét |
| 重複警告 | ⚠️ 重複 | ⚠️ Trùng lặp |
| 成功提示 | ✅ 已讀取 | ✅ Đã quét |
| 匯出按鈕 | 💾 匯出 Excel + 同步雲端 | 💾 Xuất & đồng bộ |
| 清空按鈕 | 🗑️ 清空 | 🗑️ Xóa tất cả |
| confirm 清空 | 確定要清空？ | Bạn có chắc muốn xóa? |
| 同步成功 | ✅ 已同步至雲端 | ✅ Đã đồng bộ |
| 同步失敗 | ⚠️ 雲端同步失敗 | ⚠️ Đồng bộ thất bại |

---

## 部署

- 新建 GitHub repo（與標籤工具分開）
- GitHub Pages 開啟
- 建立 Google Sheets + GAS，填入 GAS_URL

---

## 不在本次範圍

- 離線佇列（斷網時自動暫存，恢復後自動補傳）
- 多使用者 / 多部門識別
- 歷史紀錄查詢介面
