import { TILE_SIZE, animationDuration, jumpHeight, deathDuration, currentGridWidth, currentGridHeight } from './constants.js';

export function getDrawPosition(entity) {
    let t = entity.animTime / animationDuration;
    if (t > 1) t = 1;
    let gridX = entity.prevX + (entity.x - entity.prevX) * t;
    let gridY = entity.prevY + (entity.y - entity.prevY) * t;
    let offset = jumpHeight * Math.sin(Math.PI * t);
    return { x: gridX * TILE_SIZE, y: gridY * TILE_SIZE - offset };
}

export function updateAnimations(dt, player, enemies, gameState, showGameOver) {
    if (player.isMoving) {
        player.animTime += dt;
        if (player.animTime >= animationDuration) {
            player.animTime = animationDuration;
            player.isMoving = false;
        }
    }
    for (let enemy of enemies) {
        if (enemy.isMoving) {
            enemy.animTime += dt;
            if (enemy.animTime >= animationDuration) {
                enemy.animTime = animationDuration;
                enemy.isMoving = false;
            }
        }
    }
    if (gameState === "dying") {
        player.deathTimer += dt;
        player.opacity = Math.max(1 - player.deathTimer / deathDuration, 0);
        if (player.deathTimer >= deathDuration) {
            return "gameOver";
        }
    }
    return gameState;
}

export function moveEnemyTowards(enemy, player, dungeon, ghostTimeTurnsRemaining) {
    // 敵が視界に入っていない（暗闇にいる）場合は移動しない
    if (!enemy.isVisible) {
        return;
    }

    if (ghostTimeTurnsRemaining > 0) {
        let dx = Math.sign(player.x - enemy.x);
        let dy = Math.sign(player.y - enemy.y);
        if (isWalkable(enemy.x + dx, enemy.y + dy, dungeon)) {
            enemy.prevX = enemy.x;
            enemy.prevY = enemy.y;
            enemy.x += dx;
            enemy.y += dy;
            enemy.animTime = 0;
            enemy.isMoving = true;
            return;
        }
    }
    let candidates = [];
    let directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];
    for (let d of directions) {
        let newX = enemy.x + d.dx;
        let newY = enemy.y + d.dy;
        if (isWalkable(newX, newY, dungeon)) {
            let distance = Math.abs(newX - player.x) + Math.abs(newY - player.y);
            candidates.push({ newX, newY, distance });
        }
    }
    if (candidates.length === 0) return;
    candidates.sort((a, b) => a.distance - b.distance);
    let bestDistance = candidates[0].distance;
    let totalWeight = 0;
    for (let c of candidates) {
        c.weight = 1 / (1 + (c.distance - bestDistance));
        totalWeight += c.weight;
    }
    let rand = Math.random() * totalWeight;
    let chosen = candidates[0];
    for (let c of candidates) {
        rand -= c.weight;
        if (rand <= 0) {
            chosen = c;
            break;
        }
    }
    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.x = chosen.newX;
    enemy.y = chosen.newY;
    enemy.animTime = 0;
    enemy.isMoving = true;
}

function isWalkable(x, y, dungeon) {
    if (x < 0 || x >= currentGridWidth || y < 0 || y >= currentGridHeight) return false;
    let type = dungeon.grid[x][y].type;
    return (type === "floor" || type === "door");
}
