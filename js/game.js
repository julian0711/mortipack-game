// Game implementation with developer mode
import { TILE_SIZE, currentGridWidth, currentGridHeight } from './constants.js';
import { randomInt } from './utils.js';
import { Dungeon } from './dungeon.js';
import { UI } from './ui.js';
import { moveEnemyTowards, updateAnimations } from './entity.js';
import { getItemDescription, useItem } from './items.js';

import { CHARMS } from './charms.js';

export class Game {
    constructor() {

        // Developer mode flag and input buffer for title screen cheat code
        this.developerMode = false;
        this.titleInputBuffer = "";
        // Canvas setup
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = TILE_SIZE * currentGridWidth;
        this.canvas.height = TILE_SIZE * currentGridHeight;
        // UI and dungeon
        this.ui = new UI(this.canvas, this.ctx, this);
        this.dungeon = new Dungeon();
        // Game state variables
        this.score = 0;
        this.turnCount = 0;
        this.moveCount = 0;
        this.ghostTimeTurnsRemaining = 0;
        this.goalMultiplierAnimation = null;
        this.itemPickupAnimation = null;
        this.warpAnimation = null;
        this.projectileAnimation = null;
        this.currentFloor = 1;
        this.player = null;
        this.enemies = [];
        this.shopItems = []; // Shop inventory for current floor
        this.gameState = "title"; // title, playing, dying, victory, gameOver, nextFloor
        this.inputMode = "normal"; // normal, warp_gun_aim
        this.message = "";
        this.lastFrameTime = 0;
        this.gameMode = "endless";
        // Audio
        this.titleBGM = new Audio("titleBGM.mp3");
        this.titleBGM.loop = true;
        this.stageBGM = new Audio("stageBGM.mp3");
        this.stageBGM.loop = true;
        this.itemGetSE = new Audio("itemGetSE.mp3");
        this.itemGetSE.volume = 0.4;
        this.deadSE = new Audio("deadSE.mp3");
        this.deadSE.volume = 0.4;
        this.getSE = new Audio("getSE.mp3");
        this.getSE.volume = 0.4;
        this.migawariSE = new Audio("migawariSE.mp3");
        this.migawariSE.volume = 0.4;
        this.warpSE = new Audio("warpSE.mp3");
        this.warpSE.volume = 0.4;
        this.radarSE = new Audio("radarSE.mp3");
        this.radarSE.volume = 0.4;
        this.searchSE = new Audio("searchSE.mp3");
        this.searchSE.volume = 0.4;
        this.radioSE = new Audio("radioSE.mp3");
        this.radioSE.volume = 0.4;
        this.doorSE = new Audio("doorSE.mp3");
        this.doorSE.volume = 0.4;
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        this.ui.showLogoScreen();
        window.addEventListener("keydown", this.handleKeyDown);
        requestAnimationFrame(this.gameLoop);
    }

    newGame() {
        this.currentFloor = 1;
        this.score = 0;
        this.turnCount = 0;
        this.moveCount = 0;
        this.player = null;
        // If developer mode, give all items at start
        if (this.developerMode) {
            this.player = { inventory: ["key", "radio", "doc", "hallucinogen", "warpcoin", "map", "talisman", "doll", "bluebox", "warp_gun"] };
        }
        this.nextFloor();
    }

    nextFloor() {
        if (this.gameMode === "story" && this.currentFloor === 7) {
            this.gameState = "victory";
            this.ui.drawGame();
            this.ui.showVictory();
            return;
        }
        if (this.gameState === "victory" || this.gameState === "shop") {
            this.currentFloor = (this.currentFloor === 1) ? 2 : this.currentFloor + 1;
        }
        this.turnCount = 0;
        this.moveCount = 0;
        this.ghostTimeTurnsRemaining = 0;
        this.goalMultiplierAnimation = null;
        this.itemPickupAnimation = null;
        this.warpAnimation = null;
        this.projectileAnimation = null;
        this.floorFullyDiscovered = false;
        this.dungeon.generate();

        // Generate Shop Items for this floor
        let availableCharms = [...CHARMS];
        this.shopItems = [];
        for (let i = 0; i < 3; i++) {
            if (availableCharms.length === 0) break;
            let idx = Math.floor(Math.random() * availableCharms.length);
            this.shopItems.push(availableCharms[idx]);
            availableCharms.splice(idx, 1);
        }
        // Preserve inventory if already exists (developer mode case)
        const existingInventory = this.player && this.player.inventory ? this.player.inventory : [];
        const existingCharms = this.player && this.player.charms ? this.player.charms : [];
        this.player = {
            x: this.dungeon.start.x,
            y: this.dungeon.start.y,
            prevX: this.dungeon.start.x,
            prevY: this.dungeon.start.y,
            animTime: 0,
            isMoving: false,
            inventory: existingInventory,
            charms: existingCharms,
            deathTimer: 0,
            opacity: 1,
            facing: "right"
        };
        // Ensure developer mode has all items
        if (this.developerMode) {
            this.player.inventory = ["key", "radio", "doc", "hallucinogen", "warpcoin", "map", "talisman", "doll", "bluebox", "warp_gun"];
        }
        this.enemies = [];
        const numEnemies = (this.gameMode === "story") ? randomInt(2, 4) : randomInt(3, 5);
        for (let i = 0; i < numEnemies; i++) {
            let enemyPos = this.dungeon.randomFloorPosition();
            while ((enemyPos.x === this.dungeon.start.x && enemyPos.y === this.dungeon.start.y) ||
                (enemyPos.x === this.dungeon.goal.x && enemyPos.y === this.dungeon.goal.y)) {
                enemyPos = this.dungeon.randomFloorPosition();
            }
            this.enemies.push({
                x: enemyPos.x,
                y: enemyPos.y,
                prevX: enemyPos.x,
                prevY: enemyPos.y,
                animTime: 0,
                isMoving: false,
                freeze: 0,
                delay: 0,
                hallucinogenTurns: 0,
                isVisible: false
            });
        }
        this.gameState = "playing";
        this.message = "";
        this.updateVisibility();
        this.ui.updateInventoryUI();
        this.lastFrameTime = performance.now();
        if (this.stageBGM.paused) {
            this.stageBGM.play().catch(err => console.log(err));
        }
    }

    // Title screen cheat code handling and normal gameplay input
    handleKeyDown(e) {
        if (this.gameState === "title") {
            if (/^[0-9]$/.test(e.key)) {
                this.titleInputBuffer += e.key;
                if (this.titleInputBuffer.endsWith("9137")) {
                    this.developerMode = true;
                    this.message = "開発者モード有効";
                }
                if (this.titleInputBuffer.length > 10) {
                    this.titleInputBuffer = this.titleInputBuffer.slice(-10);
                }
            }
            return;
        }
        if (this.gameState !== "playing") return;

        // ---------- 転送銃の照準モード ----------
        if (this.inputMode === "warp_gun_aim") {
            let dx = 0, dy = 0;
            if (e.key === "ArrowUp") dy = -1;
            else if (e.key === "ArrowDown") dy = 1;
            else if (e.key === "ArrowLeft") dx = -1;
            else if (e.key === "ArrowRight") dx = 1;
            else {
                return; // 方向キー以外は無視
            }

            this.inputMode = "normal";
            this.removeItemFromInventory("warp_gun");

            // 弾発射アニメーションを開始（即時判定ではなくアニメーションに任せる）
            this.projectileAnimation = {
                active: true,
                startPos: { x: this.player.x, y: this.player.y },
                currentPos: { x: this.player.x, y: this.player.y },
                dir: { x: dx, y: dy },
                startTime: performance.now(),
                speed: 50 // ms per tile (faster)
            };

            this.warpSE.currentTime = 0;
            this.warpSE.play().catch(err => console.log(err));

            this.processTurn();
            this.ui.drawGame();
            return;
        }
        // Existing movement and action logic (full implementation)
        let validTurn = false;
        let newX = this.player.x;
        let newY = this.player.y;

        // ---------- 移動処理 ----------
        if (e.key === "ArrowUp") { newY--; validTurn = true; }
        else if (e.key === "ArrowDown") { newY++; validTurn = true; }
        else if (e.key === "ArrowLeft") { newX--; validTurn = true; this.player.facing = "left"; }
        else if (e.key === "ArrowRight") { newX++; validTurn = true; this.player.facing = "right"; }
        // ---------- 調査 (e) ----------
        else if (e.key === "e" || e.key === "E") {
            const cell = this.dungeon.grid[this.player.x][this.player.y];
            if (cell.shelf && !cell.shelfSearched) {
                cell.shelfSearched = true;
                if (cell.forceKey) {
                    this.player.inventory.push("key");
                    this.message = "カギが見つかった！";
                    this.score += 15;
                    this.itemPickupAnimation = { active: true, item: "key", x: this.player.x, y: this.player.y, startTime: performance.now(), duration: 500 };
                    this.getSE.currentTime = 0; this.getSE.play().catch(err => console.log(err));
                } else if (cell.item) {
                    const item = cell.item;
                    this.itemPickupAnimation = { active: true, item, x: this.player.x, y: this.player.y, startTime: performance.now(), duration: 500 };
                    this.getSE.currentTime = 0; this.getSE.play().catch(err => console.log(err));
                    if (item === "doc") { this.score += 200; this.message = "資料を手に入れた。これはすごい内容だ！（200ポイント）"; }
                    else if (item === "map") { useItem("map", this); }
                    else { this.player.inventory.push(item); if (["radio", "hallucinogen", "warpcoin", "talisman", "doll", "bluebox", "warp_gun"].includes(item)) this.score += 50; else if (item === "key") this.score += 15; this.message = "アイテム入手: " + getItemDescription(item); }
                } else {
                    this.message = "棚は空っぽでした。";
                    this.searchSE.currentTime = 0; this.searchSE.play().catch(err => console.log(err));
                }
                validTurn = true;
                this.ui.updateInventoryUI();
                this.ui.drawGame();
            }
            return;
        }
        // ---------- その他キーは無視 ----------
        if (!validTurn) return;

        // ---------- 移動可能かチェック ----------
        if (newX < 0 || newX >= currentGridWidth || newY < 0 || newY >= currentGridHeight) return;
        const destCell = this.dungeon.grid[newX][newY];
        if (destCell.type === "wall") { this.message = "そこには行けません。"; this.ui.drawGame(); return; }

        // ---------- プレイヤー位置更新 ----------
        this.player.prevX = this.player.x; this.player.prevY = this.player.y;
        this.player.x = newX; this.player.y = newY;
        this.player.animTime = 0; this.player.isMoving = true;
        this.message = ""; this.moveCount++;
        this.updateVisibility();

        // ---------- 隠しキャラ取得 ----------
        const curCell = this.dungeon.grid[this.player.x][this.player.y];
        if (curCell.hiddenChar) { this.score += 1000; this.message = "隠しキャラ発見！1000ポイント獲得！"; curCell.hiddenChar = null; }

        // ---------- ドア処理 ----------
        // ---------- ドア処理 ----------
        // ドア（通常・ショップ）の場合は移動前にチェックして、入る処理を行う
        // 移動してしまうと、次のフレームで描画位置がおかしくなったり、イベントが発火しなかったりする可能性があるため
        // ここでは「移動先がドアなら移動をキャンセルしてイベント発火」というロジックにするか、
        // あるいは「移動後にイベント発火」にするかだが、
        // 既存のコードは移動後に判定している。
        // しかし、this.player.x = newX しているので、プレイヤーはドアの上に重なる。
        // その状態で showShopScreen() などを呼ぶと、gameState が変わり、gameLoop でのアニメーション更新が止まる可能性がある。
        // 特に isMoving = true になっているので、アニメーションが終わるまで入力を受け付けないガードがある。
        // ショップ画面等のオーバーレイが出る場合、isMoving を false にリセットするか、即座に遷移する必要がある。

        if (destCell.type === "door") {
            const keyIdx = this.player.inventory.indexOf("key");
            if (keyIdx !== -1) {
                this.player.inventory.splice(keyIdx, 1);
                this.player.isMoving = false; // Stop movement animation immediately
                if (this.gameMode === "story") {
                    if (this.currentFloor < 6) { this.currentFloor++; this.gameState = "nextFloor"; this.doorSE.currentTime = 0; this.doorSE.play().catch(err => console.log(err)); this.ui.drawGame(); this.nextFloor(); return; }
                    else { this.gameState = "victory"; this.doorSE.currentTime = 0; this.doorSE.play().catch(err => console.log(err)); this.ui.drawGame(); this.ui.showVictory(); return; }
                } else { this.gameState = "victory"; this.doorSE.currentTime = 0; this.doorSE.play().catch(err => console.log(err)); this.ui.drawGame(); this.ui.showVictory(); return; }
            } else {
                this.message = "鍵が必要です。";
                // Move back if no key (optional, but keeps player off door)
                this.player.x = this.player.prevX;
                this.player.y = this.player.prevY;
                this.player.isMoving = false;
                this.ui.drawGame();
                return;
            }
        } else if (destCell.type === "door_shop") {
            const keyIdx = this.player.inventory.indexOf("key");
            if (keyIdx !== -1) {
                this.player.inventory.splice(keyIdx, 1);
                this.player.isMoving = false; // Stop movement animation immediately
                this.gameState = "shop";
                this.doorSE.currentTime = 0;
                this.doorSE.play().catch(err => console.log(err));
                this.ui.drawGame();
                this.ui.showShopScreen();
                return;
            }
            else {
                this.message = "鍵が必要です。";
                // Move back if no key
                this.player.x = this.player.prevX;
                this.player.y = this.player.prevY;
                this.player.isMoving = false;
                this.ui.drawGame();
                return;
            }
        }

        // ---------- 敵衝突チェック ----------
        for (let enemy of this.enemies) {
            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                const dollIdx = this.player.inventory.indexOf("doll");
                if (dollIdx !== -1) {
                    this.player.inventory.splice(dollIdx, 1);
                    this.ui.updateInventoryUI();
                    enemy.freeze = 5;
                    this.message = "身代わり人形が崩れ去った！触れた敵は5ターン動けなくなった！";
                    this.migawariSE.currentTime = 0; this.migawariSE.play().catch(err => console.log(err));
                } else {
                    if (this.gameState !== "dying") { this.gameState = "dying"; this.player.deathTimer = 0; this.deadSE.currentTime = 0; this.deadSE.play().catch(err => console.log(err)); }
                    this.ui.drawGame(); return;
                }
            }
        }

        // ---------- 敵の行動 ----------
        for (let enemy of this.enemies) {
            if (enemy.delay > 0) { enemy.delay--; continue; }
            if (enemy.freeze > 0) { enemy.freeze--; continue; }
            const d = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            if (d <= 3) {
                moveEnemyTowards(enemy, this.player, this.dungeon, this.ghostTimeTurnsRemaining);
                const cell = this.dungeon.grid[enemy.x][enemy.y];
                enemy.isVisible = cell.discovered;

                // 敵が移動した後に再度衝突チェック
                if (enemy.x === this.player.x && enemy.y === this.player.y) {
                    const dollIdx = this.player.inventory.indexOf("doll");
                    if (dollIdx !== -1) {
                        this.player.inventory.splice(dollIdx, 1);
                        this.ui.updateInventoryUI();
                        enemy.freeze = 5;
                        this.message = "身代わり人形が崩れ去った！触れた敵は5ターン動けなくなった！";
                        this.migawariSE.currentTime = 0; this.migawariSE.play().catch(err => console.log(err));
                    } else {
                        if (this.gameState !== "dying") { this.gameState = "dying"; this.player.deathTimer = 0; this.deadSE.currentTime = 0; this.deadSE.play().catch(err => console.log(err)); }
                        this.ui.drawGame(); return;
                    }
                }
            }
        }

        // ---------- ターン終了処理 ----------
        this.processTurn();
        this.ui.drawGame();
    }



    // --- Original methods retained below ---
    gameLoop(timestamp) {
        let dt = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        if (this.gameState === "playing" || this.gameState === "dying") {
            if (this.player) {
                let newState = updateAnimations(dt, this.player, this.enemies, this.gameState);
                if (newState === "gameOver" && this.gameState !== "gameOver") {
                    this.gameState = "gameOver";
                    this.ui.drawGame();
                    this.ui.showGameOver();
                }
            }
            if (this.dungeon) {
                this.dungeon.updateMapReveals(dt);
            }
        }
        if (this.warpAnimation && this.warpAnimation.active) {
            let elapsed = performance.now() - this.warpAnimation.startTime;
            if (this.warpAnimation.phase === "out") {
                if (elapsed < this.warpAnimation.duration / 2) {
                    let progress = elapsed / (this.warpAnimation.duration / 2);
                    this.warpAnimation.target.opacity = 1 - progress;
                    this.warpAnimation.yOffset = -progress * TILE_SIZE;
                } else {
                    this.warpAnimation.phase = "in";
                    this.warpAnimation.target.x = this.warpAnimation.endPos.x;
                    this.warpAnimation.target.y = this.warpAnimation.endPos.y;
                    if (this.warpAnimation.target === this.player) {
                        this.updateVisibility();
                    }
                }
            } else if (this.warpAnimation.phase === "in") {
                let phase2Elapsed = elapsed - (this.warpAnimation.duration / 2);
                if (phase2Elapsed < this.warpAnimation.duration / 2) {
                    let progress = phase2Elapsed / (this.warpAnimation.duration / 2);
                    this.warpAnimation.target.opacity = progress;
                    this.warpAnimation.yOffset = -TILE_SIZE + (progress * TILE_SIZE);
                } else {
                    this.warpAnimation.active = false;
                    this.warpAnimation.target.opacity = 1;
                    this.warpAnimation.yOffset = 0;
                    this.warpAnimation.target.isMoving = false;
                    if (this.warpAnimation.target === this.player) {
                        for (let enemy of this.enemies) {
                            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                                this.gameState = "dying";
                                this.player.deathTimer = 0;
                                break;
                            }
                        }
                    }
                }
            }
        }
        if (this.projectileAnimation && this.projectileAnimation.active) {
            let elapsed = performance.now() - this.projectileAnimation.startTime;
            let distance = elapsed / this.projectileAnimation.speed;
            let currentX = this.projectileAnimation.startPos.x + this.projectileAnimation.dir.x * distance;
            let currentY = this.projectileAnimation.startPos.y + this.projectileAnimation.dir.y * distance;
            this.projectileAnimation.currentPos = { x: currentX, y: currentY };
            let checkX = Math.round(currentX);
            let checkY = Math.round(currentY);
            if (checkX < 0 || checkX >= currentGridWidth || checkY < 0 || checkY >= currentGridHeight ||
                this.dungeon.grid[checkX][checkY].type === "wall") {
                this.projectileAnimation.active = false;
                this.message = "転送弾は壁に当たって消滅した。";
            } else {
                for (let enemy of this.enemies) {
                    if (Math.abs(enemy.x - currentX) < 0.5 && Math.abs(enemy.y - currentY) < 0.5) {
                        this.projectileAnimation.active = false;
                        let newPos = this.dungeon.randomFloorPosition();
                        while ((newPos.x === this.player.x && newPos.y === this.player.y) ||
                            this.enemies.some(e => e !== enemy && e.x === newPos.x && e.y === newPos.y)) {
                            newPos = this.dungeon.randomFloorPosition();
                        }
                        this.warpAnimation = {
                            active: true,
                            target: enemy,
                            startPos: { x: enemy.x, y: enemy.y },
                            endPos: { x: newPos.x, y: newPos.y },
                            startTime: performance.now(),
                            duration: 1000,
                            phase: "out",
                            yOffset: 0
                        };
                        enemy.opacity = 1;
                        this.message = "敵に命中！別の場所に転送された！";
                        this.score += 100;
                        break;
                    }
                }
            }
        }
        this.ui.drawGame();
        if (this.itemPickupAnimation && this.itemPickupAnimation.active) {
            let elapsed = performance.now() - this.itemPickupAnimation.startTime;
            if (elapsed >= this.itemPickupAnimation.duration) {
                this.itemPickupAnimation.active = false;
            }
        }
        requestAnimationFrame(this.gameLoop);
    }

    // ... other methods (processTurn, removeItemFromInventory, updateInventoryUI, drawGame, updateVisibility, randomFloorPosition, getCluster) ...
    processTurn() {
        this.turnCount++;
        if (this.turnCount % 100 === 0) {
            this.addNewEnemy();
        }
        for (let enemy of this.enemies) {
            if (enemy.hallucinogenTurns && enemy.hallucinogenTurns > 0) {
                enemy.hallucinogenTurns--;
            }
        }
        if (this.ghostTimeTurnsRemaining > 0) {
            this.ghostTimeTurnsRemaining--;
        } else {
            if (randomInt(1, 1000) === 1) {
                this.ghostTimeTurnsRemaining = 15;
                this.message = "ゴーストタイム発動！";
            }
        }
    }

    removeItemFromInventory(item) {
        let index = this.player.inventory.indexOf(item);
        if (index !== -1) {
            this.player.inventory.splice(index, 1);
            this.ui.updateInventoryUI();
        }
    }

    updateInventoryUI() {
        this.ui.updateInventoryUI();
    }

    drawGame() {
        this.ui.drawGame();
    }

    updateVisibility() {
        let newTiles = this.dungeon.updateVisibility(this.player.x, this.player.y);
        if (newTiles > 0) {
            this.score += newTiles * 50;
        }
        if (!this.floorFullyDiscovered && this.dungeon.isMapFullyDiscovered()) {
            this.floorFullyDiscovered = true;
            this.score += 5000;
            this.message = "フロア完全踏破！5000ポイント獲得！";
        }
        for (let enemy of this.enemies) {
            let cell = this.dungeon.grid[enemy.x][enemy.y];
            let isNowVisible = cell.discovered;
            if (isNowVisible && !enemy.isVisible) {
                enemy.delay = 1;
            }
            enemy.isVisible = isNowVisible;
        }
    }

    randomFloorPosition() {
        return this.dungeon.randomFloorPosition();
    }

    getCluster(x, y, count) {
        return this.dungeon.getCluster(x, y, count);
    }
}
