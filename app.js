/**
 * BLOCKBLAST.SI - Interactive Controller & UI Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  let boardState = Array.from({ length: 8 }, () => Array(8).fill(0));
  let selectedPieceSlots = ['line_h3', 'corner_tl', 'square_2'];
  let activeSlotIndex = 0;
  let currentSolution = null;
  let activeStepAnimationIdx = 0;

  // DOM Elements
  const gridContainer = document.getElementById('boardGrid');
  const clearBoardBtn = document.getElementById('clearBoardBtn');
  const fillRandomBtn = document.getElementById('fillRandomBtn');
  const solveBtn = document.getElementById('solveBtn');
  const solutionPanel = document.getElementById('solutionPanel');
  const solutionList = document.getElementById('solutionList');
  const shapeLibrary = document.getElementById('shapeLibrary');
  const dropzone = document.getElementById('dropzone');
  const screenshotInput = document.getElementById('screenshotInput');

  // 1. Initialize 8x8 Grid UI
  function renderBoard() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (boardState[r][c] === 1) {
          cell.classList.add('occupied');
        }

        cell.addEventListener('click', () => {
          boardState[r][c] = boardState[r][c] === 1 ? 0 : 1;
          renderBoard();
          clearHighlights();
        });

        gridContainer.appendChild(cell);
      }
    }
  }

  // 2. Initialize Shape Slots Tray
  function renderSlots() {
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      if (!slotEl) continue;

      slotEl.innerHTML = '';
      const label = document.createElement('span');
      label.className = 'slot-label';
      label.textContent = `SHAPE ${i + 1}`;
      slotEl.appendChild(label);

      if (i === activeSlotIndex) {
        slotEl.classList.add('selected');
      } else {
        slotEl.classList.remove('selected');
      }

      const shapeId = selectedPieceSlots[i];
      if (shapeId && window.SHAPES_DB[shapeId]) {
        const matrix = window.SHAPES_DB[shapeId].matrix;
        const preview = document.createElement('div');
        preview.className = 'piece-preview-mini';
        preview.style.gridTemplateColumns = `repeat(${matrix[0].length}, 14px)`;

        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[0].length; c++) {
            const block = document.createElement('div');
            block.className = 'mini-block';
            if (matrix[r][c] === 0) {
              block.style.opacity = '0';
            }
            preview.appendChild(block);
          }
        }
        slotEl.appendChild(preview);
      } else {
        slotEl.innerHTML += `<span style="font-size:0.75rem; color:var(--text-dim);">[Empty]</span>`;
      }

      slotEl.onclick = () => {
        activeSlotIndex = i;
        renderSlots();
      };
    }
  }

  // 3. Initialize Shape Library Grid
  function renderShapeLibrary() {
    if (!shapeLibrary) return;
    shapeLibrary.innerHTML = '';

    for (let [id, shape] of Object.entries(window.SHAPES_DB)) {
      const btn = document.createElement('button');
      btn.className = 'shape-choice-btn';
      btn.type = 'button';
      btn.title = shape.name;

      const preview = document.createElement('div');
      preview.className = 'piece-preview-mini';
      preview.style.gridTemplateColumns = `repeat(${shape.matrix[0].length}, 8px)`;

      for (let r = 0; r < shape.matrix.length; r++) {
        for (let c = 0; c < shape.matrix[0].length; c++) {
          const block = document.createElement('div');
          block.style.width = '8px';
          block.style.height = '8px';
          block.style.borderRadius = '1px';
          block.style.background = shape.matrix[r][c] === 1 ? 'var(--primary-accent)' : 'transparent';
          preview.appendChild(block);
        }
      }

      btn.appendChild(preview);
      btn.addEventListener('click', () => {
        selectedPieceSlots[activeSlotIndex] = id;
        activeSlotIndex = (activeSlotIndex + 1) % 3;
        renderSlots();
      });

      shapeLibrary.appendChild(btn);
    }
  }

  // 4. Solve Button Action
  function solvePuzzle() {
    clearHighlights();
    const solution = window.blockBlastSolver.solve(boardState, selectedPieceSlots);

    if (!solution || solution.length === 0) {
      if (solutionPanel && solutionList) {
        solutionPanel.style.display = 'block';
        solutionList.innerHTML = `
          <div style="color: #f87171; padding: 0.8rem; text-align: center; font-weight: 700;">
            ⚠️ No valid placement found for all 3 pieces without overlapping. Try clearing or adjusting the board.
          </div>
        `;
      }
      return;
    }

    currentSolution = solution;
    displaySolution(solution);
    highlightSolutionStep(0);
  }

  function displaySolution(steps) {
    if (!solutionPanel || !solutionList) return;
    solutionPanel.style.display = 'block';
    solutionList.innerHTML = '';

    steps.forEach((step, idx) => {
      const item = document.createElement('div');
      item.className = 'solution-step-item';
      item.style.cursor = 'pointer';

      const shapeId = selectedPieceSlots[step.pieceIndex];
      const shapeName = window.SHAPES_DB[shapeId] ? window.SHAPES_DB[shapeId].name : `Piece ${step.pieceIndex + 1}`;

      item.innerHTML = `
        <span class="step-num-badge badge-s${step.step}">STEP ${step.step}</span>
        <div class="solution-step-text">
          <strong>${shapeName}</strong> ➔ Row ${step.row + 1}, Col ${step.col + 1}
        </div>
        <div class="solution-step-stat">
          ${step.linesCleared > 0 ? `🔥 +${step.linesCleared} Lines` : `+${step.points} Pts`}
        </div>
      `;

      item.addEventListener('click', () => {
        highlightSolutionStep(idx);
      });

      solutionList.appendChild(item);
    });
  }

  function highlightSolutionStep(stepIdx) {
    clearHighlights();
    if (!currentSolution || !currentSolution[stepIdx]) return;

    const step = currentSolution[stepIdx];
    const matrix = step.matrix;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[0].length; c++) {
        if (matrix[r][c] === 1) {
          const targetR = step.row + r;
          const targetC = step.col + c;
          const cell = document.querySelector(`.grid-cell[data-row="${targetR}"][data-col="${targetC}"]`);
          if (cell) {
            cell.classList.add(`highlight-step-${step.step}`);
            cell.textContent = `${step.step}`;
          }
        }
      }
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.grid-cell').forEach(cell => {
      cell.classList.remove('highlight-step-1', 'highlight-step-2', 'highlight-step-3');
      cell.textContent = '';
    });
  }

  // 5. Screenshot Dropzone & Paste Scanner
  if (dropzone && screenshotInput) {
    dropzone.addEventListener('click', () => screenshotInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) handleImageFile(files[0]);
    });

    screenshotInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleImageFile(e.target.files[0]);
    });

    // Global Paste Listener (Ctrl+V)
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          handleImageFile(item.getAsFile());
          break;
        }
      }
    });
  }

  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const detected = await window.blockBlastVision.analyzeImage(img);
        boardState = detected;
        renderBoard();
        solvePuzzle();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // 6. Button Listeners
  if (clearBoardBtn) {
    clearBoardBtn.addEventListener('click', () => {
      boardState = Array.from({ length: 8 }, () => Array(8).fill(0));
      renderBoard();
      clearHighlights();
      if (solutionPanel) solutionPanel.style.display = 'none';
    });
  }

  if (fillRandomBtn) {
    fillRandomBtn.addEventListener('click', () => {
      boardState = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => Math.random() < 0.28 ? 1 : 0));
      renderBoard();
      clearHighlights();
      solvePuzzle();
    });
  }

  if (solveBtn) {
    solveBtn.addEventListener('click', solvePuzzle);
  }

  // Menu toggle for mobile
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      siteNav.classList.toggle('open');
    });
  }

  // Initial Boot
  renderBoard();
  renderSlots();
  renderShapeLibrary();
});
