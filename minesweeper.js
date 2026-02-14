//made by betticode: bettiecode.neoicites.org; github.com/bettiecode
//distributed under GPL-3.0 license

//SETTINGS TO MODIFY, READ DOCUMENTATION FOR INFO
var p = { //properties 
    containerId: "minesweeperContainer", //id of the html element that should contain the canvas
    canvasId: "minesweeperCanvas", //id the generated canvs should be assigned

    mapWidth: 30, //width of the map in number of cells
    mapHeight: 16, //height of the map in number of cells
    cellSize: 32, //width and height of a cell in pixels
    mineCount: 99, //amount of mines to be placed
    borderLeft: 16, //width of the left border in pixels
    borderRight: 16, //width of the right border in pixels
    borderBottom: 32, //height of the bottom border in pixels, should be able to fit the foot text
    borderTop: 32, //height of the top border in pixels, should be able to fit the text
    numberPadding: 2, //space between the edge of the cell and the drawn number on the cell

    font: "VCR OSD Mono", //font, used for all text
    fontSize: 16, //font size of the text written

    fps: 30, //amount of times the game should be rendered, and the timer should be updated per second 

    faces: //emoticon appearing at the center of the top, in the 3 different gamestates, can be any text
    [
        ":|", //when game is in progress
        ":D", //after game is won
        ":C"  //after game is lost
    ],
    footText: "bettiecode.neocities.org", //text written at the bottom of the window, remove if you want to

    colors: //colors of drawn elements
    { 
        borders : //border/background and the text written on it
        [
            "#003144", //border/background
            "#007488" //text written on border/background
        ],
        cells : //cells, 2-2 each, because of the checkered pattern
        [
            [ //covered cells
                "#2a6769", //color A of covered cells
                "#084547" //color B of covered cells
            ],
            [ //uncovered cells
                "#ffeeee",  //color A of uncovered cells
                "#eedddd" //color B of uncovered cells
            ]
        ],
        flag : "#ff0000", //color of placed flags, something vibrant recommended, to help visibility
        numbers : //colors of the numbers that indicate the amount of mines around uncovered cells
        [ 
            "#0000aa", //1
            "#034c03", //2
            "#aa0000", //3
            "#550055", //4
            "#c2c20b", //5
            "#005555", //6
            "#555555", //7
            "#aaaaaa"  //8
        ], 
        mine: //color of revealed mines after the game ends
        [
            "#ffaaaa", //win
            "#ff0000", //loss
        ]
    }, 

    sprites: //arrays containing vertices that determine the outlines of sprites
    {
        flag: //flag marker
        [
            {x:0.8,y:0.2}, 
            {x:0.2,y:0.4}, 
            {x:0.65,y:0.5}, 
            {x:0.65,y:0.7}, 
            {x:0.5,y:0.7}, 
            {x:0.5,y:0.8}, 
            {x:0.8,y:0.8}  
        ],
        mine: //revealed mines after game's end
        [
            [ //win
                {x:0.5,y:0.2},
                {x:0.2,y:0.5},
                {x:0.5,y:0.8},
                {x:0.8,y:0.5}
            ],
            [ //loss
                {x:0.5,y:0.1},
                {x:0.3,y:0.2}, //
                {x:0.1,y:0.1},
                {x:0.2,y:0.3}, //
                {x:0.1,y:0.5},
                {x:0.2,y:0.7}, //
                {x:0.1,y:0.9},
                {x:0.3,y:0.8}, //
                {x:0.5,y:0.9},
                {x:0.7,y:0.8}, //
                {x:0.9,y:0.9},
                {x:0.8,y:0.7}, //
                {x:0.9,y:0.5},
                {x:0.8,y:0.3}, //
                {x:0.9,y:0.1},
                {x:0.7,y:0.2} //
            ]
        ]
    }
}
//SETTINGS END HERE

var map, game, selection; //declare variables that will store objects that reference each other early
var canvas, context; //canvas element and its rendering context

var Mouse = //tracks mouse input
   {
        pos : //position realtive to the canvas 
        {
            x: 0, //x
            y: 0 //y
        },
        click : 0 //left or right click, javascript's onclick event's button property
   };

class Cell //constructor, initially all false or 0
{
    constructor()
    {
    this.dug = false; //cell dug or not, uncovered or covered
    this.number = 0; //number of mines around the cell
    this.mine = false; //mine is at cell or not
    this.flagged = false; //cell is flagged, (marked with a flag)
    }
};
class Map  //map object, containing data about the game
{
    constructor()
    {
        this.cells = []; //cell matrix, holding arrays of cell objects
        this.width = p.mapWidth; //width in number of cells
        this.height = p.mapHeight; //height in number of cells
        this.minesLeft = p.mineCount; //remaining mines, drawn at the top right (mines minus placed flags)
        this.dugCells = 0; //amount of cells uncovered, needed for win-condition check
        for(var y=0; y<this.height; y++) //loop through rows
        {
            this.cells.push([]); //add row
            for(var x=0; x<this.width; x++) //loop through coloumns
            {
                this.cells[y].push(new Cell()); //add cell
            }
        }
        var minesToPlace = this.minesLeft; //mines to place
        while(minesToPlace>0) //place mines
        {
            var x = Math.floor(Math.random() * this.width); //random x
            var y = Math.floor(Math.random() * this.height); //random y
        
            if(!this.cells[y][x].mine) //if there isn't already a mine there
            {
                this.cells[y][x].mine = true; //place mine
                minesToPlace--; //count
            }
        }
        this.assignNumbers(); //assign numbers
    }
    dig(x,y)
    {
        if(this.cells[y][x].mine) // if mine
        {
            game.state = 2; //game lost
        }
        else if(!this.cells[y][x].flagged && !this.cells[y][x].dug) //if not flagged or already dug
        {
            this.cells[y][x].dug = true; //dig cell
            this.dugCells++; //count dig action
            if(this.cells[y][x].number==0) //if cell's assigned number is 0, then automatically dig around
            {

                for(var offY=-1; offY<=1; offY++) //neighbor y loop
                {
                    for(var offX=-1; offX<=1; offX++) //neighbor x loop
                    {
                        if( //if cell in map
                        (x + offX) >= 0 && (x + offX) < this.width &&
                        (y + offY) >= 0 && (y + offY) < this.height 
                        )
                        {
                            this.dig(x+offX,y+offY); //dig neighboring cell recursively
                        }
                    }  
                }
            }
            //console.log({x,y});

        }
    }
    flag(x,y)
    {
        if(this.cells[y][x].flagged) 
        { //if flagged, unflag
            map.cells[y][x].flagged = false;
            map.minesLeft++; //one more flag to place
        }
        else
        { //if not flagged, flag
            map.cells[y][x].flagged = true;
            map.minesLeft--; //one less flag to place
        }
    }
    assignNumbers()
    {
        for(var y=0; y<this.height; y++) //y loop
        {
            for(var x=0; x<this.width; x++) //x loop
            {
                if(this.cells[y][x].mine) //if mine
                {
                    this.cells[y][x].number = 9; //9 indicates mine
                }
                else
                {
                    var sum = 0; //sum
                    for(var offY=-1; offY<=1; offY++) //neighbor y loop
                    {
                        for(var offX=-1; offX<=1; offX++) //neighbor x loop
                        {
                            if( //if cell inside map
                            (x + offX) >= 0 && (x + offX) < this.width &&
                            (y + offY) >= 0 && (y + offY) < this.height 
                            )
                            {
                                sum += Number(this.cells[y+offY][x+offX].mine); //add 1 if mine, 0 if not mine
                            }
                        }  
                    }
                    this.cells[y][x].number = sum; //assign sum
                }
            }
        }
        //console.log(map.numbers);
    }
    reshuffle(x,y)
    {
        for(var offY=-1; offY<=1; offY++) //y loop, neighbors
        {
            for(var offX=-1; offX<=1; offX++) //x loop, neighbors
            {
                if( //if cell inside map
                (x + offX) >= 0 && (x + offX) < this.width &&
                (y + offY) >= 0 && (y + offY) < this.height 
                )
                {
                    if(this.cells[y+offY][x+offX].mine) //if cell has mine
                    {
                        var newX = 0; //declare x of reshuffled mine
                        var newY = 0; //declare y of reshuffled mine
                        do //get a new random pos
                        {
                            newX = Math.floor(Math.random() * this.width);
                            newY = Math.floor(Math.random() * this.height);
                        }
                        while
                        ( //rerandomize until new position isnt't neighboring clicked cell, and randomized
                            this.cells[newY][newX].mine || 
                            (
                                (newX>=x-1) && (newX<=x+1) &&
                                (newY>=y-1) && (newY<=y+1)
                            )
                        )
                        this.cells[y+offY][x+offX].mine = false; //unplace mine
                        this.cells[newY][newX].mine = true; //place mine
                    };
                }
            }  
        }
        this.assignNumbers(); //reassign numbers
    }
}; map = new Map();

class Game //game class
{
    constructor()
    {
        this.state = 0; //game state, 0: in progress, 1: won, 2: lost
        this.startTime = 0; //start time
        this.elapsedTime = 0; //elapsed time
    }
    catchInput(e)
    {
        Mouse.click = e.button; //catch button clicked with
        Mouse.pos.x = Math.floor(map.width * (e.offsetX-p.borderLeft)/(map.width*p.cellSize)); //calculate cell x
        Mouse.pos.y = Math.floor(map.height * (e.offsetY-p.borderTop)/(map.height*p.cellSize)); //calculate cell y
        Mouse.pos.x = Math.max(0,Math.min(Mouse.pos.x,map.width-1)); //clamp x
        Mouse.pos.y = Math.max(0,Math.min(Mouse.pos.y,map.height-1)); //clamp y
    }
    update()
    {
        if(this.state==0)//game in progress
        {
            if(map.dugCells==0) //if click is first
            {
                if(map.cells[Mouse.pos.y][Mouse.pos.x].number!=0) //if starting cell isn't a 0
                {
                    map.reshuffle(Mouse.pos.x,Mouse.pos.y);  //reshuffle
                }
                map.dig(Mouse.pos.x,Mouse.pos.y); //dig cell
                this.startTime = new Date(); //get start time
            }
            else //if click isn't first
            {
                var x = Mouse.pos.x; //shorten
                var y = Mouse.pos.y; //shorten
                var clickedCell = map.cells[y][x]; //shorten
                switch(Mouse.click) //left or right click
                {
                    case 0: //left click
                        if(!clickedCell.flagged) //if clicked cell is flagged, then don't do anything
                        {
                            if(!clickedCell.dug) //if cell hasn't been dug yet, then dig it
                            {
                                map.dig(x,y);
                            }
                            else //else, try to fig around
                            {
                                var flagCount = 0; //variable holding counted flags around cell
                                var freeTiles = []; //diggable cells, stored so the program only has to loop through once
                                for(var offY=-1; offY<=1; offY++) //neighbor y loop
                                {
                                    for(var offX=-1; offX<=1; offX++) //neighbor x loop
                                    {
                                        if( //if cell inside map
                                        (x + offX) >= 0 && (x + offX) < map.width &&
                                        (y + offY) >= 0 && (y + offY) < map.height 
                                        )
                                        {
                                            if(map.cells[y+offY][x+offX].flagged) //if flag found
                                                flagCount++; //count flag
                                            else if(!map.cells[y+offY][x+offX].dug) //else if cell hasn't been dug
                                                freeTiles.push({x:x+offX,y:y+offY}); //add it to the array 
                                        }
                                    }  
                                }
                                //console.log(freeTiles,flagCount);
                                if(flagCount == clickedCell.number) //if flags are equal to the neigboring mines
                                {
                                    freeTiles.forEach( //each diggable cell
                                        function(v) 
                                        {
                                            map.dig(v.x,v.y); //dig cell
                                        }
                                    );
                                }
                            }
                        }
                        
                    case 2: //right click
                        if(!clickedCell.dug) //ignore dug cells
                        {
                            map.flag(x,y); //toggle flag of cell
                        }
                }
            }

            
            if(map.dugCells+p.mineCount == map.width*map.height) //check win condition
            {
                this.state = 1; //switch game state
                map.minesLeft = 0; //indicate that all mines have been found, even if the player didn't flag them
            }
        }
    }
    render()
    {
        //clear
        context.fillStyle = p.colors.borders[0]; //set fill color to border/background's
        context.fillRect(0,0,canvas.width,canvas.height); //clear
        //cells
        for(var y=0; y<map.height; y++) //y loop
        {
            for(var x=0; x<map.width; x++) //x loop
            {
                //cell
                context.fillStyle = p.colors.cells[Number(map.cells[y][x].dug)][(x+y)%2]; //get cell color
                context.fillRect(p.borderLeft+x*p.cellSize,p.borderTop+y*p.cellSize,p.cellSize,p.cellSize); //fill cell
                if(!map.cells[y][x].dug) //covered cells
                {
                    if(game.state==0)
                    {
                        if(map.cells[y][x].flagged) //if flagged
                        {
                            drawSprite(x,y,p.sprites.flag,p.colors.flag); //draw flag
                        }
                    }
                    else
                    {
                        if(map.cells[y][x].mine) //if game has ended, draw mines 
                        {
                            drawSprite(x,y,p.sprites.mine[game.state-1],p.colors.mine[game.state-1]); //draw mine sprite, win or loss
                        }
                    }
                }
                else
                {
                    var idx = map.cells[y][x].number; //get number
                    if(idx!=0) //skip if 0
                    {
                        context.font = "bold "+(p.cellSize-2*p.numberPadding)+"px "+p.font; //set font
                        context.textAlign = "center"; //set x align
                        context.textBaseline = "middle"; //set y align
                        context.fillStyle = p.colors.numbers[idx-1]; //get color
                        context.fillText(String(idx),p.borderLeft+(x+0.5)*p.cellSize,p.borderTop+(y+0.5)*p.cellSize); //draw number
                    }
                }

            }
        } 
        //hud
        context.font = "bold "+p.fontSize   +"px "+p.font; //set font
        context.textBaseline = "middle"; //center vertically
        context.fillStyle = p.colors.borders[1]; //set color
        //time
        context.textAlign = "left"; //to the left
        context.fillText((this.elapsedTime/1000),p.borderLeft,p.borderTop/2); //draw elapsed time in seconds
        //foot text
        context.fillText((p.footText),p.borderLeft,canvas.height-p.borderBottom/2); //draw foot text
        //mines
        context.textAlign = "right"; //to the right
        context.fillText(map.minesLeft,canvas.width-p.borderRight,p.borderTop/2); //draw mines remiaining
        //face
        context.textAlign = "center"; //to the center
        context.fillText(p.faces[this.state],canvas.width/2,p.borderTop/2); //draw face
        
    }

}; game = new Game();

function main() //main  
{
   //initalize
   canvas = makeCanvas(); //make canvas 
   context = canvas.getContext("2d"); //get context
   //init input
   canvas.onclick = function(e) //get input data and update game
   {
        game.catchInput(e); //handle input
        game.update(); //update game
   };
   canvas.oncontextmenu = function(e){ canvas.onclick(e); return false}; //enable right click
   //init
   game.startTime = -1; //set start time to stopped (indicated by -1)
   setInterval
   (
    function()
    {
        if(game.startTime!=-1 && game.state==0) game.elapsedTime = (new Date())-game.startTime; //update elapsed time
        game.render();
    },
    1000/p.fps
    );
}

function makeCanvas() //make canvas inside div, and initialize some values
{
    var container = document.getElementById(p.containerId); //find container
    container.innerHTML = "<canvas id='"+p.canvasId+"'></canvas>"; //build inner html
    var canvas = document.getElementById(p.canvasId); //get id of newly made element
    var w = p.borderLeft + p.mapWidth*p.cellSize + p.borderRight; //calculate width
    var h = p.borderTop + p.mapHeight*p.cellSize + p.borderBottom; //calculate height
    canvas.width = w; //set canvas width
    canvas.height = h; //set canvas height
    container.style.width = w+"px"; //set container width
    container.style.height = h+"px"; //set container height

    return canvas; //return the element
}

function drawSprite(x,y,v,c) //draw sprite
{
    context.fillStyle = c; //set color
    context.moveTo //move to start
    (
        p.borderLeft+x*p.cellSize+v[0].x*p.cellSize,
        p.borderTop+y*p.cellSize+v[0].y*p.cellSize
    );
    context.beginPath(); //begin line
    for(var i=1; i<=v.length; i++) //loop through vertices
    {
        context.lineTo //go to next
        (
            p.borderLeft+x*p.cellSize+v[i%v.length].x*p.cellSize,
            p.borderTop+y*p.cellSize+v[i%v.length].y*p.cellSize
        );
    }
    context.closePath(); //end line
    context.fill(); //fill
}

main(); //start program
