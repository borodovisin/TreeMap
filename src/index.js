import echarts from 'echarts';
import { getNodeListFromData, getMetricTooltip } from './util';
import * as textContain from 'zrender/src/contain/text';

import './index.css';

/**
 * Global controller object is described on Zoomdata knowledge base
 * @see https://www.zoomdata.com/developers/docs/custom-chart-api/controller/
 */

/* global controller */

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/creating-chart-container/
 */
const chartContainer = document.createElement('div');
chartContainer.id = 'idDivTreeMap';
chartContainer.classList.add('chart-container');
controller.element.appendChild(chartContainer);

echarts.registerPostUpdate(() => {
    const storage = treeMap._zr.storage;
    // Get access to shape list
    storage.updateDisplayList();
    storage._displayList.map(d => {
      if (_.has(d, 'style.truncate') && d.__tmStorageName === 'content') {
        const textWidth = Math.floor(textContain.getBoundingRect(d.style.text, `${d.style.fontSize}px ${d.style.fontFamily}`, 
                          d.style.textAlign, d.style.textVerticalAlign, _.fill(Array(4), d.style.textPadding)).width);

        if (Math.floor(d.style.truncate.outerWidth) <= textWidth){
          if(Math.floor(d.style.truncate.outerHeight) <= textWidth) d.setStyle('text', '');
          else d.setStyle('textRotation', (90 * Math.PI / 180));
        }
        // Disable truncateText behaviour from zrender
        d.setStyle('truncate', undefined);
      }
    });
});

const treeMap = echarts.init(document.querySelector('#idDivTreeMap'));

const option = {
    series: [{
        type: 'treemap',
        data: [],
        roam: false,
        nodeClick: false,
        breadcrumb: {
            show: false,
        },
        width: '100%',
        height: '100%',
        label: {
            fontFamily: 'Source Pro, source-sans-pro, Helvetica, Arial, sans-serif',
            fontSize: 14,
            align: 'center',
            verticalAlign: 'middle',
            ellipsis: true,
            padding: 0,
        },
        emphasis: {
            label: {
                show: false,
            }
        }
    }]
}

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/updating-queries-axis-labels/
 */
controller.createAxisLabel({
    picks: 'Group By',
    orientation: 'horizontal',
    position: 'bottom',
    popoverTitle: 'Group'
});

controller.createAxisLabel({
    picks: 'Color',
    orientation: 'horizontal',
    position: 'bottom',
});

controller.createAxisLabel({
    picks: 'Size',
    orientation: 'horizontal',
    position: 'bottom',
});

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/receiving-chart-data/
 */
controller.update = data => {
    const nodeList = getNodeListFromData(data);
    option.series[0].data = nodeList;
    treeMap.setOption(option);
};

controller.resize = () => treeMap.resize();  

// Tooltip
treeMap.on('mousemove', params => {
    if (params && params.data && _.isObject(params.data.datum)) {
        controller.tooltip.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            content: () => {
                return getMetricTooltip(params);
            }
        });
    }
});

treeMap.on('mouseout', () => {
    controller.tooltip.hide();
});

// Menu bar
treeMap.on('click', params => {
    controller.tooltip.hide();
    controller.menu.show({
        x: params.event.event.clientX,
        y: params.event.event.clientY,
        data: () => params.data.datum,
    });
});
