let filters = {
  streamers: [],
  titles: [],
  categories: [],
  excluded: [],
  enabled: true
};

async function loadFilters() {
  const stored = await chrome.storage.local.get(['filters']);
  if (stored.filters) {
    filters = stored.filters;
    // Ensure excluded array exists for backward compatibility
    if (!filters.excluded) {
      filters.excluded = [];
    }
  }
  updateUI();
}

async function saveFilters() {
  await chrome.storage.local.set({ filters });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url?.includes('kick.com')) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'updateFilters', filters });
    }
  });
}

function updateUI() {
  updateFilterList('streamerList', filters.streamers);
  updateFilterList('titleList', filters.titles);
  updateFilterList('categoryList', filters.categories);
  updateFilterList('excludedList', filters.excluded || []);
  
  document.getElementById('enableToggle').checked = filters.enabled;
  const statusEl = document.getElementById('status');
  if (filters.enabled) {
    statusEl.textContent = 'Filtering Active';
    statusEl.className = 'status active';
  } else {
    statusEl.textContent = 'Filtering Disabled';
    statusEl.className = 'status inactive';
  }
}

function updateFilterList(listId, items) {
  const listEl = document.getElementById(listId);
  if (items.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No filters added</div>';
    return;
  }
  
  listEl.innerHTML = items.map((item, index) => `
    <div class="filter-item">
      <span class="filter-text">${escapeHtml(item)}</span>
      <button class="remove-btn" data-type="${listId}" data-index="${index}">Remove</button>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addFilter(type, value) {
  if (!value.trim()) return;
  
  value = value.trim().toLowerCase();
  
  // Ensure the filter type exists
  if (!filters[type]) {
    filters[type] = [];
  }
  
  if (!filters[type].includes(value)) {
    filters[type].push(value);
    saveFilters();
    updateUI();
  }
}

function removeFilter(type, index) {
  filters[type].splice(index, 1);
  saveFilters();
  updateUI();
}

document.getElementById('addStreamer').addEventListener('click', () => {
  const input = document.getElementById('streamerInput');
  addFilter('streamers', input.value);
  input.value = '';
});

document.getElementById('addTitle').addEventListener('click', () => {
  const input = document.getElementById('titleInput');
  addFilter('titles', input.value);
  input.value = '';
});

document.getElementById('addCategory').addEventListener('click', () => {
  const input = document.getElementById('categoryInput');
  addFilter('categories', input.value);
  input.value = '';
});

document.getElementById('streamerInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addStreamer').click();
  }
});

document.getElementById('titleInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addTitle').click();
  }
});

document.getElementById('categoryInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addCategory').click();
  }
});

// Excluded streamers handlers
document.getElementById('addExcluded').addEventListener('click', () => {
  const input = document.getElementById('excludedInput');
  addFilter('excluded', input.value);
  input.value = '';
});

document.getElementById('excludedInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('addExcluded').click();
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-btn')) {
    const type = e.target.dataset.type;
    const index = parseInt(e.target.dataset.index);
    const typeMap = {
      'streamerList': 'streamers',
      'titleList': 'titles',
      'categoryList': 'categories',
      'excludedList': 'excluded'
    };
    removeFilter(typeMap[type], index);
  }
});

document.getElementById('enableToggle').addEventListener('change', (e) => {
  filters.enabled = e.target.checked;
  saveFilters();
  updateUI();
});

// Export filters functionality
function exportFilters() {
  const data = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    filters: filters
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `kick-filters-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showBackupStatus('Filters exported successfully!', false);
}

// Import filters functionality
function importFilters(file) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate the imported data
      if (!data.filters || typeof data.filters !== 'object') {
        throw new Error('Invalid backup file format');
      }
      
      // Validate filter arrays
      if (!Array.isArray(data.filters.streamers) || 
          !Array.isArray(data.filters.titles) || 
          !Array.isArray(data.filters.categories)) {
        throw new Error('Invalid filters structure');
      }
      
      // Merge or replace filters (you can change this logic)
      const shouldReplace = confirm(
        'Do you want to replace existing filters?\n\n' +
        'OK = Replace all existing filters\n' +
        'Cancel = Merge with existing filters'
      );
      
      if (shouldReplace) {
        // Replace all filters
        filters = {
          streamers: data.filters.streamers || [],
          titles: data.filters.titles || [],
          categories: data.filters.categories || [],
          excluded: data.filters.excluded || [],
          enabled: data.filters.enabled !== undefined ? data.filters.enabled : true
        };
      } else {
        // Merge filters (avoid duplicates)
        filters.streamers = [...new Set([...filters.streamers, ...data.filters.streamers])];
        filters.titles = [...new Set([...filters.titles, ...data.filters.titles])];
        filters.categories = [...new Set([...filters.categories, ...data.filters.categories])];
        filters.excluded = [...new Set([...filters.excluded, ...(data.filters.excluded || [])])];
      }
      
      await saveFilters();
      updateUI();
      
      const count = filters.streamers.length + filters.titles.length + filters.categories.length + (filters.excluded?.length || 0);
      showBackupStatus(`Import successful! ${count} total filters loaded.`, false);
      
    } catch (error) {
      console.error('Import error:', error);
      showBackupStatus(`Import failed: ${error.message}`, true);
    }
  };
  
  reader.onerror = () => {
    showBackupStatus('Failed to read file', true);
  };
  
  reader.readAsText(file);
}

// Show backup status message
function showBackupStatus(message, isError) {
  const statusEl = document.getElementById('backupStatus');
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : '';
  statusEl.style.display = 'block';
  
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Export button click handler
document.getElementById('exportBtn').addEventListener('click', () => {
  exportFilters();
});

// Import button click handler
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

// File input change handler
document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showBackupStatus('Please select a valid JSON file', true);
      return;
    }
    importFilters(file);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  }
});

loadFilters();