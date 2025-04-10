function cube(size) {
    const positions = [];
    // top
    positions.push(-size / 2, size / 2, size / 2);
    positions.push(size / 2, size / 2, size / 2);
    positions.push(-size / 2, size / 2, -size / 2);
    positions.push(size / 2, size / 2, -size / 2);
    // bottom
    positions.push(-size / 2, -size / 2, -size / 2);
    positions.push(size / 2, -size / 2, -size / 2);
    positions.push(-size / 2, -size / 2, size / 2);
    positions.push(size / 2, -size / 2, size / 2);
    // left
    positions.push(-size / 2, -size / 2, -size / 2);
    positions.push(-size / 2, -size / 2, size / 2);
    positions.push(-size / 2, size / 2, -size / 2);
    positions.push(-size / 2, size / 2, size / 2);
    // right
    positions.push(size / 2, -size / 2, size / 2);
    positions.push(size / 2, -size / 2, -size / 2);
    positions.push(size / 2, size / 2, size / 2);
    positions.push(size / 2, size / 2, -size / 2);
    // front
    positions.push(-size / 2, -size / 2, size / 2);
    positions.push(size / 2, -size / 2, size / 2);
    positions.push(-size / 2, size / 2, size / 2);
    positions.push(size / 2, size / 2, size / 2);
    // back
    positions.push(size / 2, -size / 2, -size / 2);
    positions.push(-size / 2, -size / 2, -size / 2);
    positions.push(size / 2, size / 2, -size / 2);
    positions.push(-size / 2, size / 2, -size / 2);
    const indices = [];
    // top
    indices.push(0, 1, 2);
    indices.push(2, 1, 3);
    // bottom
    indices.push(4, 5, 6);
    indices.push(6, 5, 7);
    // left
    indices.push(8, 9, 10);
    indices.push(10, 9, 11);
    // right
    indices.push(12, 13, 14);
    indices.push(14, 13, 15);
    // front
    indices.push(16, 17, 18);
    indices.push(18, 17, 19);
    // back
    indices.push(20, 21, 22);
    indices.push(22, 21, 23);
    return {positions, indices};
}