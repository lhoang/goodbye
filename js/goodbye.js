class Goodbye {
    constructor() {
    }

    /**
     * Initialisation :
     * Récupération des données et du logo.
     * Affichage du premier graph
     * @param year année du premier graph
     */
    init(year) {
        d3.json('data/history.json')
            .then( data => this._data = data)
            .then(() => this.drawFirstGraph(year));

        // chargement logo
        d3.json('data/coordinates.json')
            .then( data => this._logo = data);
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
                node.children.push(
                    {
                        name: `${node.name}-spawn-${i}`,
                        spawned: true,
                    })
            }
            delete node.count;
        }
        if (node.children) {
            node.children.forEach(child => this.spawnChildren(child));
        }
        return node;
    }


    /**
     * Création du SVG.
     */
    drawFirstGraph(year) {
        let width = 500,
            height = 520;

        const svg = d3.select('#graph')
            .append('svg')
            .attr('height', height)
            .attr('width', width);

        svg.append('g').classed('circles', true);
        //.attr('transform', 'translate(2,2)');
        svg.append('g').classed('labels', true);

        this.updateGraph(2011);

    }

    /**
     * Mise à jour du graph.
     * @param year nouvelle année
     */
    updateGraph(year) {
        const diameter = 450;
        const maxRadius = 1;
        //transition
        const t = d3.transition().duration(2000);

        const result = this.getYear({year: year});
        if (!result) {
            console.warn('no data found.');
            return;
        }
        const populated = this.spawnChildren(result.data, 0);

        const root = d3.hierarchy(populated)
            .sum(d => d.size ? d.size : (maxRadius - (Math.random() * maxRadius / 2)))
        ;

        const pack = d3.pack()
            .size([diameter - 4, diameter - 4]);

        // console.log(root);
        // console.log(pack(root));
        // console.log(pack(root).descendants());

        function cleanName(str) {
            return str.replace(/[^A-Z0-9]+/ig, '-');
        }

        const svg = d3.select('#graph').select('svg');

        function buildClassNames(d) {
            let name = 'node';
            if (!d.children) {
                name += ' leaf';
            }
            if (d.data.name === 'RATP') {
                name += ' root';
            }
            if (d.data.name === 'Lang') {
                name += ' center-elt';
            }
            if (d.data.name.startsWith('RATP-spawn')) {
                name += ' ratp-spawn';
            }
            return name;
        }


        /**
         * Tracer les cercles.
         */
        function updateCircles(data, container) {
            // Join
            const nodes = container.selectAll('.node')
                .data(data, d => d.data.name);

            // Exit
            const exitNodes = nodes.exit();

            // console.log(exitNodes.data());
            exitNodes.transition(t)
                .style('stroke-opacity', 1e-2)
                .style('fill-opacity', 1e-2).remove();

            // Update
            nodes.transition(t)
                .attr('r', d => d.r)
                .attr('cx', d => d.x)
                .attr('cy', d => d.y)
                .attr('class', d => buildClassNames(d))
                .attr('data-name', d => cleanName(d.data.name));

            // Enter
            nodes.enter()
                .append('circle')
                .attr('r', 0)
                .attr('cx', d => d.x)
                .attr('cy', d => d.y)
                .attr('class', d => buildClassNames(d))
                .attr('data-name', d => cleanName(d.data.name))
                .transition(t)
                .attr('r', d => d.r);


        }


        /**
         * MAJ des labels.
         * @param data
         * @param container
         */
        function updateLabels(data, container) {
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


            const filteredData = data.filter(d =>
                !d.data.spawned
                && d.data.name !== 'RATP');

            // Join
            const labels = container
                .selectAll('.label')
                .data(filteredData, d => d.data.name);

            // Exit
            labels.exit()
                .transition().duration(500)
                .style('fill-opacity', 1e-6).remove();

            // Update
            const labelPaths = labels.selectAll('.label-path')
                .data(filteredData, d => d.data.name)
                .transition(t)
                .attr('d', d => describeArc(d.x, d.y, d.r, 180, 0))
            ;

            // Enter
            const enterLabels = labels.enter()
                .append('g')
                .classed('label', true);

            enterLabels.append('path')
                .classed('label-path', true)
                .attr('fill', 'none')
                .attr('id', d => 'path-' + cleanName(d.data.name))
                .merge(labelPaths)
                .transition(t)
                .attr('d', d => describeArc(d.x, d.y, d.r, 180, 0));
            enterLabels.append('text')
                .classed('label-text', true)
                .style('text-anchor', 'start')
                .append('textPath')
                .attr('xlink:href', d => '#path-' + cleanName(d.data.name))
                .attr('startOffset', '0%')
                .attr('side', 'right')
                .text(d => d.data.name)
                .style('fill-opacity', 1e-6)
                .transition(t)
                .style('fill-opacity', 1);
        }

        updateCircles(pack(root).descendants(), svg.select('.circles'));
        updateLabels(pack(root).descendants(), svg.select('.labels'));
    }

    /**
     * Dessin du logo RATP avec 250 points.
     */
    drawLogo() {
        const svg = d3.select('#graph').select('svg');
        //transition
        const t = d3.transition().duration(2000);

        svg.selectAll('circle')
            .transition(t)
            .attr('r', 4)
            .attr('cx', (d, i) => this._logo[i][0])
            .attr('cy', (d, i) => this._logo[i][1]);

        svg.selectAll('.label textPath')
            .transition(t)
            .style('fill-opacity', 1e-6);
    }

}