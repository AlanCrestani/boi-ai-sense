import React, { Suspense, lazy } from 'react';
import { LoadingState } from '../states/LoadingState';

const TemporalChartsLazy = lazy(() =>
  import('./TemporalCharts').then(module => ({ default: module.TemporalCharts }))
);

const QuantitativeChartsLazy = lazy(() =>
  import('./QuantitativeCharts').then(module => ({ default: module.QuantitativeCharts }))
);

const QualitativeChartsLazy = lazy(() =>
  import('./QualitativeCharts').then(module => ({ default: module.QualitativeCharts }))
);

interface LazyChartContainerProps {
  type: 'temporal' | 'quantitative' | 'qualitative';
  [key: string]: any;
}

export const LazyChartContainer: React.FC<LazyChartContainerProps> = ({ type, ...props }) => {
  const ChartComponent = {
    temporal: TemporalChartsLazy,
    quantitative: QuantitativeChartsLazy,
    qualitative: QualitativeChartsLazy
  }[type];

  return (
    <Suspense fallback={<LoadingState type="charts" count={type === 'temporal' ? 2 : 5} />}>
      <ChartComponent {...props} />
    </Suspense>
  );
};