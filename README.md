# PDF Dual Insert

**PDF Dual Insert** is an Obsidian plugin that enhances drag & drop behavior for PDFs.  
When you drag and drop a PDF into the editor, the plugin automatically inserts **two lines**:

1) A **clickable link** (Markdown link or WikiLink — configurable)  
2) An **embedded preview** (`![]()` or `![[…]]`)

This lets you keep a clean, consistent “Open PDF” style link while still showing the inline preview.

---

## ✨ Features

- Works for **both**:
  - Internal drag & drop (from Obsidian file explorer)
  - External drag & drop (from Finder/Explorer)
- Configurable **link label** (default: `Open PDF`)
- Choose **Markdown link** or **WikiLink** output
- Handles filenames with **spaces** and **non-ASCII** characters safely

---

## 🔧 Settings

- **Link Label**  
  Text used for the top clickable link (e.g., `Open PDF`, `View PDF`, `開く`).
- **Link Style**  
  Output either **Markdown** links or **WikiLinks**.

---

## 🖼 Example Output

**Markdown style**
```markdown
[Open PDF](attachments/example%20file.pdf)
![](attachments/example%20file.pdf)
```

**WikiLink style**
```markdown
[[attachments/example file.pdf|Open PDF]]
![[attachments/example file.pdf]]
```

> Note: For Markdown links, spaces and special characters are safely escaped.

---

## 📦 Installation

### Manual (development build)
1. Copy this folder to your vault:
   ```
   <your-vault>/.obsidian/plugins/pdf-dual-insert/
   ```
   It should contain at least:
   - `manifest.json`
   - `main.js`
   - `styles.css` (optional)
2. Reload Obsidian.
3. Enable **PDF Dual Insert** in **Settings → Community Plugins**.

### From Community Plugins (after it’s approved)
1. Open **Settings → Community Plugins → Browse**.
2. Search for **“PDF Dual Insert”**.
3. Install and enable it.

---

## 🧭 How It Works (Behavior)

- **Internal D&D** (file explorer → editor)  
  The plugin cancels Obsidian’s default single embed and inserts:
  ```markdown
  [Open PDF](…)
  ![](…)
  ```
  (or the WikiLink equivalents)

- **External D&D** (Finder/Explorer → editor)  
  The PDF is imported into your vault following your **attachment folder** settings, and the same two lines are inserted at the drop position.

- **Non-PDF files** are ignored (default Obsidian behavior).

---

## ⚙️ Configuration Tips

- Want a different label? Change it in **Settings → PDF Dual Insert → Link Label** (e.g., `Open`, `Open in new tab`, `開く`).
- Prefer **WikiLinks**? Toggle **Link Style** in settings.
- Use with other PDF-related plugins (e.g., PDF++) — this plugin only controls insertion, not the viewer.

---

## 🧪 Compatibility

- Tested on Obsidian Desktop `v1.5+`.
- No build step required (plain `main.js` plugin).

---

## 🗺 Roadmap

- Option to insert **link only** or **embed only**
- Option to reverse order (**embed first**, link second)
- Per-file overrides via command palette

---

## 🤝 Contributing

Issues and PRs are welcome!  
Please open an issue if you encounter edge cases with paths or special characters.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.
