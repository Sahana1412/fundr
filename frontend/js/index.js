// ==================================================
// FUNDR HOMEPAGE SCRIPTS
// ==================================================

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchFeaturedCampaigns();
});

// Animate numbers counting up
function animateCounter(elementId, targetValue, duration = 1500, formatFn = null) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let startTimestamp = null;
  const startValue = 0;
  
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = progress * (targetValue - startValue) + startValue;
    
    if (formatFn) {
      el.innerHTML = formatFn(currentValue);
    } else {
      el.innerHTML = Math.floor(currentValue);
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      // Ensure exact final number
      if (formatFn) {
        el.innerHTML = formatFn(targetValue);
      } else {
        el.innerHTML = targetValue;
      }
    }
  };
  
  window.requestAnimationFrame(step);
}

// Fetch site-wide statistics
async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    
    if (data.success) {
      const stats = data.data;
      
      animateCounter('stat-campaigns', stats.totalCampaigns, 1200);
      animateCounter('stat-raised', stats.totalMoneyRaised, 1500, (val) => formatCurrency(val));
      animateCounter('stat-helped', stats.peopleHelped, 1200);
      animateCounter('stat-rate', stats.successRate, 1000, (val) => `${Math.round(val)}%`);
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
    // Display static zeros if server error
  }
}

// Fetch 3 most funded campaigns for hero feature
async function fetchFeaturedCampaigns() {
  const row = document.getElementById('featured-campaigns-row');
  if (!row) return;

  try {
    const res = await fetch(`${API_BASE}/campaigns?sort=Most Funded`);
    const data = await res.json();
    
    // Clear skeletons
    row.innerHTML = '';

    if (data.success && data.data.length > 0) {
      // Slice top 3
      const featured = data.data.slice(0, 3);
      featured.forEach(campaign => {
        row.appendChild(createCampaignCard(campaign));
      });
    } else {
      // Render beautiful mock campaign fallbacks if database is empty
      renderMockCampaigns(row);
    }
  } catch (error) {
    console.error('Error loading featured campaigns:', error);
    renderMockCampaigns(row);
  }
}

// Reusable card creator function
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

// Render fallback mockup cards if database has 0 campaigns
function renderMockCampaigns(container) {
  const mockCampaigns = [
    {
      _id: "mock1",
      title: "Emergency Heart Surgery for 5-Year-Old Advik",
      name: "Suresh Kumar",
      category: "Medical",
      location: "Chennai, Tamil Nadu",
      description: "Young Advik requires urgent heart repair surgery. His family is unable to afford the operation cost. Please help fund his medical expenses directly and save a life.",
      targetAmount: 500000,
      fundsRaised: 375000,
      profileImage: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=600&auto=format&fit=crop",
      percentageCompleted: 75,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock2",
      title: "Support Rural Children to Learn Coding and Robotics",
      name: "Anjali Gupta",
      category: "Education",
      location: "Pune, Maharashtra",
      description: "We are establishing a STEM laboratory in local government schools to teach coding, design, and robotics to students, opening doors to careers in technology.",
      targetAmount: 180000,
      fundsRaised: 90000,
      profileImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop",
      percentageCompleted: 50,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock3",
      title: "Shelter and Food Supply for 150 Abandoned Puppies",
      name: "Animal Rescue India",
      category: "Animal Welfare",
      location: "Gurugram, Haryana",
      description: "Provide nutrition, veterinary medical care, and permanent boarding shelters for injured, sick, and abandoned animals rescued from the streets.",
      targetAmount: 250000,
      fundsRaised: 225000,
      profileImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop",
      percentageCompleted: 90,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  mockCampaigns.forEach(campaign => {
    // Generate mock card with a visual warning tag explaining it's mock
    const cardEl = createCampaignCard(campaign);
    // Overwrite the view details link to show a toast message that it is a mock card
    const viewBtn = cardEl.querySelector('.btn-primary-custom');
    viewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Mock Campaign', 'This is a mock campaign shown as a demonstration. Start a real campaign to try the features!', 'info');
    });
    container.appendChild(cardEl);
  });
}
