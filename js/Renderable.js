'use strict';

class Renderable {
    #gl;
    #array;
    #count;

    constructor(gl, attributes, model) {
        this.#gl = gl;
        this.#array = this.#gl.createVertexArray();
        this.#gl.bindVertexArray(this.#array);
        // TODO cleanup
        const positions = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, positions);
        this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(model.positions), this.#gl.STATIC_DRAW);
        this.#gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
        this.#gl.enableVertexAttribArray(attributes.position);
        const normals = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, normals);
        this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(model.normals), this.#gl.STATIC_DRAW);
        this.#gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);
        this.#gl.enableVertexAttribArray(attributes.normal);
        const colors = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, colors);
        this.#gl.bufferData(this.#gl.ARRAY_BUFFER, new Float32Array(model.colors), this.#gl.STATIC_DRAW);
        this.#gl.vertexAttribPointer(attributes.color, 4, gl.FLOAT, false, 0, 0);
        this.#gl.enableVertexAttribArray(attributes.color);
        const indices = this.#gl.createBuffer();
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, indices);
        this.#gl.bufferData(this.#gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), this.#gl.STATIC_DRAW);
        this.#gl.bindVertexArray(null);
        this.#count = model.indices.length;
    }

    render() {
        this.#gl.bindVertexArray(this.#array);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_SHORT, 0); // TODO byte
    }
}
