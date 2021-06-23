// TODO: shift the functions here
class Variable {
    constructor({
        place: [
            start, end
        ] = [],
        name
    } = {}) {
        // dont even ask me why we have the start and end
        this.start = start
        this.end = end
        this.name = name
    }
}

module.exports = {
    Variable,
}