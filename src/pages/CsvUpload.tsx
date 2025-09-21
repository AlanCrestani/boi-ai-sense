import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileSpreadsheet, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { CsvProcessor } from '@/components/CsvProcessor';
import { FatoDistribuicaoProcessor } from '@/components/FatoDistribuicaoProcessor';
import { FatoCarregamentoProcessor } from '@/components/FatoCarregamentoProcessor';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function CsvUpload() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);


  // Create csv-processed folder structure on component mount
  React.useEffect(() => {
    const createProcessedStructure = async () => {
      if (!user || !organization) return;

      try {
        const placeholderBlob = new Blob(['# Pasta para arquivos processados\n'], { type: 'text/plain' });

        // Create placeholder files for each processed folder
        const folders = ['01', '02', '03', '04', '05'];
        for (const folder of folders) {
          const { error } = await supabase.storage
            .from('csv-uploads')
            .upload(`${organization.id}/csv-processed/${folder}/.placeholder`, placeholderBlob, {
              cacheControl: '3600',
              upsert: true
            });

          if (error && !error.message.includes('already exists')) {
            console.error(`Erro criando pasta ${organization.id}/csv-processed/${folder}:`, error);
          }
        }
        console.log('✅ Estrutura csv-processed criada para organização:', organization.id);
      } catch (error) {
        console.error('Erro criando estrutura processed:', error);
      }
    };

    createProcessedStructure();
  }, [user, organization]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const csvFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
    const invalidFiles = selectedFiles.filter(file => !file.name.toLowerCase().endsWith('.csv'));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Arquivos inválidos",
        description: `${invalidFiles.length} arquivo(s) não são CSV e foram ignorados.`,
        variant: "destructive"
      });
    }
    
    // Limit to 5 files total
    const currentFileCount = files.length;
    const availableSlots = 5 - currentFileCount;
    const filesToAdd = csvFiles.slice(0, availableSlots);
    
    if (csvFiles.length > availableSlots) {
      toast({
        title: "Limite excedido",
        description: `Apenas ${availableSlots} arquivo(s) podem ser adicionados. Limite máximo: 5 arquivos.`,
        variant: "destructive"
      });
    }
    
    const newFiles: UploadFile[] = filesToAdd.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (fileName: string, folder: string) => {
    if (!organization) return false;

    try {
      // 1. Download the file from original location
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('csv-uploads')
        .download(`${organization.id}/${folder}/${fileName}`);

      if (downloadError) throw downloadError;

      // 2. Upload to csv-processed folder
      const processedPath = `${organization.id}/csv-processed/${folder}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('csv-uploads')
        .upload(processedPath, fileData, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 3. Delete from original location
      const { error: deleteError } = await supabase.storage
        .from('csv-uploads')
        .remove([`${organization.id}/${folder}/${fileName}`]);

      if (deleteError) throw deleteError;

      console.log(`✅ Arquivo ${fileName} movido para ${organization.id}/csv-processed/${folder}/`);
      return true;
    } catch (error) {
      console.error(`❌ Erro no pós-processamento de ${fileName}:`, error);
      return false;
    }
  };

  const uploadFiles = async () => {
    if (!user || !organization) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado e ter uma organização para fazer upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];
        if (uploadFile.status !== 'pending') continue;

        // Update status to uploading
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading' as const } : f
        ));

        // Determine folder based on file name prefix
        let folder = "";
        const fileName = uploadFile.file.name;

        if (fileName.startsWith("01")) folder = "01";
        else if (fileName.startsWith("02")) folder = "02";
        else if (fileName.startsWith("03")) folder = "03";
        else if (fileName.startsWith("04")) folder = "04";
        else if (fileName.startsWith("05")) folder = "05";
        else {
          console.error(`Arquivo ${fileName} não segue padrão esperado`);
          setFiles(prev => prev.map((f, idx) =>
            idx === i ? {
              ...f,
              status: 'error' as const,
              error: 'Nome do arquivo não segue padrão esperado (deve começar com 01, 02, 03, 04 ou 05)'
            } : f
          ));
          continue;
        }

        // Use organization-based path structure: org_id/pipeline_folder/filename
        const filePath = `${organization.id}/${folder}/${fileName}`;

        try {
          // 1. Upload to temporary location
          const { error } = await supabase.storage
            .from('csv-uploads')
            .upload(filePath, uploadFile.file, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) throw error;

          console.log(`✅ ${fileName} enviado para ${organization.id}/${folder}/`);

          // 2. Process file (move to csv-processed and clean original)
          const processed = await processFile(fileName, folder);

          if (processed) {
            // Update status to completed
            setFiles(prev => prev.map((f, idx) =>
              idx === i ? { ...f, status: 'completed' as const, progress: 100 } : f
            ));
          } else {
            throw new Error('Falha no pós-processamento');
          }

        } catch (error) {
          console.error('Erro no upload:', error);
          setFiles(prev => prev.map((f, idx) =>
            idx === i ? {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            } : f
          ));
        }
      }

      const completedCount = files.filter(f => f.status === 'completed').length;
      if (completedCount > 0) {
        toast({
          title: "Upload concluído",
          description: `${completedCount} arquivo(s) enviado(s) com sucesso!`,
        });
      }

    } catch (error) {
      console.error('General upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro durante o upload dos arquivos.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs and Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Upload de CSV</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Upload de CSV</h1>
          <p className="text-text-secondary">
            Envie até 5 arquivos CSV para atualizar o banco de dados
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Selecionar Arquivos CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="csv-files">
                  Escolha arquivos CSV (máximo 5)
                </Label>
                <Input
                  id="csv-files"
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={files.length >= 5 || isUploading}
                  className="max-w-md"
                />
              </div>
              
              <div className="text-sm text-text-tertiary">
                • Apenas arquivos .csv são aceitos
                • Tamanho máximo: 20MB por arquivo
                • Limite: 5 arquivos por upload
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Arquivos Selecionados ({files.length}/5)</CardTitle>
              {completedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Concluídos
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((uploadFile, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {uploadFile.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : uploadFile.status === 'error' ? (
                        <Trash2 className="h-5 w-5 text-destructive" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {uploadFile.file.name}
                        </p>
                        <span className="text-xs text-text-tertiary">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                      </div>
                      
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="h-2" />
                      )}
                      
                      {uploadFile.status === 'error' && uploadFile.error && (
                        <p className="text-xs text-destructive mt-1">
                          Erro: {uploadFile.error}
                        </p>
                      )}
                      
                      {uploadFile.status === 'completed' && (
                        <p className="text-xs text-primary mt-1">
                          Upload concluído
                        </p>
                      )}
                    </div>
                    
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {pendingFiles.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={uploadFiles}
              disabled={isUploading}
              size="lg"
              className="min-w-48"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar {pendingFiles.length} arquivo(s)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Processing Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Processamento de Dados</h2>
          <p className="text-text-secondary mb-6">
            Após o upload, processe os arquivos CSV usando os pipelines apropriados:
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CsvProcessor
              pipeline="01"
              title="Histórico de Consumo"
              description="Processa dados históricos de consumo dos animais"
              filename="01_historico_consumo.csv"
            />
            <CsvProcessor
              pipeline="02"
              title="Desvio Carregamento"
              description="Processa dados de desvio no carregamento de ingredientes"
              filename="02_desvio_carregamento.csv"
            />
            <CsvProcessor
              pipeline="03"
              title="Desvio Distribuição"
              description="Processa dados de desvio na distribuição de dietas"
              filename="03_desvio_distribuicao.csv"
            />
            <CsvProcessor
              pipeline="04"
              title="Itens de Trato"
              description="Processa dados de itens utilizados no trato"
              filename="04_itens_trato.csv"
            />
            <CsvProcessor
              pipeline="05"
              title="Trato por Curral"
              description="Processa dados de trato distribuído por curral"
              filename="05_trato_por_curral.csv"
            />
          </div>
        </div>

        {/* Fato Tables Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Tabelas Fato</h2>
          <p className="text-text-secondary mb-6">
            Processe dados enriquecidos combinando informações das tabelas staging:
          </p>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <FatoDistribuicaoProcessor />
            <FatoCarregamentoProcessor />
          </div>
        </div>
      </div>
    </Layout>
  );
}