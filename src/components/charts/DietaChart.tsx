import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  BarChart,
  type BarSeriesOption
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  type GridComponentOption,
  type TooltipComponentOption,
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
  LegendComponent,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | BarSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>;

interface DietaData {
  name: string;
  previsto: number;
  realizado: number;
  diferenca: number;
  desvio_percentual: number;
}

interface DietaChartProps {
  data: DietaData[];
  height?: number;
  date?: Date | null;
}

export function DietaChart({ data, height = 400, date }: DietaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Se no data, clear the chart
    if (!data || data.length === 0) {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.clear();
      }
      return;
    }

    // Initialize chart if needed
    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function (params: any) {
          const dataIndex = params[0].dataIndex;
          const item = data[dataIndex];
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${item.name}</div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: #3b82f6; margin-right: 8px;"></span>
              Previsto: ${item.previsto.toLocaleString('pt-BR')} kg
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: #10b981; margin-right: 8px;"></span>
              Realizado: ${item.realizado.toLocaleString('pt-BR')} kg
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <div style="color: ${item.diferenca >= 0 ? '#10b981' : '#ef4444'};">
                Diferença: ${item.diferenca >= 0 ? '+' : ''}${item.diferenca.toLocaleString('pt-BR')} kg
              </div>
              <div style="color: ${item.desvio_percentual >= 0 ? '#10b981' : '#ef4444'};">
                Desvio: ${item.desvio_percentual >= 0 ? '+' : ''}${item.desvio_percentual.toFixed(2)}%
              </div>
            </div>
          `;
        }
      },
      legend: {
        data: ['Previsto', 'Realizado'],
        textStyle: {
          color: '#ffffff',
        },
        top: 20,
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => {
          // Truncar nomes muito longos
          return item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
        }),
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 12,
          color: '#ffffff'
        },
        axisLine: {
          lineStyle: {
            color: '#4b5563'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Quantidade (kg)',
        nameLocation: 'middle',
        nameGap: 80,
        nameRotate: 90,
        nameTextStyle: {
          color: '#ffffff',
          fontSize: 14
        },
        axisLabel: {
          color: '#ffffff',
          formatter: function (value: number) {
            return value.toLocaleString('pt-BR');
          },
        },
        axisLine: {
          lineStyle: {
            color: '#4b5563'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#374151',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Previsto',
          type: 'bar',
          data: data.map(item => item.previsto),
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [2, 2, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#2563eb'
            }
          }
        },
        {
          name: 'Realizado',
          type: 'bar',
          data: data.map(item => item.realizado),
          itemStyle: {
            color: '#10b981',
            borderRadius: [2, 2, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#059669'
            }
          }
        }
      ],
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut'
    };

    // Update chart with new options
    chartInstance.current.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
      silent: false,
    });

    // Handle resize
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    const currentChartRef = chartRef.current;

    return () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
      }

      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: `${height}px`,
        minHeight: '300px'
      }}
    />
  );
}