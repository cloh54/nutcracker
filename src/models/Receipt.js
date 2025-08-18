class Receipt {
    contructor () {
        // Initialize financial properties
        this._subtotal = 0;
        this._tax = 0;
        this._fee = 0;
        this._total = 0;

        // For tracking items and people
        this._itemsNextId = 0; // For generating unique item IDs
        this._peopleNextId = 0; // For generating unique person IDs
        this._items = {}; // keys: item ID, values: item object
        this._people = {}; // keys: person ID, values: person object
        
        // For tracking Food <-> Person relationship
        this._whoAteWhat = new Map(); // keys: person's id, values: sets of item IDs
        this._itemEatenBy = new Map(); // keys: item's id, values: sets of person ids
    }

    get items() {
        return this._items;
    }
    get people() {
        return this._people;
    }
    get subtotal() {
        return this._subtotal;
    }
    get tax() {
        return this._tax;
    }
    get fee() {
        return this._fee;
    }
    get total() {
        return this._total;
    }
    set tax(value) {
        this._tax = value;
    }
    set fee(value) {
        this._fee = value;
    }

    calculateTotal() {
        this._total = this._subtotal + this._tax + this._fee;
    }

    addItem(item) {
        this._items.set(this._itemsNextId, item);
        this._itemsNextId++;
        // Initialize itemEatenBy map for this item
        this._itemEatenBy.set(item.id, new Set());
        // Update subtotal
        this._subtotal += item.price; 
        //update total
        this.calculateTotal();
        return this._items.get(this._itemsNextId - 1);
    }
    deleteItem(id) {
        const item = this._items.get(id);
        if (!item) return false; // Item not found
        this._items.delete(id);

        // Remove item from whoAteWhat and itemEatenBy maps
        this._itemEatenBy.delete(id);
        this._whoAteWhat.forEach((itemSet, _) => {
            itemSet.delete(id);
        });
        
        // Update subtotal
        this._subtotal -= item.price;
        //update total
        this.calculateTotal();
        return true;
    }

    editItem(id, name, price, amount) {
        const item = this._items.get(id);
        if (!item) return null; // Item not found
        item.name = name;
        item.price = price;
        item.amount = amount;

        // Update subtotal
        this._subtotal -= item.price; // Remove old price
        this._subtotal += price; // Add new price
        //update total
        this.calculateTotal();
        return item;
    }

    addPerson(person) {
        this._people.set(this._peopleNextId, person);
        this._peopleNextId++;
        // Initialize person's item set in whoAteWhat map
        this._whoAteWhat.set(person.id, new Set());
        return this._people.get(this._peopleNextId - 1);
    }

    deletePerson(id) {
        if (!this._people.has(id)) return false; // Person not found
        this._people.delete(id);

        // Remove person from whoAteWhat and itemEatenBy maps
        this._whoAteWhat.delete(id);
        this._itemEatenBy.forEach((peopleSet, _) => {
            peopleSet.delete(id);
        });
        return true;
    }

    editPerson(id, name) {
        const person = this._people.get(id);
        if (!person) return null; // Person not found
        person.name = name;
        return person;
    }
}