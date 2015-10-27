// Draw a Mandelbrot fractal
// Sam Hage
// 2/27/15

window.onload = function main() {
    
    initialize();
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // create program with our shaders and enable it
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var x = -0.5;
    var y = 0.0;
    var scale = 1.0;
    

    var vertices = generate(gl, x, y, scale);
    render(gl, vertices);

    canvas.oncontextmenu = function(ev) {
        ev.preventDefault();
    };

    canvas.onmousedown = function(ev) {
        // the x and y are in browser space, so we want to
        // convert them to canvas space using the bounding rect
        var new_x = ev.clientX;
        var new_y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();

        x += (new_x - rect.right/2)/(rect.right/2);
        y -= (new_y - rect.bottom/2)/(rect.bottom/2);

        switch (ev.which) {
            case 1:
                scale *= 0.9;
                break;
            case 3:
                scale *= 1.1;
                break;
            default:
                break;
        }

        vertices = generate(gl, x, y, scale);
        render(gl, vertices);
    }
}


function generate(gl, x, y, scale) {

    // Define points to draw
    // We have switched to the special Float32Array so we can send raw data
    // note that we have packed the attributes for each vertex together x1,y1,r1,g1,b1
  
    var vertices = new Float32Array([
       1.0,  1.0,    0.0, 0.0, 0.0, // point 1
      -1.0,  1.0,    0.0, 0.0, 0.0, // point 2
       1.0, -1.0,    0.0, 0.0, 0.0, // point 3
      -1.0, -1.0,    0.0, 0.0, 0.0 // point 4

    ]);
     
    // create the buffer and load it
    
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // note that we aren't flattening this any more because we don't have a list of vecs
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    

    // grab a reference to the position attribute
    var a_Position = gl.getAttribLocation(program, "a_Position");
    
    // get the size of the elements of the buffer (which we know is 32 bits)
    var FSIZE = vertices.BYTES_PER_ELEMENT;
    
    // tell the system how to extract position data from the buffer
    // note that we have added the stride, the number of bytes that makes up a single vertex, because
    // we aren't just grabbing two floats and moving on any more
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 5*FSIZE, 0);
    gl.enableVertexAttribArray(a_Position);
  
  

    // grab a reference to the color attribute
    var a_Color = gl.getAttribLocation(program, "a_Color");
    
    // extract the color information from the buffer
    // the stride stays the same, but now we set the offset, to tell it to skip the x and y values
    // and jump to the color
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 5*FSIZE, 2*FSIZE);
    gl.enableVertexAttribArray(a_Color);


    // set the center
    var u_Center = gl.getUniformLocation(program, "u_Center");
    gl.uniform2f(u_Center, x, y);

    var u_Scale = gl.getUniformLocation(program, "u_Scale");
    gl.uniform1f(u_Scale, scale);

    return vertices;
}


function render(gl, vertices) {
   
    // set the background or clear color
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    // clear the context for new content
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // tell the GPU to draw the a rectangle using four points
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}