/*
 * shage_proj6.js
 * 
 * Artificial terrain generation
 *
 * Sam Hage
 * 4/15
 *
 * Cool stuff: nose cone, heads-up display, waterline, variable roughness, fog
 *
 * To make the fog I relied heavily on Sergiu Craitoiu's tutorial at http://in2gpu.com/2014/07/22/create-fog-shader/
 * I used photos from:
 * http://kevinbeebe.smugmug.com/Aviation/Aircraft/
 * http://i.ytimg.com/vi/rVoSplhDdng/maxresdefault.jpg
 */

window.onload = function() {

    // initialize the context
    var gl = initialize();
    
    // create the terrain object
    var terrain = new Terrain(gl, 7);
    
    // to allow key presses
    window.addEventListener('keydown', handleKeyDown, true);

    // camera, look, up will be the components of lookAt()
    var camera = vec3(0, 2, 3);
    var look = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    // coefficients to modify lookAt()
    var tx = 0.0;
    var ty = 0.0;
    var tz = 0.0;
    var ay = 0.0;
    var uy = 0.0;
    var angle = 0.0;

    // set the polygon offset
    gl.polygonOffset(1.0, 1.0);
    
    // check which key was pressed
    function handleKeyDown(event) {

        // move up and down
        if (event.keyCode == 38 && event.shiftKey) { // shift-up
            ty += 0.1;
            render();
        }
        else if (event.keyCode == 40 && event.shiftKey) { // shift-down
            ty -= 0.1;
            render();
        }
        // rotate left and right (yaw)
        else if (event.keyCode == 65 && event.shiftKey) { // shift-a
            angle = (angle - 1.5) % 360;
            render();
        }
        else if (event.keyCode == 68 && event.shiftKey) { // shift-d
            angle = (angle + 1.5) % 360;
            render();
        }
        // strafe left and right
        else if (event.keyCode == 37) { // left arrow
            tx -= 0.1;
            render();
        } 
        else if (event.keyCode == 39) { // right arrow
            tx += 0.1;
            render();
        }
        // move forward and backward
        else if (event.keyCode == 38) { // up arrow
            tz -= 0.1;
            render();
        } 
        else if (event.keyCode == 40) { // down arrow
            tz += 0.1;
            render();
        }
        // roll left and right
        else if (event.keyCode == 65) { // a
            uy -= 0.05;
            render();
        }
        else if (event.keyCode == 68) { // d
            uy += 0.05;
            render();
        }
        // angle up and down (pitch)
        else if (event.keyCode == 83) { // s
            ay += 0.1;
            render();
        }
        else if (event.keyCode == 87) { // w
            ay -= 0.1;
            render();
        }
        return false;
    }

    var altitude;
    
    // function to render the terrain object
    var render = function() {
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // set the camera view using coefficients
        // this creates a helicopter-style camera, which preserves absolute
        // directional movement, as opposed to moving along new axes
        camera = vec3(0+tx, 2+ty, 3+tz);
        look = vec3(0+tx, 0+ty+ay, 0+tz);
        up = vec3(uy, 1, 0);
        var transform = lookAt(camera, look, up);
        gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(transform));

        var rotation = rotate(angle, [0.0, 1.0, 0.0]);
        gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(rotation));
        
        // display altitude information
        // 1001.3 is arbitrary to give altimeter interesting values
        altitude = (1650.0 + 1001.3*ty).toFixed(2);
        document.getElementById("alt").innerHTML = "Altitude: " + altitude;
        // draw the terrain
        terrain.draw();
    }   
    
    render();
}

/*
 * Creates a square array of side length 2n+1
 * This will be used for the diamond-square algorithm
 */
function makeSquare(n) {

    var arr = new Array(2*n+1);
    for (var i = 0; i < 2*n+1; i++) {
        arr[i] = new Array(2*n+1);
        for (var j = 0; j < 2*n+1; j++) {
            arr[i][j] = 0;
        }
    }
    return arr;
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
    gl.clearColor(0.5, 0.8, 0.9, 1.0);
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
 * Compute a cross-product
 */
function crossProduct(u, v) {

    var w = vec3(u[2]*u[1] - u[1]*v[2], 
                 u[0]*v[2] - u[2]*v[0],
                 u[0]*v[1] - u[1]*v[0]);
    return w;
}


/*
 * Build the vertices for the terrain
 */
function Terrain(gl, n) {

    // Initialize the shape
    var vertices = [];
    var indices = [];
    var normals = [];
    var n = n;
    var sideLength = Math.pow(2, n) + 1; // side length of terrain
    
    // create the buffers
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

    var normalBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    /*
     * This function initializes the object. It does all of the grunt work computing all of the
     * points and indices
     */ 
    this.setSteps = function(n) {
     
        vertices = [];
        indices = [];

        var initial = -2.75 // starting point for terrain corner
        var x, y, z;
        var rowStep = (2*-initial)/(sideLength-1); // separation between rows and columns
        var colStep = (2*-initial)/(sideLength-1);
        var k = 0; // dummy counter used for adding indices
        var height = 0.5; // used to vary roughness with terrain height
        var rand = 0.0; // keep track of a random factor in the generation

        // create a 2D array of size 2n+1
        var arr = makeSquare(sideLength);
        // initialize four corners
        arr[0][0] = 0.0;
        arr[sideLength-1][0] = 0.0;
        arr[0][sideLength-1] = 0.0;
        arr[sideLength-1][sideLength-1] = 0.0;
        // pick a roughness factor
        var roughness = 0.0075; // needs to be small because my terrain is much larger
        var s = Math.pow(2, n);
        var r = 0; // variable to scale roughness by 

        // perform diamond-square algorith
        while (s > 1) {
            // perform square step
            for (var i = 0; i < sideLength; i++) {
                for (var j = 0; j < sideLength; j++) {
                    if (i%s == s/2 && j%s == s/2) {
                        // generate random factor, then scale r based on this height
                        // constants are somewhat arbitrary
                        rand = Math.random();
                        r = (1.2*rand + 0.5)*(roughness * s);
                        arr[i][j] = (arr[i-s/2][j-s/2] + arr[i+s/2][j-s/2] + arr[i-s/2][j+s/2] + arr[i+s/2][j+s/2])/4.0;
                        arr[i][j] = Math.abs(arr[i][j] + (rand*2*r - r));
                    }
                }
            }
            // perform diamond step
            var ctr = 0.0; // tracks number of points contributing to average
            var tempSum = 0.0; // used to comppute averages
            for (i = 0; i < sideLength; i++) {
                for (j = 0; j < sideLength; j++) {

                    ctr = 0.0;
                    tempSum = 0.0;
                    if ((i%s == s/2 && j%s == 0) || (i%s == 0 && j%s == s/2)) {

                        if (i+s/2 >= 0 && i+s/2 < sideLength && j >= 0 && j < sideLength) {
                            tempSum += arr[i+s/2][j];
                            ctr += 1.0;
                        }
                        if (i-s/2 >= 0 && i-s/2 < sideLength && j >= 0 && j < sideLength) {
                            tempSum += arr[i-s/2][j];
                            ctr += 1.0;
                        }
                        if (i >= 0 && i < sideLength && j+s/2 >= 0 && j+s/2 < sideLength) {
                            tempSum += arr[i][j+s/2];
                            ctr += 1.0;
                        }
                        if (i >= 0 && i < sideLength && j-s/2 >= 0 && j-s/2 < sideLength) {
                            tempSum += arr[i][j-s/2];
                            ctr += 1.0;
                        }
                        tempSum /= ctr;
                        // vary roughness again
                        rand = Math.random();
                        r = (1.2*rand + 0.5)*(roughness * s);
                        arr[i][j] += tempSum;
                        arr[i][j] = Math.abs(arr[i][j] + (rand*2*r - r));
                    }
                }
            }
            s /= 2;
        }

        // determine coordinates for each point and add to vertices array
        // y-values are referenced from the 2n+1 array
        for (i = 0; i < sideLength; i++) {

            for (j = 0; j < sideLength; j++) {

                x = initial + j*(colStep);
                z = initial + i*(rowStep);
                if (arr[i][j] < 0.2) {
                    y = 0.2;
                } else {
                    y = arr[i][j];
                }

                vertices.push(x);
                vertices.push(y);
                vertices.push(z);
                indices.push(k); // add row-order indices
                k++;
            }
        }

        // create an array of vec3s to represent actual points, not individual coordinates
        // this will be useful for indexing
        points = [];
        var tempVec = vec3();
        for (i = 0; i < vertices.length; i += 3) {

            tempVec = vec3(vertices[i], vertices[i+1], vertices[i+2]);
            points.push(tempVec);
        }

        // compute normals using the method by which the normals of four triangle
        // faces are calculated, then added to the appropriate corner vertices
        // for averaging 
        normals = new Array(vertices.length);
        for (i = 0; i < normals.length; i++) {
            normals[i] = 0.0;
        }
        var p1, p2, p3, p4; // four points
        var v1 = vec3(); // four vectors
        var v2 = vec3();
        var v3 = vec3();
        var v4 = vec3();
        var a = vec3(); // four triangle normals
        var b = vec3();
        var c = vec3();
        var d = vec3();

        for (i = 0; i < sideLength-1; i++) {

            for (j = 0; j < sideLength-1; j++) {

                // compute the four points defining a square of four possible triangles
                p1 = vec3(points[i + j*sideLength]);
                p2 = vec3(points[i + j*sideLength + 1]);
                p3 = vec3(points[i + (j+1)*sideLength]);
                p4 = vec3(points[i + (j+1)*sideLength + 1]);

                // compute the vectors making the edges of the square
                v1 = vec3(p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]);
                v2 = vec3(p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]);
                v3 = vec3(p2[0]-p4[0], p2[1]-p4[1], p2[2]-p4[2]);
                v4 = vec3(p3[0]-p4[0], p3[1]-p4[1], p3[2]-p4[2]);

                // compute the normals of each triangle determined by the vectors
                a = normalize(crossProduct(v2, v1));
                b = normalize(crossProduct(v3, v4));
                c = normalize(crossProduct(vec3(-v1[0], -v1[1], -v1[2]), vec3(-v3[0], -v3[1], -v3[2])));
                d = normalize(crossProduct(vec3(-v4[0], -v4[1], -v4[2]), vec4(-v2[0], -v2[1], -v2[2])));

                // add these normals to the appropriate points
                // used for averaging later
                normals[(i + j*sideLength)*3] += a[2] + b[2] + c[2] + d[2];
                normals[(i + j*sideLength)*3 + 1] += a[1] + b[1] + c[1] + d[1];
                normals[(i + j*sideLength)*3 + 2] += a[0] + b[0] + c[0] + d[0];
                normals[(i + j*sideLength + 1)*3] += a[2] + b[2] + c[2] + d[2];
                normals[(i + j*sideLength + 1)*3 + 1] += a[1] + b[1] + c[1] + d[1];
                normals[(i + j*sideLength + 1)*3 + 2] += a[0] + b[0] + c[0] + d[0];
                normals[(i + (j+1)*sideLength)*3] += a[2] + b[2] + c[2] + d[2];
                normals[(i + (j+1)*sideLength)*3 + 1] += a[1] + b[1] + c[1] + d[1];
                normals[(i + (j+1)*sideLength)*3 + 2] += a[0] + b[0] + c[0] + d[0];
                normals[(i + (j+1)*sideLength + 1)*3] += a[2] + b[2] + c[2] + d[2];
                normals[(i + (j+1)*sideLength + 1)*3 + 1] += a[1] + b[1] + c[1] + d[1];
                normals[(i + (j+1)*sideLength + 1)*3 + 2] += a[0] + b[0] + c[0] + d[0];
            }
        }

        var numDivisors = 0; // number of components to each normal
        for (i = 0; i < sideLength; i++) {

            for (j = 0; j < sideLength; j++) {

                if ( (i == 0 || i == sideLength-1) && (j == 0 || j == sideLength-1) ) { // corner vertex
                    numDivisors = 3;
                } else if ( (i == 0 || i == sideLength-1) || (j == 0 || j == sideLength-1) ) { // side vertex
                    numDivisors = 6;
                } else { // interior vertex
                    numDivisors = 12;
                }
                // finish the averaging
                normals[(i + j*sideLength)*3 - 2] /= numDivisors;
                normals[(i + j*sideLength)*3 - 1] /= numDivisors;
                normals[(i + j*sideLength)*3] /= numDivisors;
            }
        }

        for (i = 0; i < sideLength; i++) {

            for (j = 0; j < sideLength; j++) {

                indices.push(j*sideLength + i); // add column-order indices
            }
        }

        for (i = 0; i < sideLength-1; i++) {

            for (j = 0; j < sideLength; j++) {

                // add vertices to index array in proper order
                indices.push(i + j*sideLength);
                indices.push(i + j*sideLength + 1);
            }
        }

        // convert to our flat form
        indices = new Uint16Array(indices);
       
        // Load the vertices into the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        
        // load up the normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        // load up the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }


    // attributes for the shaders
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

    var a_Normal= gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get storage location');
        return -1;
    }

    // uniforms for lighting information
    gl.u_LightAt = gl.getUniformLocation(gl.program, 'u_LightAt');
    gl.uniform4fv(gl.u_LightAt, vec4(0.0, 0.0, 1.0, 1.0));
    gl.u_Ambient = gl.getUniformLocation(gl.program, 'u_Ambient');
    gl.uniform3fv(gl.u_Ambient, vec3(0.2, 0.2, 0.2));
    gl.u_Diffuse = gl.getUniformLocation(gl.program, 'u_Diffuse');
    gl.uniform3fv(gl.u_Diffuse, vec3(0.9, 0.9, 0.9));
    gl.u_Specular = gl.getUniformLocation(gl.program, 'u_Specular');
    gl.uniform3fv(gl.u_Specular, vec3(0.9, 0.9, 0.9));
    gl.u_Shininess = gl.getUniformLocation(gl.program, 'u_Shininess');
    gl.uniform1f(gl.u_Shininess, 3.0);

    /*
     * This method is called when we want to draw
     */
    this.draw = function() {

        // need to rebind the array buffer to the appropriate VBO in cse some other buffer has been made active
        
        // Set the association for the position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // set association for the normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_Normal);

        var FSIZE = indices.BYTES_PER_ELEMENT; // size of each index element
        var offset = Math.pow(sideLength, 2); // number of individual points in grid

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // for (i = 0; i < sideLength-1; i++) {
        //     gl.drawElements(gl.TRIANGLE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);
        // }
        for (i = 0; i < sideLength-1; i++) {
            gl.drawElements(gl.TRIANGLE_STRIP, sideLength*2, gl.UNSIGNED_SHORT, 2*(offset + i*sideLength)*FSIZE);
        }
    }
    
    // call the initialization function to jumpstart this object
    this.setSteps(n);
    
}