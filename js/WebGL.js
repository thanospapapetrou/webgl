'use strict';

class WebGL {
    static #ATTRIBUTES = {'position': 3, 'normal': 3, 'color': 4};
    static #CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]; // black
    static #CLEAR_DEPTH = 1.0;
    static #CONTEXT = 'webgl2';
    static #DISTANCE_MIN = 1.0; // 1 m
    static #DISTANCE_MAX = 100.0; // 100 m
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
    static #UNIFORMS = ['projection', 'view', 'model', 'direction'];
    static #VELOCITY_AZIMUTH = 0.25 * Math.PI; // 0.125 Hz
    static #VELOCITY_DISTANCE = 100.0; // 100 m/s
    static #VELOCITY_ELEVATION = 0.25 * Math.PI; // 0.125 Hz
    static #VELOCITY_ROTATION = 0.005 * Math.PI; // 0.0025 Hz
    static #Z_FAR = 200.0; // 100 m
    static #Z_NEAR = 0.1; // 0.1 m

    #gl;
    #renderer;
    #renderable;
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
        // resize
        // textures
        // light
        WebGL.#load(WebGL.#SHADER_VERTEX).then((response) => response.text()).then((vertex) => {
            WebGL.#load(WebGL.#SHADER_FRAGMENT).then((response) => response.text()).then((fragment) => {
                WebGL.#load(WebGL.#MODEL).then((response) => response.json()).then((cube) => {
                    const gl = document.querySelector(WebGL.#SELECTOR_CANVAS).getContext(WebGL.#CONTEXT);
                    const webGl = new WebGL(gl, new Renderer(gl, vertex, fragment, WebGL.#UNIFORMS, WebGL.#ATTRIBUTES),
                            new Renderable(gl, cube));
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

    constructor(gl, renderer, renderable) {
        this.#gl = gl;
        this.#renderer = renderer;
        this.#renderable = renderable;
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
    }

    get azimuth() {
        return this.#azimuth;
    }

    set azimuth(azimuth) {
        this.#azimuth = azimuth;
        if (this.#azimuth < 0) {
            this.#azimuth += 2 * Math.PI;
        } else if (this.#azimuth >= 2 * Math.PI) {
            this.#azimuth -= 2 * Math.PI;
        }
        document.querySelector(WebGL.#SELECTOR_AZIMUTH).firstChild.nodeValue = WebGL.#FORMAT_ANGLE(this.#azimuth);
    }

    get elevation() {
        return this.#elevation;
    }

    set elevation(elevation) {
        this.#elevation = Math.min(Math.max(elevation, 0), Math.PI / 2);
        document.querySelector(WebGL.#SELECTOR_ELEVATION).firstChild.nodeValue = WebGL.#FORMAT_ANGLE(this.#elevation);
    }

    get distance() {
        return this.#distance;
    }

    set distance(distance) {
        this.#distance = Math.min(Math.max(distance, WebGL.#DISTANCE_MIN), WebGL.#DISTANCE_MAX);
        document.querySelector(WebGL.#SELECTOR_DISTANCE).firstChild.nodeValue = WebGL.#FORMAT_DISTANCE(this.#distance);
    }

    set fps(fps) {
        document.querySelector(WebGL.#SELECTOR_FPS).firstChild.nodeValue = fps;
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
        this.fps = 1 / dt;
        this.azimuth += this.#velocityAzimuth * dt;
        this.elevation += this.#velocityElevation * dt;
        this.distance += this.#velocityDistance * dt;
        this.#time = time;
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#gl.useProgram(this.#renderer.program);
        this.#gl.uniformMatrix4fv(this.#renderer.uniforms.projection, false, this.#projection);
        this.#gl.uniformMatrix4fv(this.#renderer.uniforms.view, false, this.#view);
        this.#gl.uniform3fv(this.#renderer.uniforms.direction, [-1.41421356237, -1.41421356237, 0.0]);
        this.#renderer.attributes.position = this.#renderable.buffers.positions;
        this.#renderer.attributes.normal = this.#renderable.buffers.normals;
        this.#renderer.attributes.color = this.#renderable.buffers.colors;
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#renderable.buffers.indices);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    const model = mat4.create(); // TODO separate method
                    mat4.translate(model, model, [4 * i, 4 * j, 4 * k]);
                    this.#rotation += WebGL.#VELOCITY_ROTATION * dt;
                    if (this.#rotation >= 2 * Math.PI) {
                        this.#rotation -= 2 * Math.PI;
                    }
                    mat4.rotateX(model, model, this.#rotation * i);
                    mat4.rotateY(model, model, this.#rotation * j);
                    mat4.rotateZ(model, model, this.#rotation * k);
                    this.#gl.uniformMatrix4fv(this.#renderer.uniforms.model, false, model);
                    this.#gl.drawElements(this.#gl.TRIANGLES, this.#renderable.count, this.#gl.UNSIGNED_SHORT, 0);
                }
            }
        }
        requestAnimationFrame(this.render.bind(this));
    }

    get #projection() {
        const projection = mat4.create();
        mat4.perspective(projection, WebGL.#FIELD_OF_VIEW, this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                WebGL.#Z_NEAR, WebGL.#Z_FAR);
        return projection;
    }

    get #view() { // TODO rename to camera and let shader inert
        const view = mat4.create();
        mat4.rotateY(view, view, -this.azimuth);
        mat4.rotateX(view, view, -this.elevation);
        mat4.translate(view, view, [0.0, 0.0, this.distance]);
        mat4.invert(view, view);
        return view;
    }
}
