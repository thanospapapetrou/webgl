#version 300 es
// TODO rename to frag
precision lowp float;

uniform vec3 direction;

in vec3 vertexNormal;
in vec4 vertexColor;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vertexColor;
    fragmentColor.rgb *= 0.25 + max(dot(normalize(vertexNormal), direction), 0.0); // TODO ambient light
}
