
import echarts from 'echarts';
import visualization from '../visualization.json'

// Constants varaibles
const metricGroupBy = visualization.variables[0].name;

const metricColor = visualization.variables[2].name;

const metricSize = visualization.variables[1].name;

const defaultMetricName = 'count';

const getLuminosity = color => {
    const rgb = echarts.color.parse(color);
    const luminosity = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return luminosity >= 165 ? '#000' : '#FFF';
}

const getTableRow = (label, value) => `<div class="zd_tooltip_info_table_row"><div class="zd_tooltip_info_table_row_label">${label}</div><div class="zd_tooltip_info_table_row_value">${value}</div></div>`;

const getMetricLabel = data => {
  if (_.has(data, 'label')) {
    const func = _.has(data, 'func') && data.func ? `(${_.replace(data.func, /_/g, ' ')})` : '';
    return `${data.label} ${func}`;
  }
  return '';
}

const compareWithDefaultMetric = accessor => controller.dataAccessors[accessor]._metric.name !== defaultMetricName;

const getVolumenMetric = params => {
    if (_.has(params, 'data.datum.current.count') && compareWithDefaultMetric(metricColor)) {
        return `<div class="zd_tooltip_info_table_row">${getTableRow('Volume', params.data.datum.current.count)}</div>`;
    }
    return '';
}

const getSizeMetric = params => {
    const metrics = controller.query.metrics.toJSON();
    const dataAccessor = controller.dataAccessors[metricSize];
    if (_.isArray(metrics) && metrics.length === 2 && !_.isEqual(_.first(metrics), _.last(metrics))) {
        const label = getMetricLabel(dataAccessor._metric);
        return `<div class="zd_tooltip_info_table_row">${getTableRow(label, dataAccessor.formatted(params.data.datum))}</div>`;
    }
    return '';
}

const getMetric = params => {
    const label = getMetricLabel(controller.dataAccessors[metricColor]._metric);
    const volumenMetric = getVolumenMetric(params);
    const sizeMetric = !volumenMetric || compareWithDefaultMetric(metricSize) ? getSizeMetric(params) : '';
    return `${volumenMetric}<div class="zd_tooltip_info_table_row"><div class="zd_tooltip_info_table_row_label">${label}</div><div class="zd_tooltip_info_table_row_value"><div class="color_icon active" style="background-color: ${params.color};"></div>${controller.dataAccessors[metricColor].formatted(params.data.datum)}</div></div>${sizeMetric}`;
}

/**
 * Go through all keys and get the deeper value
 * @param {object} metric 
 * @returns {number} value of the deeper key
 */
const getValueFromMetric = metric => {
    const metricKey= metric[_.first(_.keys(metric))];
    if (_.isObject(metricKey)) {
        return getValueFromMetric(metricKey);
    }
    return metricKey;
}

const getNode = (datum, datumColor) => ({ name: _.first(datum.group), 
    itemStyle: { color: datumColor, borderWidth: 1 },
    label: { color: getLuminosity(datumColor) },
    datum });

export const getNodeListFromData = data => 
    data.map(datum => {
        const datumColor = controller.getColorAccessor().color(datum);
        const node = getNode(datum, datumColor);

        if (datum.current.metrics !== null && compareWithDefaultMetric(metricSize)) {
            node.realValue = getValueFromMetric(datum.current.metrics);
            node.value = Math.abs(node.realValue);
        } else { 
            node.value = node.realValue = datum.current.count;
        }
        return node;
    });

export const getMetricTooltip = params => {
  if (params && _.has(params, 'name') && _.has(params, 'color') && _.has(params, 'data.value')) {
      const label = controller.dataAccessors[metricGroupBy]._group.label;
      const metric = getMetric(params);
      return `<div class="zd_tooltip_info_group customized"><div class="zd_tooltip_info_table"><div class="zd_tooltip_info_table_row">${getTableRow(label, params.name)}</div>${metric}</div></div>`;
  }
  return '';
}
