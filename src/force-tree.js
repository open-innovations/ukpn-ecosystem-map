import * as d3 from './lib/d3';

// https://observablehq.com/@d3/force-directed-tree?collection=@d3/d3-hierarchy
export const forceTree = (ecosystem, element) => {
  const width = 200;
  const height = width;
  const links = ecosystem.links().filter(d => d.source.depth > 0);
  const nodes = ecosystem.descendants().filter(d => d.depth > 0);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(0)
        .strength(1)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('x', d3.forceX())
    .force('y', d3.forceY());

  const svg = element
    .append('svg')
    .attr('viewBox', [-width / 2, -height / 2, width, height]);

  const graph = svg.append('g')
    .attr('id', 'graph');

  const link = graph
    .append('g')
    .attr('id', 'edges')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', d => d.source.data.type);

  const drag = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };

  const tooltip = element.append('div').attr('class', 'tooltip hide');

  const showTooltip = (entity) => {
    const { id, name, type } = entity.data;
    const content = `
      <h1>${name || id} (${type})</h1>
      <p>${nodePath(entity)}</p>
    `;
    tooltip.classed('hide', false);
    tooltip.html(content);
  };

  const hideTooltip = (entity) => {
    tooltip.classed('hide', !entity.selected);
  };

  const node = graph
    .append('g')
    .attr('id', 'nodes')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('class', (d) => d.data.type)
    .attr('r', 3.5)
    .call(drag(simulation))
    .on('mouseover', (_, i) => showTooltip(i))
    .on('mouseout', (_, i) => hideTooltip(i))
    .on('click', (_, i) => {
      node.enter().selected = false;
      i.selected = true;
    });

  function zoomed({ transform }) {
    graph.attr("transform", transform);
  }

  svg.call(d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([0.5, 4])
    .on("zoom", zoomed));

  const nodePath = (d) =>
    d
      .ancestors()
      .map((d) => d.data.id)
      .reverse()
      .join('/');

  node.append('title').text((d) => nodePath(d));

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
  });

  return svg.node();
};
