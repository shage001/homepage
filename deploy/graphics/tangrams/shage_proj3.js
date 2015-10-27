// Produce tangram pictures
// Sam Hage
// 3/6/15

// global stack to hold a copy of the transformations to be applied to the whole shape
// current transformation is pushed/popped before modifying it for the current tangram
var stack = new Array();
// global matrix for the current transformation
// initially equal to I
var transform = mat4(1.0);
// global vector representing the z-axis (for all 2d rotations)
var z = [0.0, 0.0, 1.0];
// global vectors for y- and x- axes for reflections
var y = [0.0, 1.0, 0.0];
var x = [1.0, 0.0, 0.0];

window.onload = function main(menu) {
    
    var gl = initialize();
    square(gl);
}

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
    
    // set the background or clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    
    // create program with our shaders and enable it
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.program = program;

    // specify a single triangle
    var vertices = new Float32Array([
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
    ]);
    
    // create the buffer and load it with the vertex data
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    

    // get the attribute for position
    var a_Position = gl.getAttribLocation(program, "a_Position");

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(a_Position);

    gl.clear(gl.COLOR_BUFFER_BIT); // don't put this before every draw call this time    

    return gl;
}

// pusht() and popt() hide matrix interaction from the rest of the program

// pushes the current transformation onto the stack
function pusht() {

    stack.push(transform);
}

// pops the matrix from the stack into the current transformation spot
function popt() {

    transform = stack.pop();
}

// individual tangram drawing functions---------------------------------

// draw the first big triangle
function drawBig1(gl, transform) {

    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 1.0, 1.0, 0.69, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// draw the second big triangle
function drawBig2(gl, transform) {

    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 0.55, 0.83, 0.78, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// draw the medium triangle
function drawMedium(gl, transform) {

    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 0.75, 0.73, 0.85, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// draw the first small triangle
function drawSmall1(gl, transform) {

    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 0.98, 0.5, 0.45, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// draw the second small triangle
function drawSmall2(gl, transform) {

    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 0.5, 0.7, 0.83, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// draw the square
function drawSquare(gl, transform) {

    // first triangle
    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 0.99, 0.7, 0.38, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // second triangle
    transform = mult(mult(transform, translate(1.0, 1.0, 0.0)), rotate(180.0, z));
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);

}

// draw the parallelogram
function drawGram(gl, transform) {

    // first triangle
    var u_Color = gl.getUniformLocation(program, "u_Color");
    gl.uniform4f(u_Color, 0.7, 0.87, 0.41, 1.0);

    var u_Matrix = gl.getUniformLocation(program, 'u_Matrix');
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // second triangle
    transform = mult(mult(transform, translate(0.0, 1.0, 0.0)), rotate(180.0, z));
    gl.uniformMatrix4fv(u_Matrix, false, flatten(transform));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// larger shape functions-----------------------------------------------

// draw the square pattern
function square(gl) {

    // make sure current transformation is I again, since the square needs
    // no global transformations
    transform = mat4(1.0);

    // draw the first big triangle
    pusht();
    transform = rotate(135.0, z);
    drawBig1(gl, transform);

    // draw the second big triangle
    popt();
    pusht();
    transform = rotate(45.0, z);
    drawBig2(gl, transform);

    // draw the medium triangle
    popt();
    pusht();
    transform = mult(mult(translate(0.7071, -0.7071, 0.0), scale(0.7071, 0.7071, 1.0)), rotate(90.0, z));
    drawMedium(gl, transform);

    // draw the first small triangle
    popt();
    pusht();
    transform = mult(scale(0.5, 0.5, 1.0), rotate(225.0, z));
    drawSmall1(gl, transform);

    // draw the second small triangle
    popt();
    pusht();
    transform = mult(mult(translate(0.3536, 0.3536, 0.0), scale(0.5, 0.5, 1.0)), rotate(315.0, z));
    drawSmall2(gl, transform);

    // draw the square
    popt();
    pusht();
    transform = mult(mult(translate(0.3536, -0.3536, 0.0), scale(0.5, 0.5, 1.0)), rotate(45.0, z));
    drawSquare(gl, transform);

    // draw the parallelogram
    popt();
    pusht();
    transform = mult(mult(translate(0.0, -0.7071, 0.0), scale(0.5, 0.5, 1.0)), rotate(45.0, z));
    drawGram(gl, transform);

    popt();
}

// draw the cat pattern
function cat(gl) {

    // current transform will be a scale down for the whole cat shape
    transform = mult(transform, scale(0.6, 0.6, 1.0));

    // draw the first big triangle
    pusht();
    transform = mult(mult(transform, translate(0, -1.0, 0.0)), rotate(90.0, z));
    drawBig1(gl, transform);

    // draw the second big triangle
    popt();
    pusht();
    transform = mult(transform, rotate(135.0, z));
    drawBig2(gl, transform);

    // draw the medium triangle
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(-1.2071, 0.2071, 0.0)), scale(0.7071, 0.7071, 1.0)), rotate(315.0, z));
    drawMedium(gl, transform);

    // draw the first small triangle
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(-0.8839, 1.2375, 0.0)), scale(0.5, 0.5, 1.0)), rotate(315.0, z));
    drawSmall1(gl, transform);

    // draw the second small triangle
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(-0.8839, 1.2375, 0.0)), scale(0.5, 0.5, 1.0)), rotate(135.0, z));
    drawSmall2(gl, transform);

    // draw the square
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(-0.8839, 1.2375, 0.0)), scale(0.5, 0.5, 1.0)), rotate(225.0, z));
    drawSquare(gl, transform);

    // draw the parallelogram
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(0.5, -0.5, 0.0)), scale(0.5, 0.5, 1.0)), rotate(180.0, x));
    drawGram(gl, transform);

    transform = mat4(1.0);
    pusht();
}

// draw the rabbit pattern
function rabbit(gl) {

    // current transform will be a scale down for the whole rabbit shape
    transform = mult(mult(transform, scale(0.6, 0.6, 1.0)), translate(-1.0, -0.5, 0.0));

    // draw the first big triangle
    pusht();
    transform = mult(transform, translate(0, -1.0, 0.0));
    drawBig1(gl, transform);

    // draw the second big triangle
    popt();
    pusht();
    transform = mult(transform, rotate(315.0, z));
    drawBig2(gl, transform);

    // draw the medium triangle
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(0.2071, 1.374, 0.0)), scale(0.7071, 0.7071, 1.0)), rotate(315.0, z));
    drawMedium(gl, transform);

    // draw the first small triangle
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(1.0607, 0.0, 0.0)), scale(0.5, 0.5, 1.0)), rotate(135.0, z));
    drawSmall1(gl, transform);

    // draw the second small triangle
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(0.7071, -0.3536, 0.0)), scale(0.5, 0.5, 1.0)), rotate(315.0, z));
    drawSmall2(gl, transform);

    // draw the square
    popt();
    pusht();
    transform = mult(mult(transform, translate(0.7071, 0.54, 0.0)), scale(0.5, 0.5, 1.0));
    drawSquare(gl, transform);

    // draw the parallelogram
    popt();
    pusht();
    transform = mult(mult(mult(transform, translate(1.1607, 1.47, 0.0)), scale(0.5, 0.5, 1.0)), rotate(240.0, z));
    drawGram(gl, transform);

    transform = mat4(1.0);
    pusht();
}

// handles the selection from the HTML dropdown
function handleMenu(menu) {
    var gl = initialize();
    if (menu.value === 'cat') {
        cat(gl);
    } else if (menu.value === 'square') {
        square(gl);
    } else if (menu.value === 'rabbit') {
        rabbit(gl);
    }
}