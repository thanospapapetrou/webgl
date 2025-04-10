'use strict';

class WebGL {
    static #ATTRIBUTES = {'position': 3, 'color': 4};
    static #CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]; // black
    static #CLEAR_DEPTH = 1.0;
    static #CONTEXT = 'webgl2';
    static #DISTANCE_MIN = 1.0; // 1 m
    static #DISTANCE_MAX = 100.0; // 100 m
    static #ERROR_COMPILING = (type, info) => `Error compiling ${(type == WebGLRenderingContext.VERTEX_SHADER) ? 'vertex' : 'fragment'} shader: ${info}`;
    static #ERROR_LINKING = (info) => `Error linking program: ${info}`;
    static #ERROR_LOADING = (url, status) => `Error loading ${url}: HTTP status ${status}`;
    static #FIELD_OF_VIEW = 0.5 * Math.PI; // π/2
    static #FORMAT_ANGLE = (angle) => `${angle} rad (${angle * 180 / Math.PI} °)`;
    static #FORMAT_DISTANCE = (distance) => `${distance} m`;
    static #MS_PER_S = 1000;
    static #MODEL = './models/cube.json';
    static #SELECTOR_AZIMUTH = 'span#azimuth';
    static #SELECTOR_CANVAS = 'canvas#gl';
    static #SELECTOR_DISTANCE = 'span#distance';
    static #SELECTOR_ELEVATION = 'span#elevation';
    static #SELECTOR_FPS = 'span#fps';
    static #SHADER_FRAGMENT = './glsl/fragment.glsl';
    static #SHADER_VERTEX = './glsl/vertex.glsl';
    static #UNIFORMS = ['projection', 'modelView'];
    static #VELOCITY_AZIMUTH = 0.25 * Math.PI; // 0.125 Hz
    static #VELOCITY_DISTANCE = 100.0; // 100 m/s
    static #VELOCITY_ELEVATION = 0.25 * Math.PI; // 0.125 Hz
    static #VELOCITY_ROTATION = 0.005 * Math.PI; // 0.0025 Hz
    static #Z_FAR = 200.0; // 100 m
    static #Z_NEAR = 0.1; // 0.1 m

    #gl;
    #program;
    #uniforms;
    #attributes;
    #buffers;
    #count;
    #azimuth;
    #elevation;
    #distance;
    #velocityAzimuth;
    #velocityElevation;
    #velocityDistance;
    #rotation;
    #time;

    static main() {
        // VAOs
        // split into renderer and renderable
        // resize
        // textures
        // light
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
        this.#count = model.indices.length;
        this.#azimuth = 0.0;
        this.#elevation = 0.0;
        this.#distance = WebGL.#DISTANCE_MAX;
        this.#velocityAzimuth = 0.0;
        this.#velocityElevation = 0.0;
        this.#velocityDistance = 0.0;
        this.#rotation = 0.0;
        this.#time = 0;
        this.#gl.clearColor(...WebGL.#CLEAR_COLOR);
        this.#gl.clearDepth(WebGL.#CLEAR_DEPTH);
        this.#gl.depthFunc(this.#gl.LEQUAL);
        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.cullFace(this.#gl.BACK);
        this.#gl.enable(this.#gl.CULL_FACE);
        this.#gl.canvas.addEventListener(Event.KEY_DOWN, this.keyboard.bind(this));
        this.#gl.canvas.addEventListener(Event.KEY_UP, this.keyboard.bind(this));
        this.#gl.canvas.focus();
        console.log(JSON.stringify(cube(1)));
    }

    keyboard(event) {
        this.#velocityAzimuth = 0.0;
        this.#velocityElevation = 0.0;
        this.#velocityDistance = 0.0;
        if (event.type == Event.KEY_DOWN) {
            switch (event.code) {
            case KeyCode.ARROW_UP:
                this.#velocityElevation = WebGL.#VELOCITY_ELEVATION;
                break;
            case KeyCode.ARROW_DOWN:
                this.#velocityElevation = -WebGL.#VELOCITY_ELEVATION;
                break;
            case KeyCode.ARROW_LEFT:
                this.#velocityAzimuth = WebGL.#VELOCITY_AZIMUTH;
                break;
            case KeyCode.ARROW_RIGHT:
                this.#velocityAzimuth = -WebGL.#VELOCITY_AZIMUTH;
                break;
            case KeyCode.PAGE_UP:
                this.#velocityDistance = WebGL.#VELOCITY_DISTANCE;
                break;
            case KeyCode.PAGE_DOWN:
                this.#velocityDistance = -WebGL.#VELOCITY_DISTANCE;
                break;
            }
        }
    }

    render(time) {
        const dt = (time - this.#time) / WebGL.#MS_PER_S;
        document.querySelector(WebGL.#SELECTOR_FPS).firstChild.nodeValue = 1 / dt;
        this.#time = time;
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#gl.useProgram(this.#program);
        const projection = mat4.create();
        mat4.perspective(projection, WebGL.#FIELD_OF_VIEW, this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                WebGL.#Z_NEAR, WebGL.#Z_FAR);
        this.#uniforms.projection = projection;
        const view = mat4.create();
        this.#azimuth += this.#velocityAzimuth * dt;
        if (this.#azimuth < 0) {
            this.#azimuth += 2 * Math.PI;
        } else if (this.#azimuth >= 2 * Math.PI) {
            this.#azimuth -= 2 * Math.PI;
        }
        document.querySelector(WebGL.#SELECTOR_AZIMUTH).firstChild.nodeValue = WebGL.#FORMAT_ANGLE(this.#azimuth);
        mat4.rotateY(view, view, -this.#azimuth);
        this.#elevation = Math.min(Math.max(this.#elevation + this.#velocityElevation * dt,
                0), Math.PI / 2);
        document.querySelector(WebGL.#SELECTOR_ELEVATION).firstChild.nodeValue = WebGL.#FORMAT_ANGLE(this.#elevation);
        mat4.rotateX(view, view, -this.#elevation);
        this.#distance = Math.min(Math.max(this.#distance + this.#velocityDistance * dt,
                WebGL.#DISTANCE_MIN), WebGL.#DISTANCE_MAX);
        document.querySelector(WebGL.#SELECTOR_DISTANCE).firstChild.nodeValue = WebGL.#FORMAT_DISTANCE(this.#distance);
        mat4.translate(view, view, [0.0, 0.0, this.#distance]);
        this.#attributes.position = this.#buffers.positions;
        this.#attributes.color = this.#buffers.colors;
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#buffers.indices);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    const modelView = mat4.create();
                    mat4.invert(modelView, view);
                    mat4.translate(modelView, modelView, [4 * i, 4 * j, 4 * k]);
                    this.#rotation += WebGL.#VELOCITY_ROTATION * dt;
                    if (this.#rotation >= 2 * Math.PI) {
                        this.#rotation -= 2 * Math.PI;
                    }
                    mat4.rotateX(modelView, modelView, this.#rotation * i);
                    mat4.rotateY(modelView, modelView, this.#rotation * j);
                    mat4.rotateZ(modelView, modelView, this.#rotation * k);
                    this.#uniforms.modelView = modelView;
                    this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_SHORT, 0);
                }
            }
        }
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
