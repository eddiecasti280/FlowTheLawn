class FlowTheLawnGame {
    constructor() {
        this.gridSize = 12;
        this.currentLevel = 1;
        this.selectedLiquid = null;
        this.waterCount = 0;
        this.magmaCount = 0;
        this.grid = [];
        this.teleporters = [];
        this.gameState = 'planning'; // 'planning', 'simulating', 'completed'
        
        this.initializeGrid();
        this.setupEventListeners();
        this.loadLevel(1);
    }
    
    initializeGrid() {
        const gridElement = document.getElementById('game-grid');
        gridElement.innerHTML = '';
        
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Mark top row as placement row
                if (row === 0) {
                    cell.classList.add('placement-row');
                }
                
                // Mark bottom row as floor
                if (row === this.gridSize - 1) {
                    cell.classList.add('floor');
                }
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                gridElement.appendChild(cell);
                
                this.grid[row][col] = {
                    element: cell,
                    type: 'empty',
                    liquid: null,
                    surface: row === this.gridSize - 1 ? 'floor' : 'empty'
                };
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('water-btn').addEventListener('click', () => this.selectLiquid('water'));
        document.getElementById('magma-btn').addEventListener('click', () => this.selectLiquid('magma'));
        document.getElementById('submit-btn').addEventListener('click', () => this.submitSolution());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetLevel());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
    }
    
    selectLiquid(type) {
        if (this.gameState !== 'planning') return;
        
        this.selectedLiquid = type;
        
        // Update button states
        document.getElementById('water-btn').classList.toggle('selected', type === 'water');
        document.getElementById('magma-btn').classList.toggle('selected', type === 'magma');
        
        // Update placement row visual feedback
        for (let col = 0; col < this.gridSize; col++) {
            const cell = this.grid[0][col].element;
            cell.classList.remove('water-selected', 'magma-selected');
            if (type === 'water') {
                cell.classList.add('water-selected');
            } else if (type === 'magma') {
                cell.classList.add('magma-selected');
            }
        }
    }
    
    handleCellClick(row, col) {
        if (this.gameState !== 'planning') return;
        
        // Only allow placement in top row
        if (row !== 0) return;
        
        if (!this.selectedLiquid) return;
        
        const cell = this.grid[row][col];
        
        // Check if we have enough liquid of this type
        if (this.selectedLiquid === 'water' && this.waterCount <= 0) return;
        if (this.selectedLiquid === 'magma' && this.magmaCount <= 0) return;
        
        // Place liquid
        if (cell.liquid === null) {
            cell.liquid = this.selectedLiquid;
            cell.element.classList.add(this.selectedLiquid);
            console.log('Placed', this.selectedLiquid, 'at', row, col, 'Classes:', cell.element.className);
            
            // Decrease count
            if (this.selectedLiquid === 'water') {
                this.waterCount--;
            } else {
                this.magmaCount--;
            }
            
            this.updateLiquidCounts();
        } else if (cell.liquid === this.selectedLiquid) {
            // Remove liquid if clicking the same type
            cell.liquid = null;
            cell.element.classList.remove(this.selectedLiquid);
            
            // Increase count
            if (this.selectedLiquid === 'water') {
                this.waterCount++;
            } else {
                this.magmaCount++;
            }
            
            this.updateLiquidCounts();
        }
    }
    
    updateLiquidCounts() {
        document.getElementById('water-count').textContent = this.waterCount;
        document.getElementById('magma-count').textContent = this.magmaCount;
    }
    
    submitSolution() {
        if (this.gameState !== 'planning') return;
        
        this.gameState = 'simulating';
        document.getElementById('submit-btn').disabled = true;
        
        // Simulate liquid flow
        this.simulateLiquidFlow();
        
        // Check win condition
        setTimeout(() => {
            if (this.checkWinCondition()) {
                this.showLevelComplete();
            } else {
                this.gameState = 'planning';
                document.getElementById('submit-btn').disabled = false;
            }
        }, 1000);
    }
    
    simulateLiquidFlow() {
        // Create a copy of the grid for simulation
        const simulationGrid = this.grid.map(row => row.map(cell => ({
            ...cell,
            liquid: cell.liquid
        })));
        
        // Multiple passes to simulate proper water flow
        let changed = true;
        let iterations = 0;
        
        while (changed && iterations < 10) {
            changed = false;
            iterations++;
            
            // Process each cell from top to bottom, left to right
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const currentCell = simulationGrid[row][col];
                    
                    if (currentCell.liquid && currentCell.surface !== 'gray') {
                        // Try to flow down first
                        if (row < this.gridSize - 1) {
                            const belowCell = simulationGrid[row + 1][col];
                            if (belowCell.liquid === null && belowCell.surface === 'empty') {
                                // Flow down one step
                                belowCell.liquid = currentCell.liquid;
                                this.grid[row + 1][col].liquid = currentCell.liquid;
                                this.grid[row + 1][col].element.classList.add(currentCell.liquid);
                                changed = true;
                            } else if (belowCell.surface === 'grass' || belowCell.surface === 'fire') {
                                // Hit a surface, try to flow left and/or right
                                if (this.tryHorizontalFlow(simulationGrid, row, col, currentCell.liquid)) {
                                    changed = true;
                                }
                            } else if (belowCell.surface === 'floor') {
                                // Hit the floor, water stops
                                // No action needed - water stops at floor
                            }
                        } else {
                            // At bottom, try horizontal flow
                            if (this.tryHorizontalFlow(simulationGrid, row, col, currentCell.liquid)) {
                                changed = true;
                            }
                        }
                    }
                }
            }
            
            // Handle teleporters after each iteration
            this.handleTeleporters(simulationGrid);
        }
    }
    
    
    tryHorizontalFlow(simulationGrid, row, col, liquidType) {
        // Don't spread horizontally in the top row (row 0)
        if (row === 0) {
            return false;
        }
        
        let changed = false;
        
        // Try to flow left and/or right one step
        const leftCol = col - 1;
        const rightCol = col + 1;
        
        // Check left
        if (leftCol >= 0) {
            const leftCell = simulationGrid[row][leftCol];
            if (leftCell.liquid === null && (leftCell.surface === 'empty' || leftCell.surface === 'grass' || leftCell.surface === 'fire')) {
                leftCell.liquid = liquidType;
                this.grid[row][leftCol].liquid = liquidType;
                this.grid[row][leftCol].element.classList.add(liquidType);
                changed = true;
            }
        }
        
        // Check right
        if (rightCol < this.gridSize) {
            const rightCell = simulationGrid[row][rightCol];
            if (rightCell.liquid === null && (rightCell.surface === 'empty' || rightCell.surface === 'grass' || rightCell.surface === 'fire')) {
                rightCell.liquid = liquidType;
                this.grid[row][rightCol].liquid = liquidType;
                this.grid[row][rightCol].element.classList.add(liquidType);
                changed = true;
            }
        }
        
        return changed;
    }
    
    handleTeleporters(simulationGrid) {
        for (const teleporter of this.teleporters) {
            const inputCell = simulationGrid[teleporter.inputRow][teleporter.inputCol];
            const outputCell = simulationGrid[teleporter.outputRow][teleporter.outputCol];
            
            if (inputCell.liquid && !outputCell.liquid) {
                outputCell.liquid = inputCell.liquid;
                this.grid[teleporter.outputRow][teleporter.outputCol].liquid = inputCell.liquid;
                this.grid[teleporter.outputRow][teleporter.outputCol].element.classList.add(inputCell.liquid);
            }
        }
    }
    
    checkWinCondition() {
        // Check all grass cells have water adjacent
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                
                if (cell.surface === 'grass') {
                    let hasWaterAdjacent = false;
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    
                    for (const [dr, dc] of directions) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (newRow >= 0 && newRow < this.gridSize && 
                            newCol >= 0 && newCol < this.gridSize) {
                            const adjacentCell = this.grid[newRow][newCol];
                            if (adjacentCell.liquid === 'water') {
                                hasWaterAdjacent = true;
                                break;
                            }
                        }
                    }
                    
                    if (!hasWaterAdjacent) return false;
                }
                
                if (cell.surface === 'fire') {
                    let hasMagmaAdjacent = false;
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    
                    for (const [dr, dc] of directions) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (newRow >= 0 && newRow < this.gridSize && 
                            newCol >= 0 && newCol < this.gridSize) {
                            const adjacentCell = this.grid[newRow][newCol];
                            if (adjacentCell.liquid === 'magma') {
                                hasMagmaAdjacent = true;
                                break;
                            }
                        }
                    }
                    
                    if (!hasMagmaAdjacent) return false;
                }
                
                if (cell.surface === 'gray') {
                    let hasNoLiquidAdjacent = true;
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    
                    for (const [dr, dc] of directions) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (newRow >= 0 && newRow < this.gridSize && 
                            newCol >= 0 && newCol < this.gridSize) {
                            const adjacentCell = this.grid[newRow][newCol];
                            if (adjacentCell.liquid !== null) {
                                hasNoLiquidAdjacent = false;
                                break;
                            }
                        }
                    }
                    
                    if (!hasNoLiquidAdjacent) return false;
                }
            }
        }
        
        return true;
    }
    
    showLevelComplete() {
        this.gameState = 'completed';
        
        // Add success visual feedback
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.surface === 'grass' || cell.surface === 'fire' || cell.surface === 'gray') {
                    cell.element.classList.add('success');
                }
            }
        }
        
        document.getElementById('next-level-btn').style.display = 'block';
    }
    
    resetLevel() {
        this.gameState = 'planning';
        this.selectedLiquid = null;
        
        // Reset grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                cell.liquid = null;
                cell.element.className = 'grid-cell';
                if (row === 0) {
                    cell.element.classList.add('placement-row');
                }
                if (cell.surface !== 'empty') {
                    cell.element.classList.add(cell.surface);
                }
            }
        }
        
        // Reset UI
        document.getElementById('water-btn').classList.remove('selected');
        document.getElementById('magma-btn').classList.remove('selected');
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('next-level-btn').style.display = 'none';
        
        this.loadLevel(this.currentLevel);
    }
    
    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel <= 5) {
            this.loadLevel(this.currentLevel);
        } else {
            alert('Congratulations! You have completed all levels!');
        }
    }
    
    loadLevel(level) {
        this.teleporters = [];
        
        // Clear all surfaces and liquids
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                cell.surface = 'empty';
                cell.liquid = null;
                cell.element.classList.remove('grass', 'fire', 'gray', 'teleporter', 'water', 'magma');
                
                // Re-add placement row class for top row
                if (row === 0) {
                    cell.element.classList.add('placement-row');
                }
                
                // Re-add floor class for bottom row
                if (row === this.gridSize - 1) {
                    cell.element.classList.add('floor');
                    cell.surface = 'floor';
                }
            }
        }
        
        // Load level-specific content
        switch (level) {
            case 1:
                this.loadLevel1();
                break;
            case 2:
                this.loadLevel2();
                break;
            case 3:
                this.loadLevel3();
                break;
            case 4:
                this.loadLevel4();
                break;
            case 5:
                this.loadLevel5();
                break;
        }
        
        // Reset game state and UI
        this.gameState = 'planning';
        this.selectedLiquid = null;
        document.getElementById('water-btn').classList.remove('selected');
        document.getElementById('magma-btn').classList.remove('selected');
        document.getElementById('submit-btn').disabled = false;
        document.getElementById('next-level-btn').style.display = 'none';
        
        // Update UI
        document.getElementById('current-level').textContent = level;
        this.updateLevelDescription(level);
        this.updateLiquidCounts();
    }
    
    updateLevelDescription(level) {
        const descriptions = {
            1: "First buckets - Learn to place",
            2: "More platforms - Understand liquid physics",
            3: "Not on my turf - Introduce gray blocks",
            4: "Turf Wars - Introducing fire blocks and magma",
            5: "Now you're thinking with Teleporters! - Introduce teleporters",
            6: "Combination - All mechanics"
        };
        
        document.getElementById('level-description').textContent = descriptions[level] || "";
    }
    
    loadLevel1() {
        // Simple level with just 2 water blocks and 2 flat grass platforms
        this.waterCount = 2;
        this.magmaCount = 0;
        
        // Add two flat grass platforms that are easy to reach
        // Platform 1: 1x3 grass line
        for (let c = 3; c <= 5; c++) {
            this.setSurface(8, c, 'grass');
        }
        
        // Platform 2: 1x3 grass line
        for (let c = 7; c <= 9; c++) {
            this.setSurface(8, c, 'grass');
        }
    }
    
    loadLevel2() {
        // Level 2 based on the grid image - rectangular grass blocks
        this.waterCount = 3;
        this.magmaCount = 0;
        
        // Top horizontal bar (like C6:O6 in the image)
        for (let c = 2; c <= 9; c++) {
            this.setSurface(5, c, 'grass');
        }
        
        // Middle vertical bar (like P9:P15 in the image)
        for (let r = 7; r <= 10; r++) {
            this.setSurface(r, 8, 'grass');
        }
        
        // Top right horizontal bar (like W9:Y9 in the image)
        for (let c = 9; c <= 11; c++) {
            this.setSurface(7, c, 'grass');
        }
        
        // Bottom right horizontal bar (like W14:Y14 in the image)
        for (let c = 9; c <= 11; c++) {
            this.setSurface(9, c, 'grass');
        }
        
        // Bottom horizontal bar (like C18:R18 in the image)
        for (let c = 2; c <= 9; c++) {
            this.setSurface(11, c, 'grass');
        }
    }
    
    loadLevel3() {
        // Introduce gray blocks
        this.waterCount = 4;
        this.magmaCount = 0;
        
        // Add grass blocks
        this.setSurface(30, 20, 'grass');
        this.setSurface(35, 25, 'grass');
        this.setSurface(40, 30, 'grass');
        this.setSurface(45, 35, 'grass');
        this.setSurface(50, 40, 'grass');
        this.setSurface(55, 45, 'grass');
        
        // Add more gray blocks
        this.setSurface(15, 10, 'gray');
        this.setSurface(20, 15, 'gray');
        this.setSurface(25, 20, 'gray');
        this.setSurface(30, 25, 'gray');
        this.setSurface(35, 30, 'gray');
        this.setSurface(40, 35, 'gray');
        this.setSurface(45, 40, 'gray');
        this.setSurface(50, 45, 'gray');
    }
    
    loadLevel4() {
        // Introduce fire blocks and magma
        this.waterCount = 3;
        this.magmaCount = 3;
        
        // Add grass blocks
        this.setSurface(35, 25, 'grass');
        this.setSurface(40, 30, 'grass');
        this.setSurface(45, 35, 'grass');
        this.setSurface(50, 40, 'grass');
        this.setSurface(55, 45, 'grass');
        
        // Add fire blocks
        this.setSurface(35, 45, 'fire');
        this.setSurface(40, 50, 'fire');
        this.setSurface(45, 55, 'fire');
        this.setSurface(50, 60, 'fire');
        this.setSurface(55, 65, 'fire');
        
        // Add some gray blocks
        this.setSurface(20, 15, 'gray');
        this.setSurface(25, 20, 'gray');
        this.setSurface(30, 25, 'gray');
        this.setSurface(35, 30, 'gray');
        this.setSurface(40, 35, 'gray');
        this.setSurface(45, 40, 'gray');
    }
    
    loadLevel5() {
        // All mechanics including teleporters
        this.waterCount = 4;
        this.magmaCount = 4;
        
        // Add grass blocks
        this.setSurface(40, 20, 'grass');
        this.setSurface(45, 25, 'grass');
        this.setSurface(50, 30, 'grass');
        this.setSurface(55, 35, 'grass');
        this.setSurface(60, 40, 'grass');
        this.setSurface(65, 45, 'grass');
        
        // Add fire blocks
        this.setSurface(40, 45, 'fire');
        this.setSurface(45, 50, 'fire');
        this.setSurface(50, 55, 'fire');
        this.setSurface(55, 60, 'fire');
        this.setSurface(60, 65, 'fire');
        this.setSurface(65, 70, 'fire');
        
        // Add gray blocks
        this.setSurface(15, 10, 'gray');
        this.setSurface(20, 15, 'gray');
        this.setSurface(25, 20, 'gray');
        this.setSurface(30, 25, 'gray');
        this.setSurface(35, 30, 'gray');
        this.setSurface(40, 35, 'gray');
        this.setSurface(45, 40, 'gray');
        this.setSurface(50, 45, 'gray');
        this.setSurface(55, 50, 'gray');
        this.setSurface(60, 55, 'gray');
        
        // Add teleporters
        this.addTeleporter(15, 20, 50, 20);
        this.addTeleporter(25, 40, 45, 40);
    }
    
    setSurface(row, col, surfaceType) {
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            const cell = this.grid[row][col];
            cell.surface = surfaceType;
            cell.element.classList.add(surfaceType);
        }
    }
    
    addTeleporter(inputRow, inputCol, outputRow, outputCol) {
        this.setSurface(inputRow, inputCol, 'teleporter');
        this.setSurface(outputRow, outputCol, 'teleporter');
        
        this.teleporters.push({
            inputRow,
            inputCol,
            outputRow,
            outputCol
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlowTheLawnGame();
});
