/*
 * shage_proj5.js
 * 
 * A polygon mesh to display a simple height field
 *
 * Sam Hage
 * 3/15
 *
 * Cool stuff: use arrow keys to control the camera; dynamic functions
 *
 */


var zoom = 1.0; // factor to control zooming
var angle = 0.0; // angle of mesh orientation
var angle2 = 0.0;

window.onload = function() {

    var gl = initialize();    

    // create sliders, displays, and menus
    var r_slider = document.getElementById('rowSlider');
    var c_slider = document.getElementById('colSlider');
    var r_display = document.getElementById('rowDisplay');
    var c_display = document.getElementById('colDisplay');
    var rows = parseInt(r_slider.value);
    var cols = parseInt(c_slider.value);
    var menu = document.getElementById('renderMenu');
    var type = menu.value;
    var f_menu = document.getElementById('functionsMenu');
    var func = f_menu.value;

    // set the polygon offset
    gl.polygonOffset(1.0, 1.0);
    
    // create our mesh object
    var mesh = new Mesh(gl, rows, cols, "function1");
    
    // control sliders, displays, and menus
    r_slider.oninput = function() {
        mesh.rows = parseInt(r_slider.value);
        r_display.value = mesh.rows;
        mesh.setSteps(mesh.rows, mesh.cols, func);
        render();
    }
    c_slider.oninput = function() {
        mesh.cols = parseInt(c_slider.value);
        c_display.value = mesh.cols;
        mesh.setSteps(mesh.rows, mesh.cols, func);
        render();
    }
    r_display.onchange = function() {
        mesh.rows = parseInt(r_display.value);
        r_slider.value = mesh.rows;
        mesh.setSteps(mesh.rows, mesh.cols, func);
        render();
    }
    c_display.onchange = function() {
        mesh.cols = parseInt(c_display.value);
        c_slider.value = mesh.cols;
        mesh.setSteps(mesh.rows, mesh.cols, func);
        render();
    }
    menu.onchange = function() {
        type =  menu.value;
        render();
    }
    f_menu.onchange = function() {
        func =  f_menu.value;
        mesh.setSteps(mesh.rows, mesh.cols, func);
        render();
    }

    // to allow key presses
    window.addEventListener('keydown', handleKeyDown, true);
    
    // check which key was pressed
    function handleKeyDown(ev) {

        if (ev.keyCode == 39) { // right arrow
            angle = (angle - 1.5) % 360;
            render();
        }
        else if (event.keyCode == 37) { // left arrow
            angle = (angle + 1.5) % 360;
            render();
        } 
        else if (ev.keyCode == 38) { // up arrow
            angle2 = (angle2 - 1.5) % 360;
            render();
        } 
        else if (event.keyCode == 40) { // down arrow
            angle2 = (angle2 + 1.5) % 360;
            render();
        }
        else if (event.keyCode == 88) { // x
            zoom = zoom + 0.1;
            render();
        }
        else if (event.keyCode == 90) { // z
            zoom = zoom - 0.1;
            render();
        }
        ev.preventDefault();
        return false;
    }
    
    // function to render the mesh object
    var render = function() {
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // set the camera view using zoom
        var transform = lookAt(vec3(0, zoom*1.5, zoom*3), vec3(0,0,0), vec3(0,1,0));
        gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(transform));

        // rotate the model matrix
        var rotation = rotate(angle, [0.0, 1.0, 0.0]);
        rotation = mult(rotate(angle2, [1.0, 0.0, 0.0]), rotation);
        gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(rotation));
    
        // draw the mesh
        mesh.draw(type);
    }   
    
    render();
}


/*
 * Our standard initialization.
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
    var projection = perspective(50, canvas.width/canvas.height, .5, 10);

    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));
    
    return gl;
}

/*
 * Build the vertices for the mesh
 */
function Mesh(gl, rows, cols, func) {

    /* Initialize the shape */
    
    var vertices = [];
    var indices = [];
    var rows = rows;
    var cols = cols;
    
    
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
    
    /*
     * This function initializes the object. It does all of the grunt work computing all of the
     * points and indices. This has been made a function to make this object mutable. We can
     * decide we want to change the number of points and recalculate the shape.
     */ 
    this.setSteps = function(rows, cols, func) {
     
        this.rows = rows;
        this.cols = cols;
        vertices = [];
        indices = [];

        var initial = -1.0 // starting point for mesh corner
        var x, y, z;
        var rowStep = (2*-initial)/(this.rows-1); // separation between rows and columns
        var colStep = (2*-initial)/(this.cols-1);
        var k = 0;

        for (var i = 0; i < this.rows; i++) {

            for (var j = 0; j < this.cols; j++) {

                x = initial + j*(colStep);
                z = initial + i*(rowStep);
                if (func == "function1") {
                    y = (Math.sin(Math.pow(x*4.0, 2) + Math.pow(z*4.0, 2)))*.05;
                } else if (func == "function2") {
                    y = Math.pow(x, 2) - Math.pow(z, 2);
                } else if (func == "function3") {
                    y = Math.cos(Math.abs(x)+Math.abs(z))*(Math.abs(x)+Math.abs(z));
                } else {
                    y = Math.floor(Math.pow(Math.E,(Math.abs((x*z))+Math.round(1/Math.cos((x*z)))))) - 3.0;
                }

                vertices.push(x);
                vertices.push(y);
                vertices.push(z);
                indices.push(k); // add row-order indices
                k++;
            }
        }
        
        for (i = 0; i < this.cols; i++) {

            for (j = 0; j < this.rows; j++) {

                indices.push(j*this.cols + i); // add column-order indices
            }
        }

        for (i = 0; i < this.cols-1; i++) {

            for (j = 0; j < this.rows; j++) {

                // add skin-order vertices
                indices.push(i + j*cols);
                indices.push(i + j*cols+1);
            }
        }

        // convert to our flat form
        indices = new Uint16Array(indices);
       
        // Load the vertices into the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        
        // load up the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }


    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get storage location');
        return -1;
    }

    var v_Height = gl.getAttribLocation(gl.program, 'v_Height');
    if (a_Position < 0) {
        console.log('Failed to get storage location');
        return -1;
    }    
    gl.u_Grid = gl.getUniformLocation(gl.program, 'u_Grid');

    /*
     * This method is called when we want to draw the shape.
     */
    this.draw = function(type) {


        // need to rebind the array buffer to the appropriate VBO in cse some other buffer has been made active
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
        // Set the association for the position attribute
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        // booleans to control what is drawn
        var point = false;
        var grid = false;
        var skin = false;

        if (type == "full") {
            grid = true;
            skin = true;
        } else if (type == "skin") {
            skin = true;
        } else if (type == "grid") {
            grid = true;
        } else {
            point = true;
        }

        var FSIZE = indices.BYTES_PER_ELEMENT; // size of each index element
        var offset = this.rows*this.cols; // number of individual points in grid

        // draw the shape
        if (point) {
        
            gl.uniform1i(gl.u_Grid, 1.0);
            gl.drawElements(gl.POINTS, indices.length, gl.UNSIGNED_SHORT, 0);
        }
        
        if (grid) {

            gl.uniform1i(gl.u_Grid, 1.0);
            for (var i = 0; i < this.rows; i++) {

                gl.drawElements(gl.LINE_STRIP, this.cols, gl.UNSIGNED_SHORT, i*this.cols*FSIZE);
            }

            for (i = 0; i < this.cols; i++) {

                gl.drawElements(gl.LINE_STRIP, this.rows, gl.UNSIGNED_SHORT, (offset + i*this.rows)*FSIZE);
            }
       
        } 

        if (skin) { // skin

            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.uniform1i(gl.u_Grid, 0.0);

            for (i = 0; i < this.cols-1; i++) {
                gl.drawElements(gl.TRIANGLE_STRIP, this.rows*2, gl.UNSIGNED_SHORT, 2*(offset + i*this.rows)*FSIZE);
            }
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
    }
    
    // call the initialization function to jumpstart this object
    this.setSteps(rows, cols, func);
    
}