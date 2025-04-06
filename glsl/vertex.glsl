attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 modelView;
uniform mat4 projection;

varying lowp vec4 vColor;

void main(void) {
  gl_Position = projection * modelView * aVertexPosition;
  vColor = aVertexColor;
}
