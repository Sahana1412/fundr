// ==================================================
// FUNDR CREATOR DASHBOARD SCRIPTS
// ==================================================

let editMode = false;
let editId = null;
let deleteId = null;
let deleteModalObj = null;

// Track selected files in memory
let filesToUpload = {
  profileImage: null,
  qrImage: null,
  governmentId: null
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize bootstrap modal
  const delModalEl = document.getElementById('deleteModal');
  if (delModalEl) {
    deleteModalObj = new bootstrap.Modal(delModalEl);
  }

  // 2. Load Creator's campaigns
  loadUserCampaigns();

  // 3. Initialize File drag-and-drop slots
  initFileUploads();

  // 4. Form Submit handler
  initFormSubmit();

  // 5. Handle direct Create action parameter (?action=create)
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'create') {
    const tabTrigger = new bootstrap.Tab(document.getElementById('form-tab'));
    tabTrigger.show();
  }

  // 6. Bind cancel edit button
  document.getElementById('cancel-edit-btn').addEventListener('click', resetFormState);

  // 7. Bind confirm delete button
  document.getElementById('confirm-delete-btn').addEventListener('click', deleteCampaignAction);
});

// Get user campaigns list from localStorage mappings
function getStoredCampaigns() {
  return JSON.parse(localStorage.getItem('fundr_my_campaigns') || '{}');
}

// Fetch details for all campaigns created by this user
async function loadUserCampaigns() {
  const container = document.getElementById('user-campaigns-container');
  if (!container) return;

  const myCampaigns = getStoredCampaigns();
  const campaignIds = Object.keys(myCampaigns);

  // Reset counters
  document.getElementById('user-total-campaigns-stat').innerText = '0';
  document.getElementById('user-total-raised-stat').innerText = formatCurrency(0);

  if (campaignIds.length === 0) {
    renderDashboardEmptyState(container);
    return;
  }

  container.innerHTML = '';
  let campaignsFetchedCount = 0;
  let totalRaisedAccumulator = 0;

  for (const id of campaignIds) {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`);
      const result = await res.json();

      if (result.success && result.data) {
        const campaign = result.data;
        container.appendChild(createUserCampaignCard(campaign));
        
        campaignsFetchedCount++;
        totalRaisedAccumulator += campaign.fundsRaised;
      } else {
        // If campaign was deleted from server database, remove it from localStorage
        removeCampaignFromLocalStorage(id);
      }
    } catch (err) {
      console.error(`Failed to fetch user campaign ${id}:`, err);
    }
  }

  // Update stats
  document.getElementById('user-total-campaigns-stat').innerText = campaignsFetchedCount;
  document.getElementById('user-total-raised-stat').innerText = formatCurrency(totalRaisedAccumulator);

  if (campaignsFetchedCount === 0) {
    renderDashboardEmptyState(container);
  }
}

// Build list cards for dashboard
function createUserCampaignCard(campaign) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  
  const percentage = campaign.percentageCompleted || 0;
  const imageUrl = campaign.profileImage.startsWith('http') 
    ? campaign.profileImage 
    : `${window.location.origin}/${campaign.profileImage}`;

  col.innerHTML = `
    <div class="card-custom h-100 d-flex flex-column">
      <div class="position-relative">
        <img src="${imageUrl}" class="campaign-card-img" style="height: 180px;" alt="${campaign.title}" onerror="this.src='https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop'">
        <span class="position-absolute top-0 end-0 m-3 category-badge cat-${campaign.category.replace(' ', '-')}">${campaign.category}</span>
        <span class="position-absolute top-0 start-0 m-3 badge rounded-pill bg-dark bg-opacity-75 text-white">${campaign.status}</span>
      </div>
      <div class="p-4 d-flex flex-column flex-grow-1">
        <h5 class="fw-bold text-main mb-2 line-clamp-2">${campaign.title}</h5>
        
        <div class="mb-3 mt-2">
          <div class="d-flex justify-content-between text-muted small mb-1">
            <span>Raised: <strong>${formatCurrency(campaign.fundsRaised)}</strong></span>
            <span>Goal: <strong>${formatCurrency(campaign.targetAmount)}</strong></span>
          </div>
          <div class="progress-container">
            <div class="progress-bar-custom" style="width: ${percentage}%"></div>
          </div>
        </div>
        
        <div class="d-flex gap-2 mt-auto pt-3 border-top border-color">
          <a href="campaign.html?id=${campaign._id}" class="btn btn-outline-custom btn-sm flex-grow-1 py-2">
            <i class="bi bi-eye"></i> View
          </a>
          <button type="button" class="btn btn-primary-custom btn-sm flex-grow-1 py-2" onclick="triggerEditCampaign('${campaign._id}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button type="button" class="btn btn-danger btn-sm px-3" onclick="triggerDeleteCampaign('${campaign._id}')" title="Delete Campaign">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  return col;
}

// Empty state layout for dashboard
function renderDashboardEmptyState(container) {
  container.innerHTML = `
    <div class="col-12">
      <div class="empty-state py-5 shadow-sm">
        <div class="empty-state-icon text-muted"><i class="bi bi-grid"></i></div>
        <h3>No Campaigns Created Yet</h3>
        <p class="text-muted max-width-500 mx-auto mb-4">You have not created any fundraising campaigns in this browser session. Start one now to make an impact!</p>
        <button class="btn btn-primary-custom" onclick="openCreateTab()"><i class="bi bi-plus-circle me-1"></i> Start a Campaign</button>
      </div>
    </div>
  `;
}

function openCreateTab() {
  const tabTrigger = new bootstrap.Tab(document.getElementById('form-tab'));
  tabTrigger.show();
}

function removeCampaignFromLocalStorage(id) {
  const myCampaigns = getStoredCampaigns();
  delete myCampaigns[id];
  localStorage.setItem('fundr_my_campaigns', JSON.stringify(myCampaigns));
}

// Bind drag and drop file slot actions
function initFileUploads() {
  setupFileDropSlot('drag-profile-img', 'file-profile-img', 'preview-profile-img', 'profileImage');
  setupFileDropSlot('drag-qr-img', 'file-qr-img', 'preview-qr-img', 'qrImage');
  setupFileDropSlot('drag-id-img', 'file-id-img', 'preview-id-img', 'governmentId');
}

function setupFileDropSlot(dragId, fileInputId, previewId, fieldKey) {
  const dropZone = document.getElementById(dragId);
  const fileInput = document.getElementById(fileInputId);
  const preview = document.getElementById(previewId);
  const errorEl = document.getElementById(`error-${fieldKey === 'profileImage' ? 'profile-img' : fieldKey === 'qrImage' ? 'qr-img' : 'id-img'}`);

  if (!dropZone || !fileInput) return;

  // Click handler to trigger hidden file selector
  dropZone.addEventListener('click', () => fileInput.click());

  // Drag over states
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0], fileInput, preview, errorEl, fieldKey);
    }
  });

  // Handle manual selection
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0], fileInput, preview, errorEl, fieldKey);
    }
  });
}

// File type and size validations
function handleFileSelected(file, fileInput, preview, errorEl, fieldKey) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxBytes = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(file.type)) {
    showFileError(errorEl, 'Only image files (JPG, JPEG, PNG) are allowed!');
    fileInput.value = '';
    preview.classList.add('d-none');
    filesToUpload[fieldKey] = null;
    return;
  }

  if (file.size > maxBytes) {
    showFileError(errorEl, 'File is too large! Maximum limit is 2MB.');
    fileInput.value = '';
    preview.classList.add('d-none');
    filesToUpload[fieldKey] = null;
    return;
  }

  // Clear errors
  if (errorEl) {
    errorEl.classList.add('d-none');
    errorEl.classList.remove('d-block');
  }

  // Set file details
  filesToUpload[fieldKey] = file;

  // Show preview
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('d-none');
}

function showFileError(errorEl, text) {
  if (errorEl) {
    errorEl.innerText = text;
    errorEl.classList.remove('d-none');
    errorEl.classList.add('d-block');
  }
  showToast('Upload Error', text, 'error');
}

// Client side inputs validators
function validateFormInputs() {
  let isValid = true;

  // Full Name
  const nameInput = document.getElementById('input-name');
  if (nameInput.value.trim().length < 3) {
    nameInput.classList.add('is-invalid');
    isValid = false;
  } else {
    nameInput.classList.remove('is-invalid');
  }

  // Email
  const emailInput = document.getElementById('input-email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    emailInput.classList.add('is-invalid');
    isValid = false;
  } else {
    emailInput.classList.remove('is-invalid');
  }

  // Phone
  const phoneInput = document.getElementById('input-phone');
  // Indian phone regex: matches 10 digits starting with 6-9, optionally prefixed by +91 or 91 or 0
  const phoneRegex = /^(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}$/;
  if (!phoneRegex.test(phoneInput.value.trim())) {
    phoneInput.classList.add('is-invalid');
    isValid = false;
  } else {
    phoneInput.classList.remove('is-invalid');
  }

  // Location
  const locInput = document.getElementById('input-location');
  if (locInput.value.trim().length === 0) {
    locInput.classList.add('is-invalid');
    isValid = false;
  } else {
    locInput.classList.remove('is-invalid');
  }

  // Title
  const titleInput = document.getElementById('input-title');
  if (titleInput.value.trim().length < 3) {
    titleInput.classList.add('is-invalid');
    isValid = false;
  } else {
    titleInput.classList.remove('is-invalid');
  }

  // Category
  const catSelect = document.getElementById('input-category');
  if (catSelect.value === '') {
    catSelect.classList.add('is-invalid');
    isValid = false;
  } else {
    catSelect.classList.remove('is-invalid');
  }

  // Goal
  const targetInput = document.getElementById('input-target');
  const goalVal = parseFloat(targetInput.value);
  if (isNaN(goalVal) || goalVal <= 0) {
    targetInput.classList.add('is-invalid');
    isValid = false;
  } else {
    targetInput.classList.remove('is-invalid');
  }

  // Description
  const descText = document.getElementById('input-desc');
  if (descText.value.trim().length < 30) {
    descText.classList.add('is-invalid');
    isValid = false;
  } else {
    descText.classList.remove('is-invalid');
  }

  // UPI ID format check if entered
  const upiInput = document.getElementById('input-upi');
  if (upiInput.value.trim().length > 0) {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiInput.value.trim())) {
      upiInput.classList.add('is-invalid');
      isValid = false;
    } else {
      upiInput.classList.remove('is-invalid');
    }
  } else {
    upiInput.classList.remove('is-invalid');
  }

  // Profile Image validation (only required during Creation)
  const profileError = document.getElementById('error-profile-img');
  if (!editMode && !filesToUpload.profileImage) {
    profileError.classList.remove('d-none');
    profileError.classList.add('d-block');
    isValid = false;
  } else {
    profileError.classList.add('d-none');
    profileError.classList.remove('d-block');
  }

  // Terms Checkbox
  const termsCheck = document.getElementById('confirm-terms');
  if (!termsCheck.checked) {
    termsCheck.classList.add('is-invalid');
    isValid = false;
  } else {
    termsCheck.classList.remove('is-invalid');
  }

  return isValid;
}

// Form submit action (Create & Edit handler)
function initFormSubmit() {
  const form = document.getElementById('campaign-form');
  if (!form) return;

  const submitBtn = document.getElementById('submit-form-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Run client verification
    if (!validateFormInputs()) {
      showToast('Validation Error', 'Please check highlighted fields and try again.', 'error');
      // Scroll to first invalid field
      const firstInvalid = document.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Set UI to loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...`;

    // Package FormData
    const formData = new FormData();
    formData.append('name', document.getElementById('input-name').value.trim());
    formData.append('email', document.getElementById('input-email').value.trim());
    formData.append('phone', document.getElementById('input-phone').value.trim());
    formData.append('location', document.getElementById('input-location').value.trim());
    formData.append('title', document.getElementById('input-title').value.trim());
    formData.append('category', document.getElementById('input-category').value);
    formData.append('targetAmount', document.getElementById('input-target').value);
    formData.append('description', document.getElementById('input-desc').value.trim());
    formData.append('upiId', document.getElementById('input-upi').value.trim());

    // Append files if selected
    if (filesToUpload.profileImage) {
      formData.append('profileImage', filesToUpload.profileImage);
    }
    if (filesToUpload.qrImage) {
      formData.append('qrImage', filesToUpload.qrImage);
    }
    if (filesToUpload.governmentId) {
      formData.append('governmentId', filesToUpload.governmentId);
    }

    try {
      let url = `${API_BASE}/campaigns`;
      let method = 'POST';
      let headers = {};

      if (editMode) {
        url = `${API_BASE}/campaigns/${editId}`;
        method = 'PUT';
        // Get the token associated with this campaign
        const storedTokens = getStoredCampaigns();
        const campaignToken = storedTokens[editId];
        
        if (!campaignToken) {
          showToast('Authorization Error', 'You do not own the token to modify this campaign.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Save Changes <i class="bi bi-cloud-arrow-up ms-2"></i>`;
          return;
        }
        headers['X-Creator-Token'] = campaignToken;
      }

      const res = await fetch(url, {
        method: method,
        headers: headers,
        body: formData
      });

      const result = await res.json();
      
      submitBtn.disabled = false;

      if (result.success) {
        if (!editMode) {
          // Save campaign mapping with unique creator token in local storage
          const stored = getStoredCampaigns();
          stored[result.data._id] = result.creatorToken;
          localStorage.setItem('fundr_my_campaigns', JSON.stringify(stored));
          showToast('Success!', 'Campaign published successfully!', 'success');
        } else {
          showToast('Success!', 'Campaign updated successfully!', 'success');
        }

        // Reset
        resetFormState();

        // Switch to listing tab and refresh
        const tabTrigger = new bootstrap.Tab(document.getElementById('campaigns-tab'));
        tabTrigger.show();
        loadUserCampaigns();
      } else {
        showToast('Submission Failed', result.message || 'Error occurred.', 'error');
      }
    } catch (error) {
      console.error('Error submitting campaign form:', error);
      submitBtn.disabled = false;
      if (editMode) {
        submitBtn.innerHTML = `Save Changes <i class="bi bi-cloud-arrow-up ms-2"></i>`;
      } else {
        submitBtn.innerHTML = `Publish Campaign <i class="bi bi-cloud-arrow-up ms-2"></i>`;
      }
      showToast('Network Error', 'Failed to communicate with server.', 'error');
    }
  });
}

// Populates form inputs for edit mode
window.triggerEditCampaign = async function(id) {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${id}`);
    const result = await res.json();

    if (!result.success || !result.data) {
      showToast('Error', 'Could not load campaign data.', 'error');
      return;
    }

    const campaign = result.data;
    
    // Switch to edit mode
    editMode = true;
    editId = id;

    // Change Header title
    document.getElementById('form-header-title').innerText = 'Edit Campaign Details';
    document.getElementById('cancel-edit-btn').classList.remove('d-none');
    
    const submitBtn = document.getElementById('submit-form-btn');
    submitBtn.innerHTML = `Save Changes <i class="bi bi-cloud-arrow-up ms-2"></i>`;

    // Populate inputs
    document.getElementById('input-name').value = campaign.name;
    document.getElementById('input-email').value = campaign.email;
    document.getElementById('input-phone').value = campaign.phone;
    document.getElementById('input-location').value = campaign.location;
    document.getElementById('input-title').value = campaign.title;
    document.getElementById('input-category').value = campaign.category;
    document.getElementById('input-target').value = campaign.targetAmount;
    document.getElementById('input-desc').value = campaign.description;
    document.getElementById('input-upi').value = campaign.upiId || '';
    document.getElementById('confirm-terms').checked = true;

    // Show existing files previews
    showEditPreview('preview-profile-img', campaign.profileImage);
    showEditPreview('preview-qr-img', campaign.qrImage);
    showEditPreview('preview-id-img', campaign.governmentId);

    // Switch tab to form view
    const tabTrigger = new bootstrap.Tab(document.getElementById('form-tab'));
    tabTrigger.show();

    // Scroll to form header
    document.getElementById('form-header-title').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error('Error fetching campaign for editing:', err);
    showToast('Network Error', 'Failed to fetch details.', 'error');
  }
};

function showEditPreview(previewId, serverPath) {
  const el = document.getElementById(previewId);
  if (serverPath) {
    el.src = `${window.location.origin}/${serverPath}`;
    el.classList.remove('d-none');
  } else {
    el.classList.add('d-none');
    el.src = '';
  }
}

// Reset form and cancel edit
function resetFormState() {
  editMode = false;
  editId = null;

  // Reset header & buttons
  document.getElementById('form-header-title').innerText = 'Start a New Campaign';
  document.getElementById('cancel-edit-btn').classList.add('d-none');
  
  const submitBtn = document.getElementById('submit-form-btn');
  submitBtn.disabled = false;
  submitBtn.innerHTML = `Publish Campaign <i class="bi bi-cloud-arrow-up ms-2"></i>`;

  // Clear inputs
  document.getElementById('campaign-form').reset();
  
  // Clear files array
  filesToUpload = {
    profileImage: null,
    qrImage: null,
    governmentId: null
  };

  // Hide previews
  document.getElementById('preview-profile-img').classList.add('d-none');
  document.getElementById('preview-qr-img').classList.add('d-none');
  document.getElementById('preview-id-img').classList.add('d-none');

  // Remove validation feedback overrides
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// Trigger delete prompt modal
window.triggerDeleteCampaign = function(id) {
  deleteId = id;
  if (deleteModalObj) {
    deleteModalObj.show();
  }
};

// Send Delete call
async function deleteCampaignAction() {
  if (!deleteId) return;

  const storedTokens = getStoredCampaigns();
  const token = storedTokens[deleteId];

  if (!token) {
    showToast('Authorization Error', 'You do not own the credentials for this campaign.', 'error');
    if (deleteModalObj) deleteModalObj.hide();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/campaigns/${deleteId}`, {
      method: 'DELETE',
      headers: {
        'X-Creator-Token': token
      }
    });

    const result = await res.json();
    
    if (deleteModalObj) {
      deleteModalObj.hide();
    }

    if (result.success) {
      showToast('Deleted!', 'Campaign deleted successfully.', 'success');
      // Remove from locally stored keys
      removeCampaignFromLocalStorage(deleteId);
      // Reload campaigns
      loadUserCampaigns();
    } else {
      showToast('Deletion Failed', result.message || 'Error occurred.', 'error');
    }
  } catch (err) {
    console.error('Error deleting campaign:', err);
    if (deleteModalObj) deleteModalObj.hide();
    showToast('Network Error', 'Failed to communicate with server.', 'error');
  }
  
  deleteId = null;
}
