/**
 * DocxToMarkdown - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const htmlEl = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  
  const fileDetails = document.getElementById('fileDetails');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const clearFileBtn = document.getElementById('clearFileBtn');
  const conversionProgress = document.getElementById('conversionProgress');
  const statusMessage = document.getElementById('statusMessage');
  
  // Settings Elements
  const settingTables = document.getElementById('settingTables');
  const settingStrikethrough = document.getElementById('settingStrikethrough');
  const settingHeadingShift = document.getElementById('settingHeadingShift');
  const settingImages = document.getElementById('settingImages');
  const settingHr = document.getElementById('settingHr');
  
  // Workspace Elements
  const tabMarkdownBtn = document.getElementById('tabMarkdownBtn');
  const tabPreviewBtn = document.getElementById('tabPreviewBtn');
  const tabSplitBtn = document.getElementById('tabSplitBtn');
  const workspaceContent = document.getElementById('workspaceContent');
  
  const panelMarkdown = document.getElementById('panelMarkdown');
  const panelPreview = document.getElementById('panelPreview');
  
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const markdownOutput = document.getElementById('markdownOutput');
  const previewRender = document.getElementById('previewRender');
  const lineNumbers = document.getElementById('lineNumbers');
  
  const toastContainer = document.getElementById('toastContainer');
  
  // Extracted Assets Elements
  const cardAssets = document.getElementById('cardAssets');
  const assetCount = document.getElementById('assetCount');
  const assetsGrid = document.getElementById('assetsGrid');
  const downloadAllAssetsBtn = document.getElementById('downloadAllAssetsBtn');

  // --- App State ---
  let activeFile = null;
  let convertedMarkdown = '';
  let activeTab = 'markdown'; // markdown, preview, split
  let extractedImages = [];

  // --- Initialize App ---
  initTheme();
  setupEventListeners();

  // --- Theme Controller ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlEl.setAttribute('data-theme', savedTheme);
  }

  function toggleTheme() {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme Switch
    themeToggle.addEventListener('click', toggleTheme);

    // File Selection
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    });

    // Clear File
    clearFileBtn.addEventListener('click', resetFileState);

    // Re-trigger conversion if settings change
    [settingTables, settingStrikethrough, settingHeadingShift, settingImages, settingHr].forEach(elem => {
      elem.addEventListener('change', () => {
        if (activeFile) {
          convertDocx(activeFile);
        }
      });
    });

    // Workspace Tabs
    tabMarkdownBtn.addEventListener('click', () => switchTab('markdown'));
    tabPreviewBtn.addEventListener('click', () => switchTab('preview'));
    tabSplitBtn.addEventListener('click', () => switchTab('split'));

    // Copy to Clipboard
    copyBtn.addEventListener('click', copyToClipboard);

    // Download MD
    downloadBtn.addEventListener('click', downloadMarkdownFile);

    // Download ZIP
    downloadZipBtn.addEventListener('click', downloadMarkdownZip);

    // Download All Extracted Images
    downloadAllAssetsBtn.addEventListener('click', downloadAllImages);

    // Synchronized scrolling flags
    let isScrollingEditor = false;
    let isScrollingPreview = false;

    // Sync Editor scroll with Line Numbers and Preview
    markdownOutput.addEventListener('scroll', () => {
      lineNumbers.scrollTop = markdownOutput.scrollTop;
      
      if (activeTab === 'split' && !isScrollingPreview) {
        isScrollingEditor = true;
        const editorScrollHeight = markdownOutput.scrollHeight - markdownOutput.clientHeight;
        if (editorScrollHeight > 0) {
          const scrollPercentage = markdownOutput.scrollTop / editorScrollHeight;
          previewRender.scrollTop = scrollPercentage * (previewRender.scrollHeight - previewRender.clientHeight);
        }
        // Debounce unsetting flag
        setTimeout(() => { isScrollingEditor = false; }, 50);
      }
    });

    // Sync Preview scroll with Editor
    previewRender.addEventListener('scroll', () => {
      if (activeTab === 'split' && !isScrollingEditor) {
        isScrollingPreview = true;
        const previewScrollHeight = previewRender.scrollHeight - previewRender.clientHeight;
        if (previewScrollHeight > 0) {
          const scrollPercentage = previewRender.scrollTop / previewScrollHeight;
          markdownOutput.scrollTop = scrollPercentage * (markdownOutput.scrollHeight - markdownOutput.clientHeight);
          lineNumbers.scrollTop = markdownOutput.scrollTop;
        }
        // Debounce unsetting flag
        setTimeout(() => { isScrollingPreview = false; }, 50);
      }
    });

    // Responsive textarea height updates lines count dynamically
    markdownOutput.addEventListener('input', () => {
      convertedMarkdown = markdownOutput.value;
      updateLineNumbers();
      renderMarkdownPreview();
    });

    // Intercept TOC / Anchor link clicks in the Rich Preview to scroll inside container
    previewRender.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
        const targetId = link.getAttribute('href').substring(1);
        const targetEl = previewRender.querySelector(`[id="${targetId}"], [name="${targetId}"]`);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  // --- Toast Alert Helper ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning' || type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      // Info icon
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Slide out and remove
    setTimeout(() => {
      toast.style.animation = 'fade-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3500);
  }

  // --- Tab Switcher Logic ---
  function switchTab(tab) {
    activeTab = tab;
    
    // Reset buttons
    tabMarkdownBtn.classList.remove('active');
    tabPreviewBtn.classList.remove('active');
    tabSplitBtn.classList.remove('active');
    
    // Reset workspace content styling classes
    workspaceContent.className = 'workspace-content';
    panelMarkdown.classList.remove('active');
    panelPreview.classList.remove('active');

    if (tab === 'markdown') {
      tabMarkdownBtn.classList.add('active');
      workspaceContent.classList.add('mode-markdown');
      panelMarkdown.classList.add('active');
      // Sync lines scroll on render
      setTimeout(() => { lineNumbers.scrollTop = markdownOutput.scrollTop; }, 50);
    } else if (tab === 'preview') {
      tabPreviewBtn.classList.add('active');
      workspaceContent.classList.add('mode-preview');
      panelPreview.classList.add('active');
      renderMarkdownPreview();
    } else if (tab === 'split') {
      tabSplitBtn.classList.add('active');
      workspaceContent.classList.add('mode-split');
      panelMarkdown.classList.add('active');
      panelPreview.classList.add('active');
      renderMarkdownPreview();
      setTimeout(() => { lineNumbers.scrollTop = markdownOutput.scrollTop; }, 50);
    }
  }

  // --- Line Numbers Sync ---
  function updateLineNumbers() {
    const lines = convertedMarkdown.split('\n');
    const totalLines = Math.max(1, lines.length);
    let html = '';
    for (let i = 1; i <= totalLines; i++) {
      html += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = html;
  }

  // --- Markdown Preview Renderer ---
  function renderMarkdownPreview() {
    if (!convertedMarkdown) {
      previewRender.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <h3>Nothing to preview</h3>
          <p>Convert a DOCX document to view the visual HTML presentation here.</p>
        </div>
      `;
      return;
    }

    try {
      // Configure Marked rules
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      previewRender.innerHTML = marked.parse(convertedMarkdown);
    } catch (err) {
      console.error('Marked Render Error:', err);
      previewRender.innerHTML = `<div style="color: var(--danger-color)">Error rendering preview. Raw Markdown output is safe.</div>`;
    }
  }

  // --- File Select Router ---
  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function processFile(file) {
    // Validate File Extension and MIME Type
    const validExtension = file.name.toLowerCase().endsWith('.docx');
    
    if (!validExtension) {
      showToast('Invalid format. Please upload a .docx file.', 'danger');
      resetFileState();
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showToast('File is too large. Max limit is 10MB.', 'warning');
      return;
    }

    activeFile = file;
    
    // Update Details Box UI
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    
    dropzone.classList.add('hidden');
    fileDetails.classList.remove('hidden');

    convertDocx(file);
  }

  function resetFileState() {
    activeFile = null;
    convertedMarkdown = '';
    markdownOutput.value = '';
    
    fileInput.value = '';
    fileName.textContent = 'document.docx';
    fileSize.textContent = '0 KB';
    
    conversionProgress.style.width = '0%';
    statusMessage.textContent = 'Ready to convert...';
    statusMessage.style.color = 'var(--text-muted)';
    
    fileDetails.classList.add('hidden');
    dropzone.classList.remove('hidden');
    
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    downloadZipBtn.disabled = true;

    // Revoke and clear extracted assets
    extractedImages.forEach(img => URL.revokeObjectURL(img.blobUrl));
    extractedImages = [];
    assetsGrid.innerHTML = '';
    cardAssets.classList.add('hidden');

    updateLineNumbers();
    renderMarkdownPreview();
  }

  // --- Mammoth and Turndown Parser Pipeline ---
  async function convertDocx(file) {
    try {
      updateStatus('Reading file...', 20);
      
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      updateStatus('Extracting content from Word...', 50);

      // Clean previous extraction resources
      extractedImages.forEach(img => URL.revokeObjectURL(img.blobUrl));
      extractedImages = [];
      assetsGrid.innerHTML = '';
      cardAssets.classList.add('hidden');

      // Create custom image handler that ALWAYS extracts the files locally
      // while formatting the markdown body according to the user's setting
      const imgSetting = settingImages.value;
      const imageHandler = mammoth.images.inline((element) => {
        return element.read("base64").then((imageBuffer) => {
          const rawBase64 = typeof imageBuffer === 'string' ? imageBuffer : imageBuffer.toBase64();
          const base64Str = rawBase64.replace(/[\s\r\n]+/g, '');
          const mimeType = element.contentType;
          const extension = mimeType.split('/')[1] || 'png';
          const imgId = extractedImages.length + 1;
          const imgName = `image-${imgId}.${extension}`;
          
          // Generate Blob and local object url for the asset drawer
          const byteCharacters = atob(base64Str);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          
          extractedImages.push({
            id: imgId,
            name: imgName,
            mimeType: mimeType,
            base64: base64Str,
            blobUrl: blobUrl,
            size: blob.size
          });

          // Return body format output
          if (imgSetting === 'base64') {
            return {
              src: `data:${mimeType};base64,${base64Str}`
            };
          } else if (imgSetting === 'placeholder') {
            return {
              value: `![${imgName}]([IMAGE_PLACEHOLDER: ${imgName}])`
            };
          } else {
            // Ignore (omit from text body)
            return { value: '' };
          }
        });
      });

      // Configure Mammoth conversion options
      const options = {
        convertImage: imageHandler
      };

      // Convert DOCX to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      let htmlContent = result.value;
      const messages = result.messages;
      
      if (messages && messages.length > 0) {
        console.warn('Mammoth parser reports warnings:', messages);
      }

      updateStatus('Converting to Markdown...', 80);

      // --- HTML Pre-processing to improve Markdown output ---
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // 1. Remove empty formatting nodes to avoid clutter like **** or __ in markdown
      doc.querySelectorAll('p, span, strong, em, b, i, strike, s, del, u, ins, code').forEach(el => {
        if (!el.textContent.trim() && el.children.length === 0) {
          el.remove();
        }
      });

      // 2. Format tables to meet GFM table syntax requirements
      doc.querySelectorAll('table').forEach(table => {
        // Construct thead from the first row if missing (Mammoth default output format)
        let thead = table.querySelector('thead');
        if (!thead) {
          thead = doc.createElement('thead');
          const firstRow = table.querySelector('tr');
          if (firstRow) {
            thead.appendChild(firstRow);
            table.insertBefore(thead, table.firstChild);
          }
        }
        
        // Convert td to th inside thead
        if (thead) {
          thead.querySelectorAll('td').forEach(td => {
            const th = doc.createElement('th');
            th.innerHTML = td.innerHTML;
            for (let i = 0; i < td.attributes.length; i++) {
              const attr = td.attributes[i];
              th.setAttribute(attr.name, attr.value);
            }
            td.replaceWith(th);
          });
        }
        
        // Wrap remaining rows in a tbody
        let tbody = table.querySelector('tbody');
        if (!tbody) {
          tbody = doc.createElement('tbody');
          const rows = Array.from(table.querySelectorAll('tr')).filter(tr => tr.parentNode !== thead);
          rows.forEach(row => tbody.appendChild(row));
          table.appendChild(tbody);
        }
        
        // Flatten cell block-level content (p, div) into inline text to prevent Turndown fallback
        table.querySelectorAll('td, th').forEach(cell => {
          const blocks = cell.querySelectorAll('p, div, blockquote');
          if (blocks.length > 0) {
            let newHtml = '';
            const blockContents = [];
            blocks.forEach(block => {
              if (block.innerHTML.trim()) {
                blockContents.push(block.innerHTML.trim());
              }
            });
            newHtml = blockContents.length > 0 ? blockContents.join(' <br> ') : cell.innerHTML;
            cell.innerHTML = newHtml;
          }
          
          // Strip newlines inside cell code so it doesn't break GFM Markdown rows
          cell.innerHTML = cell.innerHTML.replace(/\r?\n|\r/g, ' ').trim();
        });
      });

      // 3. Pre-process TOC anchor targets to ensure they are preserved as empty anchors
      doc.querySelectorAll('[id], [name]').forEach(el => {
        const id = el.getAttribute('id') || el.getAttribute('name');
        if (id && el.nodeName !== 'A' && el.nodeName !== 'TD' && el.nodeName !== 'TH' && el.nodeName !== 'TR') {
          // Prepend an empty anchor with this ID before the element so Turndown can preserve it
          const anchor = doc.createElement('a');
          anchor.setAttribute('id', id);
          el.parentNode.insertBefore(anchor, el);
        }
      });

      const cleanedHtmlContent = doc.body.innerHTML;

      // Initialize Turndown Service
      const hrChar = settingHr.value;
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: hrChar,
        bulletListMarker: '-',
        codeBlockStyle: 'fenced'
      });

      // Enable custom GFM plugins based on toggle switches
      if (typeof turndownPluginGfm !== 'undefined') {
        if (settingTables.checked) {
          turndownService.use(turndownPluginGfm.tables);
        }
        if (settingStrikethrough.checked) {
          // Note: GFM strikethrough plugin is loaded, but we override below for perfect double-tildes
          turndownService.use(turndownPluginGfm.strikethrough);
        }
        // Always load standard lists formatting
        turndownService.use(turndownPluginGfm.taskListItems);
      }

      // If table parsing is disabled, convert tables to plain paragraphs containing text columns
      if (!settingTables.checked) {
        turndownService.addRule('ignore-tables', {
          filter: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'],
          replacement: (content, node) => {
            if (node.nodeName === 'TD' || node.nodeName === 'TH') {
              return content + ' | ';
            }
            if (node.nodeName === 'TR') {
              return '| ' + content + '\n';
            }
            if (node.nodeName === 'TABLE') {
              return '\n\n' + content + '\n\n';
            }
            return content;
          }
        });
      }

      // Custom rule to format images cleanly and prevent newlines/spaces from breaking markdown syntax
      turndownService.addRule('clean-image-formatting', {
        filter: 'img',
        replacement: (content, node) => {
          const alt = (node.getAttribute('alt') || '').replace(/[\s\r\n]+/g, ' ').trim();
          const src = (node.getAttribute('src') || '').trim();
          const title = (node.getAttribute('title') || '').trim();
          const titlePart = title ? ` "${title}"` : '';
          return src ? `![${alt}](${src}${titlePart})` : '';
        }
      });

      // Add custom strikethrough rule (strict double-tildes)
      turndownService.addRule('strikethrough-custom', {
        filter: ['strike', 's', 'del'],
        replacement: (content) => {
          return `~~${content}~~`;
        }
      });

      // Add custom underline rule using HTML tag
      turndownService.addRule('underline-custom', {
        filter: ['u', 'ins'],
        replacement: (content) => {
          return `<u>${content}</u>`;
        }
      });

      // Add custom rule to preserve empty anchor tags that act as TOC targets
      turndownService.addRule('preserve-toc-anchors', {
        filter: (node) => {
          return node.nodeName === 'A' && (node.getAttribute('id') || node.getAttribute('name')) && !node.textContent.trim();
        },
        replacement: (content, node) => {
          const id = node.getAttribute('id') || node.getAttribute('name');
          return `<a id="${id}"></a>`;
        }
      });

      // Add Heading Level Shift Custom Rules
      const shift = parseInt(settingHeadingShift.value, 10);
      if (shift > 0) {
        turndownService.addRule('heading-shift', {
          filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          replacement: (content, node) => {
            const level = parseInt(node.nodeName.charAt(1), 10);
            const newLevel = Math.min(6, level + shift);
            const prefix = '#'.repeat(newLevel);
            return `\n\n${prefix} ${content.trim()}\n\n`;
          }
        });
      }

      // Custom rule to improve list formatting inside markdown
      turndownService.addRule('clean-lists', {
        filter: ['ul', 'ol'],
        replacement: (content, node) => {
          return `\n\n${content}\n\n`;
        }
      });

      // Parse HTML to Markdown
      let parsedMarkdown = turndownService.turndown(cleanedHtmlContent);

      // Post-process markdown output spacing
      convertedMarkdown = parsedMarkdown
        .replace(/\r/g, '')                      // Normalize CR characters
        .replace(/&nbsp;/g, ' ')                 // Convert html spaces to normal spaces
        .replace(/\n{3,}/g, '\n\n')              // Compress multiple blank lines to a single one
        .trim();

      // Final Output Bind
      markdownOutput.value = convertedMarkdown;
      updateLineNumbers();
      renderMarkdownPreview();

      // Populate and display extracted assets drawer
      displayExtractedAssets();

      updateStatus('Conversion successful!', 100, true);
      showToast('Document converted successfully!', 'success');
      
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      downloadZipBtn.disabled = false;

    } catch (err) {
      console.error('Conversion Failure:', err);
      updateStatus('Conversion failed.', 100, false, true);
      showToast('Error parsing file. Ensure it is a valid, uncorrupted .docx document.', 'danger');
      resetFileState();
    }
  }

  // --- Promisified File Reader ---
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('File reading error.'));
      reader.readAsArrayBuffer(file);
    });
  }

  // --- UI Progress Helpers ---
  function updateStatus(msg, percent, success = false, error = false) {
    statusMessage.textContent = msg;
    conversionProgress.style.width = `${percent}%`;

    if (error) {
      statusMessage.style.color = 'var(--danger-color)';
      conversionProgress.style.backgroundColor = 'var(--danger-color)';
    } else if (success) {
      statusMessage.style.color = 'var(--success-color)';
      conversionProgress.style.backgroundColor = 'var(--success-color)';
    } else {
      statusMessage.style.color = 'var(--text-muted)';
      conversionProgress.style.backgroundColor = ''; // uses gradient defaults
    }
  }

  // --- Action Handlers ---
  async function copyToClipboard() {
    if (!convertedMarkdown) return;
    
    try {
      await navigator.clipboard.writeText(convertedMarkdown);
      
      // Update Copy button visual status
      copyBtn.classList.add('copied');
      const textSpan = copyBtn.querySelector('span');
      textSpan.textContent = 'Copied!';
      
      showToast('Copied to clipboard!', 'success');
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        textSpan.textContent = 'Copy';
      }, 2000);
      
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Could not copy to clipboard. Please select and copy manually.', 'warning');
    }
  }

  function downloadMarkdownFile() {
    if (!convertedMarkdown) return;
    
    try {
      const blob = new Blob([convertedMarkdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Determine file name
      let baseName = 'converted-document';
      if (activeFile) {
        // Strip .docx extension
        baseName = activeFile.name.replace(/\.[^/.]+$/, "");
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}.md`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the url to free up memory
      URL.revokeObjectURL(url);
      showToast('Markdown downloaded!', 'success');
    } catch (err) {
      console.error('Download trigger error:', err);
      showToast('Failed to trigger download.', 'danger');
    }
  }

  // --- Math/Format Utility ---
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // --- Extracted Assets UI Rendering Helpers ---
  function displayExtractedAssets() {
    if (extractedImages.length > 0) {
      assetCount.textContent = extractedImages.length;
      assetsGrid.innerHTML = '';
      
      extractedImages.forEach(img => {
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.title = `${img.name} (${formatBytes(img.size)})`;
        item.addEventListener('click', () => {
          const link = document.createElement('a');
          link.href = img.blobUrl;
          link.download = img.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast(`Downloaded ${img.name}`, 'success');
        });
        
        item.innerHTML = `
          <img src="${img.blobUrl}" alt="${img.name}" class="asset-thumb">
          <div class="asset-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
        `;
        assetsGrid.appendChild(item);
      });
      
      cardAssets.classList.remove('hidden');
    } else {
      cardAssets.classList.add('hidden');
    }
  }

  function downloadAllImages() {
    if (extractedImages.length === 0) return;
    extractedImages.forEach(img => {
      const link = document.createElement('a');
      link.href = img.blobUrl;
      link.download = img.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    showToast(`Downloaded all ${extractedImages.length} images!`, 'success');
  }

  function downloadMarkdownZip() {
    if (!convertedMarkdown) return;
    
    try {
      updateStatus('Creating ZIP file...', 90);
      const zip = new JSZip();
      
      // Get base file name
      let baseName = 'converted-document';
      if (activeFile) {
        baseName = activeFile.name.replace(/\.[^/.]+$/, "");
      }
      
      // Clone the markdown contents for relative adjustments in ZIP
      let zipMarkdown = convertedMarkdown;
      
      // We will perform a highly robust regex-based extraction of images directly from the Markdown content
      // to handle cases where the base64 URLs contain whitespaces/newlines or differ slightly.
      const mdImageRegex = /!\[([^\]]*)\][\s\r\n]*\([\s\r\n]*(data:image\/([a-zA-Z0-9+-\.]+);base64,([a-zA-Z0-9\/\+=\s\n\r]+))[\s\r\n]*\)/gi;
      const htmlImageRegex = /<img\s+[^>]*src=["']\s*(data:image\/([a-zA-Z0-9+-\.]+);base64,([a-zA-Z0-9\/\+=\s\n\r]+))\s*["'][^>]*>/gi;
      
      // Temp array to store final images that are actually referenced in the markdown
      const finalImagesToZip = [];
      let matchCount = 0;

      // 1. Process Markdown style image tags
      zipMarkdown = zipMarkdown.replace(mdImageRegex, (match, altText, dataUrl, extension, base64Data) => {
        const cleanBase64 = base64Data.replace(/[\s\n\r]+/g, '');
        
        // Find if this image matches one in our extractedImages state array
        const matchingImg = extractedImages.find(img => {
          const imgClean = img.base64.replace(/[\s\n\r]+/g, '');
          return imgClean.substring(0, 100) === cleanBase64.substring(0, 100);
        });
        
        let imgName;
        if (matchingImg) {
          imgName = matchingImg.name;
          // Add to zip list if not already added
          if (!finalImagesToZip.some(x => x.name === imgName)) {
            finalImagesToZip.push(matchingImg);
          }
        } else {
          matchCount++;
          const finalExt = extension === 'jpeg' ? 'jpg' : extension;
          imgName = `image-${matchCount}.${finalExt}`;
          const newImgObj = {
            name: imgName,
            mimeType: `image/${extension}`,
            base64: cleanBase64
          };
          finalImagesToZip.push(newImgObj);
        }
        
        const cleanAlt = (altText || '').trim();
        return `![${cleanAlt || imgName}](media/${imgName})`;
      });

      // 2. Process HTML style img tags (if any exist)
      zipMarkdown = zipMarkdown.replace(htmlImageRegex, (match, dataUrl, extension, base64Data) => {
        const cleanBase64 = base64Data.replace(/[\s\n\r]+/g, '');
        
        const matchingImg = extractedImages.find(img => {
          const imgClean = img.base64.replace(/[\s\n\r]+/g, '');
          return imgClean.substring(0, 100) === cleanBase64.substring(0, 100);
        });
        
        let imgName;
        if (matchingImg) {
          imgName = matchingImg.name;
          if (!finalImagesToZip.some(x => x.name === imgName)) {
            finalImagesToZip.push(matchingImg);
          }
        } else {
          matchCount++;
          const finalExt = extension === 'jpeg' ? 'jpg' : extension;
          imgName = `image-${matchCount}.${finalExt}`;
          const newImgObj = {
            name: imgName,
            mimeType: `image/${extension}`,
            base64: cleanBase64
          };
          finalImagesToZip.push(newImgObj);
        }
        
        return `![${imgName}](media/${imgName})`;
      });

      // 3. Process placeholder links (if user selected placeholder)
      extractedImages.forEach(img => {
        const placeholderUrl = `[IMAGE_PLACEHOLDER: ${img.name}]`;
        if (zipMarkdown.includes(placeholderUrl)) {
          zipMarkdown = zipMarkdown.split(placeholderUrl).join(`media/${img.name}`);
          if (!finalImagesToZip.some(x => x.name === img.name)) {
            finalImagesToZip.push(img);
          }
        }
      });
      
      // 4. Add the markdown file containing clean relative image URLs
      zip.file(`${baseName}.md`, zipMarkdown);
      
      // 5. Add extracted images to the 'media/' folder inside the ZIP
      finalImagesToZip.forEach(img => {
        zip.file(`media/${img.name}`, img.base64, { base64: true });
      });
      
      // 6. Generate ZIP blob and download
      zip.generateAsync({ type: 'blob' }).then(function(content) {
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseName}.zip`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        updateStatus('Conversion successful!', 100, true);
        showToast('ZIP file downloaded!', 'success');
      }).catch(err => {
        console.error('ZIP generation promise failed:', err);
        updateStatus('ZIP export failed.', 100, false, true);
        showToast('Failed to compile ZIP archive.', 'danger');
      });
      
    } catch (err) {
      console.error('ZIP compilation exception:', err);
      updateStatus('ZIP export failed.', 100, false, true);
      showToast('Failed to compile ZIP archive.', 'danger');
    }
  }

  // ==========================================
  // --- VS Code Workspace Logic ---
  // ==========================================

  // Elements
  const switchToWorkspaceBtn = document.getElementById('switchToWorkspaceBtn');
  const exitWorkspaceBtn = document.getElementById('exitWorkspaceBtn');
  const vscodeWorkspace = document.getElementById('vscodeWorkspace');
  const appWrapper = document.querySelector('.app-wrapper');
  
  const activityExplorerBtn = document.getElementById('activityExplorerBtn');
  const activityUploadBtn = document.getElementById('activityUploadBtn');
  const vscodeSidebar = document.getElementById('vscodeSidebar');
  const folderInput = document.getElementById('folderInput');
  const vscodeFolderBrowseBtn = document.getElementById('vscodeFolderBrowseBtn');
  const vscodeUploadZone = document.getElementById('vscodeUploadZone');
  const vscodeFileTree = document.getElementById('vscodeFileTree');
  const vscodeWorkspaceTitle = document.getElementById('vscodeWorkspaceTitle');
  const vscodeTabs = document.getElementById('vscodeTabs');
  const vscodeSplitPanels = document.getElementById('vscodeSplitPanels');
  
  const vscodeEditorPane = document.getElementById('vscodeEditorPane');
  const workspaceEditor = document.getElementById('workspaceEditor');
  const workspaceLineNumbers = document.getElementById('workspaceLineNumbers');
  const activeFileNameSpan = document.getElementById('activeFileNameSpan');
  const workspaceImageViewer = document.getElementById('workspaceImageViewer');
  const workspaceImageSrc = document.getElementById('workspaceImageSrc');
  const workspaceImageMeta = document.getElementById('workspaceImageMeta');
  const workspacePreview = document.getElementById('workspacePreview');
  
  const statusFolderText = document.getElementById('statusFolderText');
  const statusLanguageText = document.getElementById('statusLanguageText');

  // State
  let workspaceMode = false;
  let workspaceFiles = {}; // relativePath -> { file, name, path, blobUrl, content }
  let openTabs = [];       // Array of relativePaths
  let activeTabFile = null;// relativePath

  // Toggle View Modes
  switchToWorkspaceBtn.addEventListener('click', () => {
    workspaceMode = true;
    appWrapper.classList.add('hidden');
    vscodeWorkspace.classList.remove('hidden');
    showToast('Switched to VS Code Workspace', 'info');
    
    // Auto trigger folder upload if empty
    if (Object.keys(workspaceFiles).length === 0) {
      setTimeout(() => {
        showToast('Please open or drag a folder to get started', 'info');
      }, 500);
    }
  });

  exitWorkspaceBtn.addEventListener('click', () => {
    workspaceMode = false;
    vscodeWorkspace.classList.add('hidden');
    appWrapper.classList.remove('hidden');
    showToast('Returned to Converter Mode', 'info');
  });

  // Sidebar Controls
  activityExplorerBtn.addEventListener('click', () => {
    activityExplorerBtn.classList.toggle('active');
    vscodeSidebar.classList.toggle('collapsed');
  });

  activityUploadBtn.addEventListener('click', () => {
    folderInput.click();
  });

  vscodeFolderBrowseBtn.addEventListener('click', () => {
    folderInput.click();
  });

  // Handle Directory Folder Upload
  folderInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    // Clear old blob URLs to prevent memory leaks
    Object.values(workspaceFiles).forEach(wf => {
      if (wf.blobUrl) URL.revokeObjectURL(wf.blobUrl);
    });
    
    workspaceFiles = {};
    openTabs = [];
    activeTabFile = null;

    let rootName = "";
    
    // Parse uploaded files list
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      if (!rootName && pathParts.length > 0) {
        rootName = pathParts[0];
      }
      
      const relativePath = pathParts.slice(1).join('/');
      if (!relativePath) continue; // Skip directory entry itself if any
      
      const ext = relativePath.split('.').pop().toLowerCase();
      let blobUrl = null;
      
      // Create blob urls for visual image preview elements
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
        blobUrl = URL.createObjectURL(file);
      }
      
      workspaceFiles[relativePath] = {
        file: file,
        name: file.name,
        path: relativePath,
        blobUrl: blobUrl,
        content: null
      };
    }

    statusFolderText.textContent = rootName;
    vscodeWorkspaceTitle.textContent = rootName.toUpperCase();
    vscodeUploadZone.classList.add('hidden');
    vscodeFileTree.classList.remove('hidden');

    // Build collapsible visual file tree
    buildWorkspaceFileTree();

    // Automatically load the first markdown file
    const mdFiles = Object.keys(workspaceFiles).filter(p => p.endsWith('.md'));
    if (mdFiles.length > 0) {
      // Prefer standard names like README.md, index.md, etc.
      const mainMd = mdFiles.find(p => p.toLowerCase().includes('readme') || p.toLowerCase().includes('index')) || mdFiles[0];
      await openWorkspaceFile(mainMd);
    } else {
      clearWorkspaceEditor();
    }
    
    showToast(`Loaded ${files.length} files from ${rootName}`, 'success');
  });

  // Build File Tree hierarchy
  function buildWorkspaceFileTree() {
    vscodeFileTree.innerHTML = '';

    const tree = {};
    
    // Convert flat list paths to a structured object hierarchy
    Object.keys(workspaceFiles).forEach(path => {
      const parts = path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            isDir: index < parts.length - 1,
            children: {}
          };
        }
        current = current[part].children;
      });
    });

    // Recursive helper to build DOM nodes
    function renderTreeNode(nodeName, nodeObj, container) {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'tree-item';
      
      const headerEl = document.createElement('div');
      headerEl.className = 'tree-node';
      headerEl.setAttribute('data-path', nodeObj.path);

      let iconChevronHtml = '';
      let iconFileHtml = '';
      
      if (nodeObj.isDir) {
        headerEl.classList.add('directory-node');
        iconChevronHtml = `
          <span class="node-chevron expanded">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>`;
        iconFileHtml = `
          <span class="node-icon node-icon-folder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </span>`;
      } else {
        headerEl.classList.add('file-node');
        iconChevronHtml = `<span class="node-chevron"></span>`; // layout buffer
        
        const ext = nodeObj.name.split('.').pop().toLowerCase();
        if (ext === 'md') {
          iconFileHtml = `
            <span class="node-icon node-icon-markdown">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            </span>`;
        } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
          iconFileHtml = `
            <span class="node-icon node-icon-image">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </span>`;
        } else {
          iconFileHtml = `
            <span class="node-icon node-icon-file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
            </span>`;
        }
      }

      headerEl.innerHTML = `${iconChevronHtml}${iconFileHtml}<span>${nodeObj.name}</span>`;
      nodeEl.appendChild(headerEl);

      if (nodeObj.isDir) {
        const childrenEl = document.createElement('div');
        childrenEl.className = 'tree-children';
        
        // Sort folder nodes before file nodes
        const sortedKeys = Object.keys(nodeObj.children).sort((a, b) => {
          const aIsDir = nodeObj.children[a].isDir;
          const bIsDir = nodeObj.children[b].isDir;
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.localeCompare(b);
        });

        sortedKeys.forEach(key => {
          renderTreeNode(key, nodeObj.children[key], childrenEl);
        });
        
        nodeEl.appendChild(childrenEl);

        // Folder Collapse Listener
        headerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const chev = headerEl.querySelector('.node-chevron');
          chev.classList.toggle('expanded');
          childrenEl.classList.toggle('collapsed');
        });
      } else {
        // File Selection Listener
        headerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openWorkspaceFile(nodeObj.path);
        });
      }

      container.appendChild(nodeEl);
    }

    // Sort top level elements
    const rootKeys = Object.keys(tree).sort((a, b) => {
      const aIsDir = tree[a].isDir;
      const bIsDir = tree[b].isDir;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    rootKeys.forEach(key => {
      renderTreeNode(key, tree[key], vscodeFileTree);
    });
  }

  // Open File in Workspace Pane
  async function openWorkspaceFile(path) {
    const fileObj = workspaceFiles[path];
    if (!fileObj) return;

    // Auto-collapse sidebar and reset to editor pane on mobile
    if (window.innerWidth <= 768) {
      vscodeSidebar.classList.add('collapsed');
      activityExplorerBtn.classList.remove('active');
      vscodeSplitPanels.classList.remove('preview-active');
    }

    activeTabFile = path;
    
    if (!openTabs.includes(path)) {
      openTabs.push(path);
    }
    
    renderWorkspaceTabs();
    highlightActiveTreeItem(path);

    const ext = path.split('.').pop().toLowerCase();
    activeFileNameSpan.textContent = fileObj.name;
    statusLanguageText.textContent = ext.toUpperCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      // Render inside image viewer panel
      workspaceEditor.style.display = 'none';
      workspaceLineNumbers.style.display = 'none';
      workspaceImageViewer.classList.remove('hidden');
      workspaceImageSrc.src = fileObj.blobUrl;
      workspaceImageMeta.textContent = `${fileObj.name} (${formatBytes(fileObj.file.size)})`;
    } else {
      // Render inside code text editor panel
      workspaceImageViewer.classList.add('hidden');
      workspaceEditor.style.display = 'block';
      workspaceLineNumbers.style.display = 'block';

      // Load text content from file lazily if not cached
      if (fileObj.content === null) {
        try {
          fileObj.content = await readAsTextPromise(fileObj.file);
        } catch (err) {
          console.error('Failed to read file:', err);
          showToast('Failed to open file text content.', 'danger');
          fileObj.content = '';
        }
      }
      
      workspaceEditor.value = fileObj.content;
      updateWorkspaceLineNumbers();
      renderWorkspaceMarkdown();
    }
  }

  function highlightActiveTreeItem(path) {
    document.querySelectorAll('#vscodeFileTree .tree-node').forEach(node => {
      if (node.getAttribute('data-path') === path) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  }

  function readAsTextPromise(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // Render workspace tabs
  function renderWorkspaceTabs() {
    vscodeTabs.innerHTML = '';
    
    if (openTabs.length === 0) {
      vscodeTabs.innerHTML = '<div class="empty-tabs-placeholder">No Files Open</div>';
      return;
    }

    openTabs.forEach(path => {
      const fileObj = workspaceFiles[path];
      if (!fileObj) return;
      
      const tab = document.createElement('div');
      tab.className = 'vscode-tab';
      if (path === activeTabFile) {
        tab.classList.add('active');
      }
      
      const label = document.createElement('span');
      label.textContent = fileObj.name;
      tab.appendChild(label);

      const close = document.createElement('span');
      close.className = 'tab-close';
      close.innerHTML = '&times;';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWorkspaceTab(path);
      });
      tab.appendChild(close);

      tab.addEventListener('click', () => {
        openWorkspaceFile(path);
      });

      vscodeTabs.appendChild(tab);
    });
  }

  async function closeWorkspaceTab(path) {
    const idx = openTabs.indexOf(path);
    if (idx === -1) return;

    openTabs.splice(idx, 1);

    if (activeTabFile === path) {
      if (openTabs.length > 0) {
        const nextActive = openTabs[Math.max(0, idx - 1)];
        await openWorkspaceFile(nextActive);
      } else {
        clearWorkspaceEditor();
      }
    } else {
      renderWorkspaceTabs();
    }
  }

  function clearWorkspaceEditor() {
    activeTabFile = null;
    activeFileNameSpan.textContent = 'editor.md';
    workspaceEditor.value = '';
    workspaceEditor.style.display = 'block';
    workspaceLineNumbers.style.display = 'block';
    workspaceImageViewer.classList.add('hidden');
    statusLanguageText.textContent = 'PLAIN TEXT';
    
    updateWorkspaceLineNumbers();
    renderWorkspaceMarkdown();
    renderWorkspaceTabs();
    highlightActiveTreeItem(null);
  }

  // Render markdown inside workspace preview pane with relative image path resolution
  function renderWorkspaceMarkdown() {
    const textContent = workspaceEditor.value;

    if (!textContent) {
      workspacePreview.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <h3>Nothing to preview</h3>
          <p>Select a Markdown file from explorer or edit here.</p>
        </div>
      `;
      return;
    }

    try {
      // Retrieve current global Marked renderer configuration
      const defaultRenderer = marked.defaults.renderer || new marked.Renderer();
      
      // Set custom image parser for the workspace preview
      const workspaceRenderer = new marked.Renderer();
      workspaceRenderer.image = function(hrefOrObj, title, text) {
        let href = hrefOrObj;
        if (hrefOrObj && typeof hrefOrObj === 'object') {
          href = hrefOrObj.href;
          title = hrefOrObj.title;
          text = hrefOrObj.text;
        }

        if (!href) return '';
        
        // Normalize leading dots/slashes
        const normalizedHref = href.replace(/^\.\//, '').trim();
        
        let resolvedUrl = href;
        const matchingFileObj = workspaceFiles[normalizedHref];
        
        if (matchingFileObj && matchingFileObj.blobUrl) {
          resolvedUrl = matchingFileObj.blobUrl;
        } else {
          // Fallback fuzzy search matching endings (to catch media/img.png or img.png variants)
          const matchedPath = Object.keys(workspaceFiles).find(filePath => {
            return filePath.endsWith(normalizedHref) || normalizedHref.endsWith(filePath);
          });
          
          if (matchedPath && workspaceFiles[matchedPath].blobUrl) {
            resolvedUrl = workspaceFiles[matchedPath].blobUrl;
          }
        }
        
        return `<img src="${resolvedUrl}" alt="${text || ''}" title="${title || ''}">`;
      };

      marked.setOptions({
        renderer: workspaceRenderer,
        breaks: true,
        gfm: true
      });

      workspacePreview.innerHTML = marked.parse(textContent);

      // Restore the default renderer immediately
      marked.setOptions({
        renderer: defaultRenderer
      });

    } catch (err) {
      console.error('Workspace marked parsing exception:', err);
      workspacePreview.innerHTML = `<div style="color: var(--danger-color)">Error compiling markdown preview.</div>`;
    }
  }

  // Line numbering generator
  function updateWorkspaceLineNumbers() {
    const text = workspaceEditor.value;
    const lines = text.split('\n');
    const totalLines = Math.max(1, lines.length);
    let html = '';
    for (let i = 1; i <= totalLines; i++) {
      html += `<div>${i}</div>`;
    }
    workspaceLineNumbers.innerHTML = html;
  }

  // Workspace editor input change trigger
  workspaceEditor.addEventListener('input', () => {
    updateWorkspaceLineNumbers();
    renderWorkspaceMarkdown();
    
    // Sync contents to file state cache
    if (activeTabFile && workspaceFiles[activeTabFile]) {
      workspaceFiles[activeTabFile].content = workspaceEditor.value;
    }
  });

  // Scroll Sync inside VS Code Editor Pane
  let workspaceScrollingEditor = false;
  let workspaceScrollingPreview = false;

  workspaceEditor.addEventListener('scroll', () => {
    workspaceLineNumbers.scrollTop = workspaceEditor.scrollTop;
    
    if (workspaceMode && !workspaceScrollingPreview) {
      workspaceScrollingEditor = true;
      const editorScrollHeight = workspaceEditor.scrollHeight - workspaceEditor.clientHeight;
      if (editorScrollHeight > 0) {
        const scrollPct = workspaceEditor.scrollTop / editorScrollHeight;
        workspacePreview.scrollTop = scrollPct * (workspacePreview.scrollHeight - workspacePreview.clientHeight);
      }
      setTimeout(() => { workspaceScrollingEditor = false; }, 50);
    }
  });

  workspacePreview.addEventListener('scroll', () => {
    if (workspaceMode && !workspaceScrollingEditor) {
      workspaceScrollingPreview = true;
      const previewScrollHeight = workspacePreview.scrollHeight - workspacePreview.clientHeight;
      if (previewScrollHeight > 0) {
        const scrollPct = workspacePreview.scrollTop / previewScrollHeight;
        workspaceEditor.scrollTop = scrollPct * (workspaceEditor.scrollHeight - workspaceEditor.clientHeight);
        workspaceLineNumbers.scrollTop = workspaceEditor.scrollTop;
      }
      setTimeout(() => { workspaceScrollingPreview = false; }, 50);
    }
  });

  // Mobile Panel Toggles (Editor vs Preview)
  const vscodeMobilePreviewBtn = document.getElementById('vscodeMobilePreviewBtn');
  const vscodeMobileEditorBtn = document.getElementById('vscodeMobileEditorBtn');
  
  vscodeMobilePreviewBtn.addEventListener('click', () => {
    vscodeSplitPanels.classList.add('preview-active');
  });

  vscodeMobileEditorBtn.addEventListener('click', () => {
    vscodeSplitPanels.classList.remove('preview-active');
  });

  // --- Resizable Panels Divider Logic (Splitter) ---
  const vscodeResizer = document.getElementById('vscodeResizer');
  let isResizing = false;

  vscodeResizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    vscodeResizer.classList.add('resizing');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const containerRect = vscodeSplitPanels.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    let percentage = (relativeX / containerRect.width) * 100;

    // Constrain split between 15% and 85%
    percentage = Math.max(15, Math.min(85, percentage));
    vscodeSplitPanels.style.gridTemplateColumns = `${percentage}% 4px 1fr`;
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      vscodeResizer.classList.remove('resizing');
    }
  });

  // Touch Events support
  vscodeResizer.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      isResizing = true;
      vscodeResizer.classList.add('resizing');
    }
  });

  document.addEventListener('touchmove', (e) => {
    if (!isResizing || e.touches.length === 0) return;

    const containerRect = vscodeSplitPanels.getBoundingClientRect();
    const relativeX = e.touches[0].clientX - containerRect.left;
    let percentage = (relativeX / containerRect.width) * 100;

    percentage = Math.max(15, Math.min(85, percentage));
    vscodeSplitPanels.style.gridTemplateColumns = `${percentage}% 4px 1fr`;
  });

  document.addEventListener('touchend', () => {
    if (isResizing) {
      isResizing = false;
      vscodeResizer.classList.remove('resizing');
    }
  });
});

