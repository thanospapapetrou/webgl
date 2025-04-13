function icosahedron(radius) {
    const n = 5;
    const horizontalAngle = Math.PI * 2 / n; // 72 degrees
    const verticalAngle = Math.atan(1 / 2);
    const positions = [];
    // bottom
    positions.push(0.0, -0.5, 0.0);
    // lower middle tier
    for (let i = 0; i < n; i++) {
        const x = Math.cos(-verticalAngle) * Math.cos(i * horizontalAngle);
        const y = Math.sin(verticalAngle);
        const z = Math.cos(-verticalAngle) * Math.sin(i * horizontalAngle);
        positions.push(x, y, z);
    }
    // upper middle tier
    for (let i = 0; i < n; i++) {
        const x = Math.sin(verticalAngle) * Math.cos(i * horizontalAngle + horizontalAngle / 2);
        const y = Math.cos(verticalAngle);
        const z = Math.sin(verticalAngle) * Math.sin(i * horizontalAngle + horizontalAngle / 2);
        positions.push(x, y, z);
    }
    // top
    positions.push(0.0, 0.5, 0.0);
    const normals = [];
    // bottom
    normals.push(0.0, -1.0, 0.0);
    // lower middle tier
    for (let i = 0; i < n; i++) {
        normals.push(0.0, 1.0, 0.0); // TODO
    }
    // upper middle tier
    for (let i = 0; i < n; i++) {
        normals.push(0.0, 1.0, 0.0); // TODO
    }
    // top
    normals.push(0.0, 1, 0.0);
    const indices = [];
    // bottom
    for (let i = 0; i < n; i++) {
        indices.push(i + 1, 0, (i + 2 > n) ? 1 : i + 2);
    }
    // middle tier
    for (let i = 0; i < n; i++) {
        indices.push(n + i + 1, i + 1, (i + 2 > n) ? 1 : i + 2);
    }
    // top
    for (let i = 0; i < n; i++) {
        indices.push((n + i + 2 > 2 * n) ? n + 1 : i, 2 * n + 1, n + i + 1);
    }
    const colors = []; // TODO remove
    for (let i = 0; i < positions.length / 3; i++) {
        const red = i % 3;
        const green = Math.floor(i / 3) % 3;
        const blue = Math.floor(i / 3 / 3) % 3;
        colors.push(red * 0.5, green * 0.5, blue * 0.5, 1.0);
    }
    return {positions, normals, indices, colors};
}