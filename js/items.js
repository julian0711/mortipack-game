import { randomInt, shuffle } from './utils.js';
import { currentGridWidth, currentGridHeight } from './constants.js';

export function getItemDescription(item) {
    if (item === "key") return "鍵：地下への扉を解除します。";
    else if (item === "radio") return "ラジカセ：敵の動きを10ターン停止させます。";
    else if (item === "doc") return "資料：取得すると200ポイント加算されます。（自動加算）";
    else if (item === "hallucinogen") return "探知機：敵の位置を10ターン表示します。";
    else if (item === "warpcoin") return "ワープコイン：ランダムにテレポートします。";
    else if (item === "map") return "マップ：未発見のマップを10マス開放します。";
    else if (item === "talisman") return "タリスマン：使用すると、敵を3体消去します。";
    else if (item === "doll") return "身代わり人形：敵に触れた際、死亡せずにその敵を5ターン動けなくします。";
    else if (item === "bluebox") return "青い箱：ショップドアを近くに出現させます。";
    else if (item === "warp_gun") return "転送銃：押したカーソルの方向に玉を発射して当たったエネミーを別の場所に飛ばします。";
    else return item;
}

export function useItem(item, game) {
    if (item === "radio") {
        for (let enemy of game.enemies) {
            enemy.freeze = 10;
            enemy.isDancing = true;
        }
        let texts = ["80年代の名曲POPを流した！", "80年代最高のロックを流した！", "80年代のしびれるパンクを流した！"];
        game.message = texts[randomInt(0, texts.length - 1)];
        game.score += 50;
        game.radioSE.currentTime = 0;
        game.radioSE.play().catch(err => console.log(err));
        game.removeItemFromInventory("radio");
    }
    else if (item === "hallucinogen") {
        for (let enemy of game.enemies) {
            enemy.hallucinogenTurns = 10;
        }
        game.message = "敵の位置が分かった！";
        game.score += 50;
        game.radarSE.currentTime = 0;
        game.radarSE.play().catch(err => console.log(err));
        game.removeItemFromInventory("hallucinogen");
    }
    else if (item === "warpcoin") {
        // Need to import randomFloorPosition or pass it? 
        // Better to have it on game.dungeon or game helper
        // Assuming game has a helper or we import it. 
        // Circular dependency risk if we import randomFloorPosition from dungeon.js if dungeon.js imports items.
        // dungeon.js shouldn't import items. items.js imports dungeon? No.
        // Let's assume game has a method or we pass the function.
        // For now, I'll assume game.randomFloorPosition exists or I can import it from dungeon.js if I'm careful.
        // Actually, randomFloorPosition depends on dungeon grid.

        let newPos = game.randomFloorPosition();
        // Ensure new position is not on an enemy (to avoid instant death after warp)
        while (game.enemies.some(e => e.x === newPos.x && e.y === newPos.y)) {
            newPos = game.randomFloorPosition();
        }

        game.warpAnimation = {
            active: true,
            target: game.player,
            startPos: { x: game.player.x, y: game.player.y },
            endPos: { x: newPos.x, y: newPos.y },
            startTime: performance.now(),
            duration: 1000,
            phase: "out",
            yOffset: 0
        };
        game.player.opacity = 1; // Ensure start opacity

        game.message = "導いてくれ！";
        game.score += 50;
        game.warpSE.currentTime = 0;
        game.warpSE.play().catch(err => console.log(err));
        game.removeItemFromInventory("warpcoin");
    }
    else if (item === "map") {
        for (let i = 0; i < 3; i++) {
            let cell, startX, startY;
            do {
                startX = randomInt(0, currentGridWidth - 1);
                startY = randomInt(0, currentGridHeight - 1);
                cell = game.dungeon.grid[startX][startY];
            } while ((cell.type !== "floor" && cell.type !== "door") || cell.discovered);

            // getCluster needs to be available. 
            // Maybe export getCluster from dungeon.js
            let cluster = game.getCluster(startX, startY, 10);
            for (let pos of cluster) {
                if (!game.dungeon.grid[pos.x][pos.y].discovered) {
                    game.dungeon.grid[pos.x][pos.y].tempRevealed = Infinity;
                }
            }
        }
        game.message = "マップを入手した！この階の事が少しわかったぞ！";
        game.score += 50;
        game.removeItemFromInventory("map");
    }
    else if (item === "talisman") {
        let removedCount = 0;
        // Shuffle enemies to remove random ones
        shuffle(game.enemies);
        // Remove up to 3 enemies
        for (let i = 0; i < 3; i++) {
            if (game.enemies.length > 0) {
                game.enemies.pop();
                removedCount++;
            }
        }
        if (removedCount > 0) {
            game.message = "タリスマンが輝き、敵が" + removedCount + "体消滅した！";
            game.score += 100;
            game.removeItemFromInventory("talisman");
        } else {
            game.message = "しかし、何も起こらなかった・・・";
        }
    }
    else if (item === "bluebox") {
        // Find a valid position near the player (e.g., within 3 tiles)
        let candidates = [];
        for (let x = Math.max(0, game.player.x - 3); x <= Math.min(currentGridWidth - 1, game.player.x + 3); x++) {
            for (let y = Math.max(0, game.player.y - 3); y <= Math.min(currentGridHeight - 1, game.player.y + 3); y++) {
                let cell = game.dungeon.grid[x][y];
                if (cell.type === "floor" && !cell.item && !cell.shelf && !(x === game.player.x && y === game.player.y)) {
                    // Check if it's not a start/goal/shop position (though shop is just a door type now)
                    if (cell.type !== "door" && cell.type !== "door_shop") {
                        candidates.push({ x: x, y: y });
                    }
                }
            }
        }

        if (candidates.length > 0) {
            let pos = candidates[randomInt(0, candidates.length - 1)];
            game.dungeon.grid[pos.x][pos.y].type = "door_shop";
            game.message = "近くにショップへの扉が現れた！";
            game.score += 50;
            game.removeItemFromInventory("bluebox");
        } else {
            game.message = "近くに扉を作れる場所がない！";
        }
    }
    else if (item === "warp_gun") {
        game.message = "方向キーを押して発射方向を決めてください。";
        game.inputMode = "warp_gun_aim"; // Set input mode to aiming
        // Actual firing logic will be handled in handleKeyDown in game.js
    }
    else {
        alert(getItemDescription(item));
        return;
    }
    game.updateInventoryUI();
    game.drawGame();
}
