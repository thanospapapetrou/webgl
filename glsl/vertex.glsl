#version 300 es

uniform mat4 modelView;
uniform mat4 projection;

in vec4 position;
in vec4 color;

out vec4 vertexColor;

void main(void) {
  gl_Position = projection * modelView * position;
  vertexColor = color;
}
