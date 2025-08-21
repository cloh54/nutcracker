class Person {
    constructor(name) {
        this.id = crypto.randomUUID(); // Generate a unique ID
        this.name = name;
        this.history = {};
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    setName(name) {
        this.name = name;
    }

    getHistory() {
        return this.history;
    }
}