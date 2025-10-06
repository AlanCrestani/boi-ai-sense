import { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts/core';
import {
  BarChart,
  type BarSeriesOption
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  type GridComponentOption,
  type TooltipComponentOption,
  type TitleComponentOption,
  type LegendComponentOption
} from 'echarts/components';
import {
  CanvasRenderer
} from 'echarts/renderers';

// Register required components
echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | BarSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | TitleComponentOption
  | LegendComponentOption
>;
import { DataViewModal } from './DataViewModal';


interface ChartData {
  name: string;
  previsto: number;
  realizado: number;
  diferenca: number;
}

interface SeriesData {
  name: string;
  data: number[];
  color?: string;
}

interface EChartsBarProps {
  data?: ChartData[];
  height?: number;
  date?: Date | null;
  // Generic props for non-ChartData usage
  title?: string;
  xAxisData?: string[];
  series?: SeriesData[];
  showLegend?: boolean;
  yAxisLabel?: string;
  formatTooltip?: (params: any) => string;
}

// Use memo to prevent unnecessary re-renders
export const EChartsBar = memo(function EChartsBar({
  data,
  height = 400,
  date,
  title,
  xAxisData,
  series,
  showLegend = true,
  yAxisLabel,
  formatTooltip
}: EChartsBarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // Determine if using generic mode or ChartData mode
  const isGenericMode = !data && xAxisData && series;

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
    if (!isGenericMode && (!data || data.length === 0)) {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.clear();
      }
      return;
    }

    if (isGenericMode && (!xAxisData || xAxisData.length === 0)) {
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

    let option: EChartsOption;

    if (isGenericMode) {
      // Generic mode configuration
      option = {
        title: title ? {
          text: title,
          textStyle: {
            color: '#ffffff',
          },
        } : undefined,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          borderWidth: 1,
          textStyle: {
            color: '#ffffff',
          },
          formatter: formatTooltip || undefined,
        },
        legend: showLegend ? {
          data: series.map(s => s.name),
          textStyle: {
            color: '#ffffff',
          },
          top: 20,
        } : undefined,
        grid: {
          left: '12%',
          right: '5%',
          bottom: '15%',
          top: showLegend ? '15%' : '10%',
          containLabel: false,
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisPointer: {
            type: 'shadow',
          },
          axisLabel: {
            color: '#ffffff',
            interval: 0,
            rotate: xAxisData.length > 5 ? 45 : 0,
            fontSize: 12,
          },
          axisLine: {
            lineStyle: {
              color: '#4b5563',
            },
          },
        },
        yAxis: {
          type: 'value',
          name: yAxisLabel,
          nameLocation: 'middle',
          nameGap: 80,
          nameRotate: 90,
          nameTextStyle: {
            color: '#ffffff',
            fontSize: 14,
          },
          axisLabel: {
            color: '#ffffff',
            formatter: function (value: number) {
              return value.toLocaleString('pt-BR');
            },
          },
          axisLine: {
            lineStyle: {
              color: '#4b5563',
            },
          },
          splitLine: {
            lineStyle: {
              color: '#374151',
              type: 'dashed',
            },
          },
        },
        series: series.map(s => ({
          name: s.name,
          type: 'bar' as const,
          data: s.data,
          itemStyle: {
            color: s.color || '#3b82f6',
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: s.color || '#3b82f6',
            },
          },
        })),
        animation: true,
        animationDuration: 500,
        animationEasing: 'cubicOut',
      };
    } else {
      // Original ChartData mode configuration
      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          borderWidth: 1,
          textStyle: {
            color: '#ffffff',
          },
          formatter: function (params: unknown) {
            if (!Array.isArray(params) || !params.length) return '';

            const dataPoint = (params as { data: ChartData & { value: number } }[])[0].data;
            const ingrediente = dataPoint.name;
            const previsto = dataPoint.previsto;
            const realizado = dataPoint.realizado;
            const diferenca = dataPoint.diferenca;
            const percentual = previsto > 0 ? ((realizado / previsto - 1) * 100).toFixed(1) : '0';

            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${ingrediente}</div>
                <div style="color: #3b82f6;">Previsto: ${previsto.toLocaleString('pt-BR')} kg</div>
                <div style="color: #10b981;">Realizado: ${realizado.toLocaleString('pt-BR')} kg</div>
                <div style="color: ${diferenca >= 0 ? '#eab308' : '#ef4444'}; font-weight: bold;">
                  Diferença: ${diferenca > 0 ? '+' : ''}${diferenca.toLocaleString('pt-BR')} kg (${percentual}%)
                </div>
              </div>
            `;
          },
        },
        legend: {
          data: ['Previsto (kg)', 'Realizado (kg)'],
          textStyle: {
            color: '#ffffff',
          },
          top: 20,
        },
        grid: {
          left: '12%',
          right: '5%',
          bottom: '15%',
          top: '15%',
          containLabel: false,
        },
        xAxis: {
          type: 'category',
          data: data!.map(item => item.name),
          axisPointer: {
            type: 'shadow',
          },
          axisLabel: {
            color: '#ffffff',
            interval: 0,
            rotate: 45,
            fontSize: 12,
          },
          axisLine: {
            lineStyle: {
              color: '#4b5563',
            },
          },
        },
        yAxis: {
          type: 'value',
          name: 'Quantidade (kg)',
          nameLocation: 'middle',
          nameGap: 80,
          nameRotate: 90,
          nameTextStyle: {
            color: '#ffffff',
            fontSize: 14,
          },
          axisLabel: {
            color: '#ffffff',
            formatter: function (value: number) {
              return value.toLocaleString('pt-BR');
            },
          },
          axisLine: {
            lineStyle: {
              color: '#4b5563',
            },
          },
          splitLine: {
            lineStyle: {
              color: '#374151',
              type: 'dashed',
            },
          },
        },
        series: [
          {
            name: 'Previsto (kg)',
            type: 'bar',
            data: data!.map(item => ({
              value: item.previsto,
              name: item.name,
              previsto: item.previsto,
              realizado: item.realizado,
              diferenca: item.diferenca,
            })),
            itemStyle: {
              color: '#3b82f6',
              borderRadius: [4, 4, 0, 0],
            },
            emphasis: {
              itemStyle: {
                color: '#3b82f6',
              },
            },
          },
          {
            name: 'Realizado (kg)',
            type: 'bar',
            data: data!.map(item => ({
              value: item.realizado,
              name: item.name,
              previsto: item.previsto,
              realizado: item.realizado,
              diferenca: item.diferenca,
            })),
            itemStyle: {
              color: '#10b981',
              borderRadius: [4, 4, 0, 0],
            },
            emphasis: {
              itemStyle: {
                color: '#10b981',
              },
            },
          },
        ],
        animation: true,
        animationDuration: 500,
        animationEasing: 'cubicOut',
      };
    }

    // Update chart with new options
    chartInstance.current.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
      silent: false,
    });
  }, [data, date, title, xAxisData, series, showLegend, yAxisLabel, formatTooltip, isGenericMode]);

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
        chartInstance.current = null;
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative">
      {!isGenericMode && data && data.length > 0 && (
        <div className="absolute top-0 right-0 z-10">
          <DataViewModal data={data} date={date} />
        </div>
      )}
      <div
        ref={chartRef}
        style={{ height: `${height}px`, width: '100%' }}
        className="chart-container"
      />
    </div>
  );
});