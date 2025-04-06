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
    static #UNIFORMS = ['projection', 'modelView'];
    static #VR = 0.5 * Math.PI; // 0.25 Hz
    static #Z_FAR = 100.0;
    static #Z_NEAR = 0.1;

    #gl;
    #time;
    #rotation;
    #program;
    #buffers;

    static main() {
        const webGl = new WebGL(document.querySelector('canvas#gl').getContext('webgl'));
    }

    constructor(gl) {
        this.#gl = gl;
        this.#time = 0;
        this.#rotation = 0.0;
        this.#link(WebGL.#SHADER_VERTEX, WebGL.#SHADER_FRAGMENT, WebGL.#UNIFORMS).then((program) => {
            this.#program = {
                program: program,
                attribLocations: {
                    vertexPosition: this.#gl.getAttribLocation(program, 'aVertexPosition'),
                    vertexColor: this.#gl.getAttribLocation(program, 'aVertexColor')
                }
            };
            this.#load('./models/cube.json').then((response) => response.json()).then((cube) => {
                this.#buffers = {
                    positions: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(cube.positions)),
                    colors: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(cube.colors)),
                    indices: this.#createBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.indices))
                };
                requestAnimationFrame(this.render.bind(this));
            });
        });
    }

    #link(vertex, fragment, uniforms) {
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
                program.uniforms = {};
                const gl = this.#gl;
                for (let uniform of uniforms) {
                    const location = this.#gl.getUniformLocation(program, uniform);
                    Object.defineProperty(program.uniforms, uniform, {
                        set(uniform) {
                            gl.uniformMatrix4fv(location, false, uniform);
                        }
                    });
                }
                program.attributes = {};
                return program;
            });
        });
    }

    #compile(url, type) {
        return this.#load(url).then((response) => response.text()).then((source) => {
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

    #createBuffer(type, data) {
        const buffer = this.#gl.createBuffer();
        this.#gl.bindBuffer(type, buffer);
        this.#gl.bufferData(type, data, this.#gl.STATIC_DRAW);
        return buffer;
    }

    #load(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(WebGL.ERROR_LOADING(url, response.status));
            }
            return response;
        });
    }

    drawScene() {
        this.#gl.clearColor(...WebGL.#CLEAR_COLOR);
        this.#gl.clearDepth(WebGL.#CLEAR_DEPTH);
        this.#gl.depthFunc(this.#gl.LEQUAL);
        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#gl.useProgram(this.#program.program);
        const projection = mat4.create();
        mat4.perspective(projection, WebGL.#FIELD_OF_VIEW, this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                WebGL.#Z_NEAR, WebGL.#Z_FAR);
        this.#program.program.uniforms.projection = projection;
        const modelView = mat4.create();
        mat4.translate(modelView, modelView, [-0.0, 0.0, -6.0]);
        mat4.rotate(modelView, modelView, this.#rotation, WebGL.#AXIS_Z);
        mat4.rotate(modelView, modelView, this.#rotation * 0.7, WebGL.#AXIS_Y);
        mat4.rotate(modelView, modelView, this.#rotation * 0.3, WebGL.#AXIS_X);
        this.#program.program.uniforms.modelView = modelView;
        this.setPositionAttribute();
        this.setColorAttribute();
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        const vertexCount = 36;
        this.#gl.drawElements(this.#gl.TRIANGLES, vertexCount, this.#gl.UNSIGNED_SHORT, 0);
    }

    setPositionAttribute() {
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#buffers.positions);
        this.#gl.vertexAttribPointer(this.#program.attribLocations.vertexPosition, 3, this.#gl.FLOAT, false, 0, 0);
        this.#gl.enableVertexAttribArray(this.#program.attribLocations.vertexPosition);
    }

    setColorAttribute() {
      this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#buffers.colors);
      this.#gl.vertexAttribPointer(this.#program.attribLocations.vertexColor, 4, this.#gl.FLOAT, false, 0, 0);
      this.#gl.enableVertexAttribArray(this.#program.attribLocations.vertexColor);
    }

    render(time) {
        const dt = time - this.#time;
        this.#time = time;
        this.#rotation += WebGL.#VR * dt / WebGL.#MS_PER_S;
        this.drawScene();
        requestAnimationFrame(this.render.bind(this));
    }
}
