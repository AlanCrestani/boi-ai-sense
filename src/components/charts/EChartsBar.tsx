import { useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';
import { DataViewModal } from './DataViewModal';

type EChartsOption = echarts.EChartsOption;

interface ChartData {
  name: string;
  previsto: number;
  realizado: number;
  diferenca: number;
}

interface EChartsBarProps {
  data: ChartData[];
  height?: number;
  date?: Date | null;
}

// Use memo to prevent unnecessary re-renders
export const EChartsBar = memo(function EChartsBar({ data, height = 400, date }: EChartsBarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

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

    const option: EChartsOption = {
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
        data: data.map(item => item.name),
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
          data: data.map(item => ({
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
          data: data.map(item => ({
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

    // Update chart with new options
    chartInstance.current.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
      silent: false,
    });
  }, [data, date]);

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
          minHeight: '400px',
        }}
      />
      <div className="absolute top-4 right-[5%] z-10">
        <DataViewModal data={data} date={date} />
      </div>
    </div>
  );
});
