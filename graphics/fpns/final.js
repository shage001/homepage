/*
 * final project
 * 
 * More complex FP(N)S
 *
 * Sam Hage
 * Philip Chang
 * 5/15
 *
 * Fog relies heavily on Sergiu Craitoiu's tutorial at http://in2gpu.com/2014/07/22/create-fog-shader/
 * Sphere and cube structures lifted from course examples
 * Images from opengameart.org
 */

var n = 7;
var sideLength = Math.pow(2, n) + 1; // side length of terrain
// model matrix controls
var yaw = 0.0; // turn
var pitch = 0.0; // look up and down
// separation between rows and columns
var initial = -2.75 // starting point for terrain corner
var step = (2*-initial)/(sideLength-1);
// move forward and backward
var xpos = 0.0;
var ypos = -0.3;
var zpos = 0.0;
// vectors to define movement axes
var forward = vec4(); 
var sideways = vec4();
var up = vec4(0.0, 1.0, 0.0, 0.0);
var look = mat4();
// used for indexing to move camera based on height
var ipos = 0;
var jpos = 0;
var forw = true;
var back, left, right;
// projection information
var FOVY = 50;
var NEAR = .01;
var FAR = 500;
// health and stamina
var health = 100;
var stamina = 100;

window.onload = function() {

    // initialize the context
    var gl = initialize(FOVY, NEAR, FAR);
    
    // create the terrain object
    var terrain = new Terrain(gl, n);

    // store the spheres
    var objects = [];
    for (var k = 0; k < 100; k++) {

        // randomize color and position
        var colorRand = Math.random();
        var iRand = Math.random();
        var jRand = Math.random();
        var i = iRand*5 - 2.5;
        var j = jRand*5 - 2.5;
        var terri = Math.floor(-i/step + sideLength/2.0);
        var terrj = Math.floor(-j/step + sideLength/2.0);
        var sphereHeight = 0.0;

        if (terrain.arr[terrj][terri] < 0.2) {
            sphereHeight = 0.2;
        } else {
            sphereHeight = terrain.arr[terrj][terri];
        }

        if (colorRand > 0.3) {
            var color = 1; // red
        } else {
            var color = 2; // green
        }
        // Sphere(gl, row, col, height, rad, color)
        var newSphere = new Sphere(gl, -j, -i, sphereHeight+0.05, 0.01, color);
        objects.push(newSphere);
    }

    // set the polygon offset
    gl.polygonOffset(1.0, 1.0);

    // texture files
    initializeTexture(gl, gl.TEXTURE0, 'images/sky_bk.jpg', function() {
        initializeTexture(gl, gl.TEXTURE1, 'images/sky_ft.jpg', function() {
            initializeTexture(gl, gl.TEXTURE2, 'images/sky_lf.jpg', function() {
                initializeTexture(gl, gl.TEXTURE3, 'images/sky_rt.jpg', function() {
                    initializeTexture(gl, gl.TEXTURE4, 'images/sky_up.jpg', function() {                         
                        render(gl, terrain, objects);
                    })
                })
            })
        })
    });
    
    // to allow key presses
    window.addEventListener('keydown', handleKeyDown, true);
    
    // check which key was pressed
    function handleKeyDown(event) {

        // turn left and right
        if (event.keyCode == 37) { // left arrow

            yaw = (yaw - 2.0)%360.0;
            render(gl, terrain, objects);
        } 
        else if (event.keyCode == 39) { // right arrow

            yaw = (yaw + 2.0)%360.0;
            render(gl, terrain, objects);
        }
        // look up and down
        else if (event.keyCode == 38) { // up arrow

            pitch = (pitch - 2.0)%360.0;
            render(gl, terrain, objects);
        } 
        else if (event.keyCode == 40) { // down arrow

            pitch = (pitch + 2.0)%360.0;
            render(gl, terrain, objects);
        }
        // strafe left and right
        else if (event.keyCode == 65) { // a

            xpos -= 0.01*sideways[0];
            zpos -= 0.01*sideways[2];
            left = true;
            render(gl, terrain, objects);
        }
        else if (event.keyCode == 68) { // d

            xpos += 0.01*sideways[0];
            zpos += 0.01*sideways[2];
            right = true;
            render(gl, terrain, objects);
        }
        // move forward and backward
        else if (event.keyCode == 87 && event.shiftKey) { // w and shift to sprint

            if (stamina > 0) {
                xpos += 0.03*forward[0];
                zpos += 0.03*forward[2];
                stamina -= 1;
            } else {
                xpos += 0.01*forward[0];
                zpos += 0.01*forward[2];
            }
            forw = true;
            render(gl, terrain, objects);
        }
        else if (event.keyCode == 83) { // s

            xpos -= 0.01*forward[0];
            zpos -= 0.01*forward[2];
            back = true;
            render(gl, terrain, objects);
        }
        else if (event.keyCode == 87) { // w

            xpos += 0.01*forward[0];
            zpos += 0.01*forward[2];
            forw = true;
            render(gl, terrain, objects);
        }
        return false;
    }

    // decrease health automatically
    var g_last = Date.now();
    var tick = function(){

        var now = Date.now();
        var elapsed = now - g_last;
        g_last = now;
        
        health -= Math.max(0.0, (2*elapsed) / 1000.0);         
        requestAnimationFrame(tick);
       };
    tick();

    // set viewing info
    var TOP = Math.tan(radians(FOVY/2)) * NEAR;
    var aspect = gl.canvas.width/gl.canvas.height;
    var view_height = TOP * 2;
    var view_width = aspect * view_height;
    var mouse = {};

    // handle mouse click
    document.onclick = function(event) {

        mouse.x = event.x - gl.canvas.offsetLeft;
        mouse.y = event.y - gl.canvas.offsetTop;

        // handle the pixel offset for inaccuracy
        var x = mouse.x + .5;
        var y = mouse.y + .5;

        var px = (x/gl.canvas.width)*view_width - view_width/2;
        var py = view_height/2 - (y/gl.canvas.height)*view_height;

        // shoot ray forward
        var vector = vec3(px, py, -NEAR);
        vector = normalize(vector);
        rayTrace(vec3(0, 0, 0), vector, objects);
        render(gl, terrain, objects);
    }

    // mouse listener
    document.addEventListener('mousemove', function(e){
        mouse.x = e.x - gl.canvas.offsetLeft;
        mouse.y = e.y - gl.canvas.offsetTop;
    }, false);
    
    // function to render the scene
    var render = function(gl, terrain, objects) {
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // manipulate view matrix based on angling
        look = mat4();
        look = mult(look, rotate(pitch, [1.0, 0.0, 0.0]));
        look = mult(look, rotate(yaw, [0.0, 1.0, 0.0]));
        // calculate vectors of forward and sideways movement
        forward = normalize(look[2]);
        sideways = normalize(cross(forward, up));

        var tempi = (-xpos/step + sideLength/2.0);
        var tempj = (-zpos/step + sideLength/2.0);
        ipos = Math.floor(tempi);
        jpos = Math.floor(tempj);
        // weight the average for height-based camera movement
        var iweight = tempi - ipos;
        var jweight = tempj - jpos;
        var ioffset, joffset;

        
        var direction = "north";
        if (forward[0] <= 0 && forward[2] >= 0 && Math.abs(forward[0]) < Math.abs(forward[2]) ||
            forward[0] > 0 && forward[2] > 0 && forward[0] < forward[2]) {
            direction = "north";
        } else if (forward[0] < 0 && forward[2] > 0 && Math.abs(forward[0]) > Math.abs(forward[2]) ||
                   forward[0] < 0 && forward[2] < 0 && Math.abs(forward[0]) > Math.abs(forward[2])) {
            direction = "east";
        } else if (forward[0] > 0 && forward[2] < 0 && Math.abs(forward[0]) > Math.abs(forward[2]) ||
                   forward[0] > 0 && forward[2] > 0 && forward[0] > forward[2]) {
            direction = "west";
        } else {
            direction = "south";
        }

        if (direction == "north") {
            if (forw || back) {
                ypos = -0.05 - (jweight*terrain.arr[jpos][ipos] + (1-jweight)*terrain.arr[jpos-1][ipos]);
            } else {
                ypos = -0.05 - ((1-iweight)*terrain.arr[jpos][ipos] + (iweight)*terrain.arr[jpos][ipos+1]);
            }          
        } 
        else if (direction == "south") {
            if (forw || back) {
                ypos = -0.05 - ((1-jweight)*terrain.arr[jpos][ipos] + (jweight)*terrain.arr[jpos+1][ipos]);            
            } else {
                ypos = -0.05 - ((iweight)*terrain.arr[jpos][ipos] + (1-iweight)*terrain.arr[jpos][ipos-1]);                                
            }
        }
        else if (direction == "east") {
            if (forw || back) {    
                ypos = -0.05 - ((1-iweight)*terrain.arr[jpos][ipos] + (iweight)*terrain.arr[jpos][ipos+1]);            
            } else {
                ypos = -0.05 - ((jweight)*terrain.arr[jpos][ipos] + (1-jweight)*terrain.arr[jpos-1][ipos]);                
            }
        }
        else {
            if (forw || back) {    
                ypos = -0.05 - ((iweight)*terrain.arr[jpos][ipos] + (1-iweight)*terrain.arr[jpos][ipos-1]);            
            } else {
                ypos = -0.05 - ((1-jweight)*terrain.arr[jpos][ipos] + (jweight)*terrain.arr[jpos+1][ipos]);                
            }        
        }

        // translate based on model matrix
        var transform = mat4();
        gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(transform));
        look = mult(look, translate(xpos, ypos, zpos));
        gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(look));
        
        forw = false;
        back = false;
        left = false;
        right = false;

        displayHtml();
        
        if (health > -1) { // still alive

            // draw the objects
            for (var i = 0; i < objects.length; i++) {
                objects[i].draw();
            }
            // draw the terrain
            terrain.draw();
        } else { // game over

            document.write( 
                '<body bgcolor="#000000">' +
                    '<p style="color:#FFFFFF;font-family:Lucida Console;position:absolute;left:42%;top:40%;font-size:40px">' +
                        'Game over' +
                    '</p>' +
                '</body>'
                );
        }
    }
    render(gl, terrain, objects);
}


/*
 * Display the proper text/images in html
 */
displayHtml = function() {

    // DISPLAY HTML
    document.getElementById("health").innerHTML = "Health: ";
    document.getElementById("stamina").innerHTML = "Stamina: ";

    if (health >= 95) {
        document.getElementById("hearts_red").src = "images/health_10.png";
    } else if (health >= 85) {
        document.getElementById("hearts_red").src = "images/health_9.png";            
    } else if (health >= 75) {
        document.getElementById("hearts_red").src = "images/health_8.png";            
    } else if (health >= 65) {
        document.getElementById("hearts_red").src = "images/health_7.png";            
    } else if (health >= 55) {
        document.getElementById("hearts_red").src = "images/health_6.png";            
    } else if (health >= 45) {
        document.getElementById("hearts_red").src = "images/health_5.png";            
    } else if (health >= 35) {
        document.getElementById("hearts_red").src = "images/health_4.png";            
    } else if (health >= 25) {
        document.getElementById("hearts_red").src = "images/health_3.png";            
    } else if (health >= 15) {
        document.getElementById("hearts_red").src = "images/health_2.png";            
    } else if (health >= 5) {
        document.getElementById("hearts_red").src = "images/health_1.png";            
    } else { // display 26-byte transparent gif
        document.getElementById("hearts_red").src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";                        
    }

    if (stamina >= 95) {
        document.getElementById("hearts_green").src = "images/stamina_10.png";
    } else if (stamina >= 85) {
        document.getElementById("hearts_green").src = "images/stamina_9.png";            
    } else if (stamina >= 75) {
        document.getElementById("hearts_green").src = "images/stamina_8.png";            
    } else if (stamina >= 65) {
        document.getElementById("hearts_green").src = "images/stamina_7.png";            
    } else if (stamina >= 55) {
        document.getElementById("hearts_green").src = "images/stamina_6.png";            
    } else if (stamina >= 45) {
        document.getElementById("hearts_green").src = "images/stamina_5.png";            
    } else if (stamina >= 35) {
        document.getElementById("hearts_green").src = "images/stamina_4.png";            
    } else if (stamina >= 25) {
        document.getElementById("hearts_green").src = "images/stamina_3.png";            
    } else if (stamina >= 15) {
        document.getElementById("hearts_green").src = "images/stamina_2.png";            
    } else if (stamina >= 5) {
        document.getElementById("hearts_green").src = "images/stamina_1.png";            
    } else { // display 26-byte transparent gif
        document.getElementById("hearts_green").src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";                        
    }
}

/*
 * Takes in a matrix and a vector and performs the multiplication
 * limited error checking
 */
multiply = function(mat, v) {
    if (mat.matrix && !v.matrix) {
        var prod = [];
        if (mat[0].length != v.length) {
            throw "number of columns does not match vector length";
        }
        for (var r = 0; r < mat.length; r++) {
            var row = mat[r];
            var sum = 0;
            for (var c = 0; c < row.length; c++) {
                sum += (v[c] * row[c]);
            }
            prod.push(sum);
        }
        return prod;
    }
    else {
        throw "mat must be a matrix and v must be a vector";
    }
}

/*
 * Finds whether a ray shot through a particular pixel hits an object
 */
rayTrace = function(eye, ray_vector, objects) {

    for (var i = 0; i < objects.length; i++) {

        var obj = objects[i];
        var t = getSphereIntersection(ray_vector, obj);

        if (t > 0 && t < 0.5) {

            console.log('hit');
            console.log(scalev(t, ray_vector));

            if (obj.color == 1) { // increase health
                health = Math.min(100, health+10);
            } else if (obj.color == 2) { // increase stamina
                stamina = Math.min(100, stamina+10);
            }
            obj.selected = !obj.selected;
        }
    }
}

/*
 * Find intersection point (if any) with sphere
 */
getSphereIntersection = function(ray_vector, sphere) {

    // need to get the camera coordinates of the sphere
    var center = multiply(look, vec4(sphere.center, 1.0));
    center = vec3(center);

    var eye = vec3(0, 0, 0);
    var a = dot(ray_vector, ray_vector);
    var b = 2 * dot(subtract(eye, center), ray_vector);
    var c = dot(subtract(eye, center), subtract(eye, center)) - Math.pow(sphere.radius, 2);

    // solve quadratic equation
    var det = Math.pow(b, 2) - 4*a*c;
    if (det >= 0) {
        var t = (-dot(ray_vector, subtract(eye, center)) + Math.sqrt(det))/(dot(ray_vector, ray_vector)); 
        return t;
    }
    return -1;
}


/*
 * Our standard initialization.
 */
function initialize(fovy, near, far) {

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
    gl.clearColor(0.89, 0.66, 0.34, 1.0);
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
    // var projection = perspective(50, canvas.width/canvas.height, .01, 40);
    var projection = perspective(fovy, canvas.width/canvas.height, near, far);

    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));

    /* set up the texture uniforms */

    // back side
    var u_BkSampler = gl.getUniformLocation(gl.program, 'u_BkSampler');
    gl.uniform1i(u_BkSampler, 0);
    // front side
    var u_FtSampler = gl.getUniformLocation(gl.program, 'u_FtSampler');
    gl.uniform1i(u_FtSampler, 1);
    // left side
    var u_LfSampler = gl.getUniformLocation(gl.program, 'u_LfSampler');
    gl.uniform1i(u_LfSampler, 2);
    // right side
    var u_RtSampler = gl.getUniformLocation(gl.program, 'u_RtSampler');
    gl.uniform1i(u_RtSampler, 3);
    // top side
    var u_UpSampler = gl.getUniformLocation(gl.program, 'u_UpSampler');
    gl.uniform1i(u_UpSampler, 4);
    
    return gl;
}

/*
 * create a Sphere object
 */
function Sphere(gl, row, col, height, radius, color) {

    var vertices = [];
    var indices = [];
    var normals = [];
    var textureCoordinates = [];
    var numSteps = 25;
    this.center = vec3(col, height, row);
    this.radius = radius;
    this.selected = false;
    this.color = color;
    
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var normalBuffer = gl.createBuffer();
    if (!normalBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    var texBuffer = gl.createBuffer();
    if (!texBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
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
    
    /*
     * This function initializes the object. It does all of the grunt work computing all of the
     * points and indices. This has been made a function to make this object mutable. We can
     * decide we want to change the number of points and recalculate the shape.
     */ 
    this.initialize = function() {
        // numSteps = 5; // the number of samples per circle
        numSteps = 25; // the number of samples per circle
        var sStep = 2*Math.PI/numSteps; // angular different beteen samples
        vertices = [];
        indices = [];
        textureCoordinates = [];
        // push north pole since it is only a single point
        vertices.push(col);
        vertices.push(height + radius);
        vertices.push(row);
        
        // create the points for the sphere
        // t is an angle that sketches out a circle (0 - 2PI)
        // s controls the height and the radius of the circle slices
        // we only need 0 - PI 
        // x = cos(t) * sin(s)
        // y = cos(s)
        // z = sin(t) * sin(s)
        for (var s= 1; s < numSteps; s++){

            for (var t = 0; t < numSteps; t++){

                var tAngle = t*sStep;
                var sAngle = s*sStep/2;
                vertices.push(col + Math.cos(tAngle)*Math.sin(sAngle)*radius);
                vertices.push(Math.cos(sAngle)*radius + height);
                vertices.push(row + Math.sin(tAngle)*Math.sin(sAngle)*radius);
            }
        }
        
        // push south pole -- again just a single point
        vertices.push(col);
        vertices.push(height-radius);
        vertices.push(row);
        
        //convert to the flat form
        vertices = new Float32Array(vertices);
        
        // north pole
        // this is going to form a triangle fan with the pole and the first circle slice
        indices.push(0);
        for (var i = 1; i <= numSteps; i++){
            indices.push(i);
        }
        indices.push(1);
        
        // south pole
        // another triangle fan, we grab the last point and the last circle slice
        indices.push(vertices.length/3 - 1);
        for (var i = 1; i <= numSteps; i++){
            indices.push(vertices.length/3 - 1 - i);
        }
        indices.push(vertices.length/3 - 2);
        
        
        // the bands
        // The rest of the skin is made up of triangle strips that connect two neighboring slices
        // the outer loop controls which slice we are on and the inner loop iterates around it
        for (var j = 0; j < numSteps-2; j++){
            
             for (var i = j*numSteps + 1; i <= (j+1)*numSteps; i++){
                indices.push(i);
                indices.push(i+numSteps);
            }
            
            // grab the first two points on the slices again to close the loop
            indices.push(j*numSteps +1);
            indices.push(j*numSteps +1 + numSteps);
        }
        
        // building the normals:
        // takes advantage of the fact that the normal of any point on a sphere is P - C
        // where P is the point and C is the center
        // normals were backward for some reason, so we negated them
        for (var i = 0; i < vertices.length; i+=3) {

            normals.push(-vertices[i] + this.center[0]);
            normals.push(-vertices[i+1] + this.center[1]);
            normals.push(-vertices[i+2] + this.center[2]);
        }

        // dummy texture coordinates to avoid errors
        var texLength = 2*(vertices.length/3.0);
        textureCoordinates = new Array(texLength);
        textureCoordinates = new Float32Array(textureCoordinates);

        // convert to our flat form
        indices = new Uint16Array(indices);

        normals = new Float32Array(normals);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        // Load the vertices into the VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordinates), gl.STATIC_DRAW);
        
        // load up the index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
    
    
    /*
     * This method is called when we want to draw the shape.
     */
    this.draw = function() {

        var u_Sphere = gl.getUniformLocation(gl.program, 'u_Sphere');

        // NOTE: need to rebind normal buffer because it gets messed up when you draw other stuff too
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
        // gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_TexCoord);

        // need to rebind the array buffer to the appropriate VBO in cse some other buffer has been made active
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(a_Position);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
        
        // turn grey if clicked already
        if (this.selected) {
            this.color = 0;
        }

        // change color
        if (this.color == 1) {
            gl.uniform1i(u_Sphere, 1); // red sphere
        } else if (this.color == 2) {
            gl.uniform1i(u_Sphere, 2); // green sphere
        } else {
            gl.uniform1i(u_Sphere, 3); // grey sphere            
        }
        
        // draw the shape
        // the skin
        var offset = 0; // keep track of how far into the index list we are
        // draw the north pole triangle fan
        gl.drawElements(gl.TRIANGLE_FAN, numSteps+2, gl.UNSIGNED_SHORT, 0);
        offset = (numSteps+2)*indices.BYTES_PER_ELEMENT;
        
        // draw the second triangle fan for the south pole
        gl.drawElements(gl.TRIANGLE_FAN, numSteps+2, gl.UNSIGNED_SHORT,offset);
        offset+=(numSteps+2)*indices.BYTES_PER_ELEMENT;
        
        // loop through the bands
        for (var i = 0; i < numSteps-2; i++){
            gl.drawElements(gl.TRIANGLE_STRIP, numSteps*2 +2, gl.UNSIGNED_SHORT,offset);
            offset += (numSteps*2 + 2)* indices.BYTES_PER_ELEMENT;
        }
        gl.uniform1i(u_Sphere, 0); // not sphere
    }

    // call the initialization function to jumpstart this object
    this.initialize();
}


/*
 * Initialize the texture(s)
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
        // looks better without mipmapping so we left it off
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        // gl.generateMipmap(gl.TEXTURE_2D);
        callback();
    }
    
    image.src = filename;
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
 * Build the vertices for the terrain
 */
function Terrain(gl, n) {

    // Initialize the shape
    var vertices = [];
    var normals = [];
    var indices = [];
    var textureCoordinates = [];
    var skyVertices = [];
    var skyNormals = [];
    var skyIndices = [];
    var skyTextureCoordinates = [];
    
    /* create the buffers */

    // terrain buffers
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
    if (!normalBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var texBuffer = gl.createBuffer();
    if (!texBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // skybox buffers
    var skyVertexBuffer = gl.createBuffer();
    if (!skyVertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    var skyIndexBuffer = gl.createBuffer();
    if (!skyIndexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var skyNormalBuffer = gl.createBuffer();
    if (!skyNormalBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    var skyTexBuffer = gl.createBuffer();
    if (!skyTexBuffer) {
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

        // var initial = -2.75 // starting point for terrain corner
        var x, y, z;
        var tc1, tc2, tc3; // texture coordinates
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
        var roughness = 0.0075; // needs to be small because our terrain is much larger
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
                        r = (0.2*rand + 0.5)*(roughness * s);
                        arr[i][j] = (arr[i-s/2][j-s/2] + arr[i+s/2][j-s/2] + arr[i-s/2][j+s/2] + arr[i+s/2][j+s/2])/4.0;
                        arr[i][j] = Math.abs(arr[i][j] + (rand*2*r - r));
                    }
                }
            }
            // perform diamond step
            var ctr = 0.0; // tracks number of points contributing to average
            var tempSum = 0.0; // used to comppute averages
            for (var i = 0; i < sideLength; i++) {
                for (var j = 0; j < sideLength; j++) {

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
                        r = (0.2*rand + 0.5)*(roughness * s);
                        arr[i][j] += tempSum;
                        arr[i][j] = Math.abs(arr[i][j] + (rand*2*r - r));
                    }
                }
            }
            s /= 2;
        }

        for (var i = 0; i < sideLength; i++) {
            for (var j = 0; j < sideLength; j++) {

                var randHeight1 = 0.05*Math.random();
                var randHeight2 = 0.05*Math.random();
                var randHeight3 = 0.05*Math.random();
                var randHeight4 = 0.05*Math.random();
                if (i == 0) {
                    arr[i][j] = 0.6 + randHeight1;
                    arr[i+1][j] = 0.55 + randHeight2;
                    arr[i+2][j] = 0.4 + randHeight3;
                    arr[i+3][j] = 0.3 + randHeight4;
                } else if (i == sideLength-1) {
                    arr[i][j] = 0.6 + randHeight1;
                    arr[i-1][j] = 0.55 + randHeight2;
                    arr[i-2][j] = 0.4 + randHeight3;
                    arr[i-3][j] = 0.3 + randHeight4;
                } else if (j == 0) {
                    arr[i][j] = 0.6 + randHeight1;
                    arr[i][j+1] = 0.55 + randHeight2;
                    arr[i][j+2] = 0.4 + randHeight3;
                    arr[i][j+3] = 0.3 + randHeight4;
                } else if (j == sideLength-1) {
                    arr[i][j] = 0.6 + randHeight1;
                    arr[i][j-1] = 0.55 + randHeight2;
                    arr[i][j-2] = 0.4 + randHeight3;
                    arr[i][j-3] = 0.3 + randHeight4;
                }
            }
        }

        this.arr = arr;

        // determine coordinates for each point and add to vertices array
        // y-values are referenced from the 2n+1 array
        for (i = 0; i < sideLength; i++) {

            for (j = 0; j < sideLength; j++) {

                x = initial + j*(step);
                z = initial + i*(step);
                if (arr[i][j] < 0.2) {
                    arr[i][j] = 0.16;
                    y = 0.2;
                } else {
                    y = arr[i][j];
                }

                vertices.push(x);
                vertices.push(y);
                vertices.push(z);
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
                a = normalize(cross(v1, v2));
                b = normalize(cross(v4, v3));
                c = normalize(cross(vec3(-v3[0], -v3[1], -v3[2]), vec3(-v1[0], -v1[1], -v1[2])));
                d = normalize(cross(vec3(-v2[0], -v2[1], -v2[2]), vec4(-v4[0], -v4[1], -v4[2])));

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

        var texLength = 2*(vertices.length/3.0);
        textureCoordinates = new Array(texLength);

        textureCoordinates = new Float32Array(textureCoordinates);

        /* create the cube for the skybox */

        // vertices of the cube, we are duplicating points because the faces have different normals
        skyVertices  = new Float32Array([
          4.0, 4.0, 4.0, -4.0, 4.0, 4.0, -4.0,-4.0, 4.0,  4.0,-4.0, 4.0, // front face
          4.0, 4.0, 4.0,  4.0,-4.0, 4.0,  4.0,-4.0,-4.0,  4.0, 4.0,-4.0, // right face
          4.0, 4.0,-4.0,  4.0,-4.0,-4.0, -4.0,-4.0,-4.0, -4.0, 4.0,-4.0, // back face
         -4.0, 4.0,-4.0, -4.0,-4.0,-4.0, -4.0,-4.0, 4.0, -4.0, 4.0, 4.0, // left face
          4.0, 4.0, 4.0,  4.0, 4.0,-4.0, -4.0, 4.0,-4.0, -4.0, 4.0, 4.0, // top face
          4.0,-4.0, 4.0, -4.0,-4.0, 4.0, -4.0,-4.0,-4.0,  4.0,-4.0,-4.0, // bottom face
        ]);
        
        // sky normals
        skyNormals = new Float32Array([
            0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // front face
            -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0, // right face
            0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0, // back face
           1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // left face
            0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // top face
            0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // bottom face
        ]);
        
        // again, dummy textures
        skyTextureCoordinates = new Float32Array([
           1.0, 1.0, 0.0, 1.0,  0.0, 0.0, 1.0, 0.0, // back face
           0.0, 1.0,  0.0, 0.0, 1.0, 0.0, 1.0, 1.0,// front face
           0.0, 1.0,  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, // right face
           0.0, 1.0,  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, // left face
           1.0, 1.0, 0.0, 1.0,  0.0, 0.0, 1.0, 0.0, // top face
           0.0, 1.0,  0.0, 0.0, 1.0, 0.0, 1.0, 1.0 // bottom face
        ]);

        skyIndices = new Uint16Array([
           0,1,2,  0,2,3, // front face
           4,5,6,  4,6,7,   // right face
           8,9,10, 8,10,11, // back face
           12,13,14,  12,14,15, // left face
           16,17,18, 16,18,19, // top face
           20,21,22, 20,22,23 // bottom face
        ]);

        for (i = 0; i < sideLength-1; i++) {

            for (j = 0; j < sideLength; j++) {

                // add vertices to index array in proper order
                indices.push(i + j*sideLength);
                indices.push(i + j*sideLength + 1);
            }
        }

        // convert to our flat form
        indices = new Uint16Array(indices);
       
        /* load and bind buffers */

        // sky buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, skyVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(skyVertices), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, skyNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(skyNormals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skyTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(skyTextureCoordinates), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, skyIndices, gl.STATIC_DRAW);

        // terrain buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordinates), gl.STATIC_DRAW);
    }


    // attributes for the shaders
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
    // uniform to determine which face to draw
    var u_Face = gl.getUniformLocation(gl.program, 'u_Face');
    var u_Sky = gl.getUniformLocation(gl.program, 'u_Sky');

    /*
     * This method is called when we want to draw
     */
    this.draw = function() {

        var FSIZE = indices.BYTES_PER_ELEMENT; // size of each index element
        var offset = Math.pow(sideLength, 2); // number of individual points in grid

        // need to rebind the array buffer to the appropriate VBO in cse some other buffer has been made active
        
        // Set the association for the position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // set association for the normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_TexCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // draw the terrain
        gl.uniform1i(u_Face, 5);
        gl.uniform1i(u_Sky, 0); // false
        for (i = 0; i < sideLength-1; i++) {
            gl.drawElements(gl.TRIANGLE_STRIP, sideLength*2, gl.UNSIGNED_SHORT, i*sideLength*2*FSIZE);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, skyVertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_Position);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, skyNormalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.bindBuffer(gl.ARRAY_BUFFER, skyTexBuffer);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false,  0, 0);
        gl.enableVertexAttribArray(a_TexCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyIndexBuffer);
    
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.uniform1i(gl.u_Grid, 0.0);

        // draw the skybox
        gl.uniform1i(u_Sky, 1); // true
        // need to be drawn in index order, but textured in a different order
        gl.uniform1i(u_Face, 1);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.uniform1i(u_Face, 2);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 6*FSIZE);
        gl.uniform1i(u_Face, 0);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12*FSIZE);
        gl.uniform1i(u_Face, 3);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 18*FSIZE);
        gl.uniform1i(u_Face, 4);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 24*FSIZE);

        gl.uniform1i(u_Sky, 0); // false

        gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    
    // call the initialization function to jumpstart this object
    this.setSteps(n);
    
}