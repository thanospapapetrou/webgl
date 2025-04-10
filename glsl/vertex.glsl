#version 300 es

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

in vec4 position;
in vec3 normal;
in vec4 color;

out vec3 vertexNormal;
out vec4 vertexColor;

void main(void) {
  gl_Position = projection * view * model * position;
  vertexNormal = mat3(model) * normal;
  vertexColor = color;
}
