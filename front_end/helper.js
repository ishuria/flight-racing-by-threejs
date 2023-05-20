function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomCoordinates() {
    return getRandomInt(180) + 1;
}

export { getRandomCoordinates };