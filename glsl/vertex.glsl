uniform mat4 modelView;
uniform mat4 projection;

attribute vec4 position;
attribute vec4 color;

varying lowp vec4 _color;

void main(void) {
  gl_Position = projection * modelView * position;
  _color = color;
}
