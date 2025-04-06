uniform mat4 modelView;
uniform mat4 projection;

attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

varying lowp vec4 _color;

void main(void) {
  gl_Position = projection * modelView * aVertexPosition;
  _color = aVertexColor;
}
