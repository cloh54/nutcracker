class Item {
    constructor(name, price, amount = 1) {
        this.name = name;
        this.price = price;
        this.amount = amount;
    }

    getName() {
        return this.name;
    }
    getPrice() {
        return this.price;
    }
    getAmount() {
        return this.amount;
    }
    setName(name) {
        this.name = name;
    }
    setPrice(price) {
        this.price = price;
    }
    setAmount(amount) {
        this.amount = amount;
    }
}