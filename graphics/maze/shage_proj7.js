/*
 * shage_proj7.js
 * 
 * Generate a first-person maze scenario
 *
 * Sam Hage
 * 4/15
 *
 * Cool stuff: wall collision; teal patches flip the maze upside-down, a la Windows98 screensavers; sprinting
 *
 */

var n = 4;
// var side = 2*n + 1;
var initial = -2.0 // starting point for maze corner
var step = (2*-initial)/(2*n+1); // separation between rows and columns
// model matrix controls
var yaw = 0.0; // turn
var pitch = 0.0; // look up and down
var roll = 0.0; // roll maze over
// move forward and backward
var xpos = -(n-1)*step;
var zpos = -(n-1)*step;
// vectors to define movement axes
var forward = vec4(); 
var sideways = vec4();
var up = vec4(0.0, 1.0, 0.0, 0.0);
// used for indexing to avoid collision and flip the maze
var ipos = 0;
var jpos = 0;
// view matrix controls
var look = mat4();
var flipped = false;


window.onload = function() {


    var gl = initialize();
    // create our maze object
    var maze = new Maze(gl, n);
    // three textures: floor, walls, ceiling
    initializeTexture(gl, gl.TEXTURE0, 'ground.png', function(){
        initializeTexture(gl, gl.TEXTURE1, 'brick.png', function() {
            initializeTexture(gl, gl.TEXTURE2, 'stone.png', function() {
                render(gl, maze)  
            })
        })
    });  
    

    // to allow key presses
    window.addEventListener('keydown', handleKeyDown, true);

    // check which key was pressed
    function handleKeyDown(event) {

        // turn left and right
        if (event.keyCode == 37) { // left arrow

            if (flipped) { // certain movement is inverted when maze is flipped
                yaw = (yaw + 5.0)%360.0;
            } else {
                yaw = (yaw - 5.0)%360.0;
            }
            render(gl, maze);
        } 
        else if (event.keyCode == 39) { // right arrow

            if (flipped) { // certain movement is inverted when maze is flipped
                yaw = (yaw - 5.0)%360.0;
            } else {
                yaw = (yaw + 5.0)%360.0;
            }

            render(gl, maze);
        }
        // look up and down
        else if (event.keyCode == 38) { // up arrow

            if (flipped) { // certain movement is inverted when maze is flipped
                pitch = (pitch + 2.0)%360.0
            } else {
                pitch = (pitch - 2.0)%360.0;
            }
            render(gl, maze);
        } 
        else if (event.keyCode == 40) { // down arrow

            if (flipped) { // certain movement is inverted when maze is flipped
                pitch = (pitch - 2.0)%360.0
            } else {
                pitch = (pitch + 2.0)%360.0
            }
            render(gl, maze);
        }
        // nothing right now
        else if (event.keyCode == 65) { // a

            if (flipped) { // certain movement is inverted when maze is flipped
                ipos = Math.floor((-(xpos+0.05*sideways[0])/step + n + 0.5));
                jpos = Math.floor((-(zpos+0.05*sideways[2])/step + n + 0.5));
                if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                    xpos += 0.05*sideways[0];
                    zpos += 0.05*sideways[2];
                }
            } else {
                ipos = Math.floor((-(xpos-0.05*sideways[0])/step + n + 0.5));
                jpos = Math.floor((-(zpos-0.05*sideways[2])/step + n + 0.5));
                if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                    xpos -= 0.05*sideways[0];
                    zpos -= 0.05*sideways[2];
                }
            }
            render(gl, maze);


        }
        else if (event.keyCode == 68) { // d

            if (flipped) { // certain movement is inverted when maze is flipped
                ipos = Math.floor((-(xpos-0.05*sideways[0])/step + n + 0.5));
                jpos = Math.floor((-(zpos-0.05*sideways[2])/step + n + 0.5));
                if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                    xpos -= 0.05*sideways[0];
                    zpos -= 0.05*sideways[2];
                }
            } else {
                ipos = Math.floor((-(xpos+0.05*sideways[0])/step + n + 0.5));
                jpos = Math.floor((-(zpos+0.05*sideways[2])/step + n + 0.5));
                if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                    xpos += 0.05*sideways[0];
                    zpos += 0.05*sideways[2];
                }
            }
            render(gl, maze);
        }
        // move forward and backward
        else if (event.keyCode == 87 && event.shiftKey) { // w and shift to sprint
            ipos = Math.floor((-(xpos+0.15*forward[0])/step + n + 0.5));
            jpos = Math.floor((-(zpos+0.15*forward[2])/step + n + 0.5));
            if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                xpos += 0.15*forward[0];
                zpos += 0.15*forward[2];
            }
            render(gl, maze);
        }
        else if (event.keyCode == 83) { // s

            ipos = Math.floor((-(xpos-0.05*forward[0])/step + n + 0.5));
            jpos = Math.floor((-(zpos-0.05*forward[2])/step + n + 0.5));
            if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                xpos -= 0.05*forward[0];
                zpos -= 0.05*forward[2];
            }
            render(gl, maze);
        }
        else if (event.keyCode == 87) { // w
            ipos = Math.floor((-(xpos+0.05*forward[0])/step + n + 0.5));
            jpos = Math.floor((-(zpos+0.05*forward[2])/step + n + 0.5));
            if (maze.mazeArray[jpos][ipos] != 0 && maze.mazeArray[jpos][ipos] != 1) {
                xpos += 0.05*forward[0];
                zpos += 0.05*forward[2];
            }
            render(gl, maze);
        }
        return false;
    }
}
    
// function to render the maze object
function render(gl, maze) {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // always rotate the view matrix 180 degrees if maze is flipped
    if (flipped) {
        look = mult(look, rotate(180.0, [0.0, 0.0, 1.0]));
    }
    // manipulate view matrix based on angling
    look = mult(look, rotate(pitch, [1.0, 0.0, 0.0]));
    look = mult(look, rotate(yaw, [0.0, 1.0, 0.0]));
    // calculate vectors of forward and sideways movement
    forward = normalize(look[2]);
    sideways = normalize(cross(forward, up));
    gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(look));
    // reset to blank matrix
    look = mat4();

    // translate based on model matrix
    var transform = mat4();
    transform = mult(transform, translate(xpos, -(step/2.0), zpos));
    gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(transform));

    // derive maze indices from real x, z decimal coordinates
    ipos = Math.floor((-xpos/step + n + 0.5));
    jpos = Math.floor((-zpos/step + n + 0.5));

    // if it's a teal (trap) tile, rotate the matrix 180 degrees
    if (maze.mazeArray[jpos][ipos] == 3) {

        maze.mazeArray[jpos][ipos] = "_";
        var i = 1.0;
        var repeat = setInterval(function() {rot()}, 10);

        function rot() {

            roll = 1.0*i;
            look = mult(look, rotate(roll, [0.0, 0.0, 1.0]));
            render(gl, maze);
            if (roll > 179.0) {
                stop();
            }
            i++;
        }
        
        function stop() {
            // invert status of flipped boolean
            if (flipped) {
                flipped = false;
            } else {
                flipped = true;
            }
            clearInterval(repeat);
        }
    }

    // draw the maze
    maze.draw();
}   

/*
 * Initialize the texture
 */
function initializeTexture(gl, textureid, filename, callback) {

    var texture = gl.createTexture();
    
    var image = new Image();
    
    image.onload = function() {

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(textureid);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        // looks better without mipmapping so I left it off
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        // gl.generateMipmap(gl.TEXTURE_2D);
        callback();
    }
    
    image.src = filename;
}

/*
 * Our standard initialization
 */
function initialize() {

    var canvas = document.getElementById('gl-canvas');
    
    // Use webgl-util.js to make sure we get a WebGL context
    var gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("Could not create WebGL context");
        return;
    }
    
    // set the viewport to be sized correctly
    gl.viewport(0,0, canvas.width, canvas.height);
    // set the clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // enable depth tests
    gl.enable(gl.DEPTH_TEST);
    
    
    // create program with our shaders and enable it
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // grab the handle to the model matrix and add it to gl
    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    
    // grab the handle to the view matrix and add it to gl
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    
    // Create the projection matrix and load it
    var projection = perspective(50, canvas.width/canvas.height, 0.01, 10);

    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));

    //set up the texture uniforms
    var u_FloorSampler = gl.getUniformLocation(gl.program, 'u_FloorSampler');
    gl.uniform1i(u_FloorSampler, 0);
    var u_WallSampler = gl.getUniformLocation(gl.program, 'u_WallSampler');
    gl.uniform1i(u_WallSampler, 1);
    var u_CeilingSampler = gl.getUniformLocation(gl.program, 'u_CeilingSampler');
    gl.uniform1i(u_CeilingSampler, 2);
    
    return gl;
}

/*
 * Generate a "perfect" maze using Prim's algorithm (mine isn't actually perfect)
 */
function generateMaze(n) {

    // 1. Create a grid of cells enclosed by walls
    var mazeArray = new Array(n);
    for (var i = 0; i < n; i++) {

        mazeArray[i] = new Array(n);
        for (var j = 0; j < n; j++) {
            // north, east, south, west walls
            mazeArray[i][j] = [0, 1, 2, 3];
        }
    }

    var frontier = []; // store frontier cells
    var inMaze = []; // store cells in maze
    var rand, i, j, index1, index2, north, east, south, west;
    // 2. Pick one of your cells, mark it as visited and add all of its neighbors to the frontier
    inMaze.push(0);
    frontier.push(1);
    frontier.push(n);
    // while there are cells in the frontier
    while (frontier.length > 0) {

        // remove a cell from the frontier at random
        rand = Math.floor( Math.random()*frontier.length );
        cell = frontier[rand];
        frontier.splice(rand, 1);
        inMaze.push(cell);

        // i, j are used as indices for the 2D arrays
        i = Math.floor(cell/n);
        j = cell%n;
        // neighboring cells
        north = cell-n;
        south = cell+n;
        east = cell+1;
        west = cell-1;
        
        // add its neighbors to the frontier if not already in frontier or maze
        if (i > 0 && inMaze.indexOf(north) == -1 && frontier.indexOf(north) == -1) {
            frontier.push(north);
        }
        if (i < n-1 && inMaze.indexOf(south) == -1 && frontier.indexOf(south) == -1) {
            frontier.push(south);
        }
        if (j > 0 && inMaze.indexOf(west) == -1 && frontier.indexOf(west) == -1) {
            frontier.push(west);
        }
        if (j < n-1 && inMaze.indexOf(east) == -1 && frontier.indexOf(east) == -1) {
            frontier.push(east);
        }

        // hierarchically find a cell in the maze that it connects back to
        for (var k = 0; k < inMaze.length; k++) {

            if (i - Math.floor(inMaze[k]/n) == 1 && j - inMaze[k]%n == 0) { // connect north

                index1 = mazeArray[i][j].indexOf(0);
                index2 = mazeArray[i-1][j].indexOf(2);
                if (mazeArray[i][j].length > 1 && mazeArray[i-1][j].length > 1) {
                    // remove wall between them
                    mazeArray[i][j].splice(index1, 1);
                    mazeArray[i-1][j].splice(index2, 1);
                }
            }
            else if (i - Math.floor(inMaze[k]/n) == 0 && j - inMaze[k]%n == -1) { // connect east

                index1 = mazeArray[i][j].indexOf(1);
                index2 = mazeArray[i][j+1].indexOf(3);
                if (mazeArray[i][j].length > 1 && mazeArray[i][j+1].length > 1) {
                    // remove wall between them
                    mazeArray[i][j].splice(index1, 1);
                    mazeArray[i][j+1].splice(index2, 1);
                }
            }
            else if (i - Math.floor(inMaze[k]/n) == 1 && j - inMaze[k]%n == 0) { // connect south

                index1 = mazeArray[i][j].indexOf(2);
                index2 = mazeArray[i+1][j].indexOf(0);
                if (mazeArray[i][j].length > 1 && mazeArray[i+1][j].length > 1) {
                    // remove wall between them
                    mazeArray[i][j].splice(index1, 1);
                    mazeArray[i+1][j].splice(index2, 1);
                }
            }
            else if (i - Math.floor(inMaze[k]/n) == 0 && j - inMaze[k]%n == 1) { // connect west

                index1 = mazeArray[i][j].indexOf(3);
                index2 = mazeArray[i][j-1].indexOf(1);
                if (mazeArray[i][j].length > 1 && mazeArray[i][j-1].length > 1) {
                    // remove wall between them
                    mazeArray[i][j].splice(index1, 1);
                    mazeArray[i][j-1].splice(index2, 1);
                }
            }
        }
    }


    // convert maze to full size by adding (potential) walls in between corridors
    var side = 2*n+1;
    var newArray = new Array(side);
    for (i = 0; i < newArray.length; i++) {
        newArray[i] = new Array(side);
    }
    var string = "";
    for (i = 0; i < side; i++) {
        for (j = 0; j < side; j++) {
            newArray[i][j] = "1";
        }
    }
    var k = 1;
    var l = 1;
    for (i = 0; i < n; i++) {
        l = 1;
        for (j = 0; j < n; j++) {
            if (mazeArray[i][j].indexOf(0) != -1) {
                newArray[k-1][l] = 0;
            } else if (i > 0) {
                newArray[k-1][l] = "_";
            }
            if (mazeArray[i][j].indexOf(1) != -1) {
                newArray[k][l+1] = 0;
            } else if (j < n - 1) {
                newArray[k][l+1] = "_";
            }
            if (mazeArray[i][j].indexOf(2) != -1) {
                newArray[k+1][l] = 0;
            } else if (i < n - 1) {
                newArray[k+1][l] = "_";
            }
            if (mazeArray[i][j].indexOf(3) != -1) {
                newArray[k][l-1] = 0;
            } else if (j > 0) {
                newArray[k][l-1] = "_";
            }
            newArray[k][l] = "_";
            l += 2;
        }
        k += 2;
    }
    
    // eliminate 'islands'. I was getting a problem with this
    for (i = 0; i < side; i++) {
        for (j = 0; j < side; j++) {

            if (newArray[i][j] == 1 && i > 0 &&
                newArray[i-1][j] == "_" && i < side-1 &&
                newArray[i+1][j] == "_" && j > 0 &&
                newArray[i][j-1] == "_" && j < side-1 &&
                newArray[i][j+1] == "_") {

                rand = Math.floor(Math.random()*2);
                if (rand == 0) {
                    newArray[i-1][j] = 0;
                } else {
                    newArray[i+1][j] = 0;
                }
            }
        }
    }

    newArray[0][1] = "_"; // exit cell
    for (var i = 0; i < 4; i++) {
        var randi = 0;
        var randj = 0;
        while (newArray[randi][randj] != "_") {
            randi = Math.floor(Math.random()*side);
            randj = Math.floor(Math.random()*side);
        }
        newArray[randi][randj] = 3; // teal square for maze flipping
    }

    // print maze for debugging/guidance
    for (i = 0; i < side; i++) {
        for (j = 0; j < side; j++) {
            string += newArray[i][j] + " ";
            if ((j+1)%(side) == 0) {
                string += "\n";
            }
        }
    }
    console.log(string);
    
    return newArray;
}


/*
 * Build the vertices for the maze
 */
function Maze(gl, n) {

    // initialize the shape
    
    var vertices = [];
    var indices = [];
    var normals = [];
    var textureCoordinates = [];
    var n = n;
    var side = 2*n+1; // side length of maze

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var texBuffer = gl.createBuffer();
    if (!texBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var normalBuffer = gl.createBuffer();
    if (!normalBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    
    /*
     * Build a floor at the specified location
     */
    function buildFloor(i, j, ceiling, teal) {

        var height;
        var normy = 0.0;
        var normz = 0.0;
        if (ceiling) {
            height = step;
            normy = -1.0;
        } else {
            height = 0.0;
            normy = 1.0;
        }

        if (teal) {
            normy = 1/Math.sqrt(2.0);
            normz = 1/Math.sqrt(2.0);
        }

        // first triangle
        vertices.push(initial + j*step);
        vertices.push(height);
        vertices.push(initial + i*step);

        vertices.push(initial + (j+1)*step);
        vertices.push(height);
        vertices.push(initial + i*step);

        vertices.push(initial + j*step);
        vertices.push(height);
        vertices.push(initial + (i+1)*step);

        // second triangle
        vertices.push(initial + (j+1)*step);
        vertices.push(height);
        vertices.push(initial + i*step);

        vertices.push(initial + (j+1)*step);
        vertices.push(height);
        vertices.push(initial + (i+1)*step);

        vertices.push(initial + j*step);
        vertices.push(height);
        vertices.push(initial + (i+1)*step);

        // texture coordinates
        textureCoordinates.push(0.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(0.0);        

        // normals
        for (var i = 0; i < 6; i++) {
            normals.push(0.0);
            normals.push(normy);
            normals.push(normz);
        }
    }

    /*
     * Build a wall at a specified location
     */
    function buildWall (i, j, direction) {

        var scalars = new Array(12);
        for (var k = 0; k < 12; k++) {
            scalars[k] = 0;
        }
        x = 0.0;
        y = 0.0;
        z = 0.0;
        // set appropriate displacement coefficients and normal components
        if (direction == "north") {
            scalars[8] = 1;
            scalars[10] = 1;
            scalars[11] = 1;
            z = 1.0;
        } else if (direction == "east") {
            scalars[2] = 1;
            scalars[4] = 1;
            scalars[5] = 1;
            scalars[6] = 1;
            scalars[7] = 1;
            scalars[8] = 1;
            scalars[9] = 1;
            scalars[10] = 1;
            scalars[11] = 1;
            x = -1.0;
        } else if (direction == "south") {
            scalars[0] = 1;
            scalars[1] = 1;
            scalars[2] = 1;
            scalars[3] = 1;
            scalars[4] = 1;
            scalars[5] = 1;
            scalars[8] = 1;
            scalars[10] = 1;
            scalars[11] = 1;
            z = -1.0;
        } else if (direction == "west") {
            scalars[2] = 1;
            scalars[4] = 1;
            scalars[5] = 1;
            x = 1.0;
        }

        // first triangle
        vertices.push(initial + (j+scalars[6])*step);
        vertices.push(0.0);
        vertices.push(initial + (i+scalars[0])*step);

        vertices.push(initial + (j+scalars[7])*step);
        vertices.push(step);
        vertices.push(initial + (i+scalars[1])*step);

        vertices.push(initial + (j+scalars[8])*step);
        vertices.push(0.0);
        vertices.push(initial + (i+scalars[2])*step);

        // second triangle
        vertices.push(initial + (j+scalars[9])*step);
        vertices.push(step);
        vertices.push(initial + (i+scalars[3])*step);

        vertices.push(initial + (j+scalars[10])*step);
        vertices.push(step);
        vertices.push(initial + (i+scalars[4])*step);

        vertices.push(initial + (j+scalars[11])*step);
        vertices.push(0.0);
        vertices.push(initial + (i+scalars[5])*step);

        // normals
        for (var i = 0; i < 6; i++) {
            normals.push(x);
            normals.push(y);
            normals.push(z);
        }

        // texture coordinates
        textureCoordinates.push(0.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(1.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(0.0);        
        textureCoordinates.push(0.0);        

    }
     
    vertices = [];
    indices = [];
    normals = [];

    this.mazeArray = generateMaze(n);

    for (var i = 0; i < side; i++) {

        for (var j = 0; j < side; j++) {

            var curCell = this.mazeArray[i][j];
            if (curCell == 3) {
                buildFloor(i, j, false, true);
                buildFloor(i, j, true, true);
            }
            if (curCell == "_") {
                buildFloor(i, j, false, false);
                buildFloor(i, j, true, false);
            }
            if (i > 0 && (curCell == "_" || curCell == 3) && (this.mazeArray[i-1][j] == 0 || this.mazeArray[i-1][j] == 1)) {
                buildWall(i, j, "north");
            }
            if (j < side-1 && (curCell == "_" || curCell == 3) && (this.mazeArray[i][j+1] == 0 || this.mazeArray[i][j+1] == 1)) {
                buildWall(i, j, "east");
            }
            if (i < side-1 && (curCell == "_" || curCell == 3) && (this.mazeArray[i+1][j] == 0 || this.mazeArray[i+1][j] == 1)) {
                buildWall(i, j, "south");
            }
            if (j > 0 && (curCell == "_" || curCell == 3) && (this.mazeArray[i][j-1] == 0 || this.mazeArray[i][j-1] == 1)) {
                buildWall(i, j, "west");
            }
        }
    }
    
    for (var i = 0; i < vertices.length/3; i++) {

        indices.push(i);
    }

    // convert to our flat form
    indices = new Uint16Array(indices);
   
    // Load the vertices into the VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // load up the normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    // load up the texture buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordinates), gl.STATIC_DRAW);
    
    // load up the index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get storage location');
        return -1;
    }
    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get storage location');
        return -1;
    }
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get storage location');
        return -1;
    }

    // uniforms for lighting information
    gl.u_Ambient = gl.getUniformLocation(gl.program, 'u_Ambient');
    gl.uniform3fv(gl.u_Ambient, vec3(0.15, 0.15, 0.15));
    gl.u_Diffuse = gl.getUniformLocation(gl.program, 'u_Diffuse');
    gl.uniform3fv(gl.u_Diffuse, vec3(0.9, 0.9, 0.9));

    /*
     * This method is called when we want to draw the shape.
     */
    this.draw = function() {

        // Set the association for the position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // set association for the normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // set association for the texture attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_TexCoord);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
}