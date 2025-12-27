**Description:** Interfaces with Expo Push API.
*   **Payload:** `{ to: push_token, title: "Mistie", body: "...", data: { route: "..." } }`
*   **Logic:**
    *   If `type == 'silent'`, set `sound: 'default'` but body is empty string (just vibration).
    *   If `type == 'note'`, body = `content`.

### 1.3 `mistie-shredder`
**Trigger:** User Action (Settings -> "End Relationship").
**Description:** GDPR-compliant "Right to be Forgotten" + Relationship termination.
*   **Steps:**
    1.  Generate PDF/JSON export of all chat history.
    2.  Email export to users.
    3.  Cascading HARD DELETE of `bonds` row (wipes all child data).
    4.  Clean up Storage bucket artifacts.

---

## 2. Database Triggers (PL/pgSQL)

### 2.1 `trg_check_dew_completion`
*   **Watch:** `daily_dews` (UPDATE).
*   **Condition:** `NEW.user_1_response IS NOT NULL AND NEW.user_2_response IS NOT NULL`.
*   **Action:**
    *   `SET is_revealed = TRUE`.
    *   Increment `bonds.streak_count`.
    *   Notification: "The Mist has cleared."

### 2.2 `trg_on_new_nug`
*   **Watch:** `nugs` (INSERT).
*   **Action:** HTTP Request to `send-push-notification`.

### 2.3 `trg_init_bond`
*   **Watch:** `bonds` (UPDATE `user_2_id`).
*   **Action:**
    *   Set `status` = 'couple'.
    *   Create 3 default `relationship_anchors` (e.g., 'Anniversary', 'First Date').
    *   Insert "Welcome" Dew.