/**
 * Main JavaScript file for file upload functionality sign.codevn.net
 * Handles drag & drop uploads for IPA, P12 and mobileprovision files
 */

document.addEventListener('DOMContentLoaded', function() {
  // Configuration (would typically come from server)
  const jsonConfig = {
    max_upload_size: 2048 * 1024 * 1024, // Example: 100MB
    max_upload_size_name: '2048MB'
  };

  // Initialize UI components
  initializeFileInputs();
  initializeUploadForm();
  initializeDragDropZones();
  setupProgressObserver();

  /**
   * Initialize file input handling
   */
  function initializeFileInputs() {
    // Set up all file inputs with validation
    const fileInputs = document.querySelectorAll('.custom-file-input');
    fileInputs.forEach(input => {
      input.addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name;
        if (!fileName) return;
        
        const allowedExtensions = /(\.ipa|\.p12|\.mobileprovision)$/i;
        if (!allowedExtensions.exec(fileName)) {
          showErrorModal('Vui lòng chọn đúng loại file hỗ trợ');
          e.target.value = '';
          return false;
        }
        
        // Display selected filename
        const nextSibling = e.target.nextElementSibling;
        if (nextSibling) {
          nextSibling.innerText = fileName;
        }
      });
    });

    // Set up specific file inputs
    setupSpecificFileInput('ipa', function(file) {
      $('.btn_upload').prop('disabled', false);
      $('#error').hide();
      
      if (file.size > jsonConfig.max_upload_size) {
        $('.btn_upload').prop('disabled', true);
        $('#error').html("<strong>Lỗi!</strong> Kích thước tệp tin vượt quá giới hạn cho phép. Vui lòng tải lên tệp tin nhỏ hơn " + jsonConfig.max_upload_size_name).show();
      }
    });
    setupSpecificFileInput('p12');
    setupSpecificFileInput('mobileprovision');
  }

  /**
   * Set up file input with basic handlers
   */
  function setupSpecificFileInput(inputId, callback) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const label = document.querySelector(`[for=${inputId}] .form-file-text`);
    if (!label) return;
    
    input.addEventListener('change', function(e) {
      if (this.files.length > 0) {
        const file = this.files[0];
        label.innerText = file.name;
        
        if (typeof callback === 'function') {
          callback(file);
        }
      }
    });
  }

  /**
   * Initialize the Ajax form for file upload
   */
  function initializeUploadForm() {
    const bar = $('.progress-bar');
    const percent = $('.progress-bar');
    const status = $('#status');

    $('form').ajaxForm({
      beforeSend: function() {
        $('.progress').show();
        status.empty();
        const percentVal = '0%';
        bar.width(percentVal);
        percent.html(percentVal);
      },
      uploadProgress: function(event, position, total, percentComplete) {
        const percentVal = percentComplete + '%';
        bar.width(percentVal);
        percent.html(percentVal);
        
        if (percentComplete === 100) {
          percent.html('Hệ thống đang xử lý, vui lòng chờ...');
        }
      },
      complete: function(xhr) {
        $('.progress').hide();
        status.show();
        status.html(xhr.responseText);
      }
    });
  }

  /**
   * Set up observer for progress bar to disable upload button when uploading
   */
  function setupProgressObserver() {
    const progressBar = document.getElementById('progressBar');
    const uploadButton = document.getElementById('uploadButton');
    
    if (!progressBar || !uploadButton) return;

    const observer = new MutationObserver(function() {
      const isProgressBarVisible = getComputedStyle(progressBar).display !== 'none';
      uploadButton.disabled = isProgressBarVisible;
    });

    observer.observe(progressBar, { attributes: true, attributeFilter: ['style'] });
  }

  /**
   * Initialize drag & drop zones for all file types
   */
  function initializeDragDropZones() {
    // Create main IPA drag drop zone
    createIpaDragDropZone();
    
    // Setup drag & drop for additional file inputs
    setupDragDropForInput('p12', '.p12');
    setupDragDropForInput('mobileprovision', '.mobileprovision');
    
    // Setup radio button listeners for upload type selection
    setupRadioListeners();
  }

  /**
   * Create enhanced drag & drop zone for IPA file
   */
  function createIpaDragDropZone() {
    const fileUploadRow = document.getElementById('ipa')?.closest('.row');
    if (!fileUploadRow) return;
    
    const dragDropZone = document.createElement('div');
    dragDropZone.className = 'drag-drop-zone';
    dragDropZone.innerHTML = `
      <div class="file-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
        </svg>
      </div>
      <p>Kéo thả file .ipa vào đây hoặc nhấp để chọn file .ipa</p>
      <input type="file" accept=".ipa" id="dragDropInput">
    `;
    
    // Hide original file input row
    fileUploadRow.style.display = 'none';
    
    // Insert drag drop zone before the original file input
    fileUploadRow.parentNode.insertBefore(dragDropZone, fileUploadRow);
    
    // Add event handlers
    dragDropZone.addEventListener('dragover', handleDragOver);
    dragDropZone.addEventListener('dragleave', handleDragLeave);
    dragDropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('active');
      this.style.backgroundColor = '';
      this.style.borderColor = '';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleIpaFileSelect(files[0]);
      }
    });
    
    // Set up file input within drag drop zone
    const dragDropInput = dragDropZone.querySelector('#dragDropInput');
    dragDropInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        handleIpaFileSelect(this.files[0]);
      }
    });
    
    // Add click handler for the zone
    dragDropZone.addEventListener('click', function(e) {
      if (e.target === dragDropZone || e.target.closest('.file-icon') || 
          (e.target.tagName === 'P' && !e.target.classList.contains('text-muted'))) {
        dragDropInput.click();
      }
    });
    
    // Sync with original input
    syncOriginalIpaInput();
    
    return dragDropZone;
  }

  /**
   * Setup drag & drop functionality for a specific input
   */
  function setupDragDropForInput(inputId, fileExtension) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const label = input.nextElementSibling;
    if (!label) return;
    
    const fileText = label.querySelector('.form-file-text');
    
    // Add drag & drop event listeners
    label.addEventListener('dragover', handleDragOver);
    label.addEventListener('dragleave', handleDragLeave);
    label.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.style.backgroundColor = '';
      this.style.borderColor = '';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const fileName = file.name;
        const fileExt = '.' + fileName.split('.').pop().toLowerCase();
        
        if (fileExt === fileExtension) {
          // Update input with the dropped file
          updateInputWithFile(input, file);
          
          // Update display text
          if (fileText) {
            fileText.innerText = fileName;
          }
        } else {
          showErrorModal(`Vui lòng chỉ chọn file có định dạng ${fileExtension}`);
        }
      }
    });
    
    // Add visual styling
    label.style.transition = 'all 0.3s';
    label.style.cursor = 'pointer';
  }

  /**
   * Sync the original IPA input with the drag & drop zone
   */
  function syncOriginalIpaInput() {
    const ipaInput = document.getElementById('ipa');
    if (!ipaInput) return;
    
    ipaInput.addEventListener('change', function() {
      if (this.files.length > 0 && 
          document.getElementById('uploadipa')?.checked) {
        updateDragDropZone(this.files[0].name, this.files[0].size);
      }
    });
  }

  /**
   * Set up radio button listeners for upload type selection
   */
  function setupRadioListeners() {
    const radioButtons = document.querySelectorAll('input[name="sellect"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', toggleDragDropZone);
    });
  }

  /**
   * Toggle drag & drop zone visibility based on radio selection
   */
  function toggleDragDropZone() {
    const uploadIpaRadio = document.getElementById('uploadipa');
    const dragDropZone = document.querySelector('.drag-drop-zone');
    const fileUploadRow = document.getElementById('ipa')?.closest('.row');
    
    if (!uploadIpaRadio || !dragDropZone || !fileUploadRow) return;
    
    if (uploadIpaRadio.checked) {
      dragDropZone.style.display = 'block';
      fileUploadRow.style.display = 'none';
    } else {
      dragDropZone.style.display = 'none';
      fileUploadRow.style.display = 'flex';
    }
  }

  /**
   * Handle the dragover event for drag & drop zones
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('active');
    this.style.backgroundColor = 'rgba(23, 162, 184, 0.1)';
    this.style.borderColor = '#17a2b8';
  }

  /**
   * Handle the dragleave event for drag & drop zones
   */
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('active');
    this.style.backgroundColor = '';
    this.style.borderColor = '';
  }

  /**
   * Handle IPA file selection from drag & drop or file input
   */
  function handleIpaFileSelect(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (fileExtension === 'ipa') {
      // Update the original input
      const ipaInput = document.getElementById('ipa');
      if (ipaInput) {
        updateInputWithFile(ipaInput, file);
      }
      
      // Update the drag & drop zone UI
      updateDragDropZone(fileName, file.size);
    } else {
      showErrorModal('Vui lòng chỉ chọn file có định dạng .ipa');
    }
  }

  /**
   * Update the drag & drop zone UI after file selection
   */
  function updateDragDropZone(fileName, fileSize) {
    const dragDropZone = document.querySelector('.drag-drop-zone');
    if (!dragDropZone) return;
    
    const formattedSize = formatFileSize(fileSize);
    
    // Update content
    dragDropZone.innerHTML = `
      <div class="file-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
          <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
          <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
        </svg>
      </div>
      <p class="file-name">${fileName}</p>
      <p>${formattedSize}</p>
      <p class="text-muted change-file">Nhấp vào đây để chọn file khác</p>
      <input type="file" accept=".ipa" id="dragDropInput">
    `;
    
    // Add has-file class
    dragDropZone.classList.add('has-file');
    
    // Re-add event handlers
    dragDropZone.addEventListener('dragover', handleDragOver);
    dragDropZone.addEventListener('dragleave', handleDragLeave);
    dragDropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('active');
      this.style.backgroundColor = '';
      this.style.borderColor = '';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleIpaFileSelect(files[0]);
      }
    });
    
    // Set up the new file input
    const newDragDropInput = dragDropZone.querySelector('#dragDropInput');
    newDragDropInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        handleIpaFileSelect(this.files[0]);
      }
    });
    
    // Add click handler for "change file" text
    const changeFileElement = dragDropZone.querySelector('.change-file');
    if (changeFileElement) {
      changeFileElement.style.cursor = 'pointer';
      changeFileElement.addEventListener('click', function(e) {
        e.stopPropagation();
        newDragDropInput.click();
      });
    }
    
    // Remove click handler from the whole zone
    dragDropZone.onclick = null;
  }

  /**
   * Update an input element with a file
   */
  function updateInputWithFile(input, file) {
    // Create a DataTransfer object to set the file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    
    // Trigger change event
    const event = new Event('change');
    input.dispatchEvent(event);
  }

  /**
   * Show error modal with custom message
   */
  function showErrorModal(message) {
    const modalMessage = document.getElementById('modalMessage');
    if (modalMessage) {
      modalMessage.innerText = message;
    }
    
    // Use Bootstrap modal if available, otherwise fall back to alert
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
      errorModal.show();
    } else {
      alert(message);
    }
  }

  /**
   * Format file size to human-readable format
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Add CSS for drag & drop zones
   */
  function addDragDropStyles() {
    const dragDropCSS = document.createElement('style');
    dragDropCSS.innerHTML = `
      .drag-drop-zone {
        border: 2px dashed #dc3545;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
        margin-bottom: 15px;
        transition: all 0.3s;
        background-color: #fff;
        cursor: pointer;
        position: relative;
      }
      .drag-drop-zone.active {
        border-color: #17a2b8;
        background-color: rgba(23, 162, 184, 0.1);
      }
      .drag-drop-zone p {
        margin: 0;
        font-size: 16px;
      }
      .drag-drop-zone.has-file {
        background-color: rgba(40, 167, 69, 0.1);
        border-color: #28a745;
      }
      .drag-drop-zone .file-name {
        font-weight: bold;
        margin-top: 5px;
        word-break: break-word;
      }
      .drag-drop-zone .file-icon {
        font-size: 24px;
        margin-bottom: 10px;
        color: #17a2b8;
      }
      .drag-drop-zone.has-file .file-icon {
        color: #28a745;
      }
      .drag-drop-zone input[type="file"] {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: -1;
      }
    `;
    document.head.appendChild(dragDropCSS);
  }

  // Add CSS styles for drag & drop
  addDragDropStyles();
});