function tetrahedron() {
    const a = -2 * Math.PI / 3;
    const p1 = [0.0, 1.0, 0.0];
    const p2 = [0.0, Math.cos(a), Math.sin(a)];
    const p3 = [Math.sin(a) * Math.sin(a), Math.cos(a), Math.sin(a) * Math.cos(a)];
    const p4 = [Math.sin(a) * Math.sin(2 * a), Math.cos(a), Math.sin(a) * Math.cos(2 * a)];
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    // bottom
    positions.push(...p2, ...p3, ...p4);
    const n1 = normalize(add(p2, p3, p4));
    normals.push(...n1, ...n1, ...n1);
    colors.push(1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0);
    indices.push(0, 1, 2);
    // left
    positions.push(...p1, ...p2, ...p4);
    const n2 = normalize(add(p1, p2, p4));
    normals.push(...n2, ...n2, ...n2);
    colors.push(0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0);
    indices.push(3, 4, 5);
    // right
    positions.push(...p1, ...p3, ...p2);
    const n3 = normalize(add(p1, p3, p2));
    normals.push(...n3, ...n3, ...n3);
    colors.push(0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0);
    indices.push(6, 7, 8);
    // front
    positions.push(...p1, ...p4, ...p3);
    const n4 = normalize(add(p1, p4, p3));
    normals.push(...n4, ...n4, ...n4);
    colors.push(1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0);
    indices.push(9, 10, 11);
    return {positions, normals, colors, indices};
}

function add(a, b, c) {
    return [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]];
}

function normalize(a) {
    const n = Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2));
    return [a[0] / n, a[1] / n, a[2] / n];
}

function icosahedron() {
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