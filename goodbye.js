class Goodbye {
    constructor() {
    }

    async init() {
        await d3.json('history.json')
            .then((data) => {
                // console.log(data);
                this._data = data;
            });
    }

    getYear({year}) {
        if (!this._data) {
            console.warn('no data loaded.');
            return;
        }
        return this._data.history.find(d => d.year === year);
    }

    /**
     * Création des noeuds enfants banalisés.
     * (récursif)
     * @param node
     * @returns {*}
     */
    spawnChildren(node) {
        if (node.count) {
            if (!node.children) {
                node.children = [];
            }
            for (let i = 0; i < node.count; i++) {
                node.children.push({name: 'spawn'})
            }
        }
        if (node.children) {
            node.children.forEach(child => this.spawnChildren(child));
        }
        return node;
    }

}