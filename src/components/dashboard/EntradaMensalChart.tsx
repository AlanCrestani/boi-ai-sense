import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useEntradaMensalAnimais } from '@/hooks/useEntradaMensalAnimais';
import { Loader2, TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import {
  LineChart,
  type LineSeriesOption
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
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | TitleComponentOption
  | LegendComponentOption
>;

export const EntradaMensalChart: React.FC = () => {
  const { data: entradaData, isLoading, error } = useEntradaMensalAnimais();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  console.log('[EntradaMensalChart] Data received:', entradaData);
  console.log('[EntradaMensalChart] Loading:', isLoading);
  console.log('[EntradaMensalChart] Error:', error);

  const { chartData, totalAnimais, totalMediaAlojados, maiorMes } = useMemo(() => {
    if (!entradaData || entradaData.length === 0) {
      return { chartData: null, totalAnimais: 0, totalMediaAlojados: 0, maiorMes: null };
    }

    const total = entradaData.reduce((sum, item) => sum + item.total_animais, 0);
    const totalMedia = Math.round(entradaData.reduce((sum, item) => sum + item.media_alojados, 0) / entradaData.length);
    const maior = entradaData.reduce((max, item) =>
      item.total_animais > max.total_animais ? item : max
    );

    return {
      chartData: {
        categories: entradaData.map(item => item.mes_formatado),
        entradaValues: entradaData.map(item => item.total_animais),
        mediaValues: entradaData.map(item => item.media_alojados)
      },
      totalAnimais: total,
      totalMediaAlojados: totalMedia,
      maiorMes: maior
    };
  }, [entradaData]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !chartData) return;

    // Initialize chart if needed
    if (!chartInstance.current || chartInstance.current.isDisposed()) {
      const chart = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
        useDirtyRect: false,
      });
      chartInstance.current = chart;
    }

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderWidth: 1,
        textStyle: {
          color: '#ffffff',
        },
        formatter: function (params: any) {
          if (!Array.isArray(params) || !params.length) return '';

          const point = params[0];
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${point.name}</div>
              <div style="color: #10b981;">
                Animais: ${point.value.toLocaleString('pt-BR')}
              </div>
            </div>
          `;
        },
      },
      legend: {
        data: ['Entrada de Animais', 'Média Alojados'],
        textStyle: {
          color: '#ffffff',
        },
        top: 10,
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '15%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: chartData.categories,
        axisLabel: {
          color: '#ffffff',
          interval: 0,
          rotate: 45,
          fontSize: 11,
        },
        axisLine: {
          lineStyle: {
            color: '#4b5563',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Quantidade',
        nameLocation: 'middle',
        nameGap: 50,
        nameRotate: 90,
        nameTextStyle: {
          color: '#ffffff',
          fontSize: 12,
        },
        axisLabel: {
          color: '#ffffff',
          formatter: function (value: number) {
            if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'k';
            }
            return value.toString();
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
          name: 'Entrada de Animais',
          type: 'line',
          data: chartData.entradaValues,
          smooth: true,
          lineStyle: {
            color: '#10b981',
            width: 3,
          },
          itemStyle: {
            color: '#10b981',
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(16, 185, 129, 0.4)'
                },
                {
                  offset: 1,
                  color: 'rgba(16, 185, 129, 0.1)'
                }
              ]
            }
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#10b981',
              borderColor: '#ffffff',
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: '#10b981'
            }
          }
        },
        {
          name: 'Média Alojados',
          type: 'line',
          data: chartData.mediaValues,
          smooth: true,
          lineStyle: {
            color: '#3b82f6',
            width: 3,
          },
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#3b82f6',
              borderColor: '#ffffff',
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: '#3b82f6'
            }
          }
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };

    chartInstance.current.setOption(option, { notMerge: true });

    // Handle resize
    const handleResize = () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current && !chartInstance.current.isDisposed()) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Erro ao carregar dados de entrada mensal
        </div>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Nenhum dado disponível para entrada mensal
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Entrada Mensal de Animais
            </h3>
            <p className="text-sm text-muted-foreground">
              Entrada total: {totalAnimais.toLocaleString('pt-BR')} | Média alojados: {totalMediaAlojados.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {maiorMes && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Pico:</span>
            <span className="font-medium text-green-500">
              {maiorMes.mes_formatado} ({maiorMes.total_animais.toLocaleString('pt-BR')})
            </span>
          </div>
        )}
      </div>

      <div className="h-[300px]">
        <div
          ref={chartRef}
          style={{ height: '100%', width: '100%' }}
          className="chart-container"
        />
      </div>
    </Card>
  );
};