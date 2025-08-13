let filters = {
  streamers: [],
  titles: [],
  categories: [],
  enabled: true
};

async function loadFilters() {
  const stored = await chrome.storage.local.get(['filters']);
  if (stored.filters) {
    filters = stored.filters;
  }
  applyFilters();
}

function extractStreamInfo(card) {
  const info = {
    streamerName: '',
    title: '',
    category: ''
  };

  try {
    const titleLink = card.querySelector('a[title]');
    if (titleLink && titleLink.title) {
      info.title = titleLink.title.toLowerCase();
    }

    const categoryLink = card.querySelector('a[href^="/category/"]');
    if (categoryLink) {
      const categoryText = categoryLink.textContent?.trim().toLowerCase();
      if (categoryText) {
        info.category = categoryText;
      }
    }

    const streamerLinks = card.querySelectorAll('a[href]');
    for (const link of streamerLinks) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('/category/')) {
        const streamerName = href.substring(1);
        if (streamerName && !streamerName.includes('/')) {
          const linkText = link.textContent?.trim().toLowerCase();
          if (linkText === streamerName.toLowerCase()) {
            info.streamerName = streamerName.toLowerCase();
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting stream info:', error);
  }

  return info;
}

function shouldHideStream(streamInfo) {
  if (!filters.enabled) return false;

  // Exact match for streamer names (case-insensitive)
  for (const streamer of filters.streamers) {
    if (streamInfo.streamerName && streamInfo.streamerName === streamer) {
      return true;
    }
  }

  // Partial match for titles
  for (const title of filters.titles) {
    if (streamInfo.title && streamInfo.title.includes(title)) {
      return true;
    }
  }

  // Partial match for categories
  for (const category of filters.categories) {
    if (streamInfo.category && streamInfo.category.includes(category)) {
      return true;
    }
  }

  return false;
}

function applyFilters() {
  const mainContainer = document.getElementById('main-container');
  if (!mainContainer) return;

  const cards = mainContainer.querySelectorAll('.group\\/card');
  
  cards.forEach(card => {
    const streamInfo = extractStreamInfo(card);
    
    if (shouldHideStream(streamInfo)) {
      card.style.display = 'none';
      card.setAttribute('data-filtered', 'true');
    } else {
      if (card.getAttribute('data-filtered') === 'true') {
        card.style.display = '';
        card.removeAttribute('data-filtered');
      }
    }
  });
}

function observeChanges() {
  const mainContainer = document.getElementById('main-container');
  if (!mainContainer) {
    setTimeout(observeChanges, 1000);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    let shouldReapply = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            if (node.classList?.contains('group/card') || 
                node.querySelector?.('.group\\/card')) {
              shouldReapply = true;
              break;
            }
          }
        }
      }
    }
    
    if (shouldReapply) {
      applyFilters();
    }
  });

  observer.observe(mainContainer, {
    childList: true,
    subtree: true
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateFilters') {
    filters = request.filters;
    applyFilters();
  }
});

loadFilters();
observeChanges();

setInterval(applyFilters, 2000);