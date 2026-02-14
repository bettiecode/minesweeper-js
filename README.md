# Minesweeper
 
 Minesweeper for Javascript Canvas, made to be easily embedabble on your site.

 The code isn't that complicated, I recommend that you try and build something like this yourself.

## How to use

### Adding it to your site

All that you need to download from this repository is the `minesweeper.js`file. Place it somewhere your site can access it.

On your site (in your .html file), you will need a container, in the inside of which the canvas will be placed. The *id* assigned should be the same value that you assign to **containerId**. This container will be sized automatically, following the formulas specifed below. More about these properties, (the bold text) later.
- id = **containerId**
- style.width = **borderLeft**+**mapWidth**\***cellSize**+**borderRight**
- style.height = **borderTop**+**mapHeight**\***cellSize**+**borderBottom**

You don't need to calculate and assign this width and height to the conatiner element's style properties(css), it will be done automatically, but if you don't want your container to suddenly change it's size(after the automatic scaling has been done), then you should definetly scale it manually. (to prevent it messing up your layout.)

After the container(so the script can find it), you should put the linked script. Your html should look like this (comments can be removed):

    <div id="minesweeperContainer"> <!--id property-->

    </div>
    <script src="minesweeper.js"></script> <!--relative path to file-->

### Editing properties
For this, you will need to go inside `minesweeper.js`.
Right at the top of the file, after some comments, you need to look for the line starting with `var p = {` (line 5). Everything before that curly brace is closed `}` (line 109), is what you need to edit for customization.

There you will find variables, all of which you are free to edit to whatever you want to. Please note, that "whatever" doesn't mean anything, you can break the game, for example: setting something for a color that cannot be interpreted as a color, setting more mines than cells (or just too many), setting invalid vertices, negative numbers, etc. . Where this might not be obvious, I will specify what values you should avoid. You should generally use the deault values as a guide, values that make sense shouldn't cause any issues. 

For colors, instead of `"#ff0000"`, you could write `"red"` or `"rgb(255,0,0)"`, and it will work the same.

Properties:

- **containerId**: id of the html element on your site, inside which you want the game's canvas to be placed. If no element of the specified id can be found, the game will not work!
- **canvasId**: id of the generated canvas, should be something that doesn't conflict with any other element's id.
- **mapWidth**: width of the map, in number of cells. 
- **mapHeight**: height of the map, in number of cells. 
- **cellSize**: width and height of a cell, in pixels.
- **mineCount**: number of mines to be placed on the map. Since the starting cell and its neighbors have to be free, if (number of mines) > (number of cells)-9, then the game will definetly break. But you don't want to have mines that high anyways (since it will make the game really unplayable).
- **borderLeft**: width of the left border in pixels.
- **borderRight**: width of the right border in pixels.
- **borderBottom**: height of the bottom border in pixels, should be able to fit the foot text.
- **borderTop: 32**: height of the top border in pixels, should be able to fit the text(time, face, mines left).
- **numberPadding**: space between the edge of the cell and the drawn number on the cell.
- **font**: font, used for all text. Should be something your site can recognize.
- **fontSize**: font size of the text written, excluding numbers, which are sized according to other properties.
- **fps**: amount of times the game should be rendered, and the timer should be updated per second. 
- **faces**: array of emoticons appearing at the center of the top, in the 3 different gamestates, can be any text.
    - game in progress
    - game won
    - game lost
- **footText**: text written at the bottom of the window, remove if you want to, but credit is appreciated.
- **colors**: colors of drawn elements.
    - **borders**: array, border and the text written on it.
        - color of the border
        - color of text on border
    - **cells**: array of arrays, cells, 2-2 each, because of the checkered pattern.
        - covered cells
            - color A of covered cells (top left)
            - color B of covered cells 
        - uncovered cells
                color A of uncovered cells (top left)
                color B of uncovered cells
    - **flag** : color of placed flags, as markers. 
    - **numbers**: array, colors of the numbers that indicate the amount of mines around uncovered cells.
        - 1 to 8
    - **mine**: array, color of revealed mines after the game ends.
        - win
        - loss
    
- **sprites**: arrays containing vertices that determine the outlines of sprites, vertex coordinates should be between 0 and 1, (x=0: left, x=1: right, y=0: top, y=1:bottom, of cell). If you want the sprites to hang out of the cells, the coordinates can leave the previously mentioned boundary. Vertices need to be objects, you should write it the same way the default ones are written, for example: `{x: 0.2, y: 0.1}`, where x is 0.2, and y is 0.1.
    - **flag**: flag marker.
        - vertices
    - **mine**: revealed mines after game's end.
        - win
        - loss

### Recommendations, warnings

Values popular minesweeper versions use:
- Google:
    - easy: 10x8/10 (12.5%)
    - medium: 18x14/40 (15.9%~)
    - hard: 24x20/99 (20.625%~)
- General: (according to fandom.com)
    - Beginner: 8x8/10 or 9x9/10 (15.625~% or 12.3~%)
    - Intermediate: 16x16/40 (15.625%)
    - Expert: 30x16/99 (20.625%)

Fps doesn't need to be high, 30 is fine, but you can have it lower if your site needs to save on performance.
