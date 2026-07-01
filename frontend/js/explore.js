// ==================================================
// FUNDR EXPLORE CAMPAIGNS SCRIPTS
// ==================================================

let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'Newest';
let debounceTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Check URL Query Parameters for Pre-applied Filters
  parseUrlParams();

  // 2. Initialize Event Listeners
  initFilters();

  // 3. Initial Load
  loadCampaigns();
});

// Parse URL search parameters (e.g., explore.html?category=Medical)
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('category');
  const searchParam = params.get('search');

  if (catParam) {
    currentCategory = catParam;
    // Activate correct pill
    document.querySelectorAll('.category-pill').forEach(pill => {
      if (pill.getAttribute('data-category') === catParam) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  if (searchParam) {
    searchQuery = searchParam;
    const input = document.getElementById('search-input');
    if (input) input.value = searchParam;
  }
}

// Bind event listeners to filters, sorting, and search inputs
function initFilters() {
  // Category Pills
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      currentCategory = pill.getAttribute('data-category');
      
      // Update browser URL query without reloading
      const url = new URL(window.location);
      if (currentCategory !== 'All') {
        url.searchParams.set('category', currentCategory);
      } else {
        url.searchParams.delete('category');
      }
      window.history.pushState({}, '', url);

      loadCampaigns();
    });
  });

  // Search input with debounce (wait 300ms before making API request)
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const url = new URL(window.location);
        if (searchQuery) {
          url.searchParams.set('search', searchQuery);
        } else {
          url.searchParams.delete('search');
        }
        window.history.pushState({}, '', url);
        
        loadCampaigns();
      }, 300);
    });
  }

  // Sort Selector dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadCampaigns();
    });
  }
}

// Render loading card skeletons
function renderSkeletons(container) {
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card-custom h-100">
        <div class="skeleton skeleton-image"></div>
        <div class="p-4">
          <div class="d-flex gap-2 mb-3">
            <div class="skeleton skeleton-text short" style="width: 30%"></div>
            <div class="skeleton skeleton-text short" style="width: 30%"></div>
          </div>
          <div class="skeleton skeleton-text mb-2" style="height: 1.25rem"></div>
          <div class="skeleton skeleton-text mb-4" style="height: 1.25rem; width: 75%"></div>
          <div class="skeleton skeleton-text mb-2"></div>
          <div class="skeleton skeleton-text mb-4"></div>
          <div class="d-flex justify-content-between pt-3 border-top border-color">
            <div class="skeleton skeleton-text short" style="width: 40%"></div>
            <div class="skeleton skeleton-text short" style="width: 30%"></div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  }
}

// Load campaigns via API
async function loadCampaigns() {
  const grid = document.getElementById('campaigns-grid');
  if (!grid) return;

  // Show skeletons
  renderSkeletons(grid);

  try {
    // Build query URL
    let url = `${API_BASE}/campaigns?sort=${currentSort}`;
    if (currentCategory && currentCategory !== 'All') {
      url += `&category=${encodeURIComponent(currentCategory)}`;
    }
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    const res = await fetch(url);
    const result = await res.json();

    // Clear grid
    grid.innerHTML = '';

    if (result.success && result.data.length > 0) {
      result.data.forEach(campaign => {
        grid.appendChild(createCampaignCard(campaign));
      });
    } else {
      renderEmptyState(grid);
    }
  } catch (error) {
    console.error('Failed to load campaigns:', error);
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="text-danger mb-3"><i class="bi bi-exclamation-triangle-fill fs-1"></i></div>
        <h4>Failed to connect to server</h4>
        <p class="text-muted">Please check your internet connection or try again later.</p>
        <button class="btn btn-primary-custom mt-3" onclick="loadCampaigns()">Try Again</button>
      </div>
    `;
  }
}

// Render empty state if search returns nothing
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="col-12">
      <div class="empty-state shadow-sm py-5">
        <div class="empty-state-icon"><i class="bi bi-search-heart"></i></div>
        <h3>No Campaigns Found</h3>
        <p class="text-muted max-width-500 mx-auto mb-4">We couldn't find any campaigns matching your filters. Try clearing your search queries or start a new campaign.</p>
        <div class="d-flex justify-content-center gap-3">
          <button class="btn btn-outline-custom" onclick="clearFilters()">Clear Filters</button>
          <a class="btn btn-primary-custom" href="profile.html?action=create">Start a Campaign</a>
        </div>
      </div>
    </div>
  `;
}

// Clear all active search filters
function clearFilters() {
  currentCategory = 'All';
  searchQuery = '';
  currentSort = 'Newest';

  // Reset inputs
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'Newest';

  document.querySelectorAll('.category-pill').forEach(pill => {
    if (pill.getAttribute('data-category') === 'All') {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
      }
  });

  // Reset URL
  const url = new URL(window.location);
  url.search = '';
  window.history.pushState({}, '', url);

  loadCampaigns();
}

// Reuse card builder from main page but bind real Details url link
function createCampaignCard(campaign) {
  const col = document.createElement('div');
  col.className = 'col-md-4';
  
  const percentage = campaign.percentageCompleted || 0;
  const imageUrl = campaign.profileImage.startsWith('http') 
    ? campaign.profileImage 
    : `${window.location.origin}/${campaign.profileImage}`;

  col.innerHTML = `
    <div class="card-custom h-100 d-flex flex-column">
      <div class="position-relative">
        <img src="${imageUrl}" class="campaign-card-img" alt="${campaign.title}" onerror="this.src='https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop'">
        <span class="position-absolute top-0 end-0 m-3 category-badge cat-${campaign.category.replace(' ', '-')}">${campaign.category}</span>
      </div>
      <div class="p-4 d-flex flex-column flex-grow-1">
        <div class="d-flex align-items-center mb-3 text-muted small">
          <i class="bi bi-geo-alt me-1 text-danger"></i>
          <span>${campaign.location}</span>
          <span class="mx-2">&bull;</span>
          <i class="bi bi-calendar-event me-1"></i>
          <span>${getDaysSince(campaign.createdAt)}</span>
        </div>
        <h4 class="h5 text-main mb-2 line-clamp-2">${campaign.title}</h4>
        <p class="text-muted small line-clamp-3 mb-4 flex-grow-1">${campaign.description}</p>
        
        <div class="mb-3">
          <div class="d-flex justify-content-between text-muted small mb-1">
            <span>Raised: <strong>${formatCurrency(campaign.fundsRaised)}</strong></span>
            <span>Goal: <strong>${formatCurrency(campaign.targetAmount)}</strong></span>
          </div>
          <div class="progress-container">
            <div class="progress-bar-custom" style="width: ${percentage}%"></div>
          </div>
          <div class="text-end text-muted small mt-1">
            <span>${percentage}% complete</span>
          </div>
        </div>
        
        <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top border-color">
          <div class="d-flex align-items-center gap-2">
            <div class="profile-avatar-placeholder" style="width: 28px; height: 28px; font-size: 0.7rem;">
              ${campaign.name.substring(0, 2).toUpperCase()}
            </div>
            <span class="small text-main font-weight-bold">${campaign.name}</span>
          </div>
          <a href="campaign.html?id=${campaign._id}" class="btn btn-primary-custom btn-sm py-2 px-3">
            View Details
          </a>
        </div>
      </div>
    </div>
  `;
  return col;
}
