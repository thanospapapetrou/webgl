class WebGL {
    static #AXIS_X = [1.0, 0.0, 0.0];
    static #AXIS_Y = [0.0, 1.0, 0.0];
    static #AXIS_Z = [0.0, 0.0, 1.0];
    static #CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]; // black
    static #CLEAR_DEPTH = 1.0;
    static #ERROR_COMPILING = (url, info) => `Error compiling ${url}: ${info}`;
    static #ERROR_LINKING = (vertex, fragment, info) => `Error linking ${vertex} ${fragment}: ${info}`;
    static #ERROR_LOADING = (url, status) => `Error loading ${url}: HTTP status ${status}`;
    static #FIELD_OF_VIEW = 0.25 * Math.PI; // 45 deg
    static #MS_PER_S = 1000;
    static #SHADER_FRAGMENT = './glsl/fragment.glsl';
    static #SHADER_VERTEX = './glsl/vertex.glsl';
    static #VR = 0.5 * Math.PI; // 0.25 Hz
    static #Z_FAR = 100.0;
    static #Z_NEAR = 0.1;

    #gl;
    #time;
    #rotation;
    #programInfo;
    #buffers;

    static main() {
        const webGl = new WebGL(document.querySelector('canvas#gl').getContext('webgl'));
    }

    constructor(gl) {
        this.#gl = gl;
        this.#time = 0;
        this.#rotation = 0.0;
        this.#link(WebGL.#SHADER_VERTEX, WebGL.#SHADER_FRAGMENT).then((program) => {
            this.#programInfo = {
                program: program,
                attribLocations: {
                    vertexPosition: this.#gl.getAttribLocation(program, 'aVertexPosition'),
                    vertexColor: this.#gl.getAttribLocation(program, 'aVertexColor')
                },
                uniformLocations: {
                    projectionMatrix: this.#gl.getUniformLocation(program, 'uProjectionMatrix'),
                    modelViewMatrix: this.#gl.getUniformLocation(program, 'uModelViewMatrix')
                }
            };
            this.#buffers = this.initBuffers();
            requestAnimationFrame(this.render.bind(this));
        });
    }

    #link(vertex, fragment) {
        return this.#compile(vertex, this.#gl.VERTEX_SHADER).then((vertexShader) => {
            return this.#compile(fragment, this.#gl.FRAGMENT_SHADER).then((fragmentShader) => {
                const program = this.#gl.createProgram();
                this.#gl.attachShader(program, vertexShader);
                this.#gl.attachShader(program, fragmentShader);
                this.#gl.linkProgram(program);
                if (!this.#gl.getProgramParameter(program, this.#gl.LINK_STATUS)) {
                    this.#gl.deleteProgram(program);
                    throw new Error(WebGL.ERROR_LINKING(vertex, fragment, this.#gl.getProgramInfoLog(program)));
                }
                return program;
            });
        });
    }

    #compile(url, type) {
        return this.#load(url).then((source) => {
            const shader = this.#gl.createShader(type);
            this.#gl.shaderSource(shader, source);
            this.#gl.compileShader(shader);
            if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
                this.#gl.deleteShader(shader);
                throw new Error(WebGL.ERROR_COMPILING(url, this.#gl.getShaderInfoLog(shader)))
            }
            return shader;
        });
    }

    #load(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(WebGL.ERROR_LOADING(url, response.status));
            }
            return response.text();
        });
    }

    initBuffers() {
        const positionBuffer = this.initPositionBuffer();
        const colorBuffer = this.initColorBuffer();
        const indexBuffer = this.initIndexBuffer();
        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer
        };
    }

    initPositionBuffer() {
      const positionBuffer = this.#gl.createBuffer();
      this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positionBuffer);
      const positions = [
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
      ];
      this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(positions), this.#gl.STATIC_DRAW);
      return positionBuffer;
    }

    drawScene() {
        this.#gl.clearColor(...WebGL.#CLEAR_COLOR);
        this.#gl.clearDepth(WebGL.#CLEAR_DEPTH);
        this.#gl.depthFunc(this.#gl.LEQUAL);
        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#gl.useProgram(this.#programInfo.program);
        const projection = mat4.create();
        mat4.perspective(projection, WebGL.#FIELD_OF_VIEW, this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                WebGL.#Z_NEAR, WebGL.#Z_FAR);
        this.#gl.uniformMatrix4fv(this.#programInfo.uniformLocations.projectionMatrix, false, projection);
        const modelView = mat4.create();
        mat4.translate(modelView, modelView, [-0.0, 0.0, -6.0]);
        mat4.rotate(modelView, modelView, this.#rotation, WebGL.#AXIS_Z);
        mat4.rotate(modelView, modelView, this.#rotation * 0.7, WebGL.#AXIS_Y);
        mat4.rotate(modelView, modelView, this.#rotation * 0.3, WebGL.#AXIS_X);
        this.#gl.uniformMatrix4fv(this.#programInfo.uniformLocations.modelViewMatrix, false, modelView);
        this.setPositionAttribute();
        this.setColorAttribute();
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        const vertexCount = 36;
        this.#gl.drawElements(this.#gl.TRIANGLES, vertexCount, this.#gl.UNSIGNED_SHORT, 0);
    }

    setPositionAttribute() {
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#buffers.position);
        this.#gl.vertexAttribPointer(this.#programInfo.attribLocations.vertexPosition, 3, this.#gl.FLOAT, false, 0, 0);
        this.#gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexPosition);
    }

    initColorBuffer() {
        const faceColors = [
          [1.0, 1.0, 1.0, 1.0], // Front face: white
          [1.0, 0.0, 0.0, 1.0], // Back face: red
          [0.0, 1.0, 0.0, 1.0], // Top face: green
          [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
          [1.0, 1.0, 0.0, 1.0], // Right face: yellow
          [1.0, 0.0, 1.0, 1.0], // Left face: purple
        ];
        let colors = [];
        for (let j = 0; j < faceColors.length; ++j) {
          const c = faceColors[j];
          // Repeat each color four times for the four vertices of the face
          colors = colors.concat(c, c, c, c);
        }
        const colorBuffer = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, colorBuffer);
        this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(colors), this.#gl.STATIC_DRAW);
        return colorBuffer;
    }

    setColorAttribute() {
      this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#buffers.color);
      this.#gl.vertexAttribPointer(this.#programInfo.attribLocations.vertexColor, 4, this.#gl.FLOAT, false, 0, 0);
      this.#gl.enableVertexAttribArray(this.#programInfo.attribLocations.vertexColor);
    }

    render(time) {
        const dt = time - this.#time;
        this.#time = time;
        this.#rotation += WebGL.#VR * dt / WebGL.#MS_PER_S;
        this.drawScene();
        requestAnimationFrame(this.render.bind(this));
    }

    initIndexBuffer() {
      const indexBuffer = this.#gl.createBuffer();
      this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      const indices = [
         0,  1,  2,      0,  2,  3,    // front
         4,  5,  6,      4,  6,  7,    // back
         8,  9,  10,     8,  10, 11,   // top
         12, 13, 14,     12, 14, 15,   // bottom
         16, 17, 18,     16, 18, 19,   // right
         20, 21, 22,     20, 22, 23,   // left
      ];
      this.#gl.bufferData(
            this.#gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            this.#gl.STATIC_DRAW);
      return indexBuffer;
    }
}
