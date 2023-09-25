function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * 随机坐标
 * @returns 
 */
function getRandomCoordinates() {
    return getRandomInt(180) + 1;
}

// export { getRandomCoordinates };