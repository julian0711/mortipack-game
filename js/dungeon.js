import { randomInt, shuffle } from './utils.js';
import { currentGridWidth, currentGridHeight } from './constants.js';

export class Dungeon {
    constructor() {
        this.grid = [];
        this.rooms = [];
        this.start = { x: 0, y: 0 };
        this.goal = { x: 0, y: 0 };
    }

    generate() {
        // Initialize grid
        for (let x = 0; x < currentGridWidth; x++) {
            this.grid[x] = [];
            for (let y = 0; y < currentGridHeight; y++) {
                this.grid[x][y] = {
                    type: "wall",
                    discovered: false,
                    visible: false,
                    shelf: false,
                    shelfSearched: false,
                    item: null,
                    forceKey: false,
                    tempRevealed: 0,
                    blood: false,
                    hiddenChar: null
                };
            }
        }

        this.rooms = [];
        let roomCount = randomInt(5, 10);
        for (let i = 0; i < roomCount; i++) {
            let roomW = randomInt(4, 6);
            let roomH = randomInt(4, 6);
            let roomX = randomInt(1, currentGridWidth - roomW - 1);
            let roomY = randomInt(1, currentGridHeight - roomH - 1);
            let newRoom = { x: roomX, y: roomY, w: roomW, h: roomH };
            let failed = false;
            for (let other of this.rooms) {
                if (newRoom.x <= other.x + other.w + 1 &&
                    newRoom.x + newRoom.w + 1 >= other.x &&
                    newRoom.y <= other.y + other.h + 1 &&
                    newRoom.y + newRoom.h + 1 >= other.y) {
                    failed = true;
                    break;
                }
            }
            if (!failed) {
                this.createRoom(newRoom);
                this.rooms.push(newRoom);
            }
        }

        for (let i = 1; i < this.rooms.length; i++) {
            let prev = this.centerOfRoom(this.rooms[i - 1]);
            let curr = this.centerOfRoom(this.rooms[i]);
            if (Math.random() < 0.5) {
                this.createHCorridor(prev.x, curr.x, prev.y);
                this.createVCorridor(prev.y, curr.y, curr.x);
            } else {
                this.createVCorridor(prev.y, curr.y, prev.x);
                this.createHCorridor(prev.x, curr.x, curr.y);
            }
        }

        this.start = this.randomFloorPosition();
        this.goal = this.randomFloorPosition();
        while (this.goal.x === this.start.x && this.goal.y === this.start.y) {
            this.goal = this.randomFloorPosition();
        }
        this.grid[this.goal.x][this.goal.y].type = "door";

        // Blood
        for (let x = 0; x < currentGridWidth; x++) {
            for (let y = 0; y < currentGridHeight; y++) {
                if (this.grid[x][y].type === "floor" && Math.random() < 0.05) {
                    this.grid[x][y].blood = true;
                }
            }
        }

        // Shelves and Items
        let keyPlaced = false;
        let shelfPositions = [];
        for (let room of this.rooms) {
            let perimeter = [];
            for (let x = room.x; x < room.x + room.w; x++) {
                perimeter.push({ x: x, y: room.y });
            }
            if (room.h > 1) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    perimeter.push({ x: x, y: room.y + room.h - 1 });
                }
            }
            if (room.w > 1) {
                for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
                    perimeter.push({ x: room.x, y: y });
                }
            }
            if (room.w > 1) {
                for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
                    perimeter.push({ x: room.x + room.w - 1, y: y });
                }
            }
            let uniquePerimeter = {};
            perimeter.forEach(pos => { uniquePerimeter[pos.x + "," + pos.y] = pos; });
            perimeter = Object.values(uniquePerimeter);
            let shelfCount = randomInt(0, 7);
            if (shelfCount > perimeter.length) shelfCount = perimeter.length;
            shuffle(perimeter);
            for (let i = 0; i < shelfCount; i++) {
                let pos = perimeter[i];
                if (this.grid[pos.x][pos.y].type === "floor" && !this.grid[pos.x][pos.y].shelf) {
                    this.grid[pos.x][pos.y].shelf = true;
                    this.grid[pos.x][pos.y].shelfSearched = false;
                    shelfPositions.push({ x: pos.x, y: pos.y });

                    // Weighted Item Generation
                    const itemWeights = {
                        "nothing": 1200,
                        "doll": 80,
                        "talisman": 50,
                        "key": !keyPlaced ? 100 : 0, // Only available if not placed
                        "radio": 80,
                        "doc": 100,
                        "hallucinogen": 100,
                        "warpcoin": 100,
                        "map": 100,
                        "bluebox": 50,
                        "warp_gun": 100
                    };

                    let totalWeight = 0;
                    for (let key in itemWeights) {
                        totalWeight += itemWeights[key];
                    }

                    let randomValue = Math.random() * totalWeight;
                    let selectedItem = "nothing";

                    for (let key in itemWeights) {
                        if (randomValue < itemWeights[key]) {
                            selectedItem = key;
                            break;
                        }
                        randomValue -= itemWeights[key];
                    }

                    if (selectedItem !== "nothing") {
                        this.grid[pos.x][pos.y].item = selectedItem;
                        if (selectedItem === "key") keyPlaced = true;
                    } else {
                        this.grid[pos.x][pos.y].item = null;
                    }
                }
            }
        }

        if (!keyPlaced && shelfPositions.length > 0) {
            let availableShelves = shelfPositions.filter(pos =>
                !this.grid[pos.x][pos.y].shelfSearched && !this.grid[pos.x][pos.y].item
            );
            if (availableShelves.length > 0) {
                let forcedShelf = availableShelves[randomInt(0, availableShelves.length - 1)];
                this.grid[forcedShelf.x][forcedShelf.y].item = "key";
                keyPlaced = true;
            } else {
                let forcedShelf = shelfPositions[randomInt(0, shelfPositions.length - 1)];
                this.grid[forcedShelf.x][forcedShelf.y].item = "key";
                this.grid[forcedShelf.x][forcedShelf.y].shelfSearched = false;
                keyPlaced = true;
            }
        }

        // Shop Door (1/3 chance)
        if (randomInt(1, 3) === 1) {
            let shopPos = this.randomFloorPosition();
            // Ensure it doesn't overwrite start or goal
            while ((shopPos.x === this.start.x && shopPos.y === this.start.y) ||
                (shopPos.x === this.goal.x && shopPos.y === this.goal.y)) {
                shopPos = this.randomFloorPosition();
            }
            this.grid[shopPos.x][shopPos.y].type = "door_shop";
        }

        // Hidden characters
        for (let i = 0; i < 2; i++) {
            if (randomInt(1, 200) === 1) {
                let pos = this.randomFloorPosition();
                if (!this.grid[pos.x][pos.y].hiddenChar) {
                    this.grid[pos.x][pos.y].hiddenChar = (randomInt(0, 1) === 0) ? "orangehat" : "packmate";
                }
            }
        }
    }

    createRoom(room) {
        for (let x = room.x; x < room.x + room.w; x++) {
            for (let y = room.y; y < room.y + room.h; y++) {
                this.grid[x][y].type = "floor";
            }
        }
    }

    centerOfRoom(room) {
        return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
    }

    createHCorridor(x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            for (let offset = 0; offset < 2; offset++) {
                if (y + offset < currentGridHeight) {
                    this.grid[x][y + offset].type = "floor";
                }
            }
        }
    }

    createVCorridor(y1, y2, x) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            for (let offset = 0; offset < 2; offset++) {
                if (x + offset < currentGridWidth) {
                    this.grid[x + offset][y].type = "floor";
                }
            }
        }
    }

    randomFloorPosition() {
        let pos;
        while (true) {
            let x = randomInt(0, currentGridWidth - 1);
            let y = randomInt(0, currentGridHeight - 1);
            if (this.grid[x][y].type === "floor" || this.grid[x][y].type === "door") {
                pos = { x: x, y: y };
                break;
            }
        }
        return pos;
    }

    updateMapReveals(dt) {
        for (let x = 0; x < currentGridWidth; x++) {
            for (let y = 0; y < currentGridHeight; y++) {
                if (this.grid[x][y].tempRevealed !== Infinity && this.grid[x][y].tempRevealed > 0) {
                    this.grid[x][y].tempRevealed = Math.max(this.grid[x][y].tempRevealed - dt, 0);
                }
            }
        }
    }

    updateVisibility(playerX, playerY) {
        let newlyDiscoveredCount = 0;
        for (let x = 0; x < currentGridWidth; x++) {
            for (let y = 0; y < currentGridHeight; y++) {
                this.grid[x][y].visible = false;
            }
        }
        if (playerX >= 0 && playerX < currentGridWidth && playerY >= 0 && playerY < currentGridHeight) {
            this.grid[playerX][playerY].visible = true;
            if (!this.grid[playerX][playerY].discovered) {
                this.grid[playerX][playerY].discovered = true;
                newlyDiscoveredCount++;
            }
        }
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let nx = playerX + dx, ny = playerY + dy;
                if (nx >= 0 && nx < currentGridWidth && ny >= 0 && ny < currentGridHeight) {
                    this.grid[nx][ny].visible = true;
                    if (!this.grid[nx][ny].discovered) {
                        this.grid[nx][ny].discovered = true;
                        newlyDiscoveredCount++;
                    }
                }
            }
        }
        return newlyDiscoveredCount;
    }

    isMapFullyDiscovered() {
        for (let x = 0; x < currentGridWidth; x++) {
            for (let y = 0; y < currentGridHeight; y++) {
                // Only check walkable tiles (floor and door) for completion.
                // Walls that are deep inside the rock cannot be seen, so we shouldn't require them.
                if ((this.grid[x][y].type === "floor" || this.grid[x][y].type === "door") && !this.grid[x][y].discovered) {
                    return false;
                }
            }
        }
        return true;
    }

    getCluster(x, y, count) {
        let cluster = [];
        let queue = [{ x: x, y: y }];
        let visited = new Set();
        while (queue.length > 0 && cluster.length < count) {
            let pos = queue.shift();
            let key = pos.x + "," + pos.y;
            if (visited.has(key)) continue;
            visited.add(key);
            let cell = this.grid[pos.x][pos.y];
            if (cell.type === "floor" || cell.type === "door") {
                cluster.push(pos);
            }
            let neighbors = [
                { x: pos.x + 1, y: pos.y },
                { x: pos.x - 1, y: pos.y },
                { x: pos.x, y: pos.y + 1 },
                { x: pos.x, y: pos.y - 1 }
            ];
            shuffle(neighbors);
            for (let n of neighbors) {
                if (n.x >= 0 && n.x < currentGridWidth && n.y >= 0 && n.y < currentGridHeight) {
                    if (!visited.has(n.x + "," + n.y)) {
                        queue.push(n);
                    }
                }
            }
        }
        return cluster;
    }
}
