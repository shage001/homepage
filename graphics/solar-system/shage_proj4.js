/*
 * shage_proj4.js
 * 
 * A solar system of shapes
 *
 * Sam Hage
 * 3/15
 */

var ANGLE_STEP = 45; // used to increment the angles and rotate/orbit shapes
const FSIZE = 4; // the size of the values we are sending to the VBO
// global vectors for axes
var x = [1.0, 0.0, 0.0];
var y = [0.0, 1.0, 0.0];
var z = [0.0, 0.0, 1.0];
// manage zooming in and out
var zoom = 0.0;

// to allow key presses
window.addEventListener('keydown', handleKeyDown, true);

// check which key was pressed, then add or subtract the zoom
function handleKeyDown(ev) {
    if (ev.keyCode == 38) {
        zoom = zoom - 2.0;
    }
    else if (event.keyCode == 40) {
        zoom = zoom + 2.0;
    }
}

// vertices for the "pyramid" shape
var pyramid_vertices = new Float32Array([

         0.0, 1.0, 0.0,   0.2, 0.2, 1.0,   // front face                         
        -1.0, 0.0, 1.0,   1.0, 0.2, 0.2,                            
         1.0, 0.0, 1.0,   0.2, 1.0, 0.2,
         
         0.0, 1.0, 0.0,   0.2, 0.2, 1.0,   // right face                         
         1.0, 0.0, 1.0,   1.0, 0.2, 0.2,                            
         0.0, 0.0, -1.0,  0.2, 1.0, 0.2,
        
         0.0, 1.0, 0.0,   0.2, 0.2, 1.0,   // left face                         
        -1.0, 0.0, 1.0,   1.0, 0.2, 0.2,                            
         0.0, 0.0, -1.0,  0.2, 1.0, 0.2,

        -1.0, 0.0, 1.0,   0.2, 0.2, 1.0,   // bottom face                       
         1.0, 0.0, 1.0,   1.0, 0.2, 0.2,
         0.0, 0.0, -1.0,  0.2, 1.0, 0.2
                                     
    ]);

// vertices for the diamond
var diamond_vertices = new Float32Array([

         0.0, 1.0, 0.0,   1.0, 0.6, 0.2,   // front-top face                         
        -1.0, 0.0, 1.0,   0.98, 0.32, 0.11,                            
         1.0, 0.0, 1.0,   0.98, 0.32, 0.11,
         
         0.0, -1.0, 0.0,   0.7, 1.0, 0.7,   // front-bottom face                         
        -1.0, 0.0, 1.0,   0.17, 0.46, 0.66,                            
         1.0, 0.0, 1.0,   0.17, 0.46, 0.66,


         0.0, 1.0, 0.0,   0.7, 1.0, 0.7,   // right-top face                         
         1.0, 0.0, 1.0,   0.17, 0.46, 0.66,                            
         1.0, 0.0, -1.0,  0.17, 0.46, 0.66,

         0.0, -1.0, 0.0,   1.0, 0.6, 0.2,   // right-bottom face                         
         1.0, 0.0, 1.0,   0.98, 0.32, 0.11,                            
         1.0, 0.0, -1.0,  0.98, 0.32, 0.11,

         
         0.0, 1.0, 0.0,   1.0, 0.6, 0.2,   // back-top face                         
         1.0, 0.0, -1.0,  0.98, 0.32, 0.11,                            
        -1.0, 0.0, -1.0,  0.98, 0.32, 0.11,

        0.0, -1.0, 0.0,   0.7, 1.0, 0.7,   // back-bottom face                         
         1.0, 0.0, -1.0,  0.17, 0.46, 0.66,                            
        -1.0, 0.0, -1.0,  0.17, 0.46, 0.66,

        
         0.0, 1.0, 0.0,   0.7, 1.0, 0.7,   // left-top face                         
        -1.0, 0.0, 1.0,   0.17, 0.46, 0.66,                            
        -1.0, 0.0, -1.0,  0.17, 0.46, 0.66,

         0.0, -1.0, 0.0,   1.0, 0.6, 0.2,   // left-bottom face                         
        -1.0, 0.0, 1.0,   0.98, 0.32, 0.11,                            
        -1.0, 0.0, -1.0,  0.98, 0.32, 0.11,                      
    ]);

// vertices for the cube
var cube_vertices  = new Float32Array([

          1.0,  1.0,  1.0,  1.0, 1.0, 1.0, // front face
         -1.0,  1.0,  1.0,  1.0, 0.0, 1.0,
         -1.0, -1.0,  1.0,  0.0, 0.0, 1.0,
          1.0,  1.0,  1.0,  1.0, 1.0, 1.0,
         -1.0, -1.0,  1.0,  0.0, 0.0, 1.0,
          1.0, -1.0,  1.0,  0.0, 1.0, 1.0,

          1.0,  1.0,  1.0,  1.0, 1.0, 1.0, // right face
          1.0, -1.0, -1.0,  0.0, 1.0, 0.0,
          1.0,  1.0, -1.0,  1.0, 1.0, 0.0,
          1.0,  1.0,  1.0,  1.0, 1.0, 1.0,
          1.0, -1.0,  1.0,  0.0, 1.0, 1.0,
          1.0, -1.0, -1.0,  0.0, 1.0, 0.0,

         -1.0,  1.0,  1.0,  1.0, 0.0, 1.0, // left face
         -1.0,  1.0, -1.0,  1.0, 0.0, 0.0,
         -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,
         -1.0,  1.0,  1.0,  1.0, 0.0, 1.0,
         -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,
         -1.0, -1.0,  1.0,  0.0, 0.0, 1.0,
           
          1.0,  1.0,  1.0,  1.0, 1.0, 1.0, // top face
          1.0,  1.0, -1.0,  1.0, 1.0, 0.0,
         -1.0,  1.0, -1.0,  1.0, 0.0, 0.0,
          1.0,  1.0,  1.0,  1.0, 1.0, 1.0,
         -1.0,  1.0, -1.0,  1.0, 0.0, 0.0,
         -1.0,  1.0,  1.0,  1.0, 0.0, 1.0,

          1.0, -1.0,  1.0,  0.0, 1.0, 1.0, // bottom face
         -1.0, -1.0,  1.0,  0.0, 0.0, 1.0,
         -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,
          1.0, -1.0,  1.0,  0.0, 1.0, 1.0,
         -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,
          1.0, -1.0, -1.0,  0.0, 1.0, 0.0,

          1.0,  1.0, -1.0,  1.0, 1.0, 0.0, // back face
          1.0, -1.0, -1.0,  0.0, 1.0, 0.0,
         -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,
          1.0,  1.0, -1.0,  1.0, 1.0, 0.0,
         -1.0, -1.0, -1.0,  0.0, 0.0, 0.0,
         -1.0,  1.0, -1.0,  1.0, 0.0, 0.0
    ]);

window.onload = function() {
    var gl = initialize();    
    
    // create the shapes
    // arguments are (gl object, vertices, sun boolean, rate of rotation, start angle, rotation axis, size, orbit radius, orbit axis, orbit speed)
    var sun = new Shape(gl, diamond_vertices, true, 0.5, 0, null, null, null, null, null); // sun doesn't need these last ones
    var cube_planet  = new Shape(gl, cube_vertices, false, 1.0, 0, z, 0.3, 2.0, [0.5, 0.5, 0.0], 1.0);
    var pyramid_planet = new Shape(gl, pyramid_vertices, false, 1.0, 0, y, 0.5, 3.5, [0.0, 0.5, 0.5], 1.0);
    var cube_moon1 = new Shape(gl, cube_vertices, false, 2.0, 0, x, 0.1, 2.0, x, 2.0);
    var cube_moon2 = new Shape(gl, cube_vertices, false, 2.0, 0, x, 0.1, 2.0, y, 2.0);
    var cube_moon3 = new Shape(gl, cube_vertices, false, 2.0, 0, x, 0.1, 2.0, z, 2.0);
    var pyramid_moon1 = new Shape(gl, pyramid_vertices, false, 2.0, 0, x, 0.6, 3.0, x, 2.0);

    // add dependents to the sun, and moons to the dependents
    pyramid_planet.add(cube_moon1);
    pyramid_planet.add(cube_moon2);
    pyramid_planet.add(cube_moon3);
    cube_planet.add(pyramid_moon1);
    sun.add(cube_planet);
    sun.add(pyramid_planet);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set the camera view
    var transform = lookAt(vec3(-5, 3, 3), vec3(0,0,0), vec3(0,1,0));
    gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(transform));
  
    // send the current transform down to the graphics card
    gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));
    var currentAngle = 0;

    var zoomFactor;
    var tick = function() {

        // clear the buffers
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // draw the sun and all its dependents
        sun.update();
        sun.draw();

        zoomFactor = 70 + zoom;
        // make sure camera doesn't zoom too far in or out
        if (zoomFactor > 180.0) {
            zoomFactor = 180.0;
        }
        if (zoomFactor < 2.0) {
            zoomFactor = 2.0;
        }
        // set projection based on zoom
        projection = perspective(zoomFactor, 1, .1, 90);
        gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
        gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));

        requestAnimationFrame(tick);
    };
    tick();    
}


/*
 * Initialize important boilerplate, create the matrix stack, etc.
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
    // notice that I'm adding the program as a property to the gl object
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // grab the handle to the model matrix and add it to gl
    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    
    // grab the handle to the view matrix and add it to gl
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    
    
    // Create the projection matrix and load it
    var projection = perspective(70, 1, .1, 90);

    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));
    
    // create the current transform and the matrix stack right in the gl object
    gl.currentTransform = mat4();
    gl.transformStack = [];

    // add some method for working with the matrix stack
    gl.push = function() {

        gl.transformStack.push(gl.currentTransform);
    }
    
    gl.pop = function() {

        gl.currentTransform = gl.transformStack.pop();
    }
    
    return gl;
}

/*
 * The constructor for the shape objects. Most of the code is common, so we pass
 * in specific vertices. There are some differences for the sun since it doesn't
 * have all the same attributes as the other bodies.
 *
 */
function Shape(gl, points, sun, rate, currentAngle, rotation, size, radius, axis, speed) {

    // Initialize the shape
    this.rate = rate; // rate of rotation
    this.currentAngle = currentAngle; // angle of rotation
    this.moons = new Array(); // list of dependent bodies
    if (!sun) {
        this.rotation = rotation; // axis of rotation
        this.size = size; // scale of the shape
        this.radius = radius; // orbital radius
        this.axis = axis; // orbital axis
        this.speed = speed; // orbital speed
    }
    
    var vertices = points;
    var numVertices = vertices.length / 6;

    // Load the vertices into the VBO
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // bind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    var g_last = Date.now();
    /*
     * this function updates the angle based on elapsed time
     */
    this.update = function() {

        var now = Date.now();
        var elapsed = now - g_last;
        g_last = now;
        this.currentAngle = (this.currentAngle + (this.rate * ANGLE_STEP * elapsed) / 1000.0) % 360;
    }

    /*
     * add a dependent to the parent's list
     */
    this.add = function(shape) {

        this.moons.push(shape);
    }

    /*
     * This method is called when we want to draw the shape.
     */
    this.draw = function() {
        // need to rebind the array buffer to the appropriate VBO in cse some other buffer has been made active
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Set the association for the position attribute
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6,0);
        gl.enableVertexAttribArray(a_Position);

        // Set the association for the color attribute
        var a_Color= gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false,  FSIZE*6, FSIZE*3);
        gl.enableVertexAttribArray(a_Color);

        // push a copy of the currentTransform onto the stack
        gl.push();
        // transformations for non-sun bodies
        if(!sun) {
            gl.currentTransform = mult(mult(mult(mult(gl.currentTransform, rotate(this.speed*this.currentAngle, this.axis)), 
                                                     translate(this.radius*this.axis[1], this.radius*this.axis[2], this.radius*this.axis[0])), 
                                                     scale(this.size, this.size, this.size)), 
                                                     rotate(this.currentAngle, this.rotation));
        }
        // transformations for the sun
        else {
            gl.currentTransform = mult(gl.currentTransform, rotate(this.currentAngle, y));
        }
        // push the transformations down to the shaders
        gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));

        // draw the shape 
        gl.drawArrays(gl.TRIANGLES, 0, numVertices);

        // draw all dependents
        for (var i = 0; i < this.moons.length; i++) {

            this.moons[i].update();
            this.moons[i].draw();
        }
        // pop currentTransform back off the matrix stack
        gl.pop();
    }
}