'use strict';

class WebGL {
    static #ATTRIBUTES = ['position', 'normal', 'color'];
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
    static #LIGHT = {
        ambient: [0.25, 0.25, 0.25],
        directional: {
            color: [0.75, 0.25, 0.25],
            direction: [0.0, 1.0, 0.0]
        }
    };
    static #MODEL_CUBE = './models/cube.json';
    static #MODEL_TETRAHEDRON = './models/tetrahedron.json';
    static #SELECTOR_AZIMUTH = 'span#azimuth';
    static #SELECTOR_CANVAS = 'canvas#gl';
    static #SELECTOR_DISTANCE = 'span#distance';
    static #SELECTOR_ELEVATION = 'span#elevation';
    static #SELECTOR_FPS = 'span#fps';
    static #SHADER_FRAGMENT = './glsl/shader.frag';
    static #SHADER_VERTEX = './glsl/shader.vert';
    static #UNIFORM_CAMERA = 'camera';
    static #UNIFORM_LIGHT_AMBIENT = 'light.ambient';
    static #UNIFORM_LIGHT_DIRECTIONAL_COLOR = 'light.directional.color';
    static #UNIFORM_LIGHT_DIRECTIONAL_DIRECTION = 'light.directional.direction';
    static #UNIFORM_MODEL = 'model';
    static #UNIFORM_PROJECTION = 'projection';
    static #VELOCITY_AZIMUTH = 0.25 * Math.PI; // 0.125 Hz
    static #VELOCITY_DISTANCE = 10.0; // 10 m/s
    static #VELOCITY_ELEVATION = 0.25 * Math.PI; // 0.125 Hz
    static #VELOCITY_ROTATION = 0.5 * Math.PI; // 0.25 Hz
    static #Z_FAR = 200.0; // 100 m
    static #Z_NEAR = 0.1; // 0.1 m

    #gl;
    #renderer;
    #renderables;
    #azimuth;
    #elevation;
    #distance;
    #velocityAzimuth;
    #velocityElevation;
    #velocityDistance;
    #rotation;
    #time;

    static main() {
        // TODO
        // data
        // resize
        // configuration
        // viewport
        // textures
        // light
        WebGL.#load(WebGL.#SHADER_VERTEX).then((response) => response.text()).then((vertex) => {
            WebGL.#load(WebGL.#SHADER_FRAGMENT).then((response) => response.text()).then((fragment) => {
                WebGL.#load(WebGL.#MODEL_CUBE).then((response) => response.json()).then((cube) => {
                    WebGL.#load(WebGL.#MODEL_TETRAHEDRON).then((response) => response.json()).then((tetrahedron) => {
                        const gl = document.querySelector(WebGL.#SELECTOR_CANVAS).getContext(WebGL.#CONTEXT);
                        const renderer = new Renderer(gl, vertex, fragment, [WebGL.#UNIFORM_PROJECTION,
                                WebGL.#UNIFORM_CAMERA, WebGL.#UNIFORM_MODEL, WebGL.#UNIFORM_LIGHT_AMBIENT,
                                WebGL.#UNIFORM_LIGHT_DIRECTIONAL_COLOR, WebGL.#UNIFORM_LIGHT_DIRECTIONAL_DIRECTION],
                                WebGL.#ATTRIBUTES);
                        const webGl = new WebGL(gl, renderer, [
                                new Renderable(gl, renderer.attributes, cube),
                                new Renderable(gl, renderer.attributes, tetrahedron),
                                new Renderable(gl, renderer.attributes, uvSphere(16, 16))]);
                        requestAnimationFrame(webGl.render.bind(webGl));
                    })
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

    constructor(gl, renderer, renderables) {
        this.#gl = gl;
        this.#renderer = renderer;
        this.#renderables = renderables;
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
        this.#elevation = Math.min(Math.max(elevation, -Math.PI / 2), Math.PI / 2);
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

    get rotation() {
        return this.#rotation;
    }

    set rotation(rotation) {
        this.#rotation = rotation;
        if (this.#rotation >= 2 * Math.PI) {
            this.#rotation -= 2 * Math.PI;
        }
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
        this.idle(time);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
        this.#gl.useProgram(this.#renderer.program);
        this.#gl.uniformMatrix4fv(this.#renderer.uniforms[WebGL.#UNIFORM_PROJECTION], false, this.#projection);
        this.#gl.uniformMatrix4fv(this.#renderer.uniforms[WebGL.#UNIFORM_CAMERA], false, this.#camera);
        this.#gl.uniform3fv(this.#renderer.uniforms[WebGL.#UNIFORM_LIGHT_AMBIENT], WebGL.#LIGHT.ambient);
        this.#gl.uniform3fv(this.#renderer.uniforms[WebGL.#UNIFORM_LIGHT_DIRECTIONAL_COLOR],
                WebGL.#LIGHT.directional.color);
        this.#gl.uniform3fv(this.#renderer.uniforms[WebGL.#UNIFORM_LIGHT_DIRECTIONAL_DIRECTION],
                WebGL.#LIGHT.directional.direction);
        const n = 3;
        const m = 4;
        const l = 5;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                for (let k = 0; k < l; k++) {
                    this.#gl.uniformMatrix4fv(this.#renderer.uniforms[WebGL.#UNIFORM_MODEL], false, this.#model(i, j, k));
                    this.#renderables[(i * m * l + j * l + k) % this.#renderables.length].render();
                }
            }
        }
        requestAnimationFrame(this.render.bind(this));
    }

    idle(time) {
    const dt = (time - this.#time) / WebGL.#MS_PER_S;
        this.fps = 1 / dt;
        this.azimuth += this.#velocityAzimuth * dt;
        this.elevation += this.#velocityElevation * dt;
        this.distance += this.#velocityDistance * dt;
        this.rotation += WebGL.#VELOCITY_ROTATION * dt;
        this.#time = time;
    }

    get #projection() {
        const projection = mat4.create();
        mat4.perspective(projection, WebGL.#FIELD_OF_VIEW, this.#gl.canvas.clientWidth / this.#gl.canvas.clientHeight,
                WebGL.#Z_NEAR, WebGL.#Z_FAR);
        return projection;
    }

    get #camera() {
        const camera = mat4.create();
        mat4.rotateY(camera, camera, -this.azimuth);
        mat4.rotateX(camera, camera, -this.elevation);
        mat4.translate(camera, camera, [0.0, 0.0, this.distance]);
        return camera;
    }

    #model(i, j, k) {
        const model = mat4.create();
        mat4.translate(model, model, [2 * i, 2 * j, 2 * k]);
        mat4.rotateX(model, model, this.rotation * i);
        mat4.rotateY(model, model, this.rotation * j);
        mat4.rotateZ(model, model, this.rotation * k);
        return model;
    }
}
