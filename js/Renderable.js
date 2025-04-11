'use strict';

class Renderable {
    #gl;
    #buffers;
    #count;

    constructor(gl, model) {
        this.#gl = gl;
        this.#buffers = {
            positions: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(model.positions)),
            normals: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(model.normals)),
            colors: this.#createBuffer(this.#gl.ARRAY_BUFFER, new Float32Array(model.colors)),
            indices: this.#createBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices))
        };
        this.#count = model.indices.length;
    }

    get buffers() {
        return this.#buffers;
    }

    get count() {
        return this.#count;
    }

    #createBuffer(type, data) {
        const buffer = this.#gl.createBuffer();
        this.#gl.bindBuffer(type, buffer);
        this.#gl.bufferData(type, data, this.#gl.STATIC_DRAW);
        return buffer;
    }
}
