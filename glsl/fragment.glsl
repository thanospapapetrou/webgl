#version 300 es
precision lowp float;

in vec4 vertexColor;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vertexColor;
}
