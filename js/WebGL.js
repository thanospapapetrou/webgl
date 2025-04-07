class WebGL {
    static #ATTRIBUTES = {'position': 3, 'color': 4};
    static #AXIS_X = [1.0, 0.0, 0.0];
    static #AXIS_Y = [0.0, 1.0, 0.0];
    static #AXIS_Z = [0.0, 0.0, 1.0];
    static #CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]; // black
    static #CLEAR_DEPTH = 1.0;
    static #CONTEXT = 'webgl';
    static #ERROR_COMPILING = (type, info) => `Error compiling ${(type == WebGLRenderingContext.VERTEX_SHADER) ? 'vertex' : 'fragment'} shader: ${info}`;
    static #ERROR_LINKING = (info) => `Error linking program: ${info}`;
    static #ERROR_LOADING = (url, status) => `Error loading ${url}: HTTP status ${status}`;
    static #FIELD_OF_VIEW = 0.25 * Math.PI; // 45 deg
    static #MS_PER_S = 1000;
    static #MODEL = './models/cube.json';
    static #SELECTOR_CANVAS = 'canvas#gl';
    static #SHADER_FRAGMENT = './glsl/fragment.glsl';
    static #SHADER_VERTEX = './glsl/vertex.glsl';
    static #UNIFORMS = ['projection', 'modelView'];
    static #VR = 0.5 * Math.PI; // 0.25 Hz
    static #Z_FAR = 100.0;
    static #Z_NEAR = 0.1;

    #gl;
    #program;
    #uniforms;
    #attributes;
    #buffers;
    #rotation;
    #time;

    static main() {
        // TODO WebGL 2
        // VAOs
        // draw multiple objects
        // keyboard events
        // resize
        // back face culling
        // wireframes
        WebGL.#load(WebGL.#SHADER_VERTEX).then((response) => response.text()).then((vertex) => {
            WebGL.#load(WebGL.#SHADER_FRAGMENT).then((response) => response.text()).then((fragment) => {
                WebGL.#load(WebGL.#MODEL).then((response) => response.json()).then((cube) => {
                    const webGl = new WebGL(document.querySelector(WebGL.#SELECTOR_CANVAS).getContext(WebGL.#CONTEXT),
                            vertex, fragment, cube);
                    requestAnimationFrame(webGl.render.bind(webGl));
                })
            })
        });
    }

    static #load(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(WebGL.#ERROR_LOADING(url, response.status));
            }
            return response;
        });
    }

    constructor(gl, vertex, fragment, model) {
        this.#gl = gl;
        this.#program = this.#link(vertex, fragment);
        this.#uniforms = this.#resolveUniforms(WebGL.#UNIFORMS);
        this.#attributes = this.#resolveAttributes(WebGL.#ATTRIBUTES);
        this.#buffers = {
            positions: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(model.positions)),
            colors: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(model.colors)),
            indices: this.#createBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices))
        };
        this.#rotation = 0.0;
        this.#time = 0;
        this.#gl.clearColor(...WebGL.#CLEAR_COLOR);
        this.#gl.clearDepth(WebGL.#CLEAR_DEPTH);
        this.#gl.depthFunc(this.#gl.LEQUAL);
        this.#gl.enable(this.#gl.DEPTH_TEST);
    }

    render(time) {
        const dt = time - this.#time;
        this.#time = time;
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#gl.useProgram(this.#program);
        const projection = mat4.create();
        mat4.perspective(projection, WebGL.#FIELD_OF_VIEW, this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                WebGL.#Z_NEAR, WebGL.#Z_FAR);
        this.#uniforms.projection = projection;
        const modelView = mat4.create();
        mat4.translate(modelView, modelView, [-0.0, 0.0, -6.0]);
        this.#rotation += WebGL.#VR * dt / WebGL.#MS_PER_S;
        mat4.rotate(modelView, modelView, this.#rotation, WebGL.#AXIS_Z);
        mat4.rotate(modelView, modelView, this.#rotation * 0.7, WebGL.#AXIS_Y);
        mat4.rotate(modelView, modelView, this.#rotation * 0.3, WebGL.#AXIS_X);
        this.#uniforms.modelView = modelView;
        this.#attributes.position = this.#buffers.positions;
        this.#attributes.color = this.#buffers.colors;
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        const vertexCount = 36;
        this.#gl.drawElements(this.#gl.TRIANGLES, vertexCount, this.#gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(this.render.bind(this));
    }

    #link(vertex, fragment) {
        const program = this.#gl.createProgram();
        this.#gl.attachShader(program, this.#compile(vertex, this.#gl.VERTEX_SHADER));
        this.#gl.attachShader(program, this.#compile(fragment, this.#gl.FRAGMENT_SHADER));
        this.#gl.linkProgram(program);
        if (!this.#gl.getProgramParameter(program, this.#gl.LINK_STATUS)) {
            const info = this.#gl.getProgramInfoLog(program);
            this.#gl.deleteProgram(program);
            throw new Error(WebGL.#ERROR_LINKING(info));
        }
        return program;
    }

    #resolveUniforms(uniforms) {
        const result = {};
        const gl = this.#gl;
        for (let uniform of uniforms) {
            const location = this.#gl.getUniformLocation(this.#program, uniform);
            Object.defineProperty(result, uniform, {
                set(uniform) {
                    gl.uniformMatrix4fv(location, false, uniform);
                }
            });
        }
        return result;
    }

    #resolveAttributes(attributes) {
        const result = {};
        const gl = this.#gl;
        for (let attribute of Object.keys(attributes)) {
            const location = this.#gl.getAttribLocation(this.#program, attribute);
            const size = attributes[attribute];
            Object.defineProperty(result, attribute, {
                set(attribute) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, attribute);
                    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(location);
                }
            });
        }
        return result;
    }

    #compile(source, type) {
        const shader = this.#gl.createShader(type);
        this.#gl.shaderSource(shader, source);
        this.#gl.compileShader(shader);
        if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
            const info = this.#gl.getShaderInfoLog(shader);
            this.#gl.deleteShader(shader);
            throw new Error(WebGL.#ERROR_COMPILING(type, info))
        }
        return shader;
    }

    #createBuffer(type, data) {
        const buffer = this.#gl.createBuffer();
        this.#gl.bindBuffer(type, buffer);
        this.#gl.bufferData(type, data, this.#gl.STATIC_DRAW);
        return buffer;
    }
}
