// no idea why there is only one thing here, this variable class is one of the most useless thing .-.
class Variable {
    constructor({
        place: [
            start, end
        ] = [],
        name, 
        value
    } = {}) {
        // dont even ask me why we have the start and end
        this.start = start
        this.end = end
        this.name = name
        if (value) {
            this.value = value
        }
    }
}

module.exports = {
    Variable,
}