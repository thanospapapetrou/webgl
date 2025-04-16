function tetrahedron() {
    const a = -2 * Math.PI / 3;
    const p1 = [0.0, 1.0, 0.0];
    const p2 = [0.0, Math.cos(a), Math.sin(a)];
    const p3 = [Math.sin(a) * Math.sin(a), Math.cos(a), Math.sin(a) * Math.cos(a)];
    const p4 = [Math.sin(a) * Math.sin(2 * a), Math.cos(a), Math.sin(a) * Math.cos(2 * a)];
    const n1 = p1.map(negate);
    const n2 = p2.map(negate);
    const n3 = p3.map(negate);
    const n4 = p4.map(negate);
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    // bottom
    positions.push(...p2, ...p3, ...p4);
    normals.push(...n1, ...n1, ...n1);
    colors.push(1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            1.0, 0.0, 0.0, 1.0);
    indices.push(0, 1, 2);
    // left
    positions.push(...p1, ...p2, ...p4);
    normals.push(...n3, ...n3, ...n3);
    colors.push(0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0);
    indices.push(3, 4, 5);
    // right
    positions.push(...p1, ...p3, ...p2);
    normals.push(...n4, ...n4, ...n4);
    colors.push(0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0);
    indices.push(6, 7, 8);
    // back
    positions.push(...p1, ...p4, ...p3);
    normals.push(...n2, ...n2, ...n2);
    colors.push(1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0);
    indices.push(9, 10, 11);
    return {positions, normals, colors, indices};
}

function negate(a) {
    return -1.0 * a;
}

function uvSphere(slices, sectors) {
    const va = Math.PI / slices;
    const vh = 2 * Math.PI / sectors;
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    positions.push(0.0, -1.0, 0.0);
    normals.push(0.0, -1.0, 0.0);
    colors.push(1.0, 0.0, 0.0, 1.0);
    for (let i = 0; i < slices - 1; i++) {
        for (let j = 0; j < sectors; j++) {
            const y = Math.sin((i + 1) * va - Math.PI / 2);
            const x = Math.cos((i + 1) * va - Math.PI / 2) * Math.cos(j * vh);
            const z = -Math.cos((i + 1) * va - Math.PI / 2) * Math.sin(j * vh);
            positions.push(x, y, z);
            normals.push(x, y, z);
            colors.push(1.0, 0.0, 0.0, 1.0);
            if (i > 0) {
                indices.push((i - 1) * sectors + j + 1,
                        (i - 1) * sectors + (j + 1) % sectors + 1,
                        i * sectors + j + 1);
                indices.push(i * sectors + (j + 1) % sectors + 1,
                        i * sectors + j + 1,
                        (i - 1) * sectors + (j + 1) % sectors + 1);
            } else {
                indices.push((j + 1) % sectors + 1 , j + 1, 0);
            }
        }
    }
    positions.push(0.0, 1.0, 0.0);
    normals.push(0.0, 1.0, 0.0);
    colors.push(1.0, 0.0, 0.0, 1.0);
    for (let j = 0; j < sectors; j++) {
        indices.push((slices - 2) * sectors + j + 1,
                (slices - 2) * sectors + (j + 1) % sectors + 1,
                (slices - 1) * sectors + 1);
    }
    return {positions, normals, colors, indices};
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