import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dados mock para os últimos 7 dias
const generateData = () => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const realizadoColors = ['#F00F30', '#14B981', '#F49E0D']; // Vermelho, Verde, Amarelo
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dayName = days[date.getDay()];
    const previsto = Math.floor(Math.random() * 500) + 800; // 800-1300 kg
    const realizado = previsto + (Math.random() - 0.5) * 200; // Variação de ±100 kg
    const colorIndex = (6 - i) % realizadoColors.length; // Cicla pelas cores
    
    data.push({
      dia: dayName,
      previsto: Math.round(previsto),
      realizado: Math.round(Math.max(0, realizado)),
      realizadoColor: realizadoColors[colorIndex]
    });
  }
  
  return data;
};

const data = generateData();

// Componente customizado para barras com cores diferentes
const CustomizedBar = (props: any) => {
  const { fill, ...rest } = props;
  return <Bar {...rest} />;
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold mb-2 text-gray-800">{`Dia: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded" 
              style={{ 
                backgroundColor: entry.dataKey === 'previsto' ? '#3B82F6' : '#14B981'
              }}
            />
            <span style={{ 
              color: entry.dataKey === 'previsto' ? '#3B82F6' : '#14B981' 
            }}>
              {entry.dataKey === 'previsto' ? 'Previsto' : 'Realizado'}: {entry.value} kg
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MateriaSecaChart = () => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Consumo de Matéria Seca</CardTitle>
        <CardDescription>
          Previsto vs Realizado - Últimos 7 dias (kg)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="previsto" 
              fill="#3B82F6" 
              name="Previsto"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="realizado" 
              name="Realizado"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.realizadoColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};