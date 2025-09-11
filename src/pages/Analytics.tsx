import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function Analytics() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  // Gerar dados mock para os últimos 14 dias
  const generateMockData = () => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const consumoPrevisto = Math.round(450 + Math.random() * 100); // 450-550 kg
      const consumoRealizado = Math.round(consumoPrevisto * (0.7 + Math.random() * 0.5)); // 70-120% do previsto
      
      // Calcular eficiência
      const eficiencia = (consumoRealizado / consumoPrevisto) * 100;
      let corRealizado = '#ef4444'; // vermelho por padrão
      
      if (eficiencia >= 90 && eficiencia <= 110) {
        corRealizado = '#22c55e'; // verde - boa eficiência
      } else if (eficiencia >= 80 && eficiencia < 90 || eficiencia > 110 && eficiencia <= 120) {
        corRealizado = '#eab308'; // amarelo - eficiência média
      }

      data.push({
        data: format(date, 'dd/MM'),
        consumoPrevisto,
        consumoRealizado,
        corRealizado
      });
    }
    return data;
  };

  const data = generateMockData();

  const CustomBar = (props: any) => {
    const { payload, ...rest } = props;
    return <Bar {...rest} fill={payload?.corRealizado || '#ef4444'} />;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm mb-6">
            <span className="text-text-tertiary">ConectaBoi</span>
            <span className="text-text-secondary">/</span>
            <span className="text-text-primary">Leitura de Cocho</span>
          </nav>
          
          <div className="flex items-center justify-between mb-2">
            {/* Título */}
            <h1 className="text-3xl font-bold text-text-primary">Leitura de Cocho</h1>
            
            {/* Botão Voltar */}
            <Button 
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg transition-colors duration-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Dashboard
            </Button>
          </div>
          <p className="text-text-secondary">Monitoramento e análise do consumo de ração</p>
        </div>

        <Card className="border-border-subtle bg-card-secondary/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consumo de Matéria Seca - Últimos 14 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="horizontal"
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--text-secondary))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Matéria Seca (kg/dia)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="data"
                    stroke="hsl(var(--text-secondary))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--text-primary))'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} kg`,
                      name === 'consumoPrevisto' ? 'Previsto' : 'Realizado'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'hsl(var(--text-secondary))' }}
                    formatter={(value: string) => value === 'consumoPrevisto' ? 'Previsto' : 'Realizado'}
                  />
                  <Bar 
                    dataKey="consumoPrevisto" 
                    fill="#3b82f6"
                    name="consumoPrevisto"
                    radius={[0, 4, 4, 0]}
                  />
                  {data.map((entry, index) => (
                    <Bar 
                      key={index}
                      dataKey="consumoRealizado" 
                      fill={entry.corRealizado}
                      name="consumoRealizado"
                      radius={[0, 4, 4, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legenda de cores */}
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-text-secondary">Eficiência Boa (90-110%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-text-secondary">Eficiência Média (80-90% | 110-120%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-text-secondary">Eficiência Ruim (&lt;80% | &gt;120%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}