'use strict';

class Renderer {
    static #ERROR_COMPILING = (type, info) => `Error compiling ${(type == WebGLRenderingContext.VERTEX_SHADER) ? 'vertex' : 'fragment'} shader: ${info}`;
    static #ERROR_LINKING = (info) => `Error linking program: ${info}`;

    #gl;
    #program;
    #uniforms;
    #attributes;

    constructor(gl, vertex, fragment, uniforms, attributes) {
        this.#gl = gl;
        this.#link(vertex, fragment);
        this.#resolveUniforms(uniforms);
        this.#resolveAttributes(attributes);
    }

    get program() {
        return this.#program;
    }

    get uniforms() {
        return this.#uniforms;
    }

    get attributes() {
        return this.#attributes;
    }

    #link(vertex, fragment) {
        this.#program = this.#gl.createProgram();
        this.#gl.attachShader(this.#program, this.#compile(vertex, this.#gl.VERTEX_SHADER));
        this.#gl.attachShader(this.#program, this.#compile(fragment, this.#gl.FRAGMENT_SHADER));
        this.#gl.linkProgram(this.#program);
        if (!this.#gl.getProgramParameter(this.#program, this.#gl.LINK_STATUS)) {
            const info = this.#gl.getProgramInfoLog(this.#program);
            this.#gl.deleteProgram(this.#program);
            this.#program = null;
            throw new Error(Renderer.#ERROR_LINKING(info));
        }
    }

    #compile(source, type) {
        const shader = this.#gl.createShader(type);
        this.#gl.shaderSource(shader, source);
        this.#gl.compileShader(shader);
        if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) {
            const info = this.#gl.getShaderInfoLog(shader);
            this.#gl.deleteShader(shader);
            throw new Error(Renderer.#ERROR_COMPILING(type, info))
        }
        return shader;
    }

    #resolveUniforms(uniforms) {
        this.#uniforms = {};
        for (let uniform of uniforms) {
            this.#uniforms[uniform] = this.#gl.getUniformLocation(this.#program, uniform);
        }
    }

    #resolveAttributes(attributes) {
        this.#attributes = {};
        for (let attribute of attributes) {
            this.#attributes[attribute] = this.#gl.getAttribLocation(this.#program, attribute);
        }
    }
}
