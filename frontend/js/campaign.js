// ==================================================
// FUNDR CAMPAIGN DETAILS SCRIPTS
// ==================================================

let campaignId = '';
let currentCampaign = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Get Campaign ID from URL query
  const params = new URLSearchParams(window.location.search);
  campaignId = params.get('id');
  
  if (!campaignId) {
    showToast('Invalid Campaign', 'No campaign ID specified.', 'error');
    setTimeout(() => { window.location.href = 'explore.html'; }, 2000);
    return;
  }

  // 2. Fetch campaign details
  loadCampaignDetails();

  // 3. Setup Donation Confirmation Form
  initDonationForm();

  // 4. Setup Copy Button
  initCopyButton();
});

// Fetch detailed campaign data from server
async function loadCampaignDetails() {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${campaignId}`);
    const result = await res.json();

    if (!result.success || !result.data) {
      showToast('Error', 'Campaign not found.', 'error');
      setTimeout(() => { window.location.href = 'explore.html'; }, 2000);
      return;
    }

    currentCampaign = result.data;
    const donations = result.donations || [];

    // Hide loader, show workspace
    document.getElementById('loading-spinner').classList.add('d-none');
    document.getElementById('campaign-workspace').classList.remove('d-none');

    // Populate Page DOM
    renderDetails(currentCampaign);
    renderDonations(donations);
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    showToast('Network Error', 'Failed to retrieve campaign details.', 'error');
  }
}

// Populate UI nodes
function renderDetails(campaign) {
  // Set window title
  document.title = `${campaign.title} - Fundr`;

  // Badges
  const catBadge = document.getElementById('campaign-category-badge');
  catBadge.className = `category-badge cat-${campaign.category.replace(' ', '-')}`;
  catBadge.innerText = campaign.category;

  const statusBadge = document.getElementById('campaign-status-badge');
  statusBadge.innerText = campaign.status;
  if (campaign.status === 'Completed') {
    statusBadge.className = 'badge rounded-pill bg-success px-3 py-2';
  } else if (campaign.status === 'Paused') {
    statusBadge.className = 'badge rounded-pill bg-warning text-dark px-3 py-2';
  } else {
    statusBadge.className = 'badge rounded-pill bg-primary px-3 py-2';
  }

  // Creator profile info
  document.getElementById('campaign-title').innerText = campaign.title;
  document.getElementById('campaign-creator-avatar').innerText = campaign.name.substring(0, 2).toUpperCase();
  document.getElementById('campaign-creator-name').innerText = campaign.name;
  document.getElementById('campaign-location-text').innerText = campaign.location;

  document.getElementById('contact-email').href = `mailto:${campaign.email}?subject=Regarding Fundr Campaign: ${encodeURIComponent(campaign.title)}`;
  document.getElementById('contact-phone').href = `tel:${campaign.phone}`;

  // Image fitting
  const heroImg = document.getElementById('campaign-hero-img');
  heroImg.src = campaign.profileImage.startsWith('http') 
    ? campaign.profileImage 
    : `${window.location.origin}/${campaign.profileImage}`;
  heroImg.onerror = function() {
    this.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop';
  };

  // Description
  document.getElementById('campaign-description').innerText = campaign.description;

  // Stats Card
  const percentage = campaign.percentageCompleted || 0;
  document.getElementById('funds-raised-amount').innerText = formatCurrency(campaign.fundsRaised);
  document.getElementById('target-goal-amount').innerText = formatCurrency(campaign.targetAmount);
  
  const progressBar = document.getElementById('progress-bar-detail');
  progressBar.style.width = `${percentage}%`;
  
  document.getElementById('percentage-label').innerText = `${percentage}% complete`;
  document.getElementById('donations-count-label').innerText = `${campaign.donationCount} donation${campaign.donationCount === 1 ? '' : 's'}`;
  
  const launchDate = new Date(campaign.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('launch-date-label').innerText = `Created on ${launchDate}`;

  // QR and Payment Section setup
  const qrImage = document.getElementById('upi-qr-image');
  const upiIdField = document.getElementById('upi-id-field');
  const donationForm = document.getElementById('donation-action-card');

  // If campaign is not Active, disable donations
  if (campaign.status !== 'Active') {
    donationForm.innerHTML = `
      <div class="text-center py-4">
        <div class="text-warning mb-3"><i class="bi bi-info-circle-fill fs-1"></i></div>
        <h4 class="text-main fw-bold">Donations Closed</h4>
        <p class="text-muted small">This campaign has completed its goal or is paused and cannot accept new donations.</p>
        <a href="explore.html" class="btn btn-primary-custom w-100 mt-2">Back to Campaigns</a>
      </div>
    `;
    return;
  }

  // UPI configuration
  const creatorUpi = campaign.upiId || 'demo@upi';
  upiIdField.value = creatorUpi;

  if (campaign.qrImage) {
    qrImage.src = `${window.location.origin}/${campaign.qrImage}`;
  } else {
    // Generate dynamic QR code using public charts API pointing to real UPI protocol schema!
    const upiLink = `upi://pay?pa=${encodeURIComponent(creatorUpi)}&pn=${encodeURIComponent(campaign.name)}&tn=${encodeURIComponent(campaign.title.substring(0, 18))}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;
  }
}

// Render donation history table logs
function renderDonations(donations) {
  const container = document.getElementById('donations-history-rows');
  const emptyState = document.getElementById('donations-empty-state');

  container.innerHTML = '';
  
  if (donations.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');

  donations.forEach(donation => {
    const row = document.createElement('tr');
    const dateFormatted = new Date(donation.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    // Mask transaction ID for mock aesthetics
    const reference = donation.transactionReference 
      ? donation.transactionReference.substring(0, 18) + (donation.transactionReference.length > 18 ? '...' : '')
      : 'SIM-UPI-TXN';

    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="bg-primary bg-opacity-10 text-primary p-2 rounded-circle" style="font-size: 0.8rem;">
            <i class="bi bi-person-fill"></i>
          </div>
          <div>
            <span class="d-block text-main small font-weight-bold">Anonymous Donor</span>
            <small class="text-muted" style="font-size: 0.75rem;">${dateFormatted}</small>
          </div>
        </div>
      </td>
      <td class="text-muted fw-mono small">${reference}</td>
      <td class="text-end fw-bold text-success">${formatCurrency(donation.amount)}</td>
    `;
    container.appendChild(row);
  });
}

// Setup donation form confirmation actions
function initDonationForm() {
  const form = document.getElementById('donation-confirmation-form');
  if (!form) return;

  const confirmBtn = document.getElementById('confirm-donation-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amountField = document.getElementById('donation-amount-field');
    const refField = document.getElementById('txn-ref-field');

    const amount = parseFloat(amountField.value);
    const reference = refField.value.trim();

    if (isNaN(amount) || amount <= 0) {
      showToast('Validation Error', 'Donation amount must be a positive number.', 'error');
      return;
    }

    // Set UI to loading state
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...`;

    try {
      const res = await fetch(`${API_BASE}/donate/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, transactionReference: reference })
      });
      
      const result = await res.json();
      
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `I Have Donated <i class="bi bi-check-lg ms-2"></i>`;

      if (result.success) {
        // Trigger Success Celebration Overlay
        showCelebration(amount);
        
        // Reset form
        form.reset();

        // Refresh stats and logs on-page dynamically without hard reload!
        loadCampaignDetails();
      } else {
        showToast('Submission Failed', result.message || 'Could not log donation.', 'error');
      }
    } catch (error) {
      console.error('Error logging donation:', error);
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `I Have Donated <i class="bi bi-check-lg ms-2"></i>`;
      showToast('Network Error', 'Failed to communicate with server.', 'error');
    }
  });

  // Success overlay dismiss button
  document.getElementById('dismiss-overlay-btn').addEventListener('click', () => {
    document.getElementById('success-overlay').classList.remove('active');
  });
}

// Helper to copy creator UPI string
function initCopyButton() {
  const copyBtn = document.getElementById('copy-upi-btn');
  const upiField = document.getElementById('upi-id-field');

  if (!copyBtn || !upiField) return;

  copyBtn.addEventListener('click', () => {
    upiField.select();
    upiField.setSelectionRange(0, 99999); // Mobile
    
    navigator.clipboard.writeText(upiField.value)
      .then(() => {
        showToast('Copied!', 'UPI ID copied to clipboard.', 'success');
      })
      .catch(err => {
        console.error('Copy failed:', err);
        showToast('Error', 'Failed to copy text automatically.', 'error');
      });
  });
}

// Display full screen success banner
function showCelebration(amount) {
  const overlay = document.getElementById('success-overlay');
  const raisedText = document.getElementById('success-raised-label');
  
  raisedText.innerText = formatCurrency(amount);
  overlay.classList.add('active');

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 6000);
}
