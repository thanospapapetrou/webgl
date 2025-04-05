class WebGL {
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

    static main() {
        new WebGL(document.querySelector('canvas#gl').getContext('webgl'));
    }

    constructor(gl) {
        this.#gl = gl;
        const shaderProgram = this.initShaderProgram();
        const programInfo = {
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
        const buffers = this.initBuffers();
        this.drawScene(programInfo, buffers);
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
        return {
            position: positionBuffer,
            color: colorBuffer
        };
    }

    initPositionBuffer() {
      const positionBuffer = this.#gl.createBuffer();
      this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positionBuffer);
      const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
      this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(positions), this.#gl.STATIC_DRAW);
      return positionBuffer;
    }

    drawScene(programInfo, buffers) {
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
        mat4.translate(modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -6.0]); // amount to translate
        this.setPositionAttribute(buffers, programInfo);
        this.setColorAttribute(buffers, programInfo);
        this.#gl.useProgram(programInfo.program);
        this.#gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.#gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        const offset = 0;
        const vertexCount = 4;
        this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, offset, vertexCount);
    }

    setPositionAttribute(buffers, programInfo) {
        const numComponents = 2; // pull out 2 values per iteration
        const type = this.#gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, buffers.position);
        this.#gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        this.#gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    initColorBuffer() {
        const colors = [
            1.0,
            1.0,
            1.0,
            1.0, // white
            1.0,
            0.0,
            0.0,
            1.0, // red
            0.0,
            1.0,
            0.0,
            1.0, // green
            0.0,
            0.0,
            1.0,
            1.0, // blue
        ];
        const colorBuffer = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, colorBuffer);
        this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(colors), this.#gl.STATIC_DRAW);
        return colorBuffer;
    }

    setColorAttribute(buffers, programInfo) {
      const numComponents = 4;
      const type = this.#gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, buffers.color);
      this.#gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
      this.#gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }
}
