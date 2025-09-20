import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dados mock para dietas fabricadas hoje
const data = [
  { name: 'Dieta Crescimento', value: 2500, color: '#0088FE' },
  { name: 'Dieta Engorda', value: 3200, color: '#00C49F' },
  { name: 'Dieta Terminação', value: 1800, color: '#FFBB28' },
  { name: 'Dieta Especial', value: 900, color: '#FF8042' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{data.name}</p>
        <p className="text-blue-600">
          {`Quantidade: ${data.value} kg`}
        </p>
        <p className="text-gray-500">
          {`${((data.value / data.payload.total) * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

// Calcular total para percentuais
const totalKg = data.reduce((sum, item) => sum + item.value, 0);
const dataWithTotal = data.map(item => ({ ...item, total: totalKg }));

export const DietaFabricadaChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dietas Fabricadas Hoje</CardTitle>
        <CardDescription>
          Distribuição por tipo de dieta (kg)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => 
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legenda personalizada com totais */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="truncate">
                {item.name}: {item.value}kg
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t text-center">
          <p className="text-lg font-semibold text-gray-700">
            Total: {totalKg.toLocaleString()} kg
          </p>
        </div>
      </CardContent>
    </Card>
  );
};