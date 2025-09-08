# FlowTheLawn

A liquid flow puzzle game where you strategically place water and magma buckets to water grass and extinguish fires!

## How to Start the Game

### Method 1: Direct File Opening
1. Open `index.html` in your web browser
2. The game will automatically load Level 1
3. You'll see a 12x12 grid with the top row available for placing liquids

### Method 2: Command Line (macOS)
```bash
# Open in default browser
open index.html

# Or open in specific browser
open -a "Google Chrome" index.html
open -a "Safari" index.html
open -a "Firefox" index.html
```

### Method 3: Command Line (Linux)
```bash
# Open in default browser
xdg-open index.html

# Or open in specific browser
google-chrome index.html
firefox index.html
```

### Method 4: Command Line (Windows)
```cmd
# Open in default browser
start index.html

# Or open in specific browser
start chrome index.html
start firefox index.html
```

### Method 5: Local Web Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

## Game Controls

### Liquid Selection
- **Water Button**: Click to select water for placement
- **Magma Button**: Click to select magma for placement
- The selected liquid type will be highlighted

### Placement
- **Click** on any cell in the top row to place the selected liquid
- **Click again** on a placed liquid to remove it and get it back
- You can only place liquids in the top row (placement row)

### Game Actions
- **Submit Button**: Start the liquid flow simulation
- **Reset Button**: Clear all placed liquids and restart the level
- **Next Level Button**: Proceed to the next level (appears after completing a level)

## Game Objective

Your goal is to satisfy all the requirements on the grid:

- **Grass blocks** (green): Must have water adjacent to them
- **Fire blocks** (red): Must have magma adjacent to them  
- **Gray blocks** (gray): Must NOT have any liquid adjacent to them

## How Liquid Flow Works

1. **Gravity**: Liquids flow downward first
2. **Horizontal Spread**: When liquids hit a surface (grass/fire), they spread left and right
3. **Teleporters**: Some levels have teleporter pairs that transport liquids
4. **Floor**: Liquids stop when they reach the bottom floor

## Game Elements

- **Water** (blue): Used to water grass blocks
- **Magma** (red/orange): Used to extinguish fire blocks
- **Grass** (green): Needs water adjacent to be satisfied
- **Fire** (red): Needs magma adjacent to be satisfied
- **Gray** (gray): Must remain dry (no liquid adjacent)
- **Teleporter** (purple): Transports liquids between connected pairs

## Tips

- Plan your placement carefully - liquids flow according to physics
- Use the Reset button if you make a mistake
- Watch the liquid counts - you have limited resources per level
- Some levels introduce new mechanics like teleporters and gray blocks

Enjoy the puzzle!
