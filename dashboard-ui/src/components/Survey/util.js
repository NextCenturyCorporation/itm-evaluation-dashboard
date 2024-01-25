export function getUID() {
    return Date.now().toString(36)
}

export function shuffle (array) {
    // randomize the list
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}