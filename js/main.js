import { Game } from './game.js';

document.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
    game.start();

    // Mobile controls
    document.querySelectorAll('.dpad-touch-zone').forEach(btn => {
        btn.addEventListener('touchstart', function (e) {
            e.preventDefault(); // Prevent scrolling/zooming
            let direction = btn.getAttribute('data-direction');
            game.handleKeyDown({ key: direction });
        });
        // Keeping click for desktop testing (if touch not supported)
        btn.addEventListener('click', function (e) {
            let direction = btn.getAttribute('data-direction');
            game.handleKeyDown({ key: direction });
        });
    });

    // Search Button
    document.getElementById('investigateButton').addEventListener('click', function () {
        game.handleKeyDown({ key: 'e' });
    });

    // Option Button (Placeholder for now)
    document.getElementById('optionButton').addEventListener('click', function () {
        console.log("Option button clicked");
        // Future implementation: toggle option screen
    });
});
