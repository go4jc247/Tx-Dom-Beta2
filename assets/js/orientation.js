// ============================================================
// TX-Dom-Dev — orientation.js
// Orientation & Persistence IIFE extracted from game.js v13.5.0
// ============================================================

// ============================================================
// SECTION 2: Orientation & Persistence
// ============================================================

(function(){
  // ==================== ORIENTATION-AWARE PERSISTENCE ====================
  function getOrientation(){ return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'; }
  let currentOrientation = getOrientation();

  function storageKey(base){ return base + '_' + currentOrientation; }

  const STORAGE_KEY_DEVMODE = 'tn51_devmode';
  const STORAGE_KEY_PRESETS = 'tn51_device_presets';

  function saveToStorage(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
  function loadFromStorage(key){ try{ const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; }catch(e){ return null; } }

  // Orientation-aware keys
  function getT42Key(){ return 'tn51_t42_layout_' + currentOrientation; }
  function getTn51Key(){ return 'tn51_tn51_layout_' + currentOrientation; }
  function getBy2Key(){ return 'tn51_boneyard_' + currentOrientation; }

  // Helper to collect current boneyard state
  function collectBy2State(){
    return {
      xOffset: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-left')) || 4.5,
      yOffset: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-top')) || 14,
      width: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-width')) || 90,
      height: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-height')) || 22,
      gap: BY2_GAP, playedOpacity: BY2_PLAYED_OPACITY,
      innerSize: BY2_INNER_SIZE, innerRadius: BY2_INNER_RADIUS, innerColor: BY2_INNER_COLOR,
      outerSize: BY2_OUTER_SIZE, outerRadius: BY2_OUTER_RADIUS, outerColor: BY2_OUTER_COLOR
    };
  }

  // Helper to apply boneyard state
  function applyBy2State(data){
    if(!data) return;
    if(data.xOffset !== undefined) document.documentElement.style.setProperty('--th-left', data.xOffset + '%');
    if(data.yOffset !== undefined) document.documentElement.style.setProperty('--th-top', data.yOffset + '%');
    if(data.width !== undefined) document.documentElement.style.setProperty('--th-width', data.width + '%');
    if(data.height !== undefined) document.documentElement.style.setProperty('--th-height', data.height + '%');
    if(data.gap !== undefined) window.BY2_GAP = data.gap;
    if(data.playedOpacity !== undefined) window.BY2_PLAYED_OPACITY = data.playedOpacity;
    if(data.innerSize !== undefined) window.BY2_INNER_SIZE = data.innerSize;
    if(data.innerRadius !== undefined) window.BY2_INNER_RADIUS = data.innerRadius;
    if(data.innerColor !== undefined) window.BY2_INNER_COLOR = data.innerColor;
    if(data.outerSize !== undefined) window.BY2_OUTER_SIZE = data.outerSize;
    if(data.outerRadius !== undefined) window.BY2_OUTER_RADIUS = data.outerRadius;
    if(data.outerColor !== undefined) window.BY2_OUTER_COLOR = data.outerColor;
    if(typeof boneyard2Visible !== 'undefined' && boneyard2Visible) renderBoneyard2();
  }

  // Update orientation labels in settings popups
  function updateOrientLabels(){
    var o = currentOrientation.charAt(0).toUpperCase() + currentOrientation.slice(1);
    var els = ['orientLabel','orientLabelT42','orientLabelBy2'];
    els.forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.textContent = 'Editing: ' + o + ' mode';
    });
  }

  // Load persisted settings for current orientation on startup
  // Try orientation-specific key first, fall back to legacy key
  const _savedT42 = loadFromStorage(getT42Key()) || loadFromStorage('tn51_t42_layout');
  if(_savedT42) Object.assign(T42_SETTINGS, _savedT42);
  const _savedTn51 = loadFromStorage(getTn51Key()) || loadFromStorage('tn51_tn51_layout');
  if(_savedTn51) Object.assign(TN51_SETTINGS, _savedTn51);

  // Load dynamic pip settings
  const _savedFancyLine = loadFromStorage('tn51_fancy_line');
  if(_savedFancyLine !== null) {
    DOMINO_STYLE.FANCY_LINE_ENABLED = _savedFancyLine;
    const flChk = document.getElementById('chkFancyLine');
    if(flChk) { flChk.checked = _savedFancyLine; }
    const flKnob = document.getElementById('fancyLineKnob');
    if(flKnob) { flKnob.style.left = _savedFancyLine ? '22px' : '2px'; flKnob.parentElement.querySelector('span').style.background = _savedFancyLine ? '#22c55e' : 'rgba(255,255,255,0.2)'; }
  }
  const _savedPipFx = loadFromStorage('tn51_pip_fx');
  if(_savedPipFx !== null) {
    DOMINO_STYLE.PIPFX_ENABLED = _savedPipFx;
    const pfChk = document.getElementById('chkPipFx');
    if(pfChk) { pfChk.checked = _savedPipFx; }
    const pfKnob = document.getElementById('pipFxKnob');
    if(pfKnob) { pfKnob.style.left = _savedPipFx ? '22px' : '2px'; pfKnob.parentElement.querySelector('span').style.background = _savedPipFx ? '#22c55e' : 'rgba(255,255,255,0.2)'; }
  }

  // Load flip trump state (default ON)
  const _savedFlipTrump = loadFromStorage('tn51_flip_trump');
  window.FLIP_TRUMP_ENABLED = _savedFlipTrump !== null ? _savedFlipTrump : true;
  if(_savedFlipTrump !== null) {
    const ftChk = document.getElementById('chkFlipTrump');
    if(ftChk) { ftChk.checked = _savedFlipTrump; }
    const ftKnob = document.getElementById('flipTrumpKnob');
    if(ftKnob) { ftKnob.style.left = _savedFlipTrump ? '22px' : '2px'; ftKnob.parentElement.querySelector('span').style.background = _savedFlipTrump ? '#22c55e' : 'rgba(255,255,255,0.2)'; }
  }

  // Developer mode
  let devModeEnabled = loadFromStorage(STORAGE_KEY_DEVMODE) || false;

  function updateDevModeUI(){
    const chk = document.getElementById('chkDevMode');
    const knob = document.getElementById('devModeKnob');
    if(chk) chk.checked = devModeEnabled;
    if(knob){
      knob.style.left = devModeEnabled ? '22px' : '2px';
      knob.previousElementSibling.style.background = devModeEnabled ? '#22c55e' : 'rgba(255,255,255,0.2)';
    }
    // Show/hide dev tabs bar container
    const wrap = document.getElementById('devTabsWrap');
    const tn51Btn = document.getElementById('tn51SettingsBtn');
    const t42Btn = document.getElementById('t42SettingsBtn');
    const moonBtn = document.getElementById('moonSettingsBtn');
    if(devModeEnabled){
      if(wrap) wrap.style.display = 'block';
      // Show game-specific layout button, hide others
      if(GAME_MODE === 'T42'){
        if(t42Btn) t42Btn.style.display = 'inline-block';
        if(tn51Btn) tn51Btn.style.display = 'none';
        if(moonBtn) moonBtn.style.display = 'none';
      } else if(GAME_MODE === 'MOON'){
        if(moonBtn) moonBtn.style.display = 'inline-block';
        if(tn51Btn) tn51Btn.style.display = 'none';
        if(t42Btn) t42Btn.style.display = 'none';
      } else {
        if(tn51Btn) tn51Btn.style.display = 'inline-block';
        if(t42Btn) t42Btn.style.display = 'none';
        if(moonBtn) moonBtn.style.display = 'none';
      }
    } else {
      if(wrap) wrap.style.display = 'none';
    }
  }

  // Helper: redraw all sprites including trick history
  function _redrawAllVisibleSprites(){
    try{
      for(const seat of sprites){
        if(!seat) continue;
        for(const d of seat){
          if(d && d.sprite && typeof d.sprite.redrawCanvases === "function") d.sprite.redrawCanvases();
        }
      }
      if(typeof playedThisTrick !== 'undefined'){
        for(const pt of playedThisTrick){
          if(pt && pt.sprite && typeof pt.sprite.redrawCanvases === "function") pt.sprite.redrawCanvases();
        }
      }
      var sl = document.getElementById('spriteLayer');
      if(sl){ for(var i = 0; i < sl.children.length; i++){ var c = sl.children[i]; if(c && typeof c.redrawCanvases === "function") c.redrawCanvases(); } }
    }catch(e){}
  }

  document.getElementById('chkFancyLine').addEventListener('change', function(){
    DOMINO_STYLE.FANCY_LINE_ENABLED = this.checked;
    saveToStorage('tn51_fancy_line', this.checked);
    const knob = document.getElementById('fancyLineKnob');
    knob.style.left = this.checked ? '22px' : '2px';
    knob.parentElement.querySelector('span').style.background = this.checked ? '#22c55e' : 'rgba(255,255,255,0.2)';
    _redrawAllVisibleSprites();
  });

  document.getElementById('chkPipFx').addEventListener('change', function(){
    DOMINO_STYLE.PIPFX_ENABLED = this.checked;
    saveToStorage('tn51_pip_fx', this.checked);
    const knob = document.getElementById('pipFxKnob');
    knob.style.left = this.checked ? '22px' : '2px';
    knob.parentElement.querySelector('span').style.background = this.checked ? '#22c55e' : 'rgba(255,255,255,0.2)';
    _redrawAllVisibleSprites();
  });

  // Flip Trump toggle (default ON)
  window.FLIP_TRUMP_ENABLED = true;
  document.getElementById('chkFlipTrump').addEventListener('change', function(){
    window.FLIP_TRUMP_ENABLED = this.checked;
    saveToStorage('tn51_flip_trump', this.checked);
    const knob = document.getElementById('flipTrumpKnob');
    knob.style.left = this.checked ? '22px' : '2px';
    knob.parentElement.querySelector('span').style.background = this.checked ? '#22c55e' : 'rgba(255,255,255,0.2)';
  });


  document.getElementById('chkDevMode').addEventListener('change', function(){
    devModeEnabled = this.checked;
    saveToStorage(STORAGE_KEY_DEVMODE, devModeEnabled);
    updateDevModeUI();
  });

    // ==================== Z-INDEX MANAGER ====================
  (function(){
    // Create backdrop
    const ziBackdrop = document.createElement('div');
    ziBackdrop.id = 'ziBackdrop';
    ziBackdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:2099;background:rgba(0,0,0,0.5);';
    ziBackdrop.addEventListener('click', function(){ closeZIndexManager(); });
    document.body.appendChild(ziBackdrop);

    // Create popup
    const ziPopup = document.createElement('div');
    ziPopup.id = 'ziPopup';
    ziPopup.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2100;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px;max-width:420px;width:94%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6);color:#fff;font-size:12px;';
    document.body.appendChild(ziPopup);

    // Z-Index registry: all elements with z-index values
    // Format: { id, label, selector, type:'css'|'inline', defaultZ }
    const Z_INDEX_REGISTRY = [
      { id:'zi_startScreen', label:'Start Screen', selector:'#startScreenBackdrop', defaultZ:1100 },
      { id:'zi_settingsBtn', label:'Settings Gear', selector:'.settingsBtn', defaultZ:1200 },
      { id:'zi_settingsMenu', label:'Settings Dropdown', selector:'.settingsMenu', defaultZ:1201 },
      { id:'zi_gameSettings', label:'Game Settings', selector:'#gameSettingsBackdrop', defaultZ:1300 },
      { id:'zi_modalBackdrop', label:'Modal Backdrops (base)', selector:'.modalBackdrop', defaultZ:1000 },
      { id:'zi_nextRoundBtn', label:'Next Round Button', selector:'.nextRoundBtn', defaultZ:1000 },
      { id:'zi_scoreBar', label:'Score Bar', selector:'.scoreBar', defaultZ:100 },
      { id:'zi_moonScoreBar', label:'Moon Score Bar', selector:'#moonScoreBar', defaultZ:100 },
      { id:'zi_trickHistoryBg', label:'Trick History BG', selector:'#trickHistoryBg', defaultZ:10 },
      { id:'zi_shadowLayer', label:'Shadow Layer', selector:'#shadowLayer', defaultZ:15 },
      { id:'zi_spriteLayer', label:'Sprite Layer', selector:'#spriteLayer', defaultZ:20 },
      { id:'zi_tableMain', label:'Table Main', selector:'#tableMain', defaultZ:0 },
      { id:'zi_layDownBackdrop', label:'Lay Down Backdrop', selector:'#layDownBackdrop', defaultZ:9000 },
      { id:'zi_layDownBtnGroup', label:'Lay Down Buttons', selector:'#layDownBtnGroup', defaultZ:800 },
      { id:'zi_callDoubleBtnGroup', label:'Call Double Buttons', selector:'#callDoubleBtnGroup', defaultZ:810 },
      { id:'zi_callDoubleBanner', label:'Call Double Banner', selector:'#callDoubleBanner', defaultZ:810 },
      { id:'zi_bonesBackdrop', label:'Bones Modal', selector:'#bonesBackdrop', defaultZ:9999 },
      { id:'zi_aboutBackdrop', label:'About Modal', selector:'#aboutBackdrop', defaultZ:1500 },
      { id:'zi_ppBackdrop', label:'Pass & Play Modal', selector:'#ppBackdrop', defaultZ:1500 },
      { id:'zi_ppHandoff', label:'P&P Handoff', selector:'#ppHandoff', defaultZ:1400 },
      { id:'zi_mpBackdrop', label:'Multiplayer Modal', selector:'#mpBackdrop', defaultZ:1500 },
      { id:'zi_mpIndicator', label:'MP Indicator', selector:'#mpIndicator', defaultZ:1300 },
      { id:'zi_mpWaiting', label:'MP Waiting', selector:'#mpWaiting', defaultZ:1350 },
      { id:'zi_tn51Settings', label:'TN51 Layout Popup', selector:'#tn51SettingsBackdrop', defaultZ:2000 },
      { id:'zi_t42Settings', label:'T42 Layout Popup', selector:'#t42SettingsBackdrop', defaultZ:2000 },
      { id:'zi_by2Settings', label:'Boneyard Popup', selector:'#by2SettingsBackdrop', defaultZ:2100 },
      { id:'zi_pipDetails', label:'Pip Details Popup', selector:'#pipDetailsPopup,#pdBackdrop', defaultZ:2000 },
      { id:'zi_pipColors', label:'Pip Colors Popup', selector:'#pipColorsPopup,#pcBackdrop', defaultZ:2000 },
      { id:'zi_devBtns', label:'Dev Mode Buttons', selector:'#devTabsWrap', defaultZ:900 },
      { id:'zi_bidIndicators', label:'Bid Indicators', selector:'[id^="bidIndicator"]', defaultZ:5 },
    ];

    // Load saved z-index overrides from localStorage
    const STORAGE_KEY = 'tn51_zindex_overrides';
    let zOverrides = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved) zOverrides = JSON.parse(saved);
    } catch(e){}

    function getCurrentZ(entry){
      if(zOverrides[entry.id] !== undefined) return zOverrides[entry.id];
      return entry.defaultZ;
    }

    function applyZIndex(entry, value){
      const selectors = entry.selector.split(',');
      for(const sel of selectors){
        const els = document.querySelectorAll(sel.trim());
        for(const el of els){
          el.style.zIndex = value;
        }
      }
    }

    function applyAllOverrides(){
      for(const entry of Z_INDEX_REGISTRY){
        if(zOverrides[entry.id] !== undefined){
          applyZIndex(entry, zOverrides[entry.id]);
        }
      }
    }

    function saveOverrides(){
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(zOverrides)); }catch(e){}
    }

    function openZIndexManager(){
      ziBackdrop.style.display = 'block';
      ziPopup.style.display = 'block';
      renderZIndexPanel();
    }

    function closeZIndexManager(){
      ziBackdrop.style.display = 'none';
      ziPopup.style.display = 'none';
    }

    function renderZIndexPanel(){
      // Sort by current z-index ascending
      const sorted = [...Z_INDEX_REGISTRY].sort((a,b) => getCurrentZ(a) - getCurrentZ(b));

      let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;">';
      html += '<span style="font-size:16px;font-weight:700;">Z-Index Manager</span>';
      html += '<button id="ziCloseBtn" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:2px 6px;">&times;</button>';
      html += '</div>';

      // Sort toggle
      html += '<div style="display:flex;gap:6px;margin-bottom:10px;">';
      html += '<button class="ziSortBtn" data-sort="z" style="flex:1;padding:4px;font-size:10px;background:rgba(99,102,241,0.6);border:1px solid rgba(255,255,255,0.3);border-radius:4px;color:#fff;cursor:pointer;">Sort by Z</button>';
      html += '<button class="ziSortBtn" data-sort="name" style="flex:1;padding:4px;font-size:10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;">Sort by Name</button>';
      html += '<button id="ziResetAll" style="flex:1;padding:4px;font-size:10px;background:rgba(239,68,68,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;">Reset All</button>';
      html += '</div>';

      // Export section
      html += '<div style="margin-bottom:10px;">';
      html += '<button id="ziExportBtn" style="width:100%;padding:6px;font-size:11px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:6px;color:#fff;cursor:pointer;font-weight:600;">Export Z-Index Values</button>';
      html += '</div>';

      // Entries
      html += '<div id="ziEntries">';
      for(const entry of sorted){
        const val = getCurrentZ(entry);
        const isOverridden = zOverrides[entry.id] !== undefined;
        const labelColor = isOverridden ? '#fbbf24' : '#fff';
        html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding:6px 8px;background:rgba(255,255,255,0.05);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-size:11px;font-weight:600;color:' + labelColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + entry.selector + '">' + entry.label + '</div>';
        html += '<div style="font-size:9px;color:rgba(255,255,255,0.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + entry.selector + '</div>';
        html += '</div>';
        html += '<input type="number" id="' + entry.id + '_input" data-entry-id="' + entry.id + '" value="' + val + '" style="width:60px;padding:3px 4px;font-size:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;text-align:center;font-family:monospace;" />';
        if(isOverridden){
          html += '<button class="ziResetBtn" data-entry-id="' + entry.id + '" style="padding:2px 6px;font-size:10px;background:rgba(239,68,68,0.4);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;" title="Reset to default (' + entry.defaultZ + ')">R</button>';
        } else {
          html += '<div style="width:24px;"></div>';
        }
        html += '</div>';
      }
      html += '</div>';

      // Export textarea (hidden by default)
      html += '<textarea id="ziExportArea" style="display:none;width:100%;height:120px;margin-top:8px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#22c55e;font-family:monospace;font-size:10px;padding:8px;resize:vertical;" readonly></textarea>';

      ziPopup.innerHTML = html;

      // Wire close button
      document.getElementById('ziCloseBtn').addEventListener('click', closeZIndexManager);

      // Wire input changes
      ziPopup.querySelectorAll('input[type="number"]').forEach(function(inp){
        inp.addEventListener('change', function(){
          const entryId = this.dataset.entryId;
          const newVal = parseInt(this.value, 10);
          if(isNaN(newVal)) return;
          const entry = Z_INDEX_REGISTRY.find(e => e.id === entryId);
          if(!entry) return;
          if(newVal === entry.defaultZ){
            delete zOverrides[entryId];
          } else {
            zOverrides[entryId] = newVal;
          }
          applyZIndex(entry, newVal);
          saveOverrides();
          renderZIndexPanel(); // Re-render to update colors
        });
      });

      // Wire reset buttons
      ziPopup.querySelectorAll('.ziResetBtn').forEach(function(btn){
        btn.addEventListener('click', function(){
          const entryId = this.dataset.entryId;
          const entry = Z_INDEX_REGISTRY.find(e => e.id === entryId);
          if(!entry) return;
          delete zOverrides[entryId];
          applyZIndex(entry, entry.defaultZ);
          saveOverrides();
          renderZIndexPanel();
        });
      });

      // Wire sort buttons
      ziPopup.querySelectorAll('.ziSortBtn').forEach(function(btn){
        btn.addEventListener('click', function(){
          const sort = this.dataset.sort;
          ziPopup.querySelectorAll('.ziSortBtn').forEach(b => {
            b.style.background = 'rgba(255,255,255,0.1)';
          });
          this.style.background = 'rgba(99,102,241,0.6)';
          const container = document.getElementById('ziEntries');
          if(!container) return;
          const entries = sort === 'name'
            ? [...Z_INDEX_REGISTRY].sort((a,b) => a.label.localeCompare(b.label))
            : [...Z_INDEX_REGISTRY].sort((a,b) => getCurrentZ(a) - getCurrentZ(b));
          // Just re-render with new sort
          let h = '';
          for(const entry of entries){
            const val = getCurrentZ(entry);
            const isOverridden = zOverrides[entry.id] !== undefined;
            const labelColor = isOverridden ? '#fbbf24' : '#fff';
            h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding:6px 8px;background:rgba(255,255,255,0.05);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">';
            h += '<div style="flex:1;min-width:0;">';
            h += '<div style="font-size:11px;font-weight:600;color:' + labelColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + entry.selector + '">' + entry.label + '</div>';
            h += '<div style="font-size:9px;color:rgba(255,255,255,0.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + entry.selector + '</div>';
            h += '</div>';
            h += '<input type="number" data-entry-id="' + entry.id + '" value="' + val + '" style="width:60px;padding:3px 4px;font-size:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;text-align:center;font-family:monospace;" />';
            if(isOverridden){
              h += '<button class="ziResetBtn" data-entry-id="' + entry.id + '" style="padding:2px 6px;font-size:10px;background:rgba(239,68,68,0.4);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;cursor:pointer;" title="Reset to default (' + entry.defaultZ + ')">R</button>';
            } else {
              h += '<div style="width:24px;"></div>';
            }
            h += '</div>';
          }
          container.innerHTML = h;
          // Re-wire inputs
          container.querySelectorAll('input[type="number"]').forEach(function(inp){
            inp.addEventListener('change', function(){
              const entryId = this.dataset.entryId;
              const newVal = parseInt(this.value, 10);
              if(isNaN(newVal)) return;
              const entry = Z_INDEX_REGISTRY.find(e => e.id === entryId);
              if(!entry) return;
              if(newVal === entry.defaultZ){
                delete zOverrides[entryId];
              } else {
                zOverrides[entryId] = newVal;
              }
              applyZIndex(entry, newVal);
              saveOverrides();
              renderZIndexPanel();
            });
          });
          container.querySelectorAll('.ziResetBtn').forEach(function(btn2){
            btn2.addEventListener('click', function(){
              const entryId = this.dataset.entryId;
              const entry = Z_INDEX_REGISTRY.find(e => e.id === entryId);
              if(!entry) return;
              delete zOverrides[entryId];
              applyZIndex(entry, entry.defaultZ);
              saveOverrides();
              renderZIndexPanel();
            });
          });
        });
      });

      // Wire Reset All
      document.getElementById('ziResetAll').addEventListener('click', function(){
        zOverrides = {};
        saveOverrides();
        // Apply generic (class) selectors first, then specific (ID) selectors last
        // so specific overrides win over generic ones
        const genericFirst = [...Z_INDEX_REGISTRY].sort((a,b) => {
          const aIsId = a.selector.startsWith('#') ? 1 : 0;
          const bIsId = b.selector.startsWith('#') ? 1 : 0;
          return aIsId - bIsId;
        });
        for(const entry of genericFirst){
          applyZIndex(entry, entry.defaultZ);
        }
        renderZIndexPanel();
      });

      // Wire Export
      document.getElementById('ziExportBtn').addEventListener('click', function(){
        const area = document.getElementById('ziExportArea');
        if(area.style.display === 'none'){
          // Generate export
          const sorted2 = [...Z_INDEX_REGISTRY].sort((a,b) => getCurrentZ(a) - getCurrentZ(b));
          let txt = '// Z-Index Export — ' + new Date().toISOString().slice(0,10) + '\n';
          txt += '// Format: Label | Selector | Z-Index (default)\n';
          txt += '// * = modified from default\n\n';
          for(const entry of sorted2){
            const val = getCurrentZ(entry);
            const mod = zOverrides[entry.id] !== undefined ? ' *' : '';
            txt += entry.label.padEnd(24) + '| ' + entry.selector.padEnd(50) + '| ' + String(val).padStart(5) + mod + '\n';
          }
          txt += '\n// JSON for import:\n';
          const exportObj = {};
          for(const entry of sorted2){
            exportObj[entry.id] = { label: entry.label, selector: entry.selector, z: getCurrentZ(entry) };
          }
          txt += JSON.stringify(exportObj, null, 2);
          area.value = txt;
          area.style.display = 'block';
          area.select();
          this.textContent = 'Hide Export';
        } else {
          area.style.display = 'none';
          this.textContent = 'Export Z-Index Values';
        }
      });
    }

    // Wire button click
    document.getElementById('zIndexBtn').addEventListener('click', openZIndexManager);

    // Apply saved overrides on load
    applyAllOverrides();

    // Expose for external use
    window.openZIndexManager = openZIndexManager;
    window.closeZIndexManager = closeZIndexManager;
  })();

  // V10_105: Ensure dev mode UI is correct on page load
  updateDevModeUI();

  // ==================== DOMINO STYLE PANEL (V10_108: Fix #15) ====================
  (function(){
    const DS_STORAGE = 'tn51_domino_style';
    let dsPanel = null;

    function showDominoStylePanel(){
      if(dsPanel){ dsPanel.remove(); dsPanel = null; return; }
      dsPanel = document.createElement('div');
      dsPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2050;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px;max-width:380px;width:94%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6);color:#fff;font-size:12px;';

      function _dsHeader(text){ var d = document.createElement('div'); d.style.cssText = 'font-weight:600;margin:10px 0 6px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;'; d.textContent = text; dsPanel.appendChild(d); }

      function _dsColorRow(label, getter, setter){
        var row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
        var lbl = document.createElement('span'); lbl.style.cssText = 'flex:1;color:rgba(255,255,255,0.6);'; lbl.textContent = label;
        var inp = document.createElement('input'); inp.type = 'color'; inp.style.cssText = 'width:32px;height:24px;border:none;background:none;cursor:pointer;';
        // Parse rgba to hex
        var c = getter(); inp.value = _rgbaToHex(c);
        var valSpan = document.createElement('span'); valSpan.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.5);width:100px;overflow:hidden;'; valSpan.textContent = c;
        inp.addEventListener('input', function(){
          setter(this.value);
          valSpan.textContent = this.value;
          _dsSave();
          _redrawAllVisibleSprites();
        });
        row.appendChild(lbl); row.appendChild(inp); row.appendChild(valSpan);
        dsPanel.appendChild(row);
      }

      function _dsSliderRow(label, getter, setter, min, max, step){
        var row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
        var lbl = document.createElement('span'); lbl.style.cssText = 'flex:1;color:rgba(255,255,255,0.6);'; lbl.textContent = label;
        var inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = getter();
        inp.style.cssText = 'flex:2;';
        var valSpan = document.createElement('span'); valSpan.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.5);width:40px;text-align:right;'; valSpan.textContent = getter();
        inp.addEventListener('input', function(){
          setter(parseFloat(this.value));
          valSpan.textContent = this.value;
          _dsSave();
          _redrawAllVisibleSprites();
        });
        row.appendChild(lbl); row.appendChild(inp); row.appendChild(valSpan);
        dsPanel.appendChild(row);
      }

      // Title
      var title = document.createElement('div'); title.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;';
      title.innerHTML = '<span style="font-size:15px;font-weight:700;">Domino Style</span>';
      var closeBtn = document.createElement('button'); closeBtn.textContent = '\u00d7'; closeBtn.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;'; closeBtn.onclick = function(){ dsPanel.remove(); dsPanel = null; };
      title.appendChild(closeBtn); dsPanel.appendChild(title);

      // Face colors
      _dsHeader('Face Colors');
      _dsColorRow('Normal', function(){ return DOMINO_STYLE.FACE.NORMAL; }, function(v){ DOMINO_STYLE.FACE.NORMAL = v; });
      _dsColorRow('Highlighted', function(){ return DOMINO_STYLE.FACE.HIGHLIGHTED; }, function(v){ DOMINO_STYLE.FACE.HIGHLIGHTED = v; });

      // Back colors
      _dsHeader('Back Colors');
      _dsColorRow('Normal', function(){ return DOMINO_STYLE.BACK.NORMAL; }, function(v){ DOMINO_STYLE.BACK.NORMAL = v; });
      _dsColorRow('Highlighted', function(){ return DOMINO_STYLE.BACK.HIGHLIGHTED; }, function(v){ DOMINO_STYLE.BACK.HIGHLIGHTED = v; });

      // Edge colors
      _dsHeader('Edge Colors');
      _dsColorRow('Normal', function(){ return DOMINO_STYLE.EDGE.NORMAL; }, function(v){ DOMINO_STYLE.EDGE.NORMAL = v; _updateAllEdgeColors(); });
      _dsColorRow('Highlighted', function(){ return DOMINO_STYLE.EDGE.HIGHLIGHTED; }, function(v){ DOMINO_STYLE.EDGE.HIGHLIGHTED = v; _updateAllEdgeColors(); });

      // V12.6: Edge thickness
      _dsHeader('Edge Thickness');
      _dsSliderRow('Panel Separation', function(){ return DOMINO_STYLE.EDGE_THICKNESS; }, function(v){
        DOMINO_STYLE.EDGE_THICKNESS = v;
        _updateAllEdgeThickness();
      }, 0, 60, 1);

      // Border & Bevel
      _dsHeader('Border & Bevel');
      _dsColorRow('Border Color', function(){ return DOMINO_STYLE.BORDER_COLOR; }, function(v){ DOMINO_STYLE.BORDER_COLOR = v; });
      _dsSliderRow('Border Width', function(){ return DOMINO_STYLE.BORDER_WIDTH; }, function(v){ DOMINO_STYLE.BORDER_WIDTH = v; }, 0, 5, 0.1);
      _dsSliderRow('Bevel Opacity', function(){ return DOMINO_STYLE.BEVEL_OPACITY; }, function(v){ DOMINO_STYLE.BEVEL_OPACITY = v; }, 0, 1, 0.01);
      _dsSliderRow('Bevel Width', function(){ return DOMINO_STYLE.BEVEL_WIDTH; }, function(v){ DOMINO_STYLE.BEVEL_WIDTH = v; }, 0, 8, 0.5);

      // Invalid state
      _dsHeader('Invalid State');
      _dsSliderRow('Invalid Opacity', function(){ return DOMINO_STYLE.INVALID_OPACITY; }, function(v){ DOMINO_STYLE.INVALID_OPACITY = v; }, 0, 1, 0.01);

      // Size offsets
      _dsHeader('Size & Spacing Offsets');
      _dsSliderRow('Size Offset %', function(){ return window._dsSizeOffset || 0; }, function(v){
        window._dsSizeOffset = v;
        var base = 56, baseH = 112;
        var w = Math.round(base * (1 + v/100));
        var h = Math.round(baseH * (1 + v/100));
        document.documentElement.style.setProperty('--tileW', w + 'px');
        document.documentElement.style.setProperty('--tileH', h + 'px');
      }, -5, 5, 0.5);
      _dsSliderRow('Spacing Offset %', function(){ return window._dsSpacingOffset || 0; }, function(v){
        window._dsSpacingOffset = v;
        // Spacing is applied through layout recalculation on next render
      }, -5, 5, 0.5);

      document.body.appendChild(dsPanel);
    }

    // V12.6: Update edge colors and thickness on all visible sprites
    function _updateAllEdgeColors(){
      document.querySelectorAll('#spriteLayer .dominoSprite').forEach(function(el){
        if(el.redrawCanvases) el.redrawCanvases();
      });
    }
    function _updateAllEdgeThickness(){
      document.querySelectorAll('#spriteLayer .dominoSprite').forEach(function(el){
        if(el.updateEdgeThickness) el.updateEdgeThickness();
      });
    }

    function _rgbaToHex(rgba){
      if(!rgba || rgba.startsWith('#')) return rgba || '#ffffff';
      var m = rgba.match(/[\d.]+/g);
      if(!m || m.length < 3) return '#ffffff';
      var r = parseInt(m[0]), g = parseInt(m[1]), b = parseInt(m[2]);
      return '#' + [r,g,b].map(function(x){ return x.toString(16).padStart(2,'0'); }).join('');
    }

    function _dsSave(){
      try{
        var data = {
          FACE: DOMINO_STYLE.FACE,
          BACK: DOMINO_STYLE.BACK,
          EDGE: DOMINO_STYLE.EDGE,
          BORDER_COLOR: DOMINO_STYLE.BORDER_COLOR,
          BORDER_WIDTH: DOMINO_STYLE.BORDER_WIDTH,
          BEVEL_OPACITY: DOMINO_STYLE.BEVEL_OPACITY,
          BEVEL_WIDTH: DOMINO_STYLE.BEVEL_WIDTH,
          EDGE_THICKNESS: DOMINO_STYLE.EDGE_THICKNESS,
          INVALID_OPACITY: DOMINO_STYLE.INVALID_OPACITY,
          sizeOffset: window._dsSizeOffset || 0,
          spacingOffset: window._dsSpacingOffset || 0
        };
        localStorage.setItem(DS_STORAGE, JSON.stringify(data));
      }catch(e){}
    }

    // Load saved domino style on startup
    try{
      var saved = localStorage.getItem(DS_STORAGE);
      if(saved){
        var d = JSON.parse(saved);
        if(d.FACE){ Object.assign(DOMINO_STYLE.FACE, d.FACE); }
        if(d.BACK){ Object.assign(DOMINO_STYLE.BACK, d.BACK); }
        if(d.EDGE){ Object.assign(DOMINO_STYLE.EDGE, d.EDGE); }
        if(d.BORDER_COLOR !== undefined) DOMINO_STYLE.BORDER_COLOR = d.BORDER_COLOR;
        if(d.BORDER_WIDTH !== undefined) DOMINO_STYLE.BORDER_WIDTH = d.BORDER_WIDTH;
        if(d.BEVEL_OPACITY !== undefined) DOMINO_STYLE.BEVEL_OPACITY = d.BEVEL_OPACITY;
        if(d.BEVEL_WIDTH !== undefined) DOMINO_STYLE.BEVEL_WIDTH = d.BEVEL_WIDTH;
        if(d.EDGE_THICKNESS !== undefined) DOMINO_STYLE.EDGE_THICKNESS = d.EDGE_THICKNESS;
        if(d.INVALID_OPACITY !== undefined) DOMINO_STYLE.INVALID_OPACITY = d.INVALID_OPACITY;
        if(d.sizeOffset){
          window._dsSizeOffset = d.sizeOffset;
          var w = Math.round(56 * (1 + d.sizeOffset/100));
          var h = Math.round(112 * (1 + d.sizeOffset/100));
          document.documentElement.style.setProperty('--tileW', w + 'px');
          document.documentElement.style.setProperty('--tileH', h + 'px');
        }
        if(d.spacingOffset){ window._dsSpacingOffset = d.spacingOffset; }
      }
    }catch(e){}

    document.getElementById('dominoStyleBtn').addEventListener('click', showDominoStylePanel);
  })();

  // ==================== SHUFFLE SETTINGS PANEL ====================
  (function(){
    const SHUFFLE_STORAGE_KEY = 'tn51_shuffle_settings';

    // Load saved settings
    try {
      const saved = localStorage.getItem(SHUFFLE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(SHUFFLE_SETTINGS, parsed);
      }
    } catch(e){}

    function saveShuffle() {
      try { localStorage.setItem(SHUFFLE_STORAGE_KEY, JSON.stringify(SHUFFLE_SETTINGS)); } catch(e){}
    }

    const shufflePanel = document.createElement('div');
    shufflePanel.id = 'shuffleSettingsPanel';
    shufflePanel.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2000;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,0,0.3);border-radius:12px;padding:16px;max-width:340px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6);color:#fff;font-size:12px;';

    function buildShuffleHTML() {
      const SS = SHUFFLE_SETTINGS;
      function row(id, label, min, max, step, val, unit) {
        unit = unit || '';
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
          '<span style="width:90px;flex-shrink:0;color:rgba(255,255,255,0.7);">' + label + '</span>' +
          '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" style="flex:1;accent-color:#eab308;">' +
          '<span id="' + id + 'Val" style="width:48px;text-align:right;font-family:monospace;color:#eab308;">' + val + unit + '</span></div>';
      }
      let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid rgba(255,255,0,0.2);padding-bottom:8px;">' +
        '<span style="font-size:15px;font-weight:700;color:#eab308;">Shuffle Settings</span>' +
        '<button id="shufflePanelClose" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px;">&times;</button></div>';

      h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);">' +
        '<span style="width:90px;flex-shrink:0;color:rgba(255,255,255,0.7);">Panel BG</span>' +
        '<input type="range" id="ssPanelOpacity" min="0" max="100" step="5" value="95" style="flex:1;accent-color:#eab308;">' +
        '<span id="ssPanelOpacityVal" style="width:48px;text-align:right;font-family:monospace;color:#eab308;">95%</span></div>';

      h += '<div style="font-weight:600;margin-bottom:6px;color:rgba(255,255,255,0.5);">Flip Phase</div>';
      h += row('ssFlipDuration', 'Flip Spread', 500, 6000, 100, SS.flipDuration, 'ms');
      h += row('ssFlipAnimSpeed', 'Flip Speed', 100, 1000, 50, SS.flipAnimSpeed, 'ms');

      h += '<div style="font-weight:600;margin:8px 0 6px;color:rgba(255,255,255,0.5);">Slide to Center</div>';
      h += row('ssSlideSpeed', 'Slide Speed', 100, 1500, 50, SS.slideSpeed, 'ms');

      h += '<div style="font-weight:600;margin:8px 0 6px;color:rgba(255,255,255,0.5);">Reshuffle</div>';
      h += row('ssReshuffleSpeed', 'Speed', 50, 800, 25, SS.reshuffleSpeed, 'ms');
      h += row('ssReshuffleCount', 'Count', 1, 10, 1, SS.reshuffleCount, 'x');
      h += row('ssReshufflePause', 'Pause', 0, 300, 10, SS.reshufflePause, 'ms');

      h += '<div style="font-weight:600;margin:8px 0 6px;color:rgba(255,255,255,0.5);">Pile Position &amp; Spread</div>';
      h += row('ssCenterXPct', 'Center X', -25, 25, 1, SS.centerXPct || 0, '%');
      h += row('ssCenterYPct', 'Center Y', -25, 25, 1, SS.centerYPct || 0, '%');
      h += row('ssSpreadXPct', 'Spread X %', 5, 40, 1, SS.spreadXPct, '%');
      h += row('ssSpreadYPct', 'Spread Y %', 3, 30, 1, SS.spreadYPct, '%');
      h += row('ssSpreadXMax', 'Max X px', 50, 400, 10, SS.spreadXMax, 'px');
      h += row('ssSpreadYMax', 'Max Y px', 30, 300, 10, SS.spreadYMax, 'px');
      h += row('ssTileScale', 'Tile Scale', 0.15, 0.8, 0.01, SS.tileScale, '');
      h += '<div style="text-align:center;margin:6px 0;"><button id="ssPreviewArea" style="background:rgba(234,179,8,0.3);border:1px solid rgba(234,179,8,0.5);color:#eab308;padding:4px 12px;border-radius:6px;font-size:11px;cursor:pointer;">Show Shuffle Area</button></div>';

      h += '<div style="font-weight:600;margin:8px 0 6px;color:rgba(255,255,255,0.5);">Deal Phase</div>';
      h += row('ssDealStagger', 'Group Stagger', 0, 200, 5, SS.dealStagger, 'ms');
      h += row('ssDealSpeed', 'Deal Speed', 100, 800, 25, SS.dealSpeed, 'ms');
      h += row('ssGroupPause', 'Group Pause', 100, 1500, 50, SS.groupPause, 'ms');

      h += '<div style="text-align:center;margin-top:10px;"><button id="ssResetBtn" style="background:rgba(255,0,0,0.3);border:1px solid rgba(255,0,0,0.5);color:#fff;padding:4px 12px;border-radius:6px;font-size:11px;cursor:pointer;">Reset Defaults</button></div>';
      return h;
    }

    shufflePanel.innerHTML = buildShuffleHTML();
    document.body.appendChild(shufflePanel);

    // Backdrop
    const shuffleBD = document.createElement('div');
    shuffleBD.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1999;';
    document.body.appendChild(shuffleBD);

    function showShufflePanel() {
      shufflePanel.innerHTML = buildShuffleHTML();
      shufflePanel.style.display = 'block';
      shuffleBD.style.display = 'block';
      wireShuffleSliders();
    }
    function hideShufflePanel() {
      shufflePanel.style.display = 'none';
      shuffleBD.style.display = 'none';
    }

    shuffleBD.addEventListener('click', hideShufflePanel);

    const SLIDER_MAP = [
      { id: 'ssFlipDuration', key: 'flipDuration', unit: 'ms' },
      { id: 'ssFlipAnimSpeed', key: 'flipAnimSpeed', unit: 'ms' },
      { id: 'ssSlideSpeed', key: 'slideSpeed', unit: 'ms' },
      { id: 'ssReshuffleSpeed', key: 'reshuffleSpeed', unit: 'ms' },
      { id: 'ssReshuffleCount', key: 'reshuffleCount', unit: 'x' },
      { id: 'ssReshufflePause', key: 'reshufflePause', unit: 'ms' },
      { id: 'ssCenterXPct', key: 'centerXPct', unit: '%' },
      { id: 'ssCenterYPct', key: 'centerYPct', unit: '%' },
      { id: 'ssSpreadXPct', key: 'spreadXPct', unit: '%' },
      { id: 'ssSpreadYPct', key: 'spreadYPct', unit: '%' },
      { id: 'ssSpreadXMax', key: 'spreadXMax', unit: 'px' },
      { id: 'ssSpreadYMax', key: 'spreadYMax', unit: 'px' },
      { id: 'ssTileScale', key: 'tileScale', unit: '' },
      { id: 'ssDealStagger', key: 'dealStagger', unit: 'ms' },
      { id: 'ssDealSpeed', key: 'dealSpeed', unit: 'ms' },
      { id: 'ssGroupPause', key: 'groupPause', unit: 'ms' }
    ];

    // Corner preview: show 4 face-down dominoes at the shuffle area boundaries
    let _previewVisible = false;
    let _previewEls = [];

    function _showShuffleAreaPreview() {
      _removeShuffleAreaPreview();
      _previewVisible = true;
      const SS = SHUFFLE_SETTINGS;
      const rect = typeof getRect === 'function' ? getRect() : { width: window.innerWidth, height: window.innerHeight };
      const cx = rect.width * 0.5 - 28 + (rect.width * (SS.centerXPct || 0) / 100);
      const cy = rect.height * 0.45 - 56 + (rect.height * (SS.centerYPct || 0) / 100);
      const spreadX = Math.min(SS.spreadXMax, rect.width * SS.spreadXPct / 100);
      const spreadY = Math.min(SS.spreadYMax, rect.height * SS.spreadYPct / 100);

      // 4 corners + center marker
      const positions = [
        { x: cx - spreadX, y: cy - spreadY, label: 'TL' },
        { x: cx + spreadX, y: cy - spreadY, label: 'TR' },
        { x: cx - spreadX, y: cy + spreadY, label: 'BL' },
        { x: cx + spreadX, y: cy + spreadY, label: 'BR' },
        { x: cx, y: cy, label: '+' }
      ];

      const container = document.getElementById('tableMain') || document.body;
      for (const pos of positions) {
        const el = document.createElement('div');
        el.className = '_shufflePreview';
        el.style.cssText = 'position:absolute;z-index:1500;pointer-events:none;' +
          'width:40px;height:70px;border-radius:5px;' +
          'background:rgba(234,179,8,0.4);border:2px solid #eab308;' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-size:10px;font-weight:700;color:#eab308;font-family:monospace;';
        if (pos.label === '+') {
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.borderRadius = '50%';
          el.style.background = 'rgba(234,179,8,0.6)';
          el.style.left = (pos.x + 12) + 'px';
          el.style.top = (pos.y + 27) + 'px';
        } else {
          el.style.left = pos.x + 'px';
          el.style.top = pos.y + 'px';
        }
        el.textContent = pos.label;
        container.appendChild(el);
        _previewEls.push(el);
      }

      // Also draw a dashed rectangle outline
      const outline = document.createElement('div');
      outline.className = '_shufflePreview';
      outline.style.cssText = 'position:absolute;z-index:1499;pointer-events:none;' +
        'border:2px dashed rgba(234,179,8,0.5);border-radius:8px;';
      outline.style.left = (cx - spreadX) + 'px';
      outline.style.top = (cy - spreadY) + 'px';
      outline.style.width = (spreadX * 2 + 40) + 'px';
      outline.style.height = (spreadY * 2 + 70) + 'px';
      container.appendChild(outline);
      _previewEls.push(outline);

      // Auto-hide button text
      const btn = document.getElementById('ssPreviewArea');
      if (btn) btn.textContent = 'Hide Shuffle Area';
    }

    function _removeShuffleAreaPreview() {
      _previewVisible = false;
      for (const el of _previewEls) {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
      _previewEls = [];
      const btn = document.getElementById('ssPreviewArea');
      if (btn) btn.textContent = 'Show Shuffle Area';
    }

    function _updatePreviewIfVisible() {
      if (_previewVisible) _showShuffleAreaPreview();
    }

    function wireShuffleSliders() {
      for (const s of SLIDER_MAP) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        el.addEventListener('input', function() {
          const v = s.key === 'tileScale' ? parseFloat(this.value) : parseInt(this.value);
          SHUFFLE_SETTINGS[s.key] = v;
          const valEl = document.getElementById(s.id + 'Val');
          if (valEl) valEl.textContent = this.value + s.unit;
          saveShuffle();
          // Live update preview when adjusting position/spread sliders
          if (['centerXPct','centerYPct','spreadXPct','spreadYPct','spreadXMax','spreadYMax'].includes(s.key)) {
            _updatePreviewIfVisible();
          }
        });
      }

      // Panel opacity slider
      const opSlider = document.getElementById('ssPanelOpacity');
      if (opSlider) {
        opSlider.addEventListener('input', function() {
          const v = parseInt(this.value);
          const valEl = document.getElementById('ssPanelOpacityVal');
          if (valEl) valEl.textContent = v + '%';
          shufflePanel.style.background = v === 0 ? 'transparent' :
            'linear-gradient(135deg, rgba(30,41,59,' + (v/100) + '), rgba(15,23,42,' + (v/100) + '))';
          shufflePanel.style.boxShadow = v < 20 ? 'none' : '0 8px 32px rgba(0,0,0,' + (v/100 * 0.6) + ')';
        });
      }

      // Preview area toggle
      const previewBtn = document.getElementById('ssPreviewArea');
      if (previewBtn) {
        previewBtn.addEventListener('click', function() {
          if (_previewVisible) { _removeShuffleAreaPreview(); }
          else { _showShuffleAreaPreview(); }
        });
      }

      const closeBtn = document.getElementById('shufflePanelClose');
      if (closeBtn) closeBtn.addEventListener('click', function() {
        _removeShuffleAreaPreview();
        hideShufflePanel();
      });

      const resetBtn = document.getElementById('ssResetBtn');
      if (resetBtn) resetBtn.addEventListener('click', function() {
        SHUFFLE_SETTINGS.flipDuration = 3000;
        SHUFFLE_SETTINGS.flipAnimSpeed = 300;
        SHUFFLE_SETTINGS.slideSpeed = 400;
        SHUFFLE_SETTINGS.reshuffleSpeed = 200;
        SHUFFLE_SETTINGS.reshuffleCount = 3;
        SHUFFLE_SETTINGS.reshufflePause = 50;
        SHUFFLE_SETTINGS.centerXPct = 0;
        SHUFFLE_SETTINGS.centerYPct = 0;
        SHUFFLE_SETTINGS.spreadXPct = 15;
        SHUFFLE_SETTINGS.spreadYPct = 10;
        SHUFFLE_SETTINGS.spreadXMax = 120;
        SHUFFLE_SETTINGS.spreadYMax = 80;
        SHUFFLE_SETTINGS.tileScale = 0.38;
        SHUFFLE_SETTINGS.dealStagger = 40;
        SHUFFLE_SETTINGS.dealSpeed = 300;
        SHUFFLE_SETTINGS.groupPause = 400;
        saveShuffle();
        _removeShuffleAreaPreview();
        shufflePanel.innerHTML = buildShuffleHTML();
        wireShuffleSliders();
      });
    }

    // Clean up preview when panel backdrop is clicked
    shuffleBD.addEventListener('click', function() {
      _removeShuffleAreaPreview();
      hideShufflePanel();
    });

    document.getElementById('shuffleSettingsBtn').addEventListener('click', showShufflePanel);
  })();

  // ==================== PIP DETAILS PANEL ====================
  (function(){
    const PIPFX_STORAGE_KEY = 'tn51_pipfx_details';
    const PIP_COLORS_STORAGE_KEY = 'tn51_pip_colors';

    // Create Pip Details popup
    const pipDetailsPopup = document.createElement('div');
    pipDetailsPopup.id = 'pipDetailsPopup';
    pipDetailsPopup.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2000;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px;max-width:340px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6);color:#fff;font-size:12px;';

    let pdHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;"><span style="font-size:15px;font-weight:700;">Pip Details</span><button id="pipDetailsClose" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px;">&times;</button></div>';
    pdHTML += '<div id="pdPreviewRow" style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;overflow-x:auto;"></div>';

    // Ring settings
    pdHTML += '<div style="font-weight:600;margin-bottom:6px;color:rgba(255,255,255,0.7);">Ring</div>';
    pdHTML += sliderRow('pdRingWidth', 'Width', 0, 0.9, 0.01, DOMINO_STYLE.PIPFX_RING_WIDTH_RATIO);
    pdHTML += sliderRow('pdRingOpacity', 'Opacity', 0, 1, 0.01, DOMINO_STYLE.PIPFX_RING_OPACITY);

    // Highlight 1
    pdHTML += '<div style="font-weight:600;margin:10px 0 6px;color:rgba(255,255,255,0.7);">Highlight 1 (Large)</div>';
    pdHTML += sliderRow('pdHi1Opacity', 'Opacity', 0, 1, 0.01, DOMINO_STYLE.PIPFX_HI1_OPACITY);
    pdHTML += sliderRow('pdHi1Size', 'Size', 0.02, 2, 0.01, DOMINO_STYLE.PIPFX_HI1_SIZE);
    pdHTML += sliderRow('pdHi1Dx', 'Offset X', -1, 1, 0.01, DOMINO_STYLE.PIPFX_HI1_DX);
    pdHTML += sliderRow('pdHi1Dy', 'Offset Y', -1, 1, 0.01, DOMINO_STYLE.PIPFX_HI1_DY);

    // Highlight 2
    pdHTML += '<div style="font-weight:600;margin:10px 0 6px;color:rgba(255,255,255,0.7);">Highlight 2 (Small)</div>';
    pdHTML += sliderRow('pdHi2Opacity', 'Opacity', 0, 1, 0.01, DOMINO_STYLE.PIPFX_HI2_OPACITY);
    pdHTML += sliderRow('pdHi2Size', 'Size', 0.02, 2, 0.01, DOMINO_STYLE.PIPFX_HI2_SIZE);
    pdHTML += sliderRow('pdHi2Dx', 'Offset X', -1, 1, 0.01, DOMINO_STYLE.PIPFX_HI2_DX);
    pdHTML += sliderRow('pdHi2Dy', 'Offset Y', -1, 1, 0.01, DOMINO_STYLE.PIPFX_HI2_DY);

    // Gradient
    pdHTML += '<div style="font-weight:600;margin:10px 0 6px;color:rgba(255,255,255,0.7);">Gradient</div>';
    pdHTML += checkRow('pdGradient', 'Radial Gradient', DOMINO_STYLE.PIPFX_GRADIENT);

    // Lock to screen
    pdHTML += checkRow('pdLockScreen', 'Lock Highlights to Viewer', DOMINO_STYLE.PIPFX_HI_LOCK_SCREEN);

    // Center line
    pdHTML += '<div style="font-weight:600;margin:10px 0 6px;color:rgba(255,255,255,0.7);">Center Line</div>';
    pdHTML += colorRow('pdLineColor', 'Line Color', DOMINO_STYLE.FANCY_LINE_COLOR || 'rgba(0,0,0,0.90)');
    pdHTML += colorRow('pdHiColor', 'Highlight Color', DOMINO_STYLE.CENTER_LINE_HI_COLOR || 'rgba(255,255,255,1)');
    pdHTML += sliderRow('pdHiOpacity', 'Highlight Opacity', 0, 1, 0.01, DOMINO_STYLE.CENTER_LINE_HI_OPACITY);
    pdHTML += sliderRow('pdHiWidthRatio', 'Highlight Width', 0, 1, 0.01, DOMINO_STYLE.CENTER_LINE_HI_WIDTH_RATIO);
    pdHTML += sliderRow('pdHiYOffset', 'Highlight Y Offset', -5, 5, 0.1, DOMINO_STYLE.CENTER_LINE_HI_Y_OFFSET_PX);
    pdHTML += colorRow('pdShColor', 'Shadow Color', DOMINO_STYLE.CENTER_LINE_SH_COLOR || 'rgba(0,0,0,1)');
    pdHTML += sliderRow('pdShOpacity', 'Shadow Opacity', 0, 1, 0.01, DOMINO_STYLE.CENTER_LINE_SH_OPACITY);
    pdHTML += sliderRow('pdShWidthRatio', 'Shadow Width', 0, 1, 0.01, DOMINO_STYLE.CENTER_LINE_SH_WIDTH_RATIO);
    pdHTML += sliderRow('pdShYOffset', 'Shadow Y Offset', -5, 5, 0.1, DOMINO_STYLE.CENTER_LINE_SH_Y_OFFSET_PX);

    // Pip Scale
    pdHTML += '<div style="font-weight:600;margin:10px 0 6px;color:rgba(255,255,255,0.7);">General</div>';
    pdHTML += sliderRow('pdPipScale', 'Pip Scale', 0.5, 2.1, 0.05, DOMINO_STYLE.PIP_SCALE);

    // Preset selector
    pdHTML += '<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;"><div style="font-weight:600;margin-bottom:6px;color:rgba(255,255,255,0.7);">Presets</div>';
    pdHTML += '<div id="pdPresetList" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;"></div>';
    pdHTML += '<div style="display:flex;gap:6px;"><input type="text" id="pdPresetName" placeholder="Preset name..." style="flex:1;padding:4px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;font-size:11px;"><button id="pdSavePreset" style="padding:4px 10px;border-radius:4px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:11px;white-space:nowrap;">Save As</button></div></div>';
    // Buttons
    pdHTML += '<div style="display:flex;gap:8px;margin-top:12px;justify-content:center;"><button id="pdReset" style="padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:11px;">Reset Defaults</button><button id="pdSave" style="padding:6px 14px;border-radius:6px;border:none;background:#22c55e;color:#fff;cursor:pointer;font-size:11px;font-weight:600;">Save</button></div>';

    pipDetailsPopup.innerHTML = pdHTML;
    document.body.appendChild(pipDetailsPopup);

    // Backdrop
    const pdBackdrop = document.createElement('div');
    pdBackdrop.id = 'pipDetailsBackdrop';
    pdBackdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:1999;background:rgba(0,0,0,0.5);';
    pdBackdrop.addEventListener('click', function(){ closePipDetails(); });
    document.body.appendChild(pdBackdrop);

    function sliderRow(id, label, min, max, step, value){
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="min-width:90px;font-size:11px;">'+label+'</span><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" style="flex:1;height:4px;accent-color:#3b82f6;"><span id="'+id+'Val" style="min-width:36px;text-align:right;font-size:10px;font-family:monospace;">'+value+'</span></div>';
    }
    function checkRow(id, label, checked){
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="min-width:180px;font-size:11px;">'+label+'</span><input type="checkbox" id="'+id+'" '+(checked?'checked':'')+' style="accent-color:#3b82f6;"></div>';
    }
    function colorRow(id, label, value){
      // Convert rgba to hex for input
      const hex = rgbaToHex(value);
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="min-width:90px;font-size:11px;">'+label+'</span><input type="color" id="'+id+'" value="'+hex+'" style="width:32px;height:24px;border:none;background:none;cursor:pointer;"><span id="'+id+'Val" style="font-size:10px;font-family:monospace;">'+hex+'</span></div>';
    }
    function rgbaToHex(rgba){
      if(rgba.startsWith('#')) return rgba.substring(0,7);
      const m = rgba.match(/[\d.]+/g);
      if(!m) return '#000000';
      const r = Math.round(parseFloat(m[0]));
      const g = Math.round(parseFloat(m[1]));
      const b = Math.round(parseFloat(m[2]));
      return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    }
    function hexToRgba(hex, alpha){
      alpha = alpha || 1;
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return 'rgba('+r+','+g+','+b+','+alpha+')';
    }

    function redrawAllSprites(){
      try{
        // Redraw hand sprites
        for(const seat of sprites){
          if(!seat) continue;
          for(const d of seat){
            if(d && d.sprite && typeof d.sprite.redrawCanvases==="function") d.sprite.redrawCanvases();
          }
        }
        // Redraw current trick sprites
        if(typeof playedThisTrick !== 'undefined'){
          for(const pt of playedThisTrick){
            if(pt && pt.sprite && typeof pt.sprite.redrawCanvases==="function") pt.sprite.redrawCanvases();
          }
        }
        // Redraw ALL sprites in spriteLayer (catches trick history tiles)
        const sl = document.getElementById('spriteLayer');
        if(sl){
          for(const child of sl.children){
            if(child && typeof child.redrawCanvases==="function") child.redrawCanvases();
          }
        }
      }catch(e){}
      // Also redraw preview canvases
      renderPreviews();
    }

    // Preview domino rendering
    const previewTiles = [[3,5],[6,6],[0,4],[2,7],[1,1]];
    function renderPreviews(){
      const containers = [document.getElementById('pdPreviewRow'), document.getElementById('pcPreviewRow')];
      for(const container of containers){
        if(!container || container.style.display === 'none') continue;
        // Create or reuse canvases
        if(container.children.length === 0){
          for(let i = 0; i < previewTiles.length; i++){
            const cvs = document.createElement('canvas');
            cvs.width = 42; cvs.height = 84;
            cvs.style.cssText = 'width:42px;height:84px;border-radius:4px;flex-shrink:0;';
            container.appendChild(cvs);
          }
        }
        for(let i = 0; i < previewTiles.length; i++){
          const cvs = container.children[i];
          if(!cvs) continue;
          const ctx = cvs.getContext('2d');
          drawFace(ctx, previewTiles[i], 42, 84, i===0, true, 0);
        }
      }
    }

    // ==================== COMBINED PRESET SYSTEM ====================
    const PIP_PRESETS_KEY = 'tn51_pip_presets';

    // Built-in presets
    const BUILTIN_PRESETS = {
      'Classic': {
        colors: {0:"rgba(20,20,22,0.95)",1:"rgba(54,178,88,0.98)",2:"rgba(240,199,61,0.98)",3:"rgba(231,76,60,0.98)",4:"rgba(0,178,255,0.98)",5:"rgba(155,89,182,0.98)",6:"rgba(167,110,52,0.98)",7:"rgba(59,130,246,0.98)"},
        details: {PIPFX_RING_WIDTH_RATIO:0.34,PIPFX_RING_OPACITY:0.06,PIPFX_HI1_OPACITY:0.33,PIPFX_HI2_OPACITY:0.22,PIPFX_HI1_SIZE:0.85,PIPFX_HI2_SIZE:0.24,PIPFX_HI1_DX:-0.60,PIPFX_HI1_DY:-0.46,PIPFX_HI2_DX:-0.12,PIPFX_HI2_DY:-0.10,PIPFX_GRADIENT:true,PIPFX_HI_LOCK_SCREEN:true,PIP_SCALE:2.05,FANCY_LINE_COLOR:'rgba(0,0,0,0.90)',CENTER_LINE_HI_COLOR:'rgba(255,255,255,1)',CENTER_LINE_HI_OPACITY:0.45,CENTER_LINE_HI_WIDTH_RATIO:0.40,CENTER_LINE_HI_Y_OFFSET_PX:-1.6,CENTER_LINE_SH_COLOR:'rgba(0,0,0,1)',CENTER_LINE_SH_OPACITY:0.30,CENTER_LINE_SH_WIDTH_RATIO:0.32,CENTER_LINE_SH_Y_OFFSET_PX:1.6},
        pipFx: false, fancyLine: false
      },
      'Custom Dark': {
        colors: {0:"rgba(0,0,0,0.98)",1:"rgba(0,103,94,0.98)",2:"rgba(0,130,0,0.98)",3:"rgba(182,19,17,0.98)",4:"rgba(102,56,0,0.98)",5:"rgba(0,0,169,0.98)",6:"rgba(255,126,19,0.98)",7:"rgba(255,38,133,0.98)"},
        details: {PIPFX_RING_WIDTH_RATIO:0.3,PIPFX_RING_OPACITY:0.09,PIPFX_HI1_OPACITY:0.79,PIPFX_HI2_OPACITY:0.39,PIPFX_HI1_SIZE:0.5,PIPFX_HI2_SIZE:1.25,PIPFX_HI1_DX:-0.6,PIPFX_HI1_DY:-0.46,PIPFX_HI2_DX:-0.36,PIPFX_HI2_DY:-0.35,PIPFX_GRADIENT:true,PIPFX_HI_LOCK_SCREEN:true,PIP_SCALE:2.1,FANCY_LINE_COLOR:'rgba(0,0,0,0.90)',CENTER_LINE_HI_COLOR:'rgba(255,255,255,1)',CENTER_LINE_HI_OPACITY:0.4,CENTER_LINE_HI_WIDTH_RATIO:0.35,CENTER_LINE_HI_Y_OFFSET_PX:-0.7,CENTER_LINE_SH_COLOR:'rgba(0,0,0,1)',CENTER_LINE_SH_OPACITY:0,CENTER_LINE_SH_WIDTH_RATIO:0.2,CENTER_LINE_SH_Y_OFFSET_PX:1.6},
        pipFx: true, fancyLine: true
      }
    };

    function getAllPipPresets(){
      const saved = loadFromStorage(PIP_PRESETS_KEY) || {};
      // Merge builtins (builtins can be overwritten by user saves)
      const merged = Object.assign({}, BUILTIN_PRESETS, saved);
      return merged;
    }

    // V10_108: Fix #14 — Export All Settings for hardcoding built-in presets
    window.exportAllSettings = function(){
      var dump = {};
      // Pip preset (colors + details + toggles)
      dump.pipPreset = collectCurrentPreset();
      // DOMINO_STYLE face/back/edge colors + all style params
      dump.dominoStyle = {
        FACE: JSON.parse(JSON.stringify(DOMINO_STYLE.FACE)),
        BACK: JSON.parse(JSON.stringify(DOMINO_STYLE.BACK)),
        EDGE: JSON.parse(JSON.stringify(DOMINO_STYLE.EDGE)),
        BORDER_COLOR: DOMINO_STYLE.BORDER_COLOR,
        BORDER_WIDTH: DOMINO_STYLE.BORDER_WIDTH,
        CENTER_LINE_WIDTH: DOMINO_STYLE.CENTER_LINE_WIDTH,
        CENTER_LINE_COLOR: DOMINO_STYLE.CENTER_LINE_COLOR,
        BEVEL_OPACITY: DOMINO_STYLE.BEVEL_OPACITY,
        BEVEL_COLOR: DOMINO_STYLE.BEVEL_COLOR,
        BEVEL_WIDTH: DOMINO_STYLE.BEVEL_WIDTH,
        INVALID_OPACITY: DOMINO_STYLE.INVALID_OPACITY,
        PIP_SCALE: DOMINO_STYLE.PIP_SCALE,
        DISPLAY_PIP_SCALE: DOMINO_STYLE.DISPLAY_PIP_SCALE,
        EDGE_THICKNESS: DOMINO_STYLE.EDGE_THICKNESS,
        sizeOffset: window._dsSizeOffset || 0,
        spacingOffset: window._dsSpacingOffset || 0
      };
      // CSS tile dimensions
      var _rs = getComputedStyle(document.documentElement);
      dump.tileDimensions = {
        tileW: _rs.getPropertyValue('--tileW'),
        tileH: _rs.getPropertyValue('--tileH'),
        borderRadius: _rs.getPropertyValue('--r')
      };
      // Boneyard style + panel position
      dump.boneyard = {
        BY2_GAP: window.BY2_GAP,
        BY2_PLAYED_OPACITY: window.BY2_PLAYED_OPACITY,
        BY2_INNER_SIZE: window.BY2_INNER_SIZE,
        BY2_INNER_RADIUS: window.BY2_INNER_RADIUS,
        BY2_INNER_COLOR: window.BY2_INNER_COLOR,
        BY2_OUTER_SIZE: window.BY2_OUTER_SIZE,
        BY2_OUTER_RADIUS: window.BY2_OUTER_RADIUS,
        BY2_OUTER_COLOR: window.BY2_OUTER_COLOR,
        panelX: parseFloat(_rs.getPropertyValue('--th-left')) || 4.5,
        panelY: parseFloat(_rs.getPropertyValue('--th-top')) || 14,
        panelW: parseFloat(_rs.getPropertyValue('--th-width')) || 90,
        panelH: parseFloat(_rs.getPropertyValue('--th-height')) || 22
      };
      // Moon settings + widow pos + placeholders
      if(typeof MOON_SETTINGS !== 'undefined') dump.moonSettings = JSON.parse(JSON.stringify(MOON_SETTINGS));
      if(typeof PLACEHOLDER_CONFIG_MOON !== 'undefined') dump.moonPlaceholders = JSON.parse(JSON.stringify(PLACEHOLDER_CONFIG_MOON));
      if(typeof MOON_WIDOW_POS !== 'undefined') dump.moonWidowPos = JSON.parse(JSON.stringify(MOON_WIDOW_POS));
      // T42 settings + placeholders
      if(typeof T42_SETTINGS !== 'undefined') dump.t42Settings = JSON.parse(JSON.stringify(T42_SETTINGS));
      if(typeof PLACEHOLDER_CONFIG_T42 !== 'undefined') dump.t42Placeholders = JSON.parse(JSON.stringify(PLACEHOLDER_CONFIG_T42));
      // TN51 settings + placeholders
      if(typeof TN51_SETTINGS !== 'undefined') dump.tn51Settings = JSON.parse(JSON.stringify(TN51_SETTINGS));
      if(typeof PLACEHOLDER_CONFIG !== 'undefined') dump.tn51Placeholders = JSON.parse(JSON.stringify(PLACEHOLDER_CONFIG));
      // Game rule settings
      dump.gameSettings = {
        FLIP_TRUMP_ENABLED: window.FLIP_TRUMP_ENABLED,
        HINT_MODE: window.HINT_MODE,
        nelloDeclareMode: window.nelloDeclareMode,
        nelloRestrictFirst: window.nelloRestrictFirst,
        nelloDoublesMode: window.nelloDoublesMode,
        callForDoubleEnabled: window.callForDoubleEnabled,
        doublesFollowMe: window.doublesFollowMe
      };
      // Animation speed
      dump.animSpeed = (typeof SPEED_MULTIPLIER !== 'undefined') ? Math.round(SPEED_MULTIPLIER * 100) : 200;
      // Deal mode
      // Shuffle settings
      if(typeof SHUFFLE_SETTINGS !== 'undefined') dump.shuffleSettings = JSON.parse(JSON.stringify(SHUFFLE_SETTINGS));
      // Hint settings
      dump.hintStyle = {
        thickness: window._hintThickness,
        feather: window._hintFeather,
        color: window._hintColor
      };
      // Sound settings
      dump.soundSettings = {
        sfxVolume: (typeof SFX !== 'undefined' && SFX.sfxVolume !== undefined) ? SFX.sfxVolume : 1,
        sfxMuted: (typeof SFX !== 'undefined' && SFX.sfxMuted !== undefined) ? SFX.sfxMuted : false,
        bgmVolume: (typeof SFX !== 'undefined' && SFX.bgmVolume !== undefined) ? SFX.bgmVolume : 0.5,
        bgmMuted: (typeof SFX !== 'undefined' && SFX.bgmMuted !== undefined) ? SFX.bgmMuted : false
      };
      // Aspect ratio
      try {
        var arW = parseFloat(_rs.getPropertyValue('--ar-w')) || 414;
        var arH = parseFloat(_rs.getPropertyValue('--ar-h')) || 896;
        dump.aspectRatio = { w: arW, h: arH };
      } catch(e){}
      // V12.10: Screen info + letterbox state
      dump.screenInfo = {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        screenWidth: window.screen ? window.screen.width : null,
        screenHeight: window.screen ? window.screen.height : null
      };
      dump.letterboxEnabled = (typeof window._letterboxEnabled === 'function') ? window._letterboxEnabled() : true;
      // Show in popup textarea
      var area = document.createElement('textarea');
      area.value = JSON.stringify(dump, null, 2);
      area.style.cssText = 'position:fixed;top:10%;left:10%;width:80%;height:80%;z-index:9999;font-family:monospace;font-size:11px;background:#1a1a2e;color:#0f0;border:2px solid #333;border-radius:8px;padding:12px;';
      area.onclick = function(){ area.select(); };
      var close = document.createElement('button');
      close.textContent = 'Close';
      close.style.cssText = 'position:fixed;top:8%;right:12%;z-index:10000;background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 16px;cursor:pointer;font-size:12px;';
      close.onclick = function(){ area.remove(); close.remove(); };
      document.body.appendChild(area);
      document.body.appendChild(close);
      area.select();
    };
    function savePipPreset(name, data){
      const saved = loadFromStorage(PIP_PRESETS_KEY) || {};
      saved[name] = data;
      saveToStorage(PIP_PRESETS_KEY, saved);
    }

    function collectCurrentPreset(){
      const colors = {};
      for(let p = 0; p <= 7; p++) colors[p] = DOMINO_STYLE.PIP_COLORS[p];
      const details = {};
      ['PIPFX_RING_WIDTH_RATIO','PIPFX_RING_OPACITY','PIPFX_HI1_OPACITY','PIPFX_HI2_OPACITY','PIPFX_HI1_SIZE','PIPFX_HI2_SIZE','PIPFX_HI1_DX','PIPFX_HI1_DY','PIPFX_HI2_DX','PIPFX_HI2_DY','PIPFX_GRADIENT','PIPFX_HI_LOCK_SCREEN','PIP_SCALE','FANCY_LINE_COLOR','CENTER_LINE_HI_COLOR','CENTER_LINE_HI_OPACITY','CENTER_LINE_HI_WIDTH_RATIO','CENTER_LINE_HI_Y_OFFSET_PX','CENTER_LINE_SH_COLOR','CENTER_LINE_SH_OPACITY','CENTER_LINE_SH_WIDTH_RATIO','CENTER_LINE_SH_Y_OFFSET_PX'].forEach(function(k){ details[k] = DOMINO_STYLE[k]; });
      return {colors, details, pipFx: DOMINO_STYLE.PIPFX_ENABLED, fancyLine: DOMINO_STYLE.FANCY_LINE_ENABLED};
    }

    function applyPreset(preset){
      if(!preset) return;
      // Apply colors
      if(preset.colors){
        Object.keys(preset.colors).forEach(function(k){
          const pip = parseInt(k);
          if(!isNaN(pip) && pip >= 0 && pip <= 7) DOMINO_STYLE.PIP_COLORS[pip] = preset.colors[k];
        });
      }
      // Apply details
      if(preset.details){
        Object.keys(preset.details).forEach(function(k){
          if(k in DOMINO_STYLE) DOMINO_STYLE[k] = preset.details[k];
        });
      }
      // Apply toggles
      if(typeof preset.pipFx === 'boolean'){
        DOMINO_STYLE.PIPFX_ENABLED = preset.pipFx;
        const chk = document.getElementById('chkPipFx');
        if(chk){ chk.checked = preset.pipFx; chk.dispatchEvent(new Event('change')); }
      }
      if(typeof preset.fancyLine === 'boolean'){
        DOMINO_STYLE.FANCY_LINE_ENABLED = preset.fancyLine;
        const chk = document.getElementById('chkFancyLine');
        if(chk){ chk.checked = preset.fancyLine; chk.dispatchEvent(new Event('change')); }
      }
      // Persist
      saveToStorage(PIPFX_STORAGE_KEY, preset.details || {});
      const colorData = {};
      for(let p = 0; p <= 7; p++) colorData[p] = DOMINO_STYLE.PIP_COLORS[p];
      saveToStorage(PIP_COLORS_STORAGE_KEY, colorData);
      // Redraw
      redrawAllSprites();
    }

    // Slider bindings (pip details)
    const pdBindings = [
      {id:'pdRingWidth', prop:'PIPFX_RING_WIDTH_RATIO'},
      {id:'pdRingOpacity', prop:'PIPFX_RING_OPACITY'},
      {id:'pdHi1Opacity', prop:'PIPFX_HI1_OPACITY'},
      {id:'pdHi1Size', prop:'PIPFX_HI1_SIZE'},
      {id:'pdHi1Dx', prop:'PIPFX_HI1_DX'},
      {id:'pdHi1Dy', prop:'PIPFX_HI1_DY'},
      {id:'pdHi2Opacity', prop:'PIPFX_HI2_OPACITY'},
      {id:'pdHi2Size', prop:'PIPFX_HI2_SIZE'},
      {id:'pdHi2Dx', prop:'PIPFX_HI2_DX'},
      {id:'pdHi2Dy', prop:'PIPFX_HI2_DY'},
      {id:'pdPipScale', prop:'PIP_SCALE'},
      {id:'pdHiOpacity', prop:'CENTER_LINE_HI_OPACITY'},
      {id:'pdHiWidthRatio', prop:'CENTER_LINE_HI_WIDTH_RATIO'},
      {id:'pdHiYOffset', prop:'CENTER_LINE_HI_Y_OFFSET_PX'},
      {id:'pdShOpacity', prop:'CENTER_LINE_SH_OPACITY'},
      {id:'pdShWidthRatio', prop:'CENTER_LINE_SH_WIDTH_RATIO'},
      {id:'pdShYOffset', prop:'CENTER_LINE_SH_Y_OFFSET_PX'}
    ];
    pdBindings.forEach(function(b){
      const el = document.getElementById(b.id);
      if(!el) return;
      el.addEventListener('input', function(){
        DOMINO_STYLE[b.prop] = parseFloat(this.value);
        const valEl = document.getElementById(b.id+'Val');
        if(valEl) valEl.textContent = this.value;
        redrawAllSprites();
      });
    });

    // Checkbox bindings
    const pdGrad = document.getElementById('pdGradient');
    if(pdGrad) pdGrad.addEventListener('change', function(){ DOMINO_STYLE.PIPFX_GRADIENT = this.checked; redrawAllSprites(); });
    const pdLock = document.getElementById('pdLockScreen');
    if(pdLock) pdLock.addEventListener('change', function(){ DOMINO_STYLE.PIPFX_HI_LOCK_SCREEN = this.checked; redrawAllSprites(); });

    // Color bindings
    const pdColorBindings = [
      {id:'pdLineColor', prop:'FANCY_LINE_COLOR', alpha:0.90},
      {id:'pdHiColor', prop:'CENTER_LINE_HI_COLOR', alpha:1},
      {id:'pdShColor', prop:'CENTER_LINE_SH_COLOR', alpha:1}
    ];
    pdColorBindings.forEach(function(b){
      const el = document.getElementById(b.id);
      if(!el) return;
      el.addEventListener('input', function(){
        DOMINO_STYLE[b.prop] = hexToRgba(this.value, b.alpha);
        const valEl = document.getElementById(b.id+'Val');
        if(valEl) valEl.textContent = this.value;
        redrawAllSprites();
      });
    });

    // Save / Reset / Close
    document.getElementById('pdSave').addEventListener('click', function(){
      const data = {};
      pdBindings.forEach(function(b){ data[b.prop] = DOMINO_STYLE[b.prop]; });
      data.PIPFX_GRADIENT = DOMINO_STYLE.PIPFX_GRADIENT;
      data.PIPFX_HI_LOCK_SCREEN = DOMINO_STYLE.PIPFX_HI_LOCK_SCREEN;
      pdColorBindings.forEach(function(b){ data[b.prop] = DOMINO_STYLE[b.prop]; });
      saveToStorage(PIPFX_STORAGE_KEY, data);
      closePipDetails();
    });
    document.getElementById('pdReset').addEventListener('click', function(){
      const defaults = {PIPFX_RING_WIDTH_RATIO:0.34,PIPFX_RING_OPACITY:0.06,PIPFX_HI1_OPACITY:0.33,PIPFX_HI2_OPACITY:0.22,PIPFX_HI1_SIZE:0.85,PIPFX_HI2_SIZE:0.24,PIPFX_HI1_DX:-0.60,PIPFX_HI1_DY:-0.46,PIPFX_HI2_DX:-0.12,PIPFX_HI2_DY:-0.10,PIPFX_GRADIENT:true,PIPFX_HI_LOCK_SCREEN:true,PIP_SCALE:2.05,FANCY_LINE_COLOR:'rgba(0,0,0,0.90)',CENTER_LINE_HI_COLOR:'rgba(255,255,255,1)',CENTER_LINE_HI_OPACITY:0.45,CENTER_LINE_HI_WIDTH_RATIO:0.40,CENTER_LINE_HI_Y_OFFSET_PX:-1.6,CENTER_LINE_SH_COLOR:'rgba(0,0,0,1)',CENTER_LINE_SH_OPACITY:0.30,CENTER_LINE_SH_WIDTH_RATIO:0.32,CENTER_LINE_SH_Y_OFFSET_PX:1.6};
      Object.assign(DOMINO_STYLE, defaults);
      // Update sliders
      pdBindings.forEach(function(b){
        const el = document.getElementById(b.id);
        if(el){ el.value = DOMINO_STYLE[b.prop]; const vEl=document.getElementById(b.id+'Val'); if(vEl) vEl.textContent=DOMINO_STYLE[b.prop]; }
      });
      if(pdGrad) pdGrad.checked = DOMINO_STYLE.PIPFX_GRADIENT;
      if(pdLock) pdLock.checked = DOMINO_STYLE.PIPFX_HI_LOCK_SCREEN;
      pdColorBindings.forEach(function(b){
        const el=document.getElementById(b.id);
        if(el){ el.value = rgbaToHex(DOMINO_STYLE[b.prop]); const vEl=document.getElementById(b.id+'Val'); if(vEl) vEl.textContent=el.value; }
      });
      localStorage.removeItem(PIPFX_STORAGE_KEY);
      redrawAllSprites();
    });
    document.getElementById('pipDetailsClose').addEventListener('click', closePipDetails);

    function renderPresetList(containerId, onSelect){
      const container = document.getElementById(containerId);
      if(!container) return;
      container.innerHTML = '';
      const presets = getAllPipPresets();
      Object.keys(presets).forEach(function(name){
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.style.cssText = 'padding:4px 10px;border-radius:4px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:10px;';
        btn.addEventListener('click', function(){
          applyPreset(presets[name]);
          if(onSelect) onSelect();
        });
        container.appendChild(btn);
      });
    }

    // Save preset button for Pip Details
    document.getElementById('pdSavePreset').addEventListener('click', function(){
      const nameEl = document.getElementById('pdPresetName');
      const name = (nameEl.value || '').trim();
      if(!name){ alert('Enter a preset name'); return; }
      savePipPreset(name, collectCurrentPreset());
      nameEl.value = '';
      renderPresetList('pdPresetList', function(){ syncPipDetailsUI(); renderPreviews(); });
      renderPresetList('pcPresetList', function(){ syncPipColorsUI(); renderPreviews(); });
    });

    function syncPipDetailsUI(){
      pdBindings.forEach(function(b){
        const el = document.getElementById(b.id);
        if(el){ el.value = DOMINO_STYLE[b.prop]; var vEl=document.getElementById(b.id+'Val'); if(vEl) vEl.textContent=DOMINO_STYLE[b.prop]; }
      });
      var g = document.getElementById('pdGradient'); if(g) g.checked = DOMINO_STYLE.PIPFX_GRADIENT;
      var l = document.getElementById('pdLockScreen'); if(l) l.checked = DOMINO_STYLE.PIPFX_HI_LOCK_SCREEN;
      pdColorBindings.forEach(function(b){
        var el=document.getElementById(b.id);
        if(el){ el.value = rgbaToHex(DOMINO_STYLE[b.prop]); var vEl=document.getElementById(b.id+'Val'); if(vEl) vEl.textContent=el.value; }
      });
    }
    function syncPipColorsUI(){
      for(var p = 0; p <= 7; p++){
        var hex = rgbaToHex(DOMINO_STYLE.PIP_COLORS[p]);
        var ci = document.getElementById('pcCustom'+p);
        if(ci) ci.value = hex;
        var cv = document.getElementById('pcCustomVal'+p);
        if(cv) cv.textContent = hex;
        pipColorsPopup.querySelectorAll('.pcPreset[data-pip="'+p+'"]').forEach(function(pe){
          pe.style.borderColor = pe.dataset.color.toLowerCase()===hex.toLowerCase() ? '#3b82f6' : 'rgba(255,255,255,0.2)';
        });
      }
    }

    function openPipDetails(){
      pipDetailsPopup.style.display = 'block';
      pdBackdrop.style.display = 'block';
      renderPresetList('pdPresetList', function(){ syncPipDetailsUI(); renderPreviews(); });
      renderPreviews();
      // Sync current values to sliders
      pdBindings.forEach(function(b){
        const el = document.getElementById(b.id);
        if(el){ el.value = DOMINO_STYLE[b.prop]; const vEl=document.getElementById(b.id+'Val'); if(vEl) vEl.textContent=DOMINO_STYLE[b.prop]; }
      });
      if(pdGrad) pdGrad.checked = DOMINO_STYLE.PIPFX_GRADIENT;
      if(pdLock) pdLock.checked = DOMINO_STYLE.PIPFX_HI_LOCK_SCREEN;
      pdColorBindings.forEach(function(b){
        const el=document.getElementById(b.id);
        if(el){ el.value = rgbaToHex(DOMINO_STYLE[b.prop]); const vEl=document.getElementById(b.id+'Val'); if(vEl) vEl.textContent=el.value; }
      });
    }
    function closePipDetails(){
      pipDetailsPopup.style.display = 'none';
      pdBackdrop.style.display = 'none';
    }
    document.getElementById('pipDetailsBtn').addEventListener('click', openPipDetails);

    // Load saved pip details on startup
    const savedPipFx = loadFromStorage(PIPFX_STORAGE_KEY);
    if(savedPipFx){
      Object.keys(savedPipFx).forEach(function(k){ if(k in DOMINO_STYLE) DOMINO_STYLE[k] = savedPipFx[k]; });
    }

    // ==================== PIP COLORS PANEL ====================
    const PRESET_COLORS = [
      '#141416','#36B258','#F0C73D','#E74C3C','#00B2FF','#9B59B6','#A76E34','#3B82F6',
      '#FFFFFF','#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6EC7','#FF8C42','#8B5CF6',
      '#EC4899','#14B8A6','#F97316','#64748B'
    ];

    const pipColorsPopup = document.createElement('div');
    pipColorsPopup.id = 'pipColorsPopup';
    pipColorsPopup.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2000;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px;max-width:340px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6);color:#fff;font-size:12px;';

    let pcHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:8px;"><span style="font-size:15px;font-weight:700;">Pip Colors</span><button id="pipColorsClose" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px;">&times;</button></div>';
    pcHTML += '<div id="pcPreviewRow" style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;padding:8px;background:rgba(0,0,0,0.3);border-radius:8px;overflow-x:auto;"></div>';

    // For each pip value 0-7
    const pipNames = ['0 (Blank)','1','2','3','4','5','6','7'];
    for(let p = 0; p <= 7; p++){
      const currentColor = rgbaToHex(DOMINO_STYLE.PIP_COLORS[p] || '#141416');
      pcHTML += '<div style="margin-bottom:10px;"><div style="font-weight:600;font-size:11px;margin-bottom:4px;">Pip ' + pipNames[p] + '</div>';
      pcHTML += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
      for(let c = 0; c < PRESET_COLORS.length; c++){
        pcHTML += '<div class="pcPreset" data-pip="'+p+'" data-color="'+PRESET_COLORS[c]+'" style="width:22px;height:22px;border-radius:4px;background:'+PRESET_COLORS[c]+';border:2px solid '+(PRESET_COLORS[c].toLowerCase()===currentColor.toLowerCase()?'#3b82f6':'rgba(255,255,255,0.2)')+';cursor:pointer;"></div>';
      }
      pcHTML += '</div>';
      pcHTML += '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:10px;">Custom:</span><input type="color" id="pcCustom'+p+'" value="'+currentColor+'" style="width:28px;height:22px;border:none;background:none;cursor:pointer;"><span id="pcCustomVal'+p+'" style="font-size:10px;font-family:monospace;">'+currentColor+'</span></div>';
      pcHTML += '</div>';
    }

    // Preset selector for colors
    pcHTML += '<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;"><div style="font-weight:600;margin-bottom:6px;color:rgba(255,255,255,0.7);">Presets</div>';
    pcHTML += '<div id="pcPresetList" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;"></div>';
    pcHTML += '<div style="display:flex;gap:6px;"><input type="text" id="pcPresetName" placeholder="Preset name..." style="flex:1;padding:4px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;font-size:11px;"><button id="pcSavePreset" style="padding:4px 10px;border-radius:4px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:11px;white-space:nowrap;">Save As</button></div></div>';
    pcHTML += '<div style="display:flex;gap:8px;margin-top:12px;justify-content:center;"><button id="pcReset" style="padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:11px;">Reset Defaults</button><button id="pcSave" style="padding:6px 14px;border-radius:6px;border:none;background:#22c55e;color:#fff;cursor:pointer;font-size:11px;font-weight:600;">Save</button></div>';

    pipColorsPopup.innerHTML = pcHTML;
    document.body.appendChild(pipColorsPopup);

    const pcBackdrop = document.createElement('div');
    pcBackdrop.id = 'pipColorsBackdrop';
    pcBackdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:1999;background:rgba(0,0,0,0.5);';
    pcBackdrop.addEventListener('click', function(){ closePipColors(); });
    document.body.appendChild(pcBackdrop);

    // Preset click handler
    pipColorsPopup.addEventListener('click', function(e){
      const el = e.target.closest('.pcPreset');
      if(!el) return;
      const pip = parseInt(el.dataset.pip);
      const color = el.dataset.color;
      DOMINO_STYLE.PIP_COLORS[pip] = hexToRgba(color, 0.98);
      // Update custom input
      const ci = document.getElementById('pcCustom'+pip);
      if(ci) ci.value = color;
      const cv = document.getElementById('pcCustomVal'+pip);
      if(cv) cv.textContent = color;
      // Update borders
      pipColorsPopup.querySelectorAll('.pcPreset[data-pip="'+pip+'"]').forEach(function(pe){
        pe.style.borderColor = pe.dataset.color.toLowerCase()===color.toLowerCase() ? '#3b82f6' : 'rgba(255,255,255,0.2)';
      });
      redrawAllSprites();
    });

    // Custom color inputs
    for(let p = 0; p <= 7; p++){
      (function(pip){
        const ci = document.getElementById('pcCustom'+pip);
        if(ci) ci.addEventListener('input', function(){
          DOMINO_STYLE.PIP_COLORS[pip] = hexToRgba(this.value, 0.98);
          const cv = document.getElementById('pcCustomVal'+pip);
          if(cv) cv.textContent = this.value;
          // Update preset borders
          pipColorsPopup.querySelectorAll('.pcPreset[data-pip="'+pip+'"]').forEach(function(pe){
            pe.style.borderColor = pe.dataset.color.toLowerCase()===ci.value.toLowerCase() ? '#3b82f6' : 'rgba(255,255,255,0.2)';
          });
          redrawAllSprites();
        });
      })(p);
    }

    // Save
    document.getElementById('pcSave').addEventListener('click', function(){
      const data = {};
      for(let p = 0; p <= 7; p++) data[p] = DOMINO_STYLE.PIP_COLORS[p];
      saveToStorage(PIP_COLORS_STORAGE_KEY, data);
      closePipColors();
    });

    // Reset
    document.getElementById('pcReset').addEventListener('click', function(){
      const defaults = {0:"rgba(20,20,22,0.95)",1:"rgba(54,178,88,0.98)",2:"rgba(240,199,61,0.98)",3:"rgba(231,76,60,0.98)",4:"rgba(0,178,255,0.98)",5:"rgba(155,89,182,0.98)",6:"rgba(167,110,52,0.98)",7:"rgba(59,130,246,0.98)"};
      Object.keys(defaults).forEach(function(k){ DOMINO_STYLE.PIP_COLORS[parseInt(k)] = defaults[k]; });
      // Update UI
      for(let p = 0; p <= 7; p++){
        const hex = rgbaToHex(defaults[p]);
        const ci = document.getElementById('pcCustom'+p);
        if(ci) ci.value = hex;
        const cv = document.getElementById('pcCustomVal'+p);
        if(cv) cv.textContent = hex;
        pipColorsPopup.querySelectorAll('.pcPreset[data-pip="'+p+'"]').forEach(function(pe){
          pe.style.borderColor = pe.dataset.color.toLowerCase()===hex.toLowerCase() ? '#3b82f6' : 'rgba(255,255,255,0.2)';
        });
      }
      localStorage.removeItem(PIP_COLORS_STORAGE_KEY);
      redrawAllSprites();
    });

    document.getElementById('pipColorsClose').addEventListener('click', closePipColors);

    function openPipColors(){
      pipColorsPopup.style.display = 'block';
      pcBackdrop.style.display = 'block';
      renderPresetList('pcPresetList', function(){ syncPipColorsUI(); renderPreviews(); });
      renderPreviews();
      // Sync current colors to UI
      for(let p = 0; p <= 7; p++){
        const hex = rgbaToHex(DOMINO_STYLE.PIP_COLORS[p]);
        const ci = document.getElementById('pcCustom'+p);
        if(ci) ci.value = hex;
        const cv = document.getElementById('pcCustomVal'+p);
        if(cv) cv.textContent = hex;
        pipColorsPopup.querySelectorAll('.pcPreset[data-pip="'+p+'"]').forEach(function(pe){
          pe.style.borderColor = pe.dataset.color.toLowerCase()===hex.toLowerCase() ? '#3b82f6' : 'rgba(255,255,255,0.2)';
        });
      }
    }
    function closePipColors(){
      pipColorsPopup.style.display = 'none';
      pcBackdrop.style.display = 'none';
    }
    document.getElementById('pipColorsBtn').addEventListener('click', openPipColors);

    // Save preset button for Pip Colors (must be after popup is created)
    document.getElementById('pcSavePreset').addEventListener('click', function(){
      const nameEl = document.getElementById('pcPresetName');
      const name = (nameEl.value || '').trim();
      if(!name){ alert('Enter a preset name'); return; }
      savePipPreset(name, collectCurrentPreset());
      nameEl.value = '';
      renderPresetList('pdPresetList', function(){ syncPipDetailsUI(); renderPreviews(); });
      renderPresetList('pcPresetList', function(){ syncPipColorsUI(); renderPreviews(); });
    });

    // Load saved pip colors on startup
    const savedPipColors = loadFromStorage(PIP_COLORS_STORAGE_KEY);
    if(savedPipColors){
      Object.keys(savedPipColors).forEach(function(k){
        const pip = parseInt(k);
        if(!isNaN(pip) && pip >= 0 && pip <= 7) DOMINO_STYLE.PIP_COLORS[pip] = savedPipColors[k];
      });
    }

    // Expose key functions globally
    window.renderPreviews = renderPreviews;
    window.BUILTIN_PRESETS = BUILTIN_PRESETS;
    window.collectCurrentPreset = collectCurrentPreset;
    window.applyPreset = applyPreset;
    window.renderPresetList = renderPresetList;
    window.syncPipDetailsUI = syncPipDetailsUI;
    window.syncPipColorsUI = syncPipColorsUI;
  })();

  // Preset helpers
  function getAllPresets(){ return loadFromStorage(STORAGE_KEY_PRESETS) || {}; }
  function savePreset(category, name, data){
    const presets = getAllPresets();
    if(!presets[category]) presets[category] = {};
    presets[category][name] = data;
    saveToStorage(STORAGE_KEY_PRESETS, presets);
  }
  function loadPreset(category){
    const presets = getAllPresets();
    const catPresets = presets[category] || {};
    const names = Object.keys(catPresets);
    if(names.length === 0){ alert('No saved presets for ' + category); return null; }
    const name = prompt('Available presets:\n' + names.join('\n') + '\n\nEnter preset name to load:');
    if(!name || !catPresets[name]){ if(name) alert('Preset not found: ' + name); return null; }
    return catPresets[name];
  }

  // ==================== T42 LAYOUT SETTINGS ====================
  const T42_DEFAULTS = {
    p1Scale:0.92, p1Spacing:0.137, p1x:0.905, p1y:0.925,
    p2Scale:0.59, p2x:0.09, p2y:0.65, p2Spacing:0.049,
    p3Scale:0.59, p3x:0.235, p3y:0.43, p3Spacing:0.087,
    p4Scale:0.59, p4x:0.905, p4y:0.65, p4Spacing:0.049,
    trickScale:0.59,
    p1TrickX:0.495, p1TrickY:0.725,
    p2TrickX:0.35, p2TrickY:0.65,
    p3TrickX:0.495, p3TrickY:0.585,
    p4TrickX:0.63, p4TrickY:0.65,
    leadScale:0.51, leadX:0.485, leadY:0.65,
    ind1x:0.495, ind1y:0.80,
    ind2x:0.215, ind2y:0.65,
    ind3x:0.495, ind3y:0.505,
    ind4x:0.775, ind4y:0.65,
    thScale:0.393, thBaseX:0.106, thBaseY:0.2281,
    thRowSpacing:0.1111, thColSpacing:0.0311
  };
  const T42_KEYS = Object.keys(T42_DEFAULTS);

  function showT42Settings(){
    document.getElementById('t42SettingsBackdrop').style.display = 'flex';
    T42_KEYS.forEach(k => {
      const slider = document.getElementById('t42s_' + k);
      const label = document.getElementById('t42sv_' + k);
      if(slider){
        slider.value = T42_SETTINGS[k];
        if(label) label.textContent = T42_SETTINGS[k].toFixed(3);
      }
    });
    // Show ghost dominos
    showT42GhostDominos();
    if(_t42GhostTimer) clearTimeout(_t42GhostTimer);
  }
  function hideT42Settings(){
    document.getElementById('t42SettingsBackdrop').style.display = 'none';
    // Remove ghosts when menu closes
    removeT42GhostDominos();
  }

  // Toggle button visibility for both T42 and Boneyard settings
  const origInitGameMode = window.initGameMode;
  const _tn51Btn = document.getElementById('tn51SettingsBtn');
  const _t42Btn = document.getElementById('t42SettingsBtn');
  const _moonBtn = document.getElementById('moonSettingsBtn');
  const _by2Btn = document.getElementById('by2SettingsBtn');
  if(origInitGameMode){
    window.initGameMode = function(mode){
      origInitGameMode(mode);
      updateDevModeUI();
    };
  }

  // TN51 Layout Settings
  function showTn51Settings(){
    document.getElementById('tn51SettingsBackdrop').style.display = 'flex';
    TN51_KEYS.forEach(k => {
      const slider = document.getElementById('tn51s_' + k);
      const label = document.getElementById('tn51sv_' + k);
      if(slider){ slider.value = TN51_SETTINGS[k]; if(label) label.textContent = TN51_SETTINGS[k].toFixed(3); }
    });
    // V12.9.4: Show ghost dominos
    showTN51GhostDominos();
    if(_tn51GhostTimer) clearTimeout(_tn51GhostTimer);
  }
  function hideTn51Settings(){
    document.getElementById('tn51SettingsBackdrop').style.display = 'none';
    // V12.9.4: Remove ghosts when menu closes
    removeTN51GhostDominos();
  }
  const TN51_KEYS = Object.keys(TN51_SETTINGS);
  const TN51_DEFAULTS = Object.assign({}, TN51_SETTINGS);
// V12.2: Ensure xOffset defaults exist
if(!TN51_DEFAULTS.p2xOff) TN51_DEFAULTS.p2xOff = 0;
if(!TN51_DEFAULTS.p3xOff) TN51_DEFAULTS.p3xOff = 0;
if(!TN51_DEFAULTS.p5xOff) TN51_DEFAULTS.p5xOff = 0;
if(!TN51_DEFAULTS.p6xOff) TN51_DEFAULTS.p6xOff = 0;

  if(_tn51Btn) _tn51Btn.addEventListener('click', showTn51Settings);
  document.getElementById('btnCloseTn51Settings').addEventListener('click', hideTn51Settings);
  document.getElementById('tn51SettingsBackdrop').addEventListener('click', function(e){ if(e.target === this) hideTn51Settings(); });

  TN51_KEYS.forEach(k => {
    const slider = document.getElementById('tn51s_' + k);
    const label = document.getElementById('tn51sv_' + k);
    if(slider){
      slider.addEventListener('input', function(){
        const val = parseFloat(this.value);
        TN51_SETTINGS[k] = val;
        if(label) label.textContent = val.toFixed(3);
        applyTn51Settings();
        refreshTN51Ghosts();
        saveToStorage(getTn51Key(), TN51_SETTINGS);
      });
    }
  });

  document.getElementById('btnTn51Reset').addEventListener('click', function(){
    Object.assign(TN51_SETTINGS, TN51_DEFAULTS);
    TN51_KEYS.forEach(k => {
      const slider = document.getElementById('tn51s_' + k);
      const label = document.getElementById('tn51sv_' + k);
      if(slider){ slider.value = TN51_DEFAULTS[k]; }
      if(label){ label.textContent = TN51_DEFAULTS[k].toFixed(3); }
    });
    applyTn51Settings();
    refreshTN51Ghosts();
    saveToStorage(getTn51Key(), TN51_SETTINGS);
  });

  document.getElementById('btnTn51Export').addEventListener('click', function(){
    const vals = {};
    TN51_KEYS.forEach(k => { vals[k] = TN51_SETTINGS[k]; });
    prompt('Copy these TN51 layout values:', JSON.stringify(vals, null, 2));
  });

  // TN51 device preset buttons (shared with T42 + Boneyard)
  document.getElementById('btnDeviceSavePreset').addEventListener('click', saveDevicePreset);
  document.getElementById('btnDeviceLoadPreset').addEventListener('click', loadDevicePreset);

  if(_t42Btn) _t42Btn.addEventListener('click', showT42Settings);
  document.getElementById('btnCloseT42Settings').addEventListener('click', hideT42Settings);
  document.getElementById('t42SettingsBackdrop').addEventListener('click', function(e){
    if(e.target === this) hideT42Settings();
  });

  T42_KEYS.forEach(k => {
    const slider = document.getElementById('t42s_' + k);
    const label = document.getElementById('t42sv_' + k);
    if(slider){
      slider.addEventListener('input', function(){
        const val = parseFloat(this.value);
        T42_SETTINGS[k] = val;
        if(label) label.textContent = val.toFixed(3);
        applyT42Settings();
        refreshT42Ghosts();
        saveToStorage(getT42Key(), T42_SETTINGS);
      });
    }
  });

  document.getElementById('btnT42Reset').addEventListener('click', function(){
    Object.assign(T42_SETTINGS, T42_DEFAULTS);
    T42_KEYS.forEach(k => {
      const slider = document.getElementById('t42s_' + k);
      const label = document.getElementById('t42sv_' + k);
      if(slider){ slider.value = T42_DEFAULTS[k]; }
      if(label){ label.textContent = T42_DEFAULTS[k].toFixed(3); }
    });
    applyT42Settings();
    refreshT42Ghosts();
    saveToStorage(getT42Key(), T42_SETTINGS);
  });

  // T42 device preset buttons (shared with TN51 + Boneyard)
  document.getElementById('btnT42DeviceSave').addEventListener('click', saveDevicePreset);
  document.getElementById('btnT42DeviceLoad').addEventListener('click', loadDevicePreset);

  document.getElementById('btnT42Export').addEventListener('click', function(){
    const vals = {};
    T42_KEYS.forEach(k => { vals[k] = T42_SETTINGS[k]; });
    prompt('Copy these T42 layout values:', JSON.stringify(vals, null, 2));
  });

  // ==================== BONEYARD SETTINGS ====================
  const BY2_DEFAULTS = {
    xOffset: 5, yOffset: 16, width: 90, height: 22,
    gap: 0, playedOpacity: 0.71,
    innerSize: 1, innerRadius: 5, innerColor: '#beb6ab',
    outerSize: 2, outerRadius: 8, outerColor: '#00deff'
  };
  const BY2_KEYS = Object.keys(BY2_DEFAULTS);

  // Load saved boneyard settings (orientation-aware with legacy fallback)
  const _savedBy2 = loadFromStorage(getBy2Key()) || loadFromStorage('tn51_boneyard');
  if(_savedBy2) applyBy2State(_savedBy2);

  function showBy2Settings(){
    document.getElementById('by2SettingsBackdrop').style.display = 'flex';
    // Read current CSS variables for position
    const by2c = document.getElementById('boneyard2Container');
    const curX = parseFloat(by2c?.style.left || getComputedStyle(by2c).left) || 5;
    const curY = parseFloat(by2c?.style.top || getComputedStyle(by2c).top) || 16;
    const curW = parseFloat(by2c?.style.width || getComputedStyle(by2c).width) || 90;
    const tableEl = document.getElementById('tableMain');
    const _bxOff = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-left')) || 5;
    const _byOff = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-top')) || 16;
    const _bwPct = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-width')) || 90;
    const _bhPct = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-height')) || 22;
    const vals = {
      xOffset: _bxOff, yOffset: _byOff, width: _bwPct, height: _bhPct,
      gap: BY2_GAP, playedOpacity: BY2_PLAYED_OPACITY,
      innerSize: BY2_INNER_SIZE, innerRadius: BY2_INNER_RADIUS, innerColor: BY2_INNER_COLOR,
      outerSize: BY2_OUTER_SIZE, outerRadius: BY2_OUTER_RADIUS, outerColor: BY2_OUTER_COLOR
    };
    BY2_KEYS.forEach(k => {
      const el = document.getElementById('by2s_' + k);
      const label = document.getElementById('by2sv_' + k);
      if(el){
        el.value = vals[k];
        if(label){
          label.textContent = (typeof vals[k] === 'number') ? vals[k].toFixed(k.includes('Opacity') ? 2 : 1) : vals[k];
        }
      }
    });
  }
  function hideBy2Settings(){
    document.getElementById('by2SettingsBackdrop').style.display = 'none';
  }

  if(_by2Btn) _by2Btn.addEventListener('click', showBy2Settings);
  var _moonSettBtn = document.getElementById('moonSettingsBtn');
  if(_moonSettBtn) _moonSettBtn.addEventListener('click', function(){ showMoonSettingsPanel(); });
  document.getElementById('btnCloseBy2Settings').addEventListener('click', hideBy2Settings);
  document.getElementById('by2SettingsBackdrop').addEventListener('click', function(e){
    if(e.target === this) hideBy2Settings();
  });

  // Map setting keys to global variable names
  const BY2_VARMAP = {
    gap: 'BY2_GAP', playedOpacity: 'BY2_PLAYED_OPACITY',
    innerSize: 'BY2_INNER_SIZE', innerRadius: 'BY2_INNER_RADIUS', innerColor: 'BY2_INNER_COLOR',
    outerSize: 'BY2_OUTER_SIZE', outerRadius: 'BY2_OUTER_RADIUS', outerColor: 'BY2_OUTER_COLOR'
  };

  BY2_KEYS.forEach(k => {
    const el = document.getElementById('by2s_' + k);
    const label = document.getElementById('by2sv_' + k);
    if(el){
      el.addEventListener('input', function(){
        let val;
        if(k === 'innerColor' || k === 'outerColor'){
          val = this.value;
        } else {
          val = parseFloat(this.value);
        }
        // Handle position controls via CSS variables
        if(k === 'xOffset'){
          document.documentElement.style.setProperty('--th-left', val + '%');
          if(label) label.textContent = val.toFixed(1);
        } else if(k === 'yOffset'){
          document.documentElement.style.setProperty('--th-top', val + '%');
          if(label) label.textContent = val.toFixed(1);
        } else if(k === 'width'){
          document.documentElement.style.setProperty('--th-width', val + '%');
          if(label) label.textContent = val.toFixed(0);
        } else if(k === 'height'){
          document.documentElement.style.setProperty('--th-height', val + '%');
          if(label) label.textContent = val.toFixed(1);
        } else {
          window[BY2_VARMAP[k]] = val;
          if(label){
            label.textContent = (typeof val === 'number') ? val.toFixed(k.includes('Opacity') ? 2 : 1) : val;
          }
        }
        if(boneyard2Visible) renderBoneyard2();
        // Save all boneyard settings (orientation-aware)
        saveToStorage(getBy2Key(), collectBy2State());
      });
    }
  });

  document.getElementById('btnBy2Reset').addEventListener('click', function(){
    document.documentElement.style.setProperty('--th-left', BY2_DEFAULTS.xOffset + '%');
    document.documentElement.style.setProperty('--th-top', BY2_DEFAULTS.yOffset + '%');
    document.documentElement.style.setProperty('--th-width', BY2_DEFAULTS.width + '%');
    document.documentElement.style.setProperty('--th-height', BY2_DEFAULTS.height + '%');
    window.BY2_GAP = BY2_DEFAULTS.gap;
    window.BY2_PLAYED_OPACITY = BY2_DEFAULTS.playedOpacity;
    window.BY2_INNER_SIZE = BY2_DEFAULTS.innerSize;
    window.BY2_INNER_RADIUS = BY2_DEFAULTS.innerRadius;
    window.BY2_INNER_COLOR = BY2_DEFAULTS.innerColor;
    window.BY2_OUTER_SIZE = BY2_DEFAULTS.outerSize;
    window.BY2_OUTER_RADIUS = BY2_DEFAULTS.outerRadius;
    window.BY2_OUTER_COLOR = BY2_DEFAULTS.outerColor;
    showBy2Settings();  // Re-sync sliders
    if(boneyard2Visible) renderBoneyard2();
  });

  document.getElementById('btnBy2Export').addEventListener('click', function(){
    const vals = {
      xOffset: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-left')) || 5,
      yOffset: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-top')) || 16,
      width: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th-width')) || 90,
      BY2_GAP: BY2_GAP, BY2_PLAYED_OPACITY: BY2_PLAYED_OPACITY,
      BY2_INNER_SIZE: BY2_INNER_SIZE, BY2_INNER_RADIUS: BY2_INNER_RADIUS, BY2_INNER_COLOR: BY2_INNER_COLOR,
      BY2_OUTER_SIZE: BY2_OUTER_SIZE, BY2_OUTER_RADIUS: BY2_OUTER_RADIUS, BY2_OUTER_COLOR: BY2_OUTER_COLOR
    };
    prompt('Copy these Boneyard values:', JSON.stringify(vals, null, 2));
  });

  // Boneyard device preset buttons (shared)
  document.getElementById('btnBy2DeviceSave').addEventListener('click', saveDevicePreset);
  document.getElementById('btnBy2DeviceLoad').addEventListener('click', loadDevicePreset);

  // ==================== DEVICE PRESET SYSTEM ====================
  // A device preset saves ALL settings for BOTH orientations under one name.
  // Structure: { portrait: { t42: {...}, tn51: {...}, boneyard: {...} },
  //              landscape: { t42: {...}, tn51: {...}, boneyard: {...} } }

  function saveDevicePreset(){
    const name = prompt('Enter a device name for this preset:\n(e.g., iPad, iPhone 16 Pro Max)');
    if(!name) return;
    // Save current orientation's settings first
    saveToStorage(getT42Key(), Object.assign({}, T42_SETTINGS));
    saveToStorage(getTn51Key(), Object.assign({}, TN51_SETTINGS));
    saveToStorage(getBy2Key(), collectBy2State());
    // Build preset from both orientations
    const preset = { portrait: {}, landscape: {} };
    ['portrait','landscape'].forEach(function(o){
      preset[o].t42 = loadFromStorage('tn51_t42_layout_' + o) || null;
      preset[o].tn51 = loadFromStorage('tn51_tn51_layout_' + o) || null;
      preset[o].boneyard = loadFromStorage('tn51_boneyard_' + o) || null;
    });
    const presets = loadFromStorage(STORAGE_KEY_PRESETS) || {};
    if(Object.keys(presets).length >= 20 && !presets[name]){
      alert('Maximum 20 presets reached. Delete an existing preset first.\nExisting: ' + Object.keys(presets).join(', '));
      return;
    }
    presets[name] = preset;
    saveToStorage(STORAGE_KEY_PRESETS, presets);
    alert('Device preset "' + name + '" saved!\nIncludes settings for both orientations.');
  }

  function loadDevicePreset(){
    const presets = loadFromStorage(STORAGE_KEY_PRESETS) || {};
    const names = Object.keys(presets);
    if(names.length === 0){ alert('No device presets saved yet.'); return; }
    const name = prompt('Available device presets:\n' + names.join('\n') + '\n\nEnter preset name to load (or type DELETE:name to remove):');
    if(!name) return;
    if(name.startsWith('DELETE:')){
      const delName = name.substring(7).trim();
      if(presets[delName]){ delete presets[delName]; saveToStorage(STORAGE_KEY_PRESETS, presets); alert('Preset "' + delName + '" deleted.'); }
      else { alert('Preset not found: ' + delName); }
      return;
    }
    if(!presets[name]){ alert('Preset not found: ' + name); return; }
    const preset = presets[name];
    // Store both orientations
    ['portrait','landscape'].forEach(function(o){
      if(preset[o]){
        if(preset[o].t42) saveToStorage('tn51_t42_layout_' + o, preset[o].t42);
        if(preset[o].tn51) saveToStorage('tn51_tn51_layout_' + o, preset[o].tn51);
        if(preset[o].boneyard) saveToStorage('tn51_boneyard_' + o, preset[o].boneyard);
      }
    });
    // Apply current orientation's settings
    const cur = preset[currentOrientation];
    if(cur){
      if(cur.t42) Object.assign(T42_SETTINGS, cur.t42);
      if(cur.tn51) Object.assign(TN51_SETTINGS, cur.tn51);
      if(cur.boneyard) applyBy2State(cur.boneyard);
    }
    // Re-apply to the game
    if(GAME_MODE === 'MOON') applyMoonSettings();
    if(GAME_MODE === 'T42') applyT42Settings();
    if(GAME_MODE === 'TN51') applyTn51Settings();
    alert('Device preset "' + name + '" loaded for ' + currentOrientation + ' mode.');
  }

  // ==================== ORIENTATION CHANGE HANDLER ====================
  function onOrientationChange(){
    const newOrient = getOrientation();
    if(newOrient === currentOrientation) return;
    // Save current orientation's settings before switching
    saveToStorage('tn51_t42_layout_' + currentOrientation, Object.assign({}, T42_SETTINGS));
    saveToStorage('tn51_tn51_layout_' + currentOrientation, Object.assign({}, TN51_SETTINGS));
    saveToStorage('tn51_boneyard_' + currentOrientation, collectBy2State());
    // Switch orientation
    currentOrientation = newOrient;
    // Load new orientation's settings
    const t42Data = loadFromStorage(getT42Key());
    if(t42Data) Object.assign(T42_SETTINGS, t42Data);
    const tn51Data = loadFromStorage(getTn51Key());
    if(tn51Data) Object.assign(TN51_SETTINGS, tn51Data);
    const by2Data = loadFromStorage(getBy2Key());
    if(by2Data) applyBy2State(by2Data);
    // Re-apply to the game
    if(GAME_MODE === 'MOON') applyMoonSettings();
    if(GAME_MODE === 'T42') applyT42Settings();
    if(GAME_MODE === 'TN51') applyTn51Settings();
    // Update any open settings popups
    updateOrientLabels();
    // Refresh layout if visible
    if(typeof refreshLayout === 'function') refreshLayout();
    if(typeof boneyard2Visible !== 'undefined' && boneyard2Visible && typeof renderBoneyard2 === 'function') renderBoneyard2();
  }

  // Listen for orientation changes
  window.addEventListener('resize', function(){
    // Debounce — orientation change triggers multiple resize events
    clearTimeout(window._orientDebounce);
    window._orientDebounce = setTimeout(onOrientationChange, 200);
  });

  // Apply dev mode on startup
  updateDevModeUI();
  updateOrientLabels();

  // Apply persisted TN51 settings if in TN51 mode
  if(GAME_MODE === 'TN51' && _savedTn51) applyTn51Settings();
  // Apply persisted T42 settings (already handled by initGameMode calling applyT42Settings)
})();


// V12.2: Scale Range Multiplier + X-Offset + File Export/Import + Built-in Presets
// Uses MutationObserver since settings functions are inside an IIFE
(function(){
  var _multState = {};
  try { var s = localStorage.getItem('tn51_slider_multipliers'); if(s) _multState = JSON.parse(s); } catch(e){}
  function saveMultState(){ try { localStorage.setItem('tn51_slider_multipliers', JSON.stringify(_multState)); } catch(e){} }

  function applyMultiplier(slider, mult){
    var origMin = parseFloat(slider.dataset.origMin);
    var origMax = parseFloat(slider.dataset.origMax);
    var range = origMax - origMin;
    slider.min = origMin + (mult - 1) * range;
    slider.max = origMax + (mult - 1) * range;
    var val = parseFloat(slider.value);
    if(val < parseFloat(slider.min)){ slider.value = slider.min; slider.dispatchEvent(new Event('input')); }
    if(val > parseFloat(slider.max)){ slider.value = slider.max; slider.dispatchEvent(new Event('input')); }
  }

  function initSliderMultipliers(panel){
    var sliders = panel.querySelectorAll('input[type="range"]');
    sliders.forEach(function(slider){
      if(slider.dataset.multInit) return;
      slider.dataset.multInit = '1';
      slider.dataset.origMin = slider.min;
      slider.dataset.origMax = slider.max;
      var mult = _multState[slider.id] || 1;
      var btn = document.createElement('button');
      btn.textContent = mult + 'x';
      btn.style.cssText = 'margin-left:4px;padding:1px 5px;font-size:10px;font-weight:700;border:1px solid rgba(255,255,255,0.3);border-radius:4px;background:rgba(255,255,255,0.1);color:' + (mult===1?'#60a5fa':mult===2?'#f59e0b':'#ef4444') + ';cursor:pointer;min-width:24px;flex-shrink:0;';
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var m = _multState[slider.id] || 1;
        m = m >= 3 ? 1 : m + 1;
        _multState[slider.id] = m;
        btn.textContent = m + 'x';
        btn.style.color = m===1?'#60a5fa':m===2?'#f59e0b':'#ef4444';
        applyMultiplier(slider, m);
        saveMultState();
      });
      if(mult > 1) applyMultiplier(slider, mult);
      // Insert after value label span or at end of parent
      var parent = slider.parentElement;
      if(parent){
        var spans = parent.querySelectorAll('span[id]');
        var lastSpan = spans.length > 0 ? spans[spans.length-1] : null;
        if(lastSpan) lastSpan.insertAdjacentElement('afterend', btn);
        else parent.appendChild(btn);
      }
    });
  }

  // ---- X-OFFSET SLIDERS ----
  function injectXOffsetSliders(panel){
    if(panel.dataset.xoffInit) return;
    panel.dataset.xoffInit = '1';
    var resetBtn = document.getElementById('btnTn51Reset');
    if(!resetBtn || !resetBtn.parentElement) return;
    var section = document.createElement('div');
    section.style.cssText = 'padding:8px 16px;border-top:1px solid rgba(255,255,255,0.1);';
    section.innerHTML = '<div style="font-size:12px;font-weight:700;color:#f59e0b;margin-bottom:6px;">Side Player X-Offset (per Domino)</div>';
    var keys = [['p2xOff','P2'],['p3xOff','P3'],['p5xOff','P5'],['p6xOff','P6']];
    keys.forEach(function(pair){
      var key = pair[0], label = pair[1];
      var val = TN51_SETTINGS[key] || 0;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;';
      row.innerHTML = '<label style="font-size:11px;color:rgba(255,255,255,0.7);min-width:28px;">' + label + '</label>'
        + '<input type="range" id="tn51s_' + key + '" min="-0.02" max="0.02" step="0.0005" value="' + val + '" style="flex:1;accent-color:#f59e0b;">'
        + '<span id="tn51sv_' + key + '" style="font-size:10px;color:#fff;min-width:42px;text-align:right;">' + val.toFixed(4) + '</span>'
        + '<input type="number" id="tn51sn_' + key + '" value="' + val + '" step="0.0001" style="width:58px;padding:2px;font-size:10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;text-align:center;">';
      section.appendChild(row);
    });
    resetBtn.parentElement.parentElement.insertBefore(section, resetBtn.parentElement);
    // Wire sliders
    keys.forEach(function(pair){
      var key = pair[0];
      var slider = document.getElementById('tn51s_' + key);
      var lbl = document.getElementById('tn51sv_' + key);
      var num = document.getElementById('tn51sn_' + key);
      function update(v){ TN51_SETTINGS[key]=v; if(lbl)lbl.textContent=v.toFixed(4); if(slider)slider.value=v; if(num)num.value=v; applyTn51Settings(); try{var k2=window.getTn51Key?getTn51Key():'tn51_tn51_layout_portrait';localStorage.setItem(k2,JSON.stringify(TN51_SETTINGS));}catch(e){} }
      if(slider) slider.addEventListener('input', function(){ update(parseFloat(this.value)); });
      if(num) num.addEventListener('input', function(){ var v=parseFloat(this.value); if(!isNaN(v)) update(v); });
    });
  }

  // ---- FILE EXPORT/IMPORT ----
  function getAllPresets(){ try{ var r=localStorage.getItem('tn51_device_presets'); return r?JSON.parse(r):{}; }catch(e){return {};} }
  function saveAllPresets(p){ try{localStorage.setItem('tn51_device_presets',JSON.stringify(p));}catch(e){} }

  function exportPresetsToFile(){
    var presets = getAllPresets();
    var data = { version:'V12.2', exportedFrom:{ screenWidth:window.innerWidth, screenHeight:window.innerHeight, dpr:window.devicePixelRatio||1, ua:navigator.userAgent.substring(0,120) }, exportDate:new Date().toISOString(), presets:presets, builtInPresets:typeof BUILTIN_DEVICE_PRESETS!=='undefined'?BUILTIN_DEVICE_PRESETS:{} };
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href=url; a.download='dominoes_presets_'+window.innerWidth+'x'+window.innerHeight+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function importPresetsFromFile(){
    var input = document.createElement('input'); input.type='file'; input.accept='.json';
    input.addEventListener('change', function(){
      var file = this.files[0]; if(!file) return;
      var reader = new FileReader();
      reader.onload = function(e){
        try {
          var data = JSON.parse(e.target.result);
          if(!data.presets || typeof data.presets !== 'object'){ alert('Invalid preset file.'); return; }
          var existing = getAllPresets(); var count = 0;
          for(var name in data.presets){ existing[name] = data.presets[name]; count++; }
          saveAllPresets(existing);
          alert('Imported ' + count + ' preset(s). Total: ' + Object.keys(existing).length);
        } catch(err){ alert('Error: ' + err.message); }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function injectFileButtons(panel, afterBtnId){
    if(panel.dataset.fileInit) return;
    panel.dataset.fileInit = '1';
    var afterBtn = document.getElementById(afterBtnId);
    if(!afterBtn || !afterBtn.parentElement) return;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap;';
    var expBtn = document.createElement('button');
    expBtn.textContent = '\u{1F4E4} Export All to File';
    expBtn.style.cssText = 'padding:6px 12px;font-size:11px;font-weight:600;background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;border-radius:8px;color:#fff;cursor:pointer;';
    expBtn.addEventListener('click', exportPresetsToFile);
    var impBtn = document.createElement('button');
    impBtn.textContent = '\u{1F4E5} Import from File';
    impBtn.style.cssText = 'padding:6px 12px;font-size:11px;font-weight:600;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:8px;color:#fff;cursor:pointer;';
    impBtn.addEventListener('click', importPresetsFromFile);
    row.appendChild(expBtn); row.appendChild(impBtn);
    afterBtn.parentElement.appendChild(row);
    // Screen info
    var info = document.createElement('div');
    info.style.cssText = 'text-align:center;font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;';
    info.textContent = 'Screen: ' + window.innerWidth + '\u00d7' + window.innerHeight + ' @' + (window.devicePixelRatio||1).toFixed(1) + 'x';
    afterBtn.parentElement.appendChild(info);
  }

  // ---- BUILT-IN PRESET PICKER ----
  function findClosestPreset(){
    var w=window.innerWidth, h=window.innerHeight, best=null, bestD=Infinity;
    for(var name in BUILTIN_DEVICE_PRESETS){
      var p=BUILTIN_DEVICE_PRESETS[name];
      var d=Math.sqrt(Math.pow(w-p.screenWidth,2)+Math.pow(h-p.screenHeight,2));
      if(d<bestD){bestD=d;best=name;}
    } return best;
  }

  window.loadBuiltInPreset = function(name){
    var preset = BUILTIN_DEVICE_PRESETS[name]; if(!preset) return;
    var orient = (window.innerWidth > window.innerHeight) ? 'landscape' : 'portrait';
    var data = preset[orient]; if(!data){ alert('No '+orient+' data for '+name); return; }
    if(data.tn51){ Object.assign(TN51_SETTINGS, data.tn51); try{localStorage.setItem('tn51_tn51_layout_'+orient, JSON.stringify(TN51_SETTINGS));}catch(e){} if(typeof applyTn51Settings==='function') applyTn51Settings(); }
    if(data.t42){ Object.assign(T42_SETTINGS, data.t42); try{localStorage.setItem('tn51_t42_layout_'+orient, JSON.stringify(T42_SETTINGS));}catch(e){} if(typeof applyT42Settings==='function') applyT42Settings(); }
    if(data.moon){ Object.assign(MOON_SETTINGS, data.moon); try{localStorage.setItem('tn51_moon_settings', JSON.stringify(MOON_SETTINGS));}catch(e){} if(typeof applyMoonSettings==='function') applyMoonSettings(); }
    if(data.moonPlaceholders){ if(data.moonPlaceholders.players){for(var mp in data.moonPlaceholders.players){if(PLACEHOLDER_CONFIG_MOON.players[mp]){PLACEHOLDER_CONFIG_MOON.players[mp].xN=data.moonPlaceholders.players[mp].xN;PLACEHOLDER_CONFIG_MOON.players[mp].yN=data.moonPlaceholders.players[mp].yN;}}} if(data.moonPlaceholders.lead){PLACEHOLDER_CONFIG_MOON.lead.xN=data.moonPlaceholders.lead.xN;PLACEHOLDER_CONFIG_MOON.lead.yN=data.moonPlaceholders.lead.yN;} try{localStorage.setItem('tn51_moon_placeholders',JSON.stringify({p1x:PLACEHOLDER_CONFIG_MOON.players[1].xN,p1y:PLACEHOLDER_CONFIG_MOON.players[1].yN,p2x:PLACEHOLDER_CONFIG_MOON.players[2].xN,p2y:PLACEHOLDER_CONFIG_MOON.players[2].yN,p3x:PLACEHOLDER_CONFIG_MOON.players[3].xN,p3y:PLACEHOLDER_CONFIG_MOON.players[3].yN,leadX:PLACEHOLDER_CONFIG_MOON.lead.xN,leadY:PLACEHOLDER_CONFIG_MOON.lead.yN}));}catch(e){} if(typeof createPlaceholders==='function') createPlaceholders(); }
    if(data.moonWidowPos && typeof MOON_WIDOW_POS!=='undefined'){ MOON_WIDOW_POS.xN=data.moonWidowPos.xN; MOON_WIDOW_POS.yN=data.moonWidowPos.yN; try{localStorage.setItem('tn51_moon_widow_pos',JSON.stringify(MOON_WIDOW_POS));}catch(e){} if(typeof updateWidowDisplay==='function') updateWidowDisplay(); }
  };

  window.showBuiltInPresetPicker = function(){
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:3000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);';
    var w=window.innerWidth, h=window.innerHeight, closest=findClosestPreset();
    var html = '<div style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;padding:20px;color:#fff;min-width:280px;max-width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">';
    html += '<div style="font-size:16px;font-weight:700;margin-bottom:4px;">Built-in Device Presets</div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:12px;">Your screen: '+w+'\u00d7'+h+' | Best match: '+(closest||'none')+'</div>';
    html += '<div style="font-size:12px;font-weight:700;color:#22c55e;margin-bottom:6px;">iPhones</div>';
    for(var name in BUILTIN_DEVICE_PRESETS){
      if(name.indexOf('iPad')>=0) continue;
      var p=BUILTIN_DEVICE_PRESETS[name], isBest=(name===closest);
      html += '<button class="_bipBtn" data-name="'+name+'" style="display:block;width:100%;text-align:left;padding:8px 12px;margin-bottom:4px;border-radius:8px;border:1px solid '+(isBest?'#22c55e':'rgba(255,255,255,0.1)')+';background:'+(isBest?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)')+';color:#fff;cursor:pointer;font-size:13px;">';
      html += '<b>'+name+'</b> <span style="font-size:11px;opacity:0.5;">'+p.screenWidth+'\u00d7'+p.screenHeight+'</span>';
      if(isBest) html += ' <span style="font-size:10px;color:#22c55e;">\u2605 Best match</span>';
      html += '</button>';
    }
    html += '<div style="font-size:12px;font-weight:700;color:#f59e0b;margin:10px 0 6px;">iPads</div>';
    for(var name in BUILTIN_DEVICE_PRESETS){
      if(name.indexOf('iPad')<0) continue;
      var p=BUILTIN_DEVICE_PRESETS[name], isBest=(name===closest);
      html += '<button class="_bipBtn" data-name="'+name+'" style="display:block;width:100%;text-align:left;padding:8px 12px;margin-bottom:4px;border-radius:8px;border:1px solid '+(isBest?'#22c55e':'rgba(255,255,255,0.1)')+';background:'+(isBest?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)')+';color:#fff;cursor:pointer;font-size:13px;">';
      html += '<b>'+name+'</b> <span style="font-size:11px;opacity:0.5;">'+p.screenWidth+'\u00d7'+p.screenHeight+'</span>';
      if(isBest) html += ' <span style="font-size:10px;color:#22c55e;">\u2605 Best match</span>';
      html += '</button>';
    }
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">';
    html += '<button id="_bipAuto" style="padding:8px 16px;font-size:13px;font-weight:700;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:8px;color:#fff;cursor:pointer;">Auto-Detect & Apply</button>';
    html += '<button id="_bipClose" style="padding:8px 16px;font-size:13px;font-weight:600;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:8px;color:#fff;cursor:pointer;">Close</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('._bipBtn').forEach(function(btn){ btn.addEventListener('click', function(){ loadBuiltInPreset(btn.dataset.name); overlay.remove(); }); });
    document.getElementById('_bipAuto').addEventListener('click', function(){ if(closest) loadBuiltInPreset(closest); overlay.remove(); });
    document.getElementById('_bipClose').addEventListener('click', function(){ overlay.remove(); });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  };

  function injectBuiltInButton(panel, afterBtnId){
    if(panel.dataset.builtinInit) return;
    panel.dataset.builtinInit = '1';
    var afterBtn = document.getElementById(afterBtnId);
    if(!afterBtn || !afterBtn.parentElement) return;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:8px;';
    var btn = document.createElement('button');
    btn.textContent = '\u{1F4F1} Built-in Device Presets';
    btn.style.cssText = 'padding:6px 14px;font-size:11px;font-weight:600;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:8px;color:#fff;cursor:pointer;';
    btn.addEventListener('click', window.showBuiltInPresetPicker);
    row.appendChild(btn);
    afterBtn.parentElement.appendChild(row);
  }

  // ---- OBSERVER: Detect when settings panels open ----
  var observer = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      if(m.type !== 'attributes' || m.attributeName !== 'style') return;
      var el = m.target;
      if(!el.id) return;
      var isVisible = el.style.display === 'flex';
      if(!isVisible) return;

      if(el.id === 'tn51SettingsBackdrop'){
        initSliderMultipliers(el);
        injectXOffsetSliders(el);
        injectFileButtons(el, 'btnDeviceLoadPreset');
        injectBuiltInButton(el, 'btnDeviceLoadPreset');
      }
      if(el.id === 't42SettingsBackdrop'){
        initSliderMultipliers(el);
        injectFileButtons(el, 'btnT42DeviceLoad');
        injectBuiltInButton(el, 'btnT42DeviceLoad');
      }
      if(el.id === 'boneyardSettingsBackdrop'){
        initSliderMultipliers(el);
        injectFileButtons(el, 'btnBy2DeviceLoad');
      }
    });
  });

  // Observe settings panels for display changes
  ['tn51SettingsBackdrop', 't42SettingsBackdrop', 'boneyardSettingsBackdrop'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) observer.observe(el, { attributes: true, attributeFilter: ['style'] });
  });

})();


// V12.3: Move fixed-position game UI elements inside tableMain
(function(){
  var table = document.getElementById('tableMain');
  if(!table) return;

  // Move topbar (score panel) inside tableMain — it's currently before gameWrapper
  var topbar = document.getElementById('topbar');
  if(topbar && topbar.parentElement !== table){
    table.insertBefore(topbar, table.firstChild);
  }

  // Elements to move inside tableMain (they use position:fixed but should be relative to game area)
  var idsToMove = ['statusBar', 'settingsBtn', 'settingsMenu',
                   'trumpDisplay', 'playerNameDisplay'];

  idsToMove.forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.parentElement !== table){
      table.appendChild(el);
    }
  });

  // Also move elements by class
  ['settingsBtn', 'settingsMenu'].forEach(function(cls){
    var els = document.querySelectorAll('.' + cls);
    els.forEach(function(el){
      if(el.parentElement !== table) table.appendChild(el);
    });
  });

  // Also move score panel inside tableMain
  var scorePanel = document.getElementById('scorePanel');
  if(!scorePanel){
    // Score panel might be a different element — find the team score containers
    var team1 = document.getElementById('team1Panel');
    var team2 = document.getElementById('team2Panel');
    var marks = document.getElementById('marksPanel');
    [team1, team2, marks].forEach(function(el){
      if(el && el.parentElement !== table) table.appendChild(el);
    });
  } else {
    if(scorePanel.parentElement !== table) table.appendChild(scorePanel);
  }

  // Move chat icon and MP indicator too
  var chatIcon = document.getElementById('mpChatIcon');
  var mpIndicator = document.getElementById('mpIndicator');
  var yourTurnBanner = document.getElementById('yourTurnBanner');
  [chatIcon, mpIndicator, yourTurnBanner].forEach(function(el){
    if(el && el.parentElement !== table) table.appendChild(el);
  });

  // Change position:fixed to position:absolute for game UI elements
  // (they're now children of tableMain which is position:relative)
  var style = document.createElement('style');
  style.textContent = '#topbar{position:absolute!important;}\n#statusBar{position:absolute!important;}'
    + '.settingsBtn{position:absolute!important;}'
    + '.settingsMenu{position:absolute!important;}'
    + '#trumpDisplay{position:absolute!important;}'
    + '#playerNameDisplay{position:absolute!important;}'
    + '#scorePanel{position:absolute!important;}'
    + '.team1Panel,.team2Panel,#team1Panel,#team2Panel{position:absolute!important;}'
    + '#marksPanel{position:absolute!important;}'
    + '#mpChatIcon{position:absolute!important;}'
    + '#mpIndicator,#mpIndicatorDock{position:absolute!important;}'
    + '#yourTurnBanner{position:absolute!important;}'
    + '.modalBackdrop{position:absolute!important;}';
  document.head.appendChild(style);
})();

/******************************************************************************
 * V10_122c: GLOBAL ERROR HANDLERS FOR iOS STABILITY
 * Prevents silent crashes from unhandled promise rejections and errors
 ******************************************************************************/
window.addEventListener('unhandledrejection', function(event) {
  console.error('[CRITICAL] Unhandled promise rejection:', event.reason);
  mpLogEntry('ERROR', 'unhandled-rejection', 'Promise rejection: ' + (event.reason ? event.reason.message : 'unknown'));
  
  // If sync is in progress and crashes, release the lock
  if(_syncInProgress){
    console.warn('[CRITICAL] Releasing stuck sync lock due to unhandled rejection');
    _syncInProgress = false;
    hideSyncingOverlay();
    mpSuppressSend = false;
    isAnimating = false;
  }
  
  // Prevent default to avoid console spam
  event.preventDefault();
});

window.addEventListener('error', function(event) {
  console.error('[CRITICAL] Unhandled error:', event.error);
  mpLogEntry('ERROR', 'unhandled-error', 'Error: ' + (event.error ? event.error.message : event.message));
  
  // If sync is in progress and crashes, release the lock
  if(_syncInProgress){
    console.warn('[CRITICAL] Releasing stuck sync lock due to unhandled error');
    _syncInProgress = false;
    hideSyncingOverlay();
    mpSuppressSend = false;
    isAnimating = false;
  }
});

/******************************************************************************
 * V10_122c: GLOBAL SYNCING OVERLAY FAILSAFE
 * Ensures overlay never stays visible for more than 15 seconds
 ******************************************************************************/
setInterval(() => {
  const overlay = document.getElementById('syncingOverlay');
  if(overlay && overlay.style.display !== 'none'){
    // Check how long overlay has been visible
    if(!overlay._shownAt){
      overlay._shownAt = Date.now();
    } else {
      const duration = Date.now() - overlay._shownAt;
      if(duration > 15000){
        console.error('[CRITICAL] Syncing overlay stuck for', Math.round(duration/1000), 's — force hiding');
        mpLogEntry('ERROR', 'overlay-stuck', 'Overlay visible for ' + Math.round(duration/1000) + 's');
        hideSyncingOverlay();
        _syncInProgress = false;
        mpSuppressSend = false;
        isAnimating = false;
        setStatus('Sync timeout - please refresh manually');
        overlay._shownAt = null;
      }
    }
  } else {
    if(overlay) overlay._shownAt = null;
  }
}, 1000);

