class Goodbye {
    constructor() {
    }

    init() {
        d3.json('history.json')
            .then((data) => {
                this._data = data;
            })
            .then(() => this.drawGraph());
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


    /**
     * Création du SVG.
     */
    drawGraph() {
        const result = this.getYear({year: 2011});
        const populated = this.spawnChildren(result.data);

        console.log(populated);

        let width = 960,
            height = 500,
            diameter = 450,
            maxRadius = 1;

        function cleanName(str) {
            return str.replace(/[^A-Z0-9]+/ig, '-');
        }

        const svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width);

        const g = svg.append('g').attr('transform', 'translate(2,2)');


        const pack = d3.pack()
            .size([diameter - 4, diameter - 4]);


        const root = d3.hierarchy(populated)
            .sum(d => d.size ? d.size : (maxRadius - (Math.random() * maxRadius / 2)))
            .sort(function (a, b) {
                return b.value - a.value;
            });

        console.log(root);
        console.log(pack(root).descendants());

        const nodes = g.selectAll('.node')
            .data(pack(root).descendants())
            .enter().append('g')
            .attr('class', function (d) {
                return d.children ? 'node' : 'leaf node';
            })
            .attr('data-name', d => cleanName(d.data.name));

        // Element root
        nodes.filter(d => d.depth === 0)
            .classed('root', true);

        // Element principal
        nodes.filter(d => d.depth === 1 && d.height === 0)
            .classed('center-elt', true);

        // Elements spawn
        nodes.filter(d => d.data.name === 'spawn')
            .classed('spawn', true);


        nodes.append('circle')
            .attr('r', d => d.r)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);


        function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians)),
            };
        }


        function describeArc(x, y, radius, startAngle, endAngle) {
            const start = polarToCartesian(x, y, radius, endAngle);
            const end = polarToCartesian(x, y, radius, startAngle);
            return [
                'M', start.x, start.y,
                'A', radius, radius, 0, 1, 1, end.x, end.y,
            ].join(' ');
        }


        // en dernier pour être au dessus
        const labels = svg.append('g').classed('labels', true)
            .selectAll('.label')
            .data(pack(root).descendants())
            .enter()
            .filter(d => d.data.name !== 'spawn'
                && d.data.name !== 'root');

        const arcs = labels.append('path')
            .attr('fill', 'none')
            .attr('id', (d, i) => 's' + i)
            .attr('d', (d, i) => describeArc(d.x, d.y, d.r, 160, -160));

        const arcPaths = labels.append('g')
            .style('fill', 'navy');
        arcPaths.append('text')
            .style('text-anchor', 'middle')
            .append('textPath')
            .attr('xlink:href', (d, i) => '#s' + i)
            .attr('startOffset', '10%')
            .attr('side', 'right')
            .text(d => d.data.name);


    }


}