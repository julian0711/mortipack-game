import { Game } from './game.js';

document.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
    game.start();

    // Mobile controls
    document.querySelectorAll('.arrow').forEach(btn => {
        btn.addEventListener('click', function () {
            let direction = btn.getAttribute('data-direction');
            game.handleKeyDown({ key: direction });
        });
    });
    document.getElementById('investigateButton').addEventListener('click', function () {
        game.handleKeyDown({ key: 'e' });
    });
});
