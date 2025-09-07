const { Plugin, Notice, MarkdownView, PluginSettingTab, Setting } = require('obsidian');

// Default settings
const DEFAULT_SETTINGS = {
  openLabel: 'Open PDF',      // Link label text
  linkStyle: 'markdown'       // 'markdown' | 'wikilink'
};

class PdfDualInsertPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new PdfDualInsertSettingTab(this.app, this));

    // Capture drop events before default Obsidian handling
    this.registerDomEvent(document, 'drop', (evt) => {
      (async () => {
        try {
          const dt = evt.dataTransfer;
          if (!dt) return;

          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!view) return;

          // Only trigger inside editor
          const pathChain = evt.composedPath ? evt.composedPath() : [];
          const inEditor = pathChain.some(el => el && el.classList && el.classList.contains('cm-editor'));
          if (!inEditor) return;

          const internalPayload = dt.getData('application/obsidian');
          const isInternal = !!internalPayload;
          const hasExternalFiles = dt.files && dt.files.length > 0;

          if (!isInternal && !hasExternalFiles) return;

          // Move cursor to drop position
          try {
            const cmView = view.editor.cm?.view;
            if (cmView) {
              const pos = cmView.posAtCoords({ x: evt.clientX, y: evt.clientY });
              if (typeof pos === 'number') {
                const loc = view.editor.offsetToPos(pos);
                view.editor.setCursor(loc);
              }
            }
          } catch {}

          // ===== Internal drag & drop (from Obsidian file explorer) =====
          if (isInternal) {
            let data; try { data = JSON.parse(internalPayload); } catch { data = null; }
            const paths = [];
            if (data?.type === 'file' && typeof data.path === 'string') {
              paths.push(data.path);
            } else if (data?.type === 'files' && Array.isArray(data.files)) {
              for (const f of data.files) if (typeof f.path === 'string') paths.push(f.path);
            }
            const pdfPaths = paths.filter(p => p.toLowerCase().endsWith('.pdf'));
            if (pdfPaths.length === 0) return;

            evt.preventDefault(); evt.stopPropagation();

            let insertText = '';
            for (const absPath of pdfPaths) {
              const file = this.app.vault.getAbstractFileByPath(absPath);
              const rel = file
                ? this.app.metadataCache.fileToLinktext(file, view.file?.path ?? '')
                : absPath;

              insertText += this._buildTwoLines(rel);
            }
            view.editor.replaceRange(insertText, view.editor.getCursor());
            return;
          }

          // ===== External drag & drop (from Finder/Explorer) =====
          if (hasExternalFiles) {
            const files = Array.from(dt.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
            if (files.length === 0) return;

            evt.preventDefault(); evt.stopPropagation();

            let insertText = '';
            for (const f of files) {
              const arrayBuf = await f.arrayBuffer();

              // Get available path according to attachment folder settings
              let availPath = this.app.fileManager.getAvailablePathForAttachment(
                f.name.replace(/\//g, '_'), view.file
              );
              if (availPath && typeof availPath.then === 'function') availPath = await availPath;
              if (typeof availPath !== 'string') availPath = availPath?.path ?? String(availPath);
              if (!availPath.toLowerCase().endsWith('.pdf')) availPath += '.pdf';

              await this._ensureFolder(availPath);
              const created = await this.app.vault.createBinary(availPath, arrayBuf);

              const rel = this.app.metadataCache.fileToLinktext(created, view.file?.path ?? '');
              insertText += this._buildTwoLines(rel);
            }
            view.editor.replaceRange(insertText, view.editor.getCursor());
            return;
          }
        } catch (e) {
          console.error('pdf-dual-insert (D&D) error:', e);
          new Notice('PDF Dual Insert: Error during drop (see Console)', 5000);
        }
      })();
    }, { capture: true });
  }

  // Build two lines: top link + embed preview
  _buildTwoLines(relPath) {
    if (this.settings.linkStyle === 'wikilink') {
      // WikiLink
      const link = relPath;
      return `[[${link}|${this.settings.openLabel}]]\n![[${link}]]\n\n`;
    } else {
      // Markdown link
      const mdDest = this._toMarkdownDest(relPath);
      return `[${this.settings.openLabel}](${mdDest})\n![](${mdDest})\n\n`;
    }
  }

  // Escape only problematic characters (keep Japanese/Unicode intact)
  _toMarkdownDest(relPath) {
    return relPath
      .replace(/ /g, '%20')   // spaces
      .replace(/#/g, '%23')   // #
      .replace(/\[/g, '%5B').replace(/\]/g, '%5D')
      .replace(/\(/g, '%28').replace(/\)/g, '%29')
      .replace(/</g, '%3C').replace(/>/g, '%3E')
      .replace(/{/g, '%7B').replace(/}/g, '%7D');
  }

  async _ensureFolder(filePath) {
    const parts = filePath.split('/').slice(0, -1);
    let cur = '';
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : p;
      if (!this.app.vault.getAbstractFileByPath(cur)) {
        await this.app.vault.createFolder(cur);
      }
    }
  }

  async saveSettings() { await this.saveData(this.settings); }
}

// Settings tab
class PdfDualInsertSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'PDF Dual Insert – Settings' });

    new Setting(containerEl)
      .setName('Link Label')
      .setDesc('The text used for the top clickable link (e.g. Open PDF / View PDF)')
      .addText(t => t
        .setPlaceholder('Open PDF')
        .setValue(this.plugin.settings.openLabel)
        .onChange(async (v) => {
          this.plugin.settings.openLabel = v || 'Open PDF';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Link Style')
      .setDesc('Choose between Markdown links or WikiLinks')
      .addDropdown(d => d
        .addOption('markdown', 'Markdown')
        .addOption('wikilink', 'WikiLink')
        .setValue(this.plugin.settings.linkStyle)
        .onChange(async (v) => {
          this.plugin.settings.linkStyle = v;
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = PdfDualInsertPlugin;
