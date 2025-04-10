#version 300 es

precision lowp float;

uniform vec3 direction;

in vec3 vertexNormal;
in vec4 vertexColor;

out vec4 fragmentColor;

void main(void) {
    fragmentColor = vertexColor;
    fragmentColor.rgb *= dot(normalize(vertexNormal), direction);
}
