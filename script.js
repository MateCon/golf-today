const WIDTH = 640, HEIGHT = 360, FPS = 60, TILE_SIZE = 40;
const mode = "GAME"; // EDITOR OR GAME
const Colors = {
    GRASS_LIGHT: "#7aba73",
    GRASS_DARK: "#54875c",
    HOLE: "#355446",
    WALL: "#0d0805"
};
let canvas, context, mousePos, tilePos, level;

let editorBlocks = [], editorType = "Wall";

fetch("levels/1.json")
    .then((res) => res.text())
    .then((text) => {
        level = JSON.parse(text);
        editorBlocks = JSON.parse(text);
    })
    .catch((e) => console.error(e));

/**
 * TO DO
 * - LEVEL EDITOR
 *   - PLACE BLOCKS
 *   - PICK BLOCK TYPE (typing a letter)
 * - BLOCKS
 *   - WALL (S for standard)
 *   - CORNER WALL (C)
 *   - WATER (W)
 *   - LAVA (L) exactly like water, but another texture
 *   - SAND (S)
 *   - ICE (I)
 *   - BALL (B), only one
 *   - Hole (H), only one
 * - WIND
 * - SCENES
 *   - BLOCK COLORS
 *   - BACKGROUND
 * - CUSTOM PIXEL ART TEXTURES
 *   - BLOCKS
 *   - BALL
 *   - Hole (with flag)
 *   - Walls and floor
 * - SOUNDS
 *   - HIT
 *   - HOLE
 *   - MUSIC
 *   - WIND (loudness depends on intensity)
 * - MAIN SCREEN
 * - DAILY
 *   - ENTER NAME
 *   - GET LEVELS FROM SERVER DAILY (3 or 5 per day)
 *   - MAKE LEADERBOARD
 * - TUTORIAL
 *   - Level one: no blocks
 *   - Level two: walls
 *   - level three: corners
 *   - Level four: water
 * - MAIN GAME
 *   - 25 levels
 *   - 5 in grass (green)
 *   - 5 in castle (gray)
 *   - 5 in tech (purple)
 *   - 5 in ice (a lot of water and ice)
 *   - 5 in hell (red)
 */

const ball = {
    position: { x: 60, y: HEIGHT / 2 },
    radius: 10,
    color: "white",
    velocity: { x: 0, y: 0 },
    friction: 0.95,
    top_speed: 40,
    in_hole: false,
    update: function () {
        if (mode === "EDITOR") return;
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x < this.radius || this.position.x > WIDTH - this.radius) {
            this.position.x -= this.velocity.x;
            this.velocity.x *= -1;
        }

        if (this.position.y < this.radius || this.position.y > HEIGHT - this.radius) {
            this.position.y -= this.velocity.y;
            this.velocity.y *= -1;
        }
        
        for (let block of level) {
            if (this.position.x > block.position.x * TILE_SIZE - this.radius && 
                this.position.x < block.position.x * TILE_SIZE + TILE_SIZE + this.radius &&
                this.position.y > block.position.y * TILE_SIZE - this.radius && 
                this.position.y < block.position.y * TILE_SIZE + TILE_SIZE + this.radius) {
                    this.position.x -= this.velocity.x;
                    this.position.y -= this.velocity.y;
                    if (this.position.x < block.position.x * TILE_SIZE - this.radius ||
                        this.position.x > block.position.x * TILE_SIZE + TILE_SIZE + this.radius)
                            this.velocity.x *= -1;
                    if (this.position.y < block.position.y * TILE_SIZE - this.radius ||
                        this.position.y > block.position.y * TILE_SIZE + TILE_SIZE + this.radius)
                            this.velocity.y *= -1;
                }
        }

        if (this.position.x > hole.position.x - 20
            && this.position.x < hole.position.x + 20
            && this.position.y > hole.position.y - 20
            && this.position.y < hole.position.y + 20
            && this.magnitude() < 10) {
                this.velocity = { x: 0, y: 0 };
                this.position = hole.position;
                this.in_hole = true;
        }
    },
    draw: function() {
        if (mode !== "EDITOR" && !this.in_hole && !this.is_moving() && mousePos) {
            const diff = { x: this.position.x - mousePos.x, y: this.position.y - mousePos.y }
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.position.x - diff.x / 2, this.position.y - diff.y / 2);
            ctx.stroke();
        }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    },
    magnitude: function() {
        return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    },
    is_moving: function() {
        return this.velocity.x > 0.2 || this.velocity.x < -0.2 || this.velocity.y > 0.2 || this.velocity.y < -0.2;
    },
    move: function({ x, y }) {
        if (this.in_hole || this.is_moving()) return;
        const diff = { x: this.position.x - x, y:  this.position.y - y };
        this.velocity = { x: diff.x * 0.15, y: diff.y * 0.15 };
        const magnitude = this.magnitude();
        if (magnitude > this.top_speed) {
            const direction = { x: this.velocity.x / magnitude, y: this.velocity.y / magnitude };
            this.velocity = { x: direction.x * this.top_speed, y: direction.y * this.top_speed };
        }
    },
};

const hole = {
    position: { x: 580, y: HEIGHT / 2 },
    radius: 12,
    color: Colors.HOLE,
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    },
};


function start() {
    canvas = document.querySelector("canvas");
    if (canvas.getContext) ctx = canvas.getContext("2d");
    window.requestAnimationFrame(draw);
}

function draw() {
    ctx.clearRect(0, 0, 640, 360);

    for (let i = 0; i < WIDTH / TILE_SIZE; i++) {
        for (let j = 0; j < HEIGHT / TILE_SIZE; j++) {
            ctx.fillStyle = i % 2 !== j % 2 ? Colors.GRASS_LIGHT : Colors.GRASS_DARK;
            ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    for (let block of level) {
        ctx.fillStyle = Colors.WALL;
        ctx.fillRect(block.position.x * TILE_SIZE, block.position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    hole.draw();
    ball.update();
    ball.draw();

    if (mode === "EDITOR") {
        if (tilePos) {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(tilePos.x * TILE_SIZE, tilePos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        for (let block of editorBlocks) {
            ctx.fillStyle = Colors[block.type.toUpperCase()];
            ctx.fillRect(block.position.x * TILE_SIZE, block.position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    setTimeout(() => {
        window.requestAnimationFrame(draw);
    }, 1000 / FPS);
}

function getMousePosition(e) {
    var rect = canvas.getBoundingClientRect();

    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

document.addEventListener("mousemove", (e) => {
    mousePos = getMousePosition(e);

    if (mode === "EDITOR") {
        const mousePos = getMousePosition(e);
        const newTilePos = {
            x: Math.floor(mousePos.x / TILE_SIZE),
            y: Math.floor(mousePos.y / TILE_SIZE)
        };

        if ((!tilePos || tilePos.x !== newTilePos.x || tilePos.y !== newTilePos.y) 
            && newTilePos.x >= 0 && newTilePos.x < WIDTH / TILE_SIZE
            && newTilePos.y >= 0 && newTilePos.y < HEIGHT / TILE_SIZE) {
            tilePos = newTilePos;
        }
    }
});

document.addEventListener("click", (e) => {
    ball.move(getMousePosition(e));
    
    if (mode === "EDITOR") {
        for (let block of editorBlocks) {
            if (tilePos.x === block.position.x && tilePos.y === block.position.y) {
                return;
            }
        }

        editorBlocks.push({
            position: { x: tilePos.x, y: tilePos.y },
            type: editorType,
        });
    }
});


document.addEventListener("keypress", e => {
    if (mode === "EDITOR") {
        switch (e.key) {
        case "w":
            editorType = "Wall";
            break;
        case "b":
            editorType = "Ball";
            break;
        case "h":
            editorType = "Hole";
            break;
        case "1":
            navigator.clipboard.writeText(JSON.stringify(editorBlocks));
        }
    }
})