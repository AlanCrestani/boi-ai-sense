import { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts/core';
import {
  PieChart,
  type PieSeriesOption
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  type TitleComponentOption,
  type TooltipComponentOption,
  type LegendComponentOption
} from 'echarts/components';
import {
  CanvasRenderer
} from 'echarts/renderers';

// Register required components
echarts.use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | PieSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>;

interface ChartData {
  name: string;
  previsto: number;
  realizado: number;
  diferenca: number;
}

interface EChartsPieProps {
  data: ChartData[];
  height?: number;
  date?: Date | null;
  showType?: 'previsto' | 'realizado';
}

// Use memo to prevent unnecessary re-renders
export const EChartsPie = memo(function EChartsPie({
  data,
  height = 400,
  date,
  showType = 'realizado',
}: EChartsPieProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Color palette - same as bar chart
  const colorPalette = [
    '#3b82f6', // azul
    '#10b981', // verde
    '#eab308', // amarelo
    '#ef4444', // vermelho
    '#8b5cf6', // roxo
    '#f97316', // laranja
    '#06b6d4', // ciano
    '#84cc16', // verde-lima
    '#ec4899', // rosa
    '#6366f1', // índigo
  ];

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Check if container has valid dimensions
    const containerWidth = chartRef.current.clientWidth;
    const containerHeight = chartRef.current.clientHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      return;
    }

    // If no data, clear the chart
    if (!data || data.length === 0) {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.clear();
      }
      return;
    }

    // Initialize chart if needed
    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      const chart = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
        useDirtyRect: false,
      });
      chartInstance.current = chart;

      // Setup resize observer for better responsiveness
      resizeObserver.current = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.current.observe(chartRef.current);
    }

    // Prepare pie data
    const pieData = data.map((item, index) => ({
      name: item.name,
      value: showType === 'previsto' ? item.previsto : item.realizado,
      itemStyle: {
        color: colorPalette[index % colorPalette.length],
      },
      // Include all data for tooltip
      previsto: item.previsto,
      realizado: item.realizado,
      diferenca: item.diferenca,
    }));

    // Calculate totals for percentage
    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderWidth: 1,
        textStyle: {
          color: '#ffffff',
        },
        formatter: function (params: any) {
          const item = params.data;
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          const diferenca = item.diferenca;
          const percentualDif =
            item.previsto > 0 ? ((item.realizado / item.previsto - 1) * 100).toFixed(1) : '0';

          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${item.name}</div>
              <div style="color: #3b82f6;">Previsto: ${item.previsto.toLocaleString('pt-BR')} kg</div>
              <div style="color: #10b981;">Realizado: ${item.realizado.toLocaleString('pt-BR')} kg</div>
              <div style="color: ${diferenca >= 0 ? '#eab308' : '#ef4444'}; font-weight: bold;">
                Diferença: ${diferenca > 0 ? '+' : ''}${diferenca.toLocaleString('pt-BR')} kg (${percentualDif}%)
              </div>
              <div style="margin-top: 4px; color: #ffffff; font-weight: bold;">
                Participação: ${percentage}%
              </div>
            </div>
          `;
        },
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        bottom: 20,
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 20,
        width: '90%',
        pageButtonItemGap: 10,
        pageIconSize: 12,
        pageIconColor: '#ffffff',
        pageIconInactiveColor: '#666666',
        pageTextStyle: {
          color: '#ffffff',
          fontSize: 11,
        },
        textStyle: {
          color: '#ffffff',
          fontSize: 11,
          width: 120,
          overflow: 'truncate',
        },
        tooltip: {
          show: true,
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          textStyle: {
            color: '#ffffff',
          },
        },
        formatter: function (name: string) {
          const item = pieData.find(d => d.name === name);
          if (!item) return name;
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          const shortName = name.length > 15 ? name.substring(0, 12) + '...' : name;
          return `${shortName} (${percentage}%)`;
        },
      },
      series: [
        {
          name: 'Distribuição Realizada',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#ffffff',
              formatter: function (params: any) {
                const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
                return `${params.name}\n${percentage}%`;
              },
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
      title: {
        text: 'Distribuição Realizada por Ingrediente',
        left: 'center',
        textStyle: {
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold',
        },
        top: 0,
      },
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
    };

    // Update chart with new options
    chartInstance.current.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
      silent: false,
    });
  }, [data, date, showType]);

  // Cleanup on unmount
  useEffect(() => {
    const currentChartRef = chartRef.current;
    const currentResizeObserver = resizeObserver.current;

    return () => {
      if (currentResizeObserver && currentChartRef) {
        currentResizeObserver.unobserve(currentChartRef);
        currentResizeObserver.disconnect();
      }

      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
      }

      chartInstance.current = null;
      resizeObserver.current = null;
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height: `${height}px`,
          minHeight: '450px',
        }}
      />
    </div>
  );
});
