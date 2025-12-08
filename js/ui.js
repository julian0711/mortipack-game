import { TILE_SIZE, currentGridWidth, currentGridHeight } from './constants.js';
import { getDrawPosition } from './entity.js';
import { getItemDescription, useItem } from './items.js';
import { CHARMS, getCharmDetails } from './charms.js';

export class UI {
    constructor(canvas, ctx, game) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = game;

        // Images
        this.images = {};
        this.loadImages();
    }

    loadImages() {
        const imageNames = [
            "player", "mortipack", "shelf", "shelfB", "wall", "floor", "door",
            "blood", "title", "orangehat", "packmate", "key",
            "item_radio", "item_report", "item_radar", "item_coin", "item_map", "item_migawari",
            "door_shop", "shop_screen"
        ];
        // Map "mortipack" to "enemy" for easier access if needed, or just use filename
        this.images.player = new Image(); this.images.player.src = "images/player.png";
        this.images.player2 = new Image(); this.images.player2.src = "images/player02.png";
        this.images.enemy = new Image(); this.images.enemy.src = "images/mortipack.png";
        this.images.enemy2 = new Image(); this.images.enemy2.src = "images/mortipack02.png";
        this.images.enemy3 = new Image(); this.images.enemy3.src = "images/mortipack03.png";
        this.images.shelf = new Image(); this.images.shelf.src = "images/shelf.png";
        this.images.shelfB = new Image(); this.images.shelfB.src = "images/shelfB.png";
        this.images.wall = new Image(); this.images.wall.src = "images/wall.png";
        this.images.floor = new Image(); this.images.floor.src = "images/floor.png";
        this.images.door = new Image(); this.images.door.src = "images/door.png";
        this.images.door_shop = new Image(); this.images.door_shop.src = "images/door_shop.png";
        this.images.shop_screen = new Image(); this.images.shop_screen.src = "images/ショップ画面.png";
        this.images.blood = new Image(); this.images.blood.src = "images/blood.png";
        this.images.title = new Image(); this.images.title.src = "images/title.png";
        this.images.orangehat = new Image(); this.images.orangehat.src = "images/orangehat.png";
        this.images.packmate = new Image(); this.images.packmate.src = "images/packmate.png";

        // Items
        this.images.item_radio = new Image(); this.images.item_radio.src = "images/item_radio.png";
        this.images.item_doc = new Image(); this.images.item_doc.src = "images/item_report.png";
        this.images.item_hallucinogen = new Image(); this.images.item_hallucinogen.src = "images/item_radar.png";
        this.images.item_warpcoin = new Image(); this.images.item_warpcoin.src = "images/item_coin.png";
        this.images.item_map = new Image(); this.images.item_map.src = "images/item_map.png";
        this.images.item_doll = new Image(); this.images.item_doll.src = "images/item_migawari.png";
        this.images.item_talisman = new Image(); this.images.item_talisman.src = "images/item_talisman.png";
        this.images.item_talisman = new Image(); this.images.item_talisman.src = "images/item_talisman.png";
        this.images.item_key = new Image(); this.images.item_key.src = "images/key.png";
        this.images.item_bluebox = new Image(); this.images.item_bluebox.src = "images/item_bluebox.png";
        this.images.item_warp_gun = new Image(); this.images.item_warp_gun.src = "images/item_warp_gun.png";
    }

    drawGame() {
        if (!this.game.player) return;

        let rawPlayerPos = this.game.player.isMoving ? getDrawPosition(this.game.player) : { x: this.game.player.x * TILE_SIZE, y: this.game.player.y * TILE_SIZE };
        let playerDrawPos = { x: Math.floor(rawPlayerPos.x), y: Math.floor(rawPlayerPos.y) };

        let camX = Math.floor((playerDrawPos.x + TILE_SIZE / 2) - this.canvas.width / 2);
        let camY = Math.floor((playerDrawPos.y + TILE_SIZE / 2) - this.canvas.height / 2);

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.filter = "none";
        if (this.game.ghostTimeTurnsRemaining > 0) {
            this.ctx.fillStyle = "rgba(200, 200, 255, 0.2)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.save();
        this.ctx.translate(-camX, -camY);

        for (let x = 0; x < currentGridWidth; x++) {
            for (let y = 0; y < currentGridHeight; y++) {
                let cell = this.game.dungeon.grid[x][y];
                let screenX = x * TILE_SIZE;
                let screenY = y * TILE_SIZE;
                if (!cell.discovered && cell.tempRevealed === 0) {
                    this.ctx.fillStyle = "black";
                    this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                } else {
                    if (cell.type === "wall") {
                        if (this.images.wall.complete) {
                            this.ctx.drawImage(this.images.wall, screenX, screenY, TILE_SIZE, TILE_SIZE);
                        } else {
                            this.ctx.fillStyle = "#555";
                            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                    else if (cell.type === "floor") {
                        if (this.images.floor.complete) {
                            this.ctx.drawImage(this.images.floor, screenX, screenY, TILE_SIZE, TILE_SIZE);
                        } else {
                            this.ctx.fillStyle = "#999";
                            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                        }
                        if (cell.blood) {
                            if (this.images.blood.complete) {
                                this.ctx.drawImage(this.images.blood, screenX, screenY, TILE_SIZE, TILE_SIZE);
                            } else {
                                this.ctx.fillStyle = "darkred";
                                this.ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                            }
                        }
                    }

                    else if (cell.type === "door") {
                        if (this.images.door.complete) {
                            this.ctx.drawImage(this.images.door, screenX, screenY, TILE_SIZE, TILE_SIZE);
                        } else {
                            this.ctx.fillStyle = "gold";
                            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                    else if (cell.type === "door_shop") {
                        if (this.images.door_shop.complete) {
                            this.ctx.drawImage(this.images.door_shop, screenX, screenY, TILE_SIZE, TILE_SIZE);
                        } else {
                            this.ctx.fillStyle = "purple";
                            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                    if (cell.shelf) {
                        if (cell.shelfSearched) {
                            if (this.images.shelfB.complete) {
                                this.ctx.drawImage(this.images.shelfB, screenX, screenY, TILE_SIZE, TILE_SIZE);
                            } else {
                                this.ctx.fillStyle = "peru";
                                this.ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                            }
                        } else {
                            if (this.images.shelf.complete) {
                                this.ctx.drawImage(this.images.shelf, screenX, screenY, TILE_SIZE, TILE_SIZE);
                            } else {
                                this.ctx.fillStyle = "saddlebrown";
                                this.ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                            }
                        }
                    }
                    if (cell.hiddenChar) {
                        if (cell.hiddenChar === "orangehat") {
                            if (this.images.orangehat.complete) {
                                this.ctx.drawImage(this.images.orangehat, screenX, screenY, TILE_SIZE, TILE_SIZE);
                            } else {
                                this.ctx.fillStyle = "orange";
                                this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                            }
                        } else if (cell.hiddenChar === "packmate") {
                            if (this.images.packmate.complete) {
                                this.ctx.drawImage(this.images.packmate, screenX, screenY, TILE_SIZE, TILE_SIZE);
                            } else {
                                this.ctx.fillStyle = "purple";
                                this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                            }
                        }
                    }
                    if (cell.visible || cell.tempRevealed > 0) {
                        // this.ctx.strokeStyle = "rgba(255,255,255,0.3)";
                        // this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }

        // Use the same rounded playerDrawPos for drawing
        this.ctx.save();
        if (this.game.gameState === "dying") {
            this.ctx.globalAlpha = this.game.player.opacity;
        }

        let playerImg = this.images.player;
        if (!this.game.player.isMoving) {
            if (Math.floor(performance.now() / 500) % 2 === 0) {
                playerImg = this.images.player;
            } else {
                playerImg = this.images.player2;
            }
        }

        if (this.game.player.facing === "left") {
            this.ctx.scale(-1, 1);
            if (playerImg.complete) {
                this.ctx.drawImage(playerImg, -playerDrawPos.x - TILE_SIZE, playerDrawPos.y, TILE_SIZE, TILE_SIZE);
            } else {
                this.ctx.fillStyle = "blue";
                this.ctx.beginPath();
                this.ctx.arc(-playerDrawPos.x - TILE_SIZE / 2, playerDrawPos.y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            if (playerImg.complete) {
                this.ctx.drawImage(playerImg, playerDrawPos.x, playerDrawPos.y, TILE_SIZE, TILE_SIZE);
            } else {
                this.ctx.fillStyle = "blue";
                this.ctx.beginPath();
                this.ctx.arc(playerDrawPos.x + TILE_SIZE / 2, playerDrawPos.y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.restore();

        for (let enemy of this.game.enemies) {
            let cellDiscovered = this.game.dungeon.grid[enemy.x][enemy.y].discovered;
            if ((enemy.hallucinogenTurns && enemy.hallucinogenTurns > 0) || cellDiscovered) {
                let enemyPos = enemy.isMoving ? getDrawPosition(enemy) : { x: enemy.x * TILE_SIZE, y: enemy.y * TILE_SIZE };

                let enemyImg = this.images.enemy;
                let flip = false;

                if (enemy.freeze > 0 && enemy.isDancing) {
                    // Dance animation: 4 steps, 250ms each (1s cycle)
                    let danceStep = Math.floor(performance.now() / 250) % 4;
                    if (danceStep === 0) {
                        enemyImg = this.images.enemy3; // mortipack03
                    } else if (danceStep === 1) {
                        enemyImg = this.images.enemy; // mortipack01
                    } else if (danceStep === 2) {
                        enemyImg = this.images.enemy3; // mortipack03 (flipped)
                        flip = true;
                    } else {
                        enemyImg = this.images.enemy; // mortipack01
                    }
                } else if (!enemy.isMoving) {
                    // Idle animation: toggle every 500ms
                    if (Math.floor(performance.now() / 500) % 2 === 0) {
                        enemyImg = this.images.enemy;
                    } else {
                        enemyImg = this.images.enemy2;
                    }
                }

                if (enemyImg && enemyImg.complete) {
                    this.ctx.save();
                    if (flip) {
                        this.ctx.translate(enemyPos.x + TILE_SIZE, enemyPos.y);
                        this.ctx.scale(-1, 1);
                        this.ctx.drawImage(enemyImg, 0, 0, TILE_SIZE, TILE_SIZE);
                    } else {
                        this.ctx.drawImage(enemyImg, enemyPos.x, enemyPos.y, TILE_SIZE, TILE_SIZE);
                    }
                    this.ctx.restore();
                } else {
                    this.ctx.fillStyle = "red";
                    this.ctx.beginPath();
                    this.ctx.arc(enemyPos.x + TILE_SIZE / 2, enemyPos.y + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Draw Warp Animation
        if (this.game.warpAnimation && this.game.warpAnimation.active) {
            let target = this.game.warpAnimation.target;
            let drawX, drawY;
            if (this.game.warpAnimation.phase === "out") {
                drawX = this.game.warpAnimation.startPos.x * TILE_SIZE;
                drawY = this.game.warpAnimation.startPos.y * TILE_SIZE + this.game.warpAnimation.yOffset;
            } else {
                drawX = this.game.warpAnimation.endPos.x * TILE_SIZE;
                drawY = this.game.warpAnimation.endPos.y * TILE_SIZE + this.game.warpAnimation.yOffset;
            }

            this.ctx.save();
            this.ctx.globalAlpha = target.opacity;

            let img = null;
            if (target === this.game.player) {
                img = this.images.player;
            } else {
                img = this.images.enemy; // Simplified, could check enemy type
            }

            if (img && img.complete) {
                this.ctx.drawImage(img, drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            this.ctx.restore();
        }

        // Draw Projectile Animation
        if (this.game.projectileAnimation && this.game.projectileAnimation.active) {
            let pos = this.game.projectileAnimation.currentPos;
            let screenX = pos.x * TILE_SIZE + TILE_SIZE / 2;
            let screenY = pos.y * TILE_SIZE + TILE_SIZE / 2;

            this.ctx.fillStyle = "cyan";
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = "white";
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        if (this.game.goalMultiplierAnimation && this.game.goalMultiplierAnimation.active) {
            this.ctx.font = "20px 'PixelMplus10', sans-serif";
            this.ctx.fillStyle = "yellow";
            this.ctx.fillText("×" + (this.game.currentFloor + 2), playerDrawPos.x, this.game.goalMultiplierAnimation.y);
        }

        if (this.game.itemPickupAnimation && this.game.itemPickupAnimation.active) {
            let elapsed = performance.now() - this.game.itemPickupAnimation.startTime;
            let progress = elapsed / this.game.itemPickupAnimation.duration;
            let yOffset = progress * 15; // Move up 15 pixels
            let alpha = Math.max(0, 1 - progress); // Fade out, clamp to 0

            let itemImage = null;
            switch (this.game.itemPickupAnimation.item) {
                case "radio": itemImage = this.images.item_radio; break;
                case "doc": itemImage = this.images.item_doc; break;
                case "hallucinogen": itemImage = this.images.item_hallucinogen; break;
                case "warpcoin": itemImage = this.images.item_warpcoin; break;
                case "map": itemImage = this.images.item_map; break;
                case "doll": itemImage = this.images.item_doll; break;
                case "talisman": itemImage = this.images.item_talisman; break;
                case "key": itemImage = this.images.item_key; break;
                case "bluebox": itemImage = this.images.item_bluebox; break;
                case "warp_gun": itemImage = this.images.item_warp_gun; break;
            }

            if (itemImage && itemImage.complete) {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.drawImage(itemImage, playerDrawPos.x, playerDrawPos.y - 20 - yOffset, TILE_SIZE, TILE_SIZE);
                this.ctx.restore();
            }
        }

        this.ctx.restore(); // Restore camera transform

        // Draw UI Text (Score, Turn, Floor)
        this.ctx.save();
        this.ctx.filter = "none";
        this.ctx.fillStyle = "white";
        this.ctx.font = "16px 'PixelMplus10', sans-serif";
        this.ctx.textAlign = "right";
        let floorLabel = "B" + this.game.currentFloor;
        let uiText = "Score: " + this.game.score + "    Turn: " + this.game.turnCount + "    Floor: " + floorLabel;
        // Ensure text is drawn within visible canvas area
        this.ctx.fillText(uiText, this.canvas.width - 10, 20);

        // Developer mode indicator
        if (this.game.developerMode) {
            this.ctx.save();
            this.ctx.fillStyle = "yellow";
            this.ctx.font = "16px 'PixelMplus10', sans-serif";
            this.ctx.textAlign = "left";
            this.ctx.fillText("開発者モード", 10, 20);
            this.ctx.restore();
        }

        this.ctx.textAlign = "left";
        this.ctx.fillText(this.game.message, 10, this.canvas.height - 10);
        this.ctx.restore();
    }

    updateInventoryUI() {
        let keyDiv = document.getElementById("keyInventory");
        let itemDiv = document.getElementById("itemInventory");
        let charmDiv = document.getElementById("charmInventory");
        keyDiv.innerHTML = "";
        itemDiv.innerHTML = "";
        if (charmDiv) charmDiv.innerHTML = "";

        // Charms
        if (charmDiv && this.game.player && this.game.player.charms) {
            this.game.player.charms.forEach(charmId => {
                let charm = getCharmDetails(charmId);
                if (charm) {
                    let img = document.createElement("img");
                    img.src = charm.image;
                    img.style.width = "24px";
                    img.style.height = "24px";
                    img.style.border = "1px solid white";
                    img.style.borderRadius = "4px";
                    img.style.backgroundColor = "rgba(0,0,0,0.5)";
                    img.style.cursor = "help";
                    img.title = charm.name + "\n" + charm.description;
                    img.addEventListener("click", () => {
                        this.game.message = charm.name + ": " + charm.description;
                        this.drawGame();
                    });
                    charmDiv.appendChild(img);
                }
            });
        }
        let keys = this.game.player.inventory.filter(item => item === "key");
        let others = this.game.player.inventory.filter(item => item !== "key" && item !== "doc");

        keys.forEach((item) => {
            let img = document.createElement("img");
            img.src = "images/key.png";
            img.alt = "カギ";
            img.title = getItemDescription(item);
            img.style.width = "24px";
            img.style.height = "24px";
            img.style.margin = "2px";
            keyDiv.appendChild(img);
        });

        const itemCounts = {};
        others.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });

        for (let item in itemCounts) {
            let container = document.createElement("div");
            container.style.display = "inline-flex";
            container.style.alignItems = "center";
            container.style.margin = "2px";
            container.style.cursor = "pointer";
            container.style.cursor = "pointer";
            // container.title = getItemDescription(item); // Removed tooltip to rely on click info

            let pressTimer;
            const startPress = (e) => {
                e.preventDefault(); // Prevent default touch behavior
                pressTimer = setTimeout(() => {
                    useItem(item, this.game);
                    pressTimer = null;
                }, 500);
            };

            const endPress = (e) => {
                e.preventDefault();
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                    // Short press: Show info
                    this.game.message = getItemDescription(item);
                    this.game.ui.drawGame(); // Redraw to show message
                }
            };

            container.addEventListener("mousedown", startPress);
            container.addEventListener("touchstart", startPress);
            container.addEventListener("mouseup", endPress);
            container.addEventListener("touchend", endPress);
            container.addEventListener("mouseleave", () => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            });

            let img = document.createElement("img");
            let imgSrc = "";
            switch (item) {
                case "radio": imgSrc = "images/item_radio.png"; break;
                case "hallucinogen": imgSrc = "images/item_radar.png"; break;
                case "warpcoin": imgSrc = "images/item_coin.png"; break;
                case "map": imgSrc = "images/item_map.png"; break;
                case "doll": imgSrc = "images/item_migawari.png"; break;
                case "talisman": imgSrc = "images/item_talisman.png"; break;
                case "doll": imgSrc = "images/item_migawari.png"; break;
                case "talisman": imgSrc = "images/item_talisman.png"; break;
                case "bluebox": imgSrc = "images/item_bluebox.png"; break;
                case "warp_gun": imgSrc = "images/item_warp_gun.png"; break;
                default: imgSrc = ""; break;
            }

            if (imgSrc) {
                img.src = imgSrc;
                img.style.width = "24px";
                img.style.height = "24px";
                container.appendChild(img);
            } else {
                // Fallback for unknown items (shouldn't happen with current items)
                let span = document.createElement("span");
                span.textContent = item;
                container.appendChild(span);
            }

            if (itemCounts[item] > 1) {
                let countSpan = document.createElement("span");
                countSpan.textContent = "×" + itemCounts[item];
                countSpan.style.marginLeft = "0px";
                countSpan.style.fontSize = "12px";
                countSpan.style.color = "white";
                countSpan.style.background = "transparent";
                countSpan.style.padding = "0";
                countSpan.style.marginRight = "5px";
                container.appendChild(countSpan);
            }

            itemDiv.appendChild(container);
        }
    }

    showTitleScreen() {
        this.game.gameState = "title";
        this.game.stageBGM.pause();
        this.game.stageBGM.currentTime = 0;

        let overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        overlay.style.opacity = "1";
        overlay.style.transition = "";
        overlay.innerHTML = "<img src='images/title.png' alt='MORTIPACK' style='width:100%; max-height:50%; object-fit:contain; margin-bottom: 20px; image-rendering: pixelated;'>" +
            "<div style='display: flex; flex-direction: column; align-items: center; gap: 20px;'>" +
            "<img id='endlessButton' src='images/button_endless mode.png' alt='Endless Mode' style='width: 200px; cursor: pointer; image-rendering: pixelated;'>" +
            "<img id='storyButton' src='images/button_story mode.png' alt='Story Mode' style='width: 200px; cursor: pointer; image-rendering: pixelated;'>" +
            "<img id='optionButton' src='images/button_story option.png' alt='Option' style='width: 200px; cursor: pointer; image-rendering: pixelated;'></div>";

        // Hide controls on title screen
        document.getElementById("controls").style.display = "none";

        this.game.titleBGM.currentTime = 0;
        this.game.titleBGM.play().catch(err => console.log(err));

        document.getElementById("endlessButton").addEventListener("click", () => {
            this.game.gameMode = "endless";
            overlay.style.display = "none";
            document.getElementById("controls").style.display = "block"; // Show controls
            document.getElementById("gameContainer").classList.add("playing"); // Show UI bg
            this.game.titleBGM.pause();
            this.game.titleBGM.currentTime = 0;
            this.game.newGame();
        });
        document.getElementById("storyButton").addEventListener("click", () => {
            this.game.gameMode = "story";
            overlay.style.display = "none";
            // Controls will be shown after story intro
            this.showStoryIntro();
        });
        // Option button does nothing for now as requested
    }

    showStoryIntro() {
        let overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        overlay.style.opacity = "1";
        overlay.style.transition = "";
        let images = ["images/story1.png", "images/story2.png", "images/story3.png"];
        let index = 0;
        overlay.innerHTML = "<img id='storyImg' src='" + images[index] + "' alt='Story' style='width:100%; height:100%; object-fit:contain;'>";
        let storyImg = document.getElementById("storyImg");

        const handler = () => {
            index++;
            if (index < images.length) {
                storyImg.src = images[index];
            } else {
                storyImg.removeEventListener("click", handler);
                this.game.titleBGM.pause();
                this.game.titleBGM.currentTime = 0;
                overlay.style.display = "none";
                document.getElementById("controls").style.display = "block"; // Show controls
                document.getElementById("gameContainer").classList.add("playing"); // Show UI bg
                this.game.newGame();
            }
        };
        storyImg.addEventListener("click", handler);
    }

    showStoryEnding() {
        let overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        overlay.style.opacity = "1";
        overlay.style.transition = "";
        document.getElementById("controls").style.display = "none"; // Hide controls
        document.getElementById("gameContainer").classList.remove("playing"); // Hide UI bg
        let images = ["images/ending1.png", "images/ending2.png"];
        let index = 0;
        overlay.innerHTML = "<img id='endingImg' src='" + images[index] + "' alt='Ending' style='width:100%; height:100%; object-fit:contain;'>";
        let endingImg = document.getElementById("endingImg");

        const handler = () => {
            index++;
            if (index < images.length) {
                endingImg.src = images[index];
            } else {
                endingImg.removeEventListener("click", handler);
                overlay.innerHTML = "<h1>Thank you for the playing!</h1><button id='backToTitle'>TITLE</button>";
                document.getElementById("backToTitle").addEventListener("click", () => {
                    overlay.style.display = "none";
                    this.showTitleScreen();
                });
            }
        };
        endingImg.addEventListener("click", handler);
    }

    showLogoScreen() {
        const overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        overlay.style.opacity = "1";
        overlay.style.transition = "opacity 1s";
        overlay.innerHTML = "<img src='images/logo.png' alt='Logo' style='width:100%; height:100%; object-fit:contain;'>";

        const handleLogoClick = () => {
            overlay.removeEventListener("click", handleLogoClick);
            overlay.style.opacity = "0";
            setTimeout(() => {
                overlay.style.display = "none";
                this.showTitleScreen();
            }, 1000);
        };
        overlay.addEventListener("click", handleLogoClick);
    }

    showGameOver() {
        let overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        document.getElementById("controls").style.display = "none"; // Hide controls
        document.getElementById("gameContainer").classList.remove("playing"); // Hide UI bg
        overlay.innerHTML = "<h1>GAME OVER</h1><p>FINAL SCORE: " + this.game.score + "</p><div style='display: flex; flex-direction: column; align-items: flex-start;'>" +
            "<button id='restartButton'>RESTART</button>" +
            "<button id='giveUpButton'>GIVE UP...</button></div>";
        document.getElementById("restartButton").addEventListener("click", () => {
            overlay.style.display = "none";
            document.getElementById("controls").style.display = "block"; // Show controls
            document.getElementById("gameContainer").classList.add("playing"); // Show UI bg
            this.game.newGame();
        });
        document.getElementById("giveUpButton").addEventListener("click", () => {
            overlay.style.display = "none";
            this.showTitleScreen();
        });
    }

    showVictory() {
        if (this.game.gameMode === "story") {
            this.showStoryEnding();
            return;
        }
        let overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        document.getElementById("controls").style.display = "none"; // Hide controls
        document.getElementById("gameContainer").classList.remove("playing"); // Hide UI bg
        overlay.innerHTML = "<h1>GO DEEPER!</h1><p>SCORE: " + this.game.score + "</p><div style='display: flex; flex-direction: column; align-items: flex-start;'>" +
            "<button id='nextFloorButton'>NEXT FLOOR</button>" +
            "<button id='giveUpButton'>TITLE</button></div>";
        // this.game.goalMultiplierAnimation = { active: true, y: this.game.player.y * TILE_SIZE - 10, startTime: performance.now(), duration: 1000 };
        document.getElementById("nextFloorButton").addEventListener("click", () => {
            overlay.style.display = "none";
            document.getElementById("controls").style.display = "block"; // Show controls
            document.getElementById("gameContainer").classList.add("playing"); // Show UI bg
            this.game.nextFloor();
        });
        document.getElementById("giveUpButton").addEventListener("click", () => {
            overlay.style.display = "none";
            this.showTitleScreen();
        });
    }

    showShopScreen() {
        let overlay = document.getElementById("overlay");
        overlay.style.display = "flex";
        document.getElementById("controls").style.display = "none";
        document.getElementById("gameContainer").classList.remove("playing");

        // Use persistent shop items from Game instance
        let shopCharms = this.game.shopItems || [];

        let charmsHtml = shopCharms.map(charm => {
            // Check if player already has this charm
            let playerCharms = this.game.player.charms || [];
            let hasCharm = playerCharms.includes(charm.id);
            let opacity = hasCharm ? "0.5" : "1";
            return `<div class="shop-item" data-id="${charm.id}" style="margin: 5px; cursor: pointer; opacity: ${opacity}; text-align: center; position: relative;">
                <img src="${charm.image}" style="width: 64px; height: 64px; image-rendering: pixelated; border: 2px solid white; background: rgba(0,0,0,0.5);">
                <div style="font-size: 10px; color: white; margin-top: 2px;">${charm.name}</div>
            </div>`;
        }).join("");

        overlay.innerHTML = "<div style='position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;'>" +
            "<img src='images/ショップ画面.png' style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: -1; image-rendering: pixelated;'>" +
            "<h1 style='margin-top: 20px; text-shadow: 2px 2px 0 #000;'>SHOP</h1>" +
            "<div style='background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center;'>" +
            "<p style='margin: 5px 0;'>よく来たね。</p>" +
            "<p style='margin: 5px 0;'>長押しで入手できるよ。</p>" +
            "</div>" +
            // Updated shopMessage position: absolute, under the character's right hand (screen left), white text
            "<div id='shopMessage' style='position: absolute; top: 650px; left: 20px; width: auto; white-space: nowrap; color: white; font-size: 16px; text-align: left; text-shadow: 1px 1px 0 #000; pointer-events: none;'></div>" +
            "<div style='flex-grow: 1;'></div>" +
            "<div id='shopItems' style='display:flex; flex-direction:row; align-items:flex-end; justify-content:center; margin-bottom: 20px; width: 100%; gap: 10px;'>" +
            charmsHtml +
            "</div>" +
            "<div style='display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 50px;'>" +
            "<button id='shopNextFloorButton'>NEXT FLOOR</button>" +
            "</div></div>";

        document.getElementById("shopNextFloorButton").addEventListener("click", () => {
            overlay.style.display = "none";
            document.getElementById("controls").style.display = "block";
            document.getElementById("gameContainer").classList.add("playing");
            this.game.nextFloor();
        });

        document.querySelectorAll(".shop-item").forEach(el => {
            let charmId = el.getAttribute("data-id");
            let charm = getCharmDetails(charmId);
            let pressTimer = null;
            let isLongPress = false;

            const startPress = (e) => {
                e.preventDefault();
                isLongPress = false;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    this.buyCharm(charmId);
                }, 500);
            };

            const endPress = (e) => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
                if (!isLongPress) {
                    // Short press: Show info
                    document.getElementById("shopMessage").textContent = charm.name + ": " + charm.description;
                }
            };

            el.addEventListener("mousedown", startPress);
            el.addEventListener("touchstart", startPress);
            el.addEventListener("mouseup", endPress);
            el.addEventListener("touchend", endPress);
            el.addEventListener("mouseleave", () => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            });
        });
    }

    buyCharm(charmId) {
        let charm = getCharmDetails(charmId);
        let playerCharms = this.game.player.charms || [];
        if (playerCharms.includes(charmId)) {
            alert("既に持っています。");
            return;
        }

        if (playerCharms.length < 4) {
            this.game.player.charms = playerCharms;
            this.game.player.charms.push(charmId);
            this.updateInventoryUI();
            alert(charm.name + " を装備しました。");
            this.showShopScreen();
        } else {
            this.showCharmDiscardModal(charmId);
        }
    }

    showCharmDiscardModal(newCharmId) {
        let overlay = document.getElementById("overlay");
        let playerCharms = this.game.player.charms || [];
        let currentCharms = playerCharms.map(id => getCharmDetails(id));
        let newCharm = getCharmDetails(newCharmId);

        let listHtml = currentCharms.map(c => {
            return `<div class="discard-item" data-id="${c.id}" style="background:rgba(0,0,0,0.8); border:1px solid white; padding:10px; margin:5px; cursor:pointer; width: 250px; text-align:left; display:flex; align-items:center;">
                <img src="${c.image}" style="width:32px; height:32px; margin-right:10px;">
                <div>
                    <div style="color:cyan; font-weight:bold;">${c.name}</div>
                    <div style="font-size:12px; color:white;">${c.description}</div>
                </div>
            </div>`;
        }).join("");

        listHtml += `<div class="discard-item" data-id="${newCharm.id}" style="background:rgba(0,0,0,0.8); border:2px solid yellow; padding:10px; margin:5px; cursor:pointer; width: 250px; text-align:left; display:flex; align-items:center;">
                <img src="${newCharm.image}" style="width:32px; height:32px; margin-right:10px;">
                <div>
                    <div style="color:yellow; font-weight:bold;">(新) ${newCharm.name}</div>
                    <div style="font-size:12px; color:white;">${newCharm.description}</div>
                    <div style="font-size:10px; color:red; text-align:right;">これを破棄（購入キャンセル）</div>
                </div>
            </div>`;

        overlay.innerHTML = "<div style='display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; background:rgba(0,0,0,0.9); color:white; width:100%;'>" +
            "<h2>チャームがいっぱいです</h2>" +
            "<p>一つ選んで破棄してください。</p>" +
            "<div style='display:flex; flex-direction:column; overflow-y:auto; max-height:60%; width:100%; align-items:center;'>" +
            listHtml +
            "</div>" +
            "</div>";

        document.querySelectorAll(".discard-item").forEach(el => {
            el.addEventListener("click", () => {
                let discardId = el.getAttribute("data-id");
                if (discardId === newCharmId) {
                    alert("購入をキャンセルしました。");
                } else {
                    let idx = this.game.player.charms.indexOf(discardId);
                    if (idx !== -1) {
                        this.game.player.charms.splice(idx, 1);
                        this.game.player.charms.push(newCharmId);
                        this.updateInventoryUI();
                        alert(getCharmDetails(discardId).name + " を破棄し、" + newCharm.name + " を装備しました。");
                    }
                }
                this.showShopScreen();
            });
        });
    }
}
