//SETTINGS TO MODIFY, READ DOCUMENTATION FOR INFO
var p = { //properties 

    mapWidth: 12, //width of the map in tiles
    mapHeight: 12, //height of the map in tiles
    tileSize: 32, //width and height of a tile in pixels
    mineCount: Math.floor(12*12*0.15), //amount of mines to be placed, 15% of the number of tiles is recommend
    borderLeft: 8, //width of the left border in pixels
    borderRight: 8, //width of the right border in pixels
    borderBottom: 8, //height of the bottom border in pixels
    borderTop: 32, //height of the top border in pixels, should be able to fit the text
    numberPadding: 2, //space between the edge of the tile and the drawn number on the tile

    font: "VCR OSD Mono", //font, used for all text
    fontSize: 16, //font size of the text written at the top of the window

    outlineWidth: 4, //width of the outline that is drawn on the currently selected tile

    faces: //emoticon appearing at the center of the top, in the 3 different gamestates
    [
        ":|", //when game is in progress
        ":D", //after game is won
        ":C"  //after game is lost
    ],

    colors: //colors of drawn elements
    { 
        borders : //border/background and the text written on it
        [
            "#003144", //border/background
            "#007488" //text written on border/background
        ],
        tiles : //tiles, 2-2 each, because of the checkered pattern
        [
            [ //covered tiles
                "#2a6769", //color A of covered tiles
                "#084547" //color B of covered tiles
            ],
            [ //uncovered tiles
                "#ffeeee",  //color A of uncovered tiles
                "#eedddd" //color B of uncovered tiles
            ]
        ],
        flag : "#ff0000", //color of placed flags, something vibrant recommended, to help visibility
        numbers : //colors of the numbers that indicate the amount of mines around uncovered tiles
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
        selection : //color of selected tile's highlight, and of the icons that indicate actions
        {
            pos : "#ffffff", //selected tile highlighted
            dig : "#777777", //dig
            flag : "#000000" //place flag
        },
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
        shovel: //icon of dig action
        [
            {x:0.4,y:0.2}, 
            {x:0.4,y:0.5}, 
            {x:0.3,y:0.5}, 
            {x:0.3,y:0.7}, 
            {x:0.5,y:0.8}, 
            {x:0.7,y:0.7}, 
            {x:0.7,y:0.5}, 
            {x:0.6,y:0.5}, 
            {x:0.6,y:0.2}  
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

var canvas, context; //canvas element and its rendering context
var map = //map stract, containing data about the game
    {
        status: [], //0: covered, 1: uncovered
        numbers: [], //amount of neihgboring mines
        mines: [], //0: no mine, 1: mine
        flagged: [], //0: not flagged, 1: flagged
        width: p.mapWidth, //width in tiles
        height: p.mapHeight, //height in tiles
        minesLeft: p.mineCount, //remaining mines, drawn at the top right
        dugTiles: 0, //amount of tiles uncovered, needed for win-condition check
        time: 0 //elapsed time
    };

var state = 0; //game state, 0: in progress, 1: won, 2: lost
var startTime; //keep track of time at start, to calculate elapsed time
var fps = 15; //frames per second
var mouseInp = //tracks mouse input asynchronously (i guess???)
   {
        pos : //position relative to the canvas
        {
            x: 0, //x
            y: 0 //y
        },
        clicked : false //left click newly pressed
   };
var mouse = //tracks mouse input as a step inside the procedure (i really don't know javascript this good)
   {
        pos : //position realtive to the canvas 
        {
            x: 0, //x
            y: 0 //y
        },
        clicked : false //left click newly pressed
   };
var selection = //struct holding data about the selected tile and the UI
{
    pos : //selected tile's position
    {
        x : 0, //x
        y : 0, //y
        active : 0 //0: no tile selected, 1: a tile is selected
    },
    flag : //position of the flag action's icon
    {
        x : 0, //x
        y : 0, //y
        active : 0 //0: tile isn't flaggable
    },
    dig : //position of the dig action's icon
    {
        x : 0, //x
        y : 0, //y
        active : 0 //0: tile isn't diggable
    },

}

function main() //main
{
   //initalize
   canvas = makeCanvas(); //make canvas 
   context = canvas.getContext("2d"); //get context
   //init input
   canvas.onclick = function(e) //track input and calculate tile position of mouse 
   {
        mouseInp.clicked = true; //function runs on click, so clicked is true, if it doesnt run another function resests it to false
        mouseInp.pos.x = Math.floor(map.width * (e.offsetX-p.borderLeft)/(map.width*p.tileSize)); //calculate x
        mouseInp.pos.y = Math.floor(map.height * (e.offsetY-p.borderTop)/(map.height*p.tileSize)); //calculate y
        mouseInp.pos.x = Math.max(0,Math.min(mouseInp.pos.x,map.width-1)); //clamp x
        mouseInp.pos.y = Math.max(0,Math.min(mouseInp.pos.y,map.height-1)); //clamp y
        //console.log(mouseInp);
   };
   //init map
   makeMap(); //make map

   startTime = new Date(); //get start time
   //game loop
   setInterval( 
    function ()
    {
        handleInput(); //input
        update(); //update
        resetInput(); //input reset
        render(); //render
        
    },
    1000/fps //every 1/fps seconds
   );

}

function makeCanvas() //make canvas inside div, and initialize some values
{
    var container = document.getElementById("minesweeper"); //find container
    container.innerHTML = "<canvas id='minesweeperCanvas'></canvas>"; //build inner html
    var canvas = document.getElementById("minesweeperCanvas"); //get id of newly made element
    var w = p.borderLeft + p.mapWidth*p.tileSize + p.borderRight; //calculate width
    var h = p.borderTop + p.mapHeight*p.tileSize + p.borderBottom; //calculate height
    canvas.width = w; //set canvas width
    canvas.height = h; //set canvas height
    container.style.width = w+"px"; //set container width
    container.style.height = h+"px"; //set container height

    return canvas; //return the element
}
function makeMap() //make map, randomize mines, initialize numbers
{
    for(var y=0; y<map.height; y++) //loop through rows
    {
        map.status.push([]); //make row
        map.numbers.push([]); //make row
        map.mines.push([]); //make row
        map.flagged.push([]); //make row
        for(var x=0; x<map.width; x++) //loop through coloumns
        {
            map.status[y].push(0); //add element
            map.numbers[y].push(0); //add element
            map.mines[y].push(0); //add element
            map.flagged[y].push(0); //add element
        }
    }
    var minesToPlace = map.minesLeft; //mines to place
    while(minesToPlace>0) //place mines
    {
        var x = Math.floor(Math.random() * map.width); //random x
        var y = Math.floor(Math.random() * map.height); //random x
    
        if(map.mines[y][x] == 0) //if there isn't already a mine there
        {
            map.mines[y][x] = 1; //place mine
            minesToPlace--; //count
        }
    }
    assignNumbers(); //assign numbers
}

function handleInput() //ready asynchronoulsy got input procedurally
{
    mouse.clicked = mouseInp.clicked; //copy
    mouse.pos.x = mouseInp.pos.x; //copy
    mouse.pos.y = mouseInp.pos.y; //copy
}
function update() //update map, game
{
    switch(state)
    {
        case 0: //game in progress
            if(map.dugTiles+p.mineCount == map.width*map.height) //check win condition
            {
                state = 1; //switch game state
                break;
            }
            if(mouse.clicked) //if clicked
            {

                if(map.dugTiles==0) //if click is first
                {
                    var x = mouse.pos.x; //shorten
                    var y = mouse.pos.y; //shorten
                    var newX = 0; //declare x of reshuffled mine
                    var newY = 0; //declare y of reshuffled mine
                    if(map.numbers[y][x]!=0) //reshuffle if starting tile isn't a 0
                    {
                        for(var offY=-1; offY<=1; offY++) //y loop, neighbors
                        {
                            for(var offX=-1; offX<=1; offX++) //x loop, neighbors
                            {
                                if( //if tile inside map
                                (x + offX) >= 0 && (x + offX) < map.width &&
                                (y + offY) >= 0 && (y + offY) < map.height 
                                )
                                {
                                    if(map.mines[y+offY][x+offX]==1) //if tile has mine
                                    {
                                        do //get a new random pos
                                        {
                                            newX = Math.floor(Math.random() * map.width);
                                            newY = Math.floor(Math.random() * map.width);
                                        }
                                        while
                                        ( //rerandomize until new position isnt't neighboring clicked tile, and randomized
                                            map.mines[newY][newX]==1 || 
                                            (
                                                (newX>=x-1) && (newX<=x+1) &&
                                                (newY>=y-1) && (newY<=y+1)
                                            )
                                        )
                                        map.mines[y+offY][x+offX] = 0; //unplace mine
                                        map.mines[newY][newX] = 1; //place mine
                                    };
                                }
                            }  
                        }
                        assignNumbers(); //reassign numbers
                    }
                    dig(x,y); //dig tile
                }
                else //if click isn't first
                {
                    if(!selection.pos.active) //if no tile is selected
                    {
                        if(!(map.status[mouse.pos.y][mouse.pos.x]==1 && map.numbers[mouse.pos.y][mouse.pos.x]==0))
                        { //select tile if it isn't an uncovered 0
                            updateSelection(); //update selection
                        }
                    }
                    else
                    {
                        if(mouse.pos.x == selection.pos.x && mouse.pos.y == selection.pos.y)
                        { //clicked selected tile
                            //unselect the tile
                            selection.pos.active = 0;
                            selection.flag.active = 0;
                            selection.dig.active = 0;
                        }
                        else if //if flag icon is clicked
                        (
                            mouse.pos.x == selection.flag.x && 
                            mouse.pos.y == selection.flag.y && 
                            selection.flag.active
                        )
                        {
                            if(map.flagged[selection.pos.y][selection.pos.x] == 1)
                            { //if flagged, unflag
                                map.flagged[selection.pos.y][selection.pos.x] = 0;
                                map.minesLeft++; //one more flag to place
                            }
                            else
                            { //if not flagged, flag
                                map.flagged[selection.pos.y][selection.pos.x] = 1;
                                map.minesLeft--; //one less flag to place
                            }
                            //unselect
                            selection.pos.active = 0;
                            selection.flag.active = 0;
                            selection.dig.active = 0;
                        }
                        else if //if dig icon is clicked
                        (
                            mouse.pos.x == selection.dig.x && 
                            mouse.pos.y == selection.dig.y && 
                            selection.dig.active  
                        )
                        {
                            if(!map.status[selection.pos.y][selection.pos.x]) //if tile is covered, dig tile
                            {
                                dig(selection.pos.x,selection.pos.y); //dig selected tile
                            }
                            else //else dig around uncovered tile
                            {
                                for(var offY=-1; offY<=1; offY++) //y loop
                                {
                                    for(var offX=-1; offX<=1; offX++) //x loop
                                    {
                                        if( //if tile is inside map
                                        (selection.pos.x + offX) >= 0 && (selection.pos.x + offX) < map.width &&
                                        (selection.pos.y + offY) >= 0 && (selection.pos.y + offY) < map.height
                                        )
                                        { //and if tile is not flagged
                                            if(!map.flagged[selection.pos.y + offY][selection.pos.x + offX])
                                            dig(selection.pos.x + offX,selection.pos.y + offY); //dig
                                        }
                                    }  
                                }
                            }
                            //unselect
                            selection.pos.active = 0;
                            selection.flag.active = 0;
                            selection.dig.active = 0;
                        }else //if no icon is clicked, place selection elsewhere
                        {
                            updateSelection(); //update selection
                        }

                        
                    }
                }
                //console.log(map.dugTiles);
            }
            map.time = (new Date())-startTime; //update elapsed time

        break;
        case 1: //victory
            //
        break;
        case 2: //defeat
            //
        break;
    }
}
function updateSelection() //place selection
{
    selection.pos.active = 1; //mark selection as active
    if(!map.flagged[mouse.pos.y][mouse.pos.x]) selection.dig.active = 1; //if tile is flagged, then it cannot be dug
    if(!map.status[mouse.pos.y][mouse.pos.x]) selection.flag.active = 1; //if tile is uncovered, then it cannot be flagged
    selection.pos.x = mouse.pos.x; //copy
    selection.pos.y = mouse.pos.y; //copy
    var offDig = 1; //icon pos offset x
    var offFlag = 1; //icon pos offset y
    if(selection.pos.x > map.width/2) offDig = -1; //icon should be towards center
    if(selection.pos.y > map.height/2) offFlag = -1; //icon should be towards center
    selection.dig.x = selection.pos.x+offDig; //dig icon x, offset
    selection.dig.y = selection.pos.y; //dig icon y, same
    selection.flag.x = selection.pos.x; //dig icon x, same 
    selection.flag.y = selection.pos.y+offFlag; //dig icon y, offset
    //console.log(selection.pos,selection.flag,selection.dig);
}
function render() //render
{
    //clear
    context.fillStyle = p.colors.borders[0]; //set fill color to border/background's
    context.fillRect(0,0,canvas.width,canvas.height); //clear
    //tiles
    for(var y=0; y<map.height; y++) //y loop
    {
        for(var x=0; x<map.width; x++) //x loop
        {
            //tile
            context.fillStyle = p.colors.tiles[map.status[y][x]][(x+y)%2]; //get tile color
            context.fillRect(p.borderLeft+x*p.tileSize,p.borderTop+y*p.tileSize,p.tileSize,p.tileSize); //fill tile
            if(map.status[y][x]==0) //covered tiles
            {
                if(map.flagged[y][x] && state==0) //if flagged
                {
                    drawSprite(x,y,p.sprites.flag,p.colors.flag); //draw flag
                }
            }
            else
            {
                var idx = map.numbers[y][x]; //get number
                if(idx!=0) //skip if 0
                {
                    context.font = "bold "+(p.tileSize-2*p.numberPadding)+"px "+p.font; //set font
                    context.textAlign = "center"; //set x align
                    context.textBaseline = "middle"; //set y align
                    context.fillStyle = p.colors.numbers[idx-1]; //get color
                    context.fillText(String(idx),p.borderLeft+(x+0.5)*p.tileSize,p.borderTop+(y+0.5)*p.tileSize); //draw number
                }
            }
            if(map.mines[y][x] && state!=0) //if game has ended, draw mines 
            {
                drawSprite(x,y,p.sprites.mine[state-1],p.colors.mine[state-1]); //draw mine sprite, win or loss
            }
        }
    }
    //interface
    context.strokeStyle = p.colors.selection.pos; //set strokestyle
    context.lineWidth = p.outlineWidth; //set outlinewidth
    if(selection.pos.active) //if a tile is selected
    {
        context.strokeRect //outline tile
        (
            p.borderLeft+selection.pos.x*p.tileSize+p.outlineWidth/2,
            p.borderTop+selection.pos.y*p.tileSize+p.outlineWidth/2,
            p.tileSize-p.outlineWidth,p.tileSize-p.outlineWidth
        );
    }
    if(selection.flag.active) //if tile flaggable
    { //draw flag icons
        drawSprite(selection.flag.x,selection.flag.y,p.sprites.flag,p.colors.selection.flag);
        //context.stroke();
    }
    if(selection.dig.active) //if tile diggable
    { //draw dig icon
        drawSprite(selection.dig.x,selection.dig.y,p.sprites.shovel,p.colors.selection.dig);
        //context.stroke();
    }   
    //hud
    context.font = "bold "+p.fontSize   +"px "+p.font; //set font
    context.textBaseline = "middle"; //center vertically
    context.fillStyle = p.colors.borders[1]; //set color
    //time
    context.textAlign = "left"; //to the left
    context.fillText((map.time/1000),p.borderLeft,p.borderTop/2); //draw elapsed time in seconds
    //mines
    context.textAlign = "right"; //to the right
    context.fillText(map.minesLeft,canvas.width-p.borderRight,p.borderTop/2); //draw mines remiaining
    //face
    context.textAlign = "center"; //to the center
    context.fillText(p.faces[state],canvas.width/2,p.borderTop/2); //draw face
    
}
function drawSprite(x,y,v,c) //draw sprite
{
    context.fillStyle = c; //set color
    context.moveTo //move to start
    (
        p.borderLeft+x*p.tileSize+v[0].x*p.tileSize,
        p.borderTop+y*p.tileSize+v[0].y*p.tileSize
    );
    context.beginPath(); //begin line
    for(var i=1; i<=v.length; i++) //loop through vertices
    {
        context.lineTo //go to next
        (
            p.borderLeft+x*p.tileSize+v[i%v.length].x*p.tileSize,
            p.borderTop+y*p.tileSize+v[i%v.length].y*p.tileSize
        );
    }
    context.closePath(); //end line
    context.fill(); //fill
}

function resetInput() //reset input
{
   mouse.clicked=false; 
   mouseInp.clicked=false;
}

function assignNumbers() //assign nummbers
{
    for(var y=0; y<map.height; y++) //y loop
    {
        for(var x=0; x<map.width; x++) //x loop
        {
            if(map.mines[y][x]==1) //if mine
            {
                map.numbers[y][x] = 9; //9 indicates mine
            }
            else
            {
                var sum = 0; //sum
                for(var offY=-1; offY<=1; offY++) //neighbor y loop
                {
                    for(var offX=-1; offX<=1; offX++) //neighbor x loop
                    {
                        if( //if tile inside map
                        (x + offX) >= 0 && (x + offX) < map.width &&
                        (y + offY) >= 0 && (y + offY) < map.height 
                        )
                        {
                            sum += map.mines[y+offY][x+offX]; //add 1 if mine, 0 if not mine
                        }
                    }  
                }
                map.numbers[y][x] = sum; //assign sum
            }
        }
    }
    //console.log(map.numbers);
}

function dig(x,y) //dig x y
{
    if(map.mines[y][x]==1) // if mine
    {
        state = 2; //game lost
    }
    else if(map.numbers[y][x]==0 && !map.flagged[y][x]) //automatically diag around 0 recursively
    {
        //console.log({x,y});
        if(map.status[y][x] == 0) map.dugTiles++; //if tile hasn't been dug yet, count digging it
        map.status[y][x] = 1; //set status, then loop around
        for(var offY=-1; offY<=1; offY++) //y loop
        {
            for(var offX=-1; offX<=1; offX++) //x loop
            {
                if( //if tile in map
                   (x + offX) >= 0 && (x + offX) < map.width &&
                   (y + offY) >= 0 && (y + offY) < map.height 
                )
                {
                    if(map.status[y+offY][x+offX]==0) dig(x+offX,y+offY); //if tile hasn't already been dug, then dig it
                }
            }  
        }
    }
    else if(!map.flagged[y][x]) //dig tile
    {
        if(map.status[y][x] == 0) map.dugTiles++; //if tile hasn't been dug yet, count digging it
        map.status[y][x] = 1; //set status
    }
}

main();

/*TODO:
add sprites
add win/loss animations
flag or dig option
*/