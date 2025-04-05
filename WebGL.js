class WebGL {
    static #MS_PER_S = 1000;
    static #VR = 0.5 * Math.PI; // 0.25 Hz
    static VERTEX_SHADER = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main(void) {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          vColor = aVertexColor;
        }
    `;
    static FRAGMENT_SHADER = `
        varying lowp vec4 vColor;

        void main(void) {
          gl_FragColor = vColor;
        }
    `;

    #gl;
    #time;
    #rotation;
    #programInfo;
    #buffers;

    static main() {
        const webGl = new WebGL(document.querySelector('canvas#gl').getContext('webgl'));
        requestAnimationFrame(webGl.render.bind(webGl));
    }

    constructor(gl) {
        this.#gl = gl;
        this.#time = 0;
        this.#rotation = 0;
        const shaderProgram = this.initShaderProgram();
        this.#programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.#gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor: this.#gl.getAttribLocation(shaderProgram, 'aVertexColor')
            },
            uniformLocations: {
                projectionMatrix: this.#gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.#gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
            }
        };
        this.#buffers = this.initBuffers();
    }

    initShaderProgram() {
        const vertexShader = this.loadShader(this.#gl.VERTEX_SHADER, WebGL.VERTEX_SHADER);
        const fragmentShader = this.loadShader(this.#gl.FRAGMENT_SHADER, WebGL.FRAGMENT_SHADER);
        const shaderProgram = this.#gl.createProgram();
        this.#gl.attachShader(shaderProgram, vertexShader);
        this.#gl.attachShader(shaderProgram, fragmentShader);
        this.#gl.linkProgram(shaderProgram);
        if (!this.#gl.getProgramParameter(shaderProgram, this.#gl.LINK_STATUS)) {
            alert(`Unable to initialize the shader program: ${this.#gl.getProgramInfoLog(shaderProgram)}`);
            return null;
        }
        return shaderProgram;
    }

    loadShader(type, source) {
        const shader = this.#gl.createShader(type);
        this.#gl.shaderSource(shader, source);
        this.#gl.compileShader(shader);
        if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
            alert(`An error occurred compiling the shaders: ${this.#gl.getShaderInfoLog(shader)}`);
            this.#gl.deleteShader(shader);
            return null;
        }
        return shader;
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
        this.#gl.clearColor(0.0, 0.0, 0.0, 1.0); // black
        this.#gl.clearDepth(1.0);
        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.depthFunc(this.#gl.LEQUAL);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        const fieldOfView = (45 * Math.PI) / 180;
        const aspect = this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, // matrix to translate
                [-0.0, 0.0, -6.0]); // amount to translate
        mat4.rotate(modelViewMatrix, modelViewMatrix,
                this.#rotation, [0, 0, 1]); // axis to rotate around
        mat4.rotate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to rotate
          this.#rotation, // amount to rotate in radians
          [0, 0, 1],
        ); // axis to rotate around (Z)
        mat4.rotate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to rotate
          this.#rotation * 0.7, // amount to rotate in radians
          [0, 1, 0],
        ); // axis to rotate around (Y)
        mat4.rotate(
          modelViewMatrix, // destination matrix
          modelViewMatrix, // matrix to rotate
          this.#rotation * 0.3, // amount to rotate in radians
          [1, 0, 0],
        ); // axis to rotate around (X)
        this.setPositionAttribute();
        this.setColorAttribute();
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        this.#gl.useProgram(this.#programInfo.program);
        this.#gl.uniformMatrix4fv(this.#programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.#gl.uniformMatrix4fv(this.#programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        const vertexCount = 36;
        const type = this.#gl.UNSIGNED_SHORT;
        const offset = 0;
        this.#gl.drawElements(this.#gl.TRIANGLES, vertexCount, type, offset);
    }

    setPositionAttribute() {
        const numComponents = 3; // pull out 2 values per iteration
        const type = this.#gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#buffers.position);
        this.#gl.vertexAttribPointer(
            this.#programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
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
      const numComponents = 4;
      const type = this.#gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#buffers.color);
      this.#gl.vertexAttribPointer(
        this.#programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
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
